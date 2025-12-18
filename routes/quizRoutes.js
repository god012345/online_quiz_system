const express = require('express');
const router = express.Router();
const { db, admin, COLLECTIONS } = require('../firebase/firebaseConfig');

// Get random questions for user
router.get('/public-leaderboard', async (req, res) => {
  try {
    const leaderboardRef = db.collection(COLLECTIONS.LEADERBOARD);
    const snapshot = await leaderboardRef
      .orderBy('score', 'desc')
      .limit(50)
      .get();
    
    const leaderboard = [];
    let rank = 1;
    snapshot.forEach(doc => {
      const data = doc.data();
      leaderboard.push({
        rank: rank++,
        name: data.name,
        registerNo: data.registerNo, // Consider masking if sensitive
        score: data.score || 0,
        correctAnswers: data.correctAnswers || 0,
        totalQuestions: data.totalQuestions || 0,
        timeTaken: data.timeTaken || 0
      });
    });
    
    res.json({ leaderboard });
    
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Get all questions for public archive (Question Bank)
router.get('/archive', async (req, res) => {
  try {
    const questionsRef = db.collection(COLLECTIONS.QUIZ_QUESTIONS);
    const snapshot = await questionsRef.get();
    
    const questions = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      questions.push({
        id: doc.id,
        question: data.question,
        type: data.type,
        marks: data.marks,
        options: data.options // Include options with isCorrect flags for the archive/study mode
      });
    });
    
    res.json({ questions });
    
  } catch (error) {
    console.error('Archive error:', error);
    res.status(500).json({ error: 'Failed to get archive' });
  }
});

// Get random questions for user
router.get('/questions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user exists and hasn't attempted
    const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    if (userData.hasAttempted) {
      return res.status(400).json({ 
        error: 'You have already attempted the quiz' 
      });
    }
    
    // Get quiz settings
    const settingsRef = db.collection(COLLECTIONS.ADMIN_SETTINGS).doc('quiz_settings');
    const settingsDoc = await settingsRef.get();
    const settings = settingsDoc.data();
    
    // Get all questions
    const questionsRef = db.collection(COLLECTIONS.QUIZ_QUESTIONS);
    const snapshot = await questionsRef.get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No questions available' });
    }
    
    // Convert to array and shuffle
    let allQuestions = [];
    snapshot.forEach(doc => {
      const question = doc.data();
      question.id = doc.id;
      allQuestions.push(question);
    });
    
    // Shuffle array (Fisher-Yates algorithm)
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }
    
    // Select required number of questions
    const numberOfQuestions = settings?.questionsPerUser || 10;
    const selectedQuestions = allQuestions.slice(0, numberOfQuestions);
    
    // Remove correct answers before sending to client
    const questionsForUser = selectedQuestions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options.map(o => ({ id: o.id, text: o.text })),
      type: q.type,
      marks: q.marks || 1
    }));
    
    // Store which questions user got (for verification)
    const totalPossibleMarks = selectedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    await userRef.update({
      assignedQuestions: selectedQuestions.map(q => q.id),
      quizStartedAt: admin.firestore.Timestamp.now(),
      totalPossibleMarks
    });
    
    res.json({
      questions: questionsForUser,
      timer: settings?.quizDuration || 600, // Default 10 minutes
      totalMarks: selectedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0)
    });
    
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to get questions' });
  }
});

