const express = require("express");
const router = express.Router();
const { db, admin, COLLECTIONS } = require("../firebase/firebaseConfig");

/**
 * POST /api/users/register
 * One-time signup OR auto-login if user exists
 */
router.post("/register", async (req, res) => {
  try {
    const { name, registerNo, email } = req.body;

    /* ---------------- VALIDATION ---------------- */
    if (!name || !registerNo || !email) {
      return res.status(400).json({
        error: "Name, Register Number and Email are required"
      });
    }

    /* ---------------- QUIZ STATUS CHECK ---------------- */
    const settingsRef = db
      .collection(COLLECTIONS.ADMIN_SETTINGS)
      .doc("quiz_settings");

    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists || settingsDoc.data().isActive !== true) {
      return res.status(400).json({
        error: "Quiz is not active at the moment"
      });
    }

    const usersRef = db.collection(COLLECTIONS.USERS);

    /* ---------------- CHECK EXISTING USER (REGISTER NO) ---------------- */
    const byRegister = await usersRef
      .where("registerNo", "==", registerNo)
      .limit(1)
      .get();

    if (!byRegister.empty) {
      const userDoc = byRegister.docs[0];
      return res.status(200).json({
        success: true,
        message: "Login successful",
        isExisting: true,
        userId: userDoc.id,
        userData: userDoc.data()
      });
    }

    /* ---------------- CHECK EXISTING USER (EMAIL) ---------------- */
    const byEmail = await usersRef
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!byEmail.empty) {
      const userDoc = byEmail.docs[0];
      return res.status(200).json({
        success: true,
        message: "Login successful",
        isExisting: true,
        userId: userDoc.id,
        userData: userDoc.data()
      });
    }

    /* ---------------- CREATE NEW USER ---------------- */
    const userData = {
      name: name.trim(),
      registerNo: registerNo.trim(),
      email: email.trim().toLowerCase(),
      registeredAt: admin.firestore.Timestamp.now(),
      hasAttempted: false,
      attemptCount: 0,
      score: 0,
      correctAnswers: 0,
      totalQuestions: 0,
      submittedAt: null
    };

    const userRef = await usersRef.add(userData);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      isExisting: false,
      userId: userRef.id,
      userData
    });

  } catch (error) {
    console.error("❌ User registration error:", error);
    return res.status(500).json({
      error: "Registration failed. Please try again."
    });
  }
});

/**
 * GET /api/users/check/:registerNo
 * Check if user exists & can attempt quiz
 */
router.get("/check/:registerNo", async (req, res) => {
  try {
    const { registerNo } = req.params;

    const usersRef = db.collection(COLLECTIONS.USERS);
    const snapshot = await usersRef
      .where("registerNo", "==", registerNo)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    if (userData.hasAttempted) {
      return res.status(400).json({
        error: "You have already attempted the quiz",
        attempted: true
      });
    }

    return res.json({
      canAttempt: true,
      userId: userDoc.id,
      user: {
        name: userData.name,
        registerNo: userData.registerNo,
        email: userData.email
      }
    });

  } catch (error) {
    console.error("❌ User check error:", error);
    return res.status(500).json({
      error: "Failed to check user"
    });
  }
});

module.exports = router;
