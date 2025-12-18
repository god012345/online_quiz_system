const express = require('express');
const router = express.Router();
const { db, admin, COLLECTIONS } = require('../firebase/firebaseConfig');

// Register user (one-time sign-in)
router.post('/register', async (req, res) => {
  try {
    const { name, registerNo, email } = req.body;
    
    // Validation
    if (!name || !registerNo || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if user already exists
    const usersRef = db.collection(COLLECTIONS.USERS);
    const byRegister = await usersRef.where('registerNo', '==', registerNo).get();
    
    // If user exists, log them in instead of erroring
    if (!byRegister.empty) {
      const existingUser = byRegister.docs[0];
      return res.status(200).json({
        success: true,
        message: 'Login successful!',
        userId: existingUser.id,
        userData: existingUser.data(),
        isExisting: true
      });
    }

    const byEmail = await usersRef.where('email', '==', email).get();
    if (!byEmail.empty) {
       const existingUser = byEmail.docs[0];
       return res.status(200).json({
         success: true,
         message: 'Login successful!',
         userId: existingUser.id,
         userData: existingUser.data(),
         isExisting: true
      });
    }
    
    // Check if quiz is active
    const settingsRef = db.collection(COLLECTIONS.ADMIN_SETTINGS).doc('quiz_settings');
    const settingsDoc = await settingsRef.get();
    
    if (!settingsDoc.exists || !settingsDoc.data().isActive) {
      return res.status(400).json({ 
        error: 'Quiz is not active at the moment' 
      });
    }
    
    // Create user
    const userData = {
      name,
      registerNo,
      email,
      registeredAt: admin.firestore.Timestamp.now(),
      hasAttempted: false,
      attemptCount: 0,
      score: 0,
      submittedAt: null
    };
    
    const userRef = await usersRef.add(userData);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      userId: userRef.id,
      userData
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Check if user can take quiz
router.get('/check/:registerNo', async (req, res) => {
  try {
    const { registerNo } = req.params;
    
    const usersRef = db.collection(COLLECTIONS.USERS);
    const snapshot = await usersRef
      .where('registerNo', '==', registerNo)
      .get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = snapshot.docs[0].data();
    
    if (userData.hasAttempted) {
      return res.status(400).json({ 
        error: 'You have already attempted the quiz',
        attempted: true 
      });
    }
    
    res.json({
      canAttempt: true,
      user: {
        name: userData.name,
        registerNo: userData.registerNo,
        email: userData.email
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Check failed' });
  }
});

module.exports = router;