// Submit quiz answers
router.post('/submit', async (req, res) => {
  try {
    const { userId, answers } = req.body;
    
    if (!userId || !answers) {
      return res.status(400).json({ error: 'Missing data' });
    }
    
    // Get user data
    const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    if (userData.hasAttempted) {
      return res.status(400).json({ 
        error: 'Quiz already submitted' 
      });
    }
    
    // Verify assigned questions
    if (!userData.assignedQuestions || userData.assignedQuestions.length === 0) {
      return res.status(400).json({ error: 'No assigned questions found' });
    }
    
    // Calculate score on server side
    let totalScore = 0;
    let correctAnswers = 0;
    const responseDetails = [];
    
    // Get correct answers for assigned questions (fetch each doc to avoid 'in' limits)
    const questionsMap = {};
    const questionsRef = db.collection(COLLECTIONS.QUIZ_QUESTIONS);
    const questionDocs = await Promise.all(
      (userData.assignedQuestions || []).map(id => questionsRef.doc(id).get())
    );
    questionDocs.forEach(doc => {
      if (doc.exists) questionsMap[doc.id] = doc.data();
    });
    
    // Calculate score
    for (const answer of answers) {
      const question = questionsMap[answer.questionId];
      if (!question) continue;
      
      let isCorrect = false;
      const marks = question.marks || 1;
      
      if (question.type === 'multiple') {
        // For multiple correct answers
        const correctOptions = question.options
          .filter(opt => opt.isCorrect)
          .map(opt => opt.id)
          .sort();
        
        const userOptions = answer.selectedOptions.sort();
        isCorrect = JSON.stringify(correctOptions) === JSON.stringify(userOptions);
      } else {
        // For single correct answer
        const correctOption = question.options.find(opt => opt.isCorrect);
        isCorrect = correctOption && correctOption.id === answer.selectedOption;
      }
      
      if (isCorrect) {
        totalScore += marks;
        correctAnswers++;
      }
      
      responseDetails.push({
        questionId: answer.questionId,
        userAnswer: answer.selectedOptions || answer.selectedOption,
        correctAnswer: question.type === 'multiple' 
          ? question.options.filter(opt => opt.isCorrect).map(opt => opt.id)
          : question.options.find(opt => opt.isCorrect)?.id,
        isCorrect,
        marks: isCorrect ? marks : 0
      });
    }
    
    // Update user record
    await userRef.update({
      hasAttempted: true,
      attemptCount: (userData.attemptCount || 0) + 1,
      score: totalScore,
      correctAnswers,
      totalQuestions: userData.assignedQuestions.length,
      submittedAt: new Date(),
      responses: responseDetails
    });
    
    // Add to leaderboard
    const leaderboardRef = db.collection(COLLECTIONS.LEADERBOARD);
    // compute timeTaken robustly (supports Timestamp or Date)
    let timeTaken = 0;
    try {
      const started = userData.quizStartedAt;
      const startMillis = started && started.toMillis ? started.toMillis() : (started ? new Date(started).getTime() : null);
      const nowMillis = admin.firestore.Timestamp.now().toMillis();
      if (startMillis) timeTaken = Math.floor((nowMillis - startMillis) / 1000);
    } catch (e) {
      timeTaken = 0;
    }

    await leaderboardRef.add({
      userId,
      name: userData.name,
      registerNo: userData.registerNo,
      score: totalScore,
      correctAnswers,
      totalQuestions: userData.assignedQuestions.length,
      timeTaken,
      submittedAt: admin.firestore.Timestamp.now()
    });
    
    res.json({
      success: true,
      score: totalScore,
      correctAnswers,
      totalQuestions: userData.assignedQuestions.length,
      message: 'Quiz submitted successfully!',
      responses: responseDetails
    });
    
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: 'Submission failed' });
  }
});

// Get user's quiz result
router.get('/result/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    if (!userData.hasAttempted) {
      return res.status(400).json({ 
        error: 'Quiz not attempted yet' 
      });
    }
    
    // Calculate percentage using stored totalPossibleMarks if available
    const totalPossible = userData.totalPossibleMarks || (userData.totalQuestions || 0);
    const percentage = totalPossible > 0 ? ((userData.score / totalPossible) * 100).toFixed(2) : '0.00';

    // Enrich responses with question details if available
    const enriched
     = [];
    if (userData.responses && userData.responses.length > 0) {
        // Fetch questions involved
        const questionsRef = db.collection(COLLECTIONS.QUIZ_QUESTIONS);
        // We can optimize by only fetching assigned questions
        const questionIds = userData.responses.map(r => r.questionId);
        // Firestore 'in' query supports up to 10 items, better to fetch all if many or use multiple queries
        // or just fetch all questions (assuming manageable size) or fetch individually
        // Since we already have assignedQuestions in userData, let's use that
        
        const questionDocs = await Promise.all(
            userData.responses.map(r => questionsRef.doc(r.questionId).get())
        );

        const questionsMap = {};
        questionDocs.forEach(doc => {
             if (doc.exists) questionsMap[doc.id] = doc.data();
        });

        userData.responses.forEach(r => {
             const q = questionsMap[r.questionId];
             if (q) {
                 enriched.push({
                     questionId: r.questionId,
                     userAnswer: r.userAnswer,
                     isCorrect: r.isCorrect,
                     correctAnswer: r.correctAnswer,
                     // Add question details for display
                     question: q.question,
                     options: q.options.map(o => ({ id: o.id, text: o.text })), // Hide isCorrect in options if strict, but this is result view so maybe okay? 
                     // Actually for review we want to show which was correct.
                     // The client needs to know which option ID corresponds to which text.
                     // And ideally which was the correct one.
                     type: q.type
                 });
             }
        });
    }

    // Overwrite the response with enriched data
    res.json({
      name: userData.name,
      registerNo: userData.registerNo,
      score: userData.score,
      correctAnswers: userData.correctAnswers,
      totalQuestions: userData.totalQuestions,
      submittedAt: userData.submittedAt,
      percentage,
      responses: enriched.length > 0 ? enriched : (userData.responses || [])
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to get result' });
  }
});

module.exports = router;