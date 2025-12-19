const express = require("express");
const router = express.Router();
const { db, admin, COLLECTIONS } = require("../firebase/firebaseConfig");

/* =========================================================
   PUBLIC LEADERBOARD (NO AUTH)
========================================================= */
router.get("/public-leaderboard", async (req, res) => {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.LEADERBOARD)
      .orderBy("score", "desc")
      .limit(50)
      .get();

    let rank = 1;
    const leaderboard = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        rank: rank++,
        name: d.name,
        registerNo: d.registerNo,
        score: d.score || 0,
        correctAnswers: d.correctAnswers || 0,
        totalQuestions: d.totalQuestions || 0,
        timeTaken: d.timeTaken || 0
      };
    });

    res.json({ leaderboard });
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Failed to get leaderboard" });
  }
});

/* =========================================================
   QUESTION ARCHIVE (STUDY MODE – OPTIONAL)
========================================================= */
router.get("/archive", async (req, res) => {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.QUIZ_QUESTIONS)
      .get();

    const questions = snapshot.docs.map(doc => {
      const q = doc.data();
      return {
        id: doc.id,
        question: q.question,
        type: q.type,
        marks: q.marks || 1,
        options: q.options // includes isCorrect (intended for study)
      };
    });

    res.json({ questions });
  } catch (err) {
    console.error("Archive error:", err);
    res.status(500).json({ error: "Failed to get archive" });
  }
});

/* =========================================================
   GET QUIZ QUESTIONS FOR USER
========================================================= */
router.get("/questions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    if (userData.hasAttempted) {
      return res.status(400).json({ error: "Quiz already attempted" });
    }

    /* ---- CHECK QUIZ STATUS ---- */
    const settingsDoc = await db
      .collection(COLLECTIONS.ADMIN_SETTINGS)
      .doc("quiz_settings")
      .get();

    if (!settingsDoc.exists || settingsDoc.data().isActive !== true) {
      return res.status(400).json({ error: "Quiz is not active" });
    }

    /* ---- FETCH QUESTIONS ---- */
    const snapshot = await db
      .collection(COLLECTIONS.QUIZ_QUESTIONS)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "No questions available" });
    }

    const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    /* ---- SHUFFLE (FISHER-YATES) ---- */
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }

    const settings = settingsDoc.data();
    const count = settings.questionsPerUser || 20;
    const selected = all.slice(0, count);

    const totalPossibleMarks = selected.reduce(
      (sum, q) => sum + (q.marks || 1),
      0
    );

    const questionsForUser = selected.map(q => ({
      id: q.id,
      question: q.question,
      type: q.type,
      marks: q.marks || 1,
      options: q.options.map(o => ({
        id: o.id,
        text: o.text
      }))
    }));

    await userRef.update({
      assignedQuestions: selected.map(q => q.id),
      quizStartedAt: admin.firestore.Timestamp.now(),
      totalPossibleMarks
    });

    res.json({
      questions: questionsForUser,
      timer: settings.quizDuration || 1200,
      totalMarks: totalPossibleMarks
    });
  } catch (err) {
    console.error("Get questions error:", err);
    res.status(500).json({ error: "Failed to get questions" });
  }
});

/* =========================================================
   SUBMIT QUIZ
========================================================= */
router.post("/submit", async (req, res) => {
  try {
    const { userId, answers } = req.body;

    if (!userId || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "Invalid submission data" });
    }

    const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    if (userData.hasAttempted) {
      return res.status(400).json({ error: "Quiz already submitted" });
    }

    const questionsRef = db.collection(COLLECTIONS.QUIZ_QUESTIONS);
    const questionDocs = await Promise.all(
      userData.assignedQuestions.map(id => questionsRef.doc(id).get())
    );

    const questionsMap = {};
    questionDocs.forEach(d => {
      if (d.exists) questionsMap[d.id] = d.data();
    });

    let totalScore = 0;
    let correctAnswers = 0;
    const responses = [];

    for (const ans of answers) {
      const q = questionsMap[ans.questionId];
      if (!q) continue;

      let isCorrect = false;
      const marks = q.marks || 1;

      if (q.type === "multiple") {
        const correct = q.options
          .filter(o => o.isCorrect)
          .map(o => o.id)
          .sort();
        const user = (ans.selectedOptions || []).sort();
        isCorrect = JSON.stringify(correct) === JSON.stringify(user);
      } else {
        const correct = q.options.find(o => o.isCorrect);
        isCorrect = correct && correct.id === ans.selectedOption;
      }

      if (isCorrect) {
        totalScore += marks;
        correctAnswers++;
      }

      responses.push({
        questionId: ans.questionId,
        userAnswer: ans.selectedOptions || ans.selectedOption,
        correctAnswer: q.options.filter(o => o.isCorrect).map(o => o.id),
        isCorrect,
        marks: isCorrect ? marks : 0
      });
    }

    const now = admin.firestore.Timestamp.now();

    await userRef.update({
      hasAttempted: true,
      attemptCount: (userData.attemptCount || 0) + 1,
      score: totalScore,
      correctAnswers,
      totalQuestions: userData.assignedQuestions.length,
      submittedAt: now,
      responses
    });

    let timeTaken = 0;
    if (userData.quizStartedAt?.toMillis) {
      timeTaken = Math.floor(
        (now.toMillis() - userData.quizStartedAt.toMillis()) / 1000
      );
    }

    await db.collection(COLLECTIONS.LEADERBOARD).add({
      userId,
      name: userData.name,
      registerNo: userData.registerNo,
      score: totalScore,
      correctAnswers,
      totalQuestions: userData.assignedQuestions.length,
      timeTaken,
      submittedAt: now
    });

    res.json({
      success: true,
      score: totalScore,
      correctAnswers,
      totalQuestions: userData.assignedQuestions.length,
      responses
    });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ error: "Submission failed" });
  }
});

/* =========================================================
   RESULT
========================================================= */
router.get("/result/:userId", async (req, res) => {
  try {
    const userDoc = await db
      .collection(COLLECTIONS.USERS)
      .doc(req.params.userId)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const u = userDoc.data();
    if (!u.hasAttempted) {
      return res.status(400).json({ error: "Quiz not attempted yet" });
    }

    const totalPossible = u.totalPossibleMarks || u.totalQuestions || 0;
    const percentage =
      totalPossible > 0
        ? ((u.score / totalPossible) * 100).toFixed(2)
        : "0.00";

    res.json({
      name: u.name,
      registerNo: u.registerNo,
      score: u.score,
      correctAnswers: u.correctAnswers,
      totalQuestions: u.totalQuestions,
      submittedAt: u.submittedAt,
      percentage,
      responses: u.responses || []
    });
  } catch (err) {
    console.error("Result error:", err);
    res.status(500).json({ error: "Failed to get result" });
  }
});

module.exports = router;
