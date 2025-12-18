const express = require('express');
const router = express.Router();
const { db, admin, COLLECTIONS } = require('../firebase/firebaseConfig');

const ADMIN_KEY = process.env.ADMIN_KEY || "GODMODE123";

// Middleware to verify admin key
const verifyAdmin = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey || req.body && req.body.adminKey;
  
  if (!adminKey || adminKey !== ADMIN_KEY) {
    return res.status(401).json({ 
      error: 'Unauthorized: Invalid admin key' 
    });
  }
  next();
};

// Lightweight validation endpoint (unprotected) used by admin UI to check key
router.post('/validate', (req, res) => {
  const adminKey = req.headers['x-admin-key'] || req.body && req.body.adminKey || req.query.adminKey;
  if (!adminKey || adminKey !== ADMIN_KEY) {
    return res.status(401).json({ valid: false, error: 'Invalid admin key' });
  }
  res.json({ valid: true, message: 'Admin key valid' });
});

// Apply admin verification to all subsequent routes
router.use(verifyAdmin);

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const usersRef = db.collection(COLLECTIONS.USERS);
    const leaderboardRef = db.collection(COLLECTIONS.LEADERBOARD);
    
    const [usersSnapshot, leaderboardSnapshot, settingsDoc] = await Promise.all([
      usersRef.get(),
      leaderboardRef.orderBy('score', 'desc').limit(20).get(),
      db.collection(COLLECTIONS.ADMIN_SETTINGS).doc('quiz_settings').get()
    ]);
    
    const totalUsers = usersSnapshot.size;
    const attemptedUsers = usersSnapshot.docs.filter(doc => doc.data().hasAttempted).length;
    
    const leaderboard = [];
    leaderboardSnapshot.forEach(doc => {
      leaderboard.push(doc.data());
    });
    
    const settings = settingsDoc.exists ? settingsDoc.data() : {};
    
    // Calculate average score
    let totalScore = 0;
    let userCount = 0;
    
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      if (user.hasAttempted) {
        totalScore += user.score || 0;
        userCount++;
      }
    });
    
    const averageScore = userCount > 0 ? (totalScore / userCount).toFixed(2) : 0;
    
    res.json({
      statistics: {
        totalUsers,
        attemptedUsers,
        pendingUsers: totalUsers - attemptedUsers,
        averageScore,
        completionRate: totalUsers > 0 ? ((attemptedUsers / totalUsers) * 100).toFixed(2) : 0
      },
      leaderboard: leaderboard.slice(0, 10),
      settings
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Update quiz settings
router.post('/settings', async (req, res) => {
  try {
    const { 
      isActive, 
      quizDuration, 
      questionsPerUser,
      title,
      description 
    } = req.body;
    
    const settingsRef = db.collection(COLLECTIONS.ADMIN_SETTINGS).doc('quiz_settings');
    
    await settingsRef.set({
      isActive: isActive !== undefined ? isActive : true,
      quizDuration: quizDuration || 600,
      questionsPerUser: questionsPerUser || 10,
      title: title || 'GOD-LEVEL Quiz',
      description: description || 'Test your knowledge!',
      updatedAt: new Date()
    }, { merge: true });
    
    res.json({ 
      success: true, 
      message: 'Settings updated successfully' 
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Add new question
router.post('/questions', async (req, res) => {
  try {
    const { question, options, type, marks, category } = req.body;
    
    if (!question || !options || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate options
    if (type === 'single') {
      const correctOptions = options.filter(opt => opt.isCorrect);
      if (correctOptions.length !== 1) {
        return res.status(400).json({ 
          error: 'Single choice questions must have exactly one correct answer' 
        });
      }
    }
    
    if (type === 'multiple') {
      const correctOptions = options.filter(opt => opt.isCorrect);
      if (correctOptions.length < 2) {
        return res.status(400).json({ 
          error: 'Multiple choice questions must have at least two correct answers' 
        });
      }
    }
    
    const questionData = {
      question,
      options: options.map((opt, index) => ({
        id: `opt${index + 1}`,
        text: opt.text,
        isCorrect: opt.isCorrect || false
      })),
      type,
      marks: marks || 1,
      category: category || 'general',
      createdAt: new Date(),
      isActive: true
    };
    
    const questionsRef = db.collection(COLLECTIONS.QUIZ_QUESTIONS);
    const result = await questionsRef.add(questionData);
    
    res.json({
      success: true,
      message: 'Question added successfully',
      questionId: result.id
    });
    
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// Get all questions
router.get('/questions', async (req, res) => {
  try {
    const questionsRef = db.collection(COLLECTIONS.QUIZ_QUESTIONS);
    const snapshot = await questionsRef.get();
    
    const questions = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      questions.push({
        id: doc.id,
        ...data
      });
    });
    
    res.json({ questions });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to get questions' });
  }
});

// Get leaderboard (protected - requires admin key)
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboardRef = db.collection(COLLECTIONS.LEADERBOARD);
    const snapshot = await leaderboardRef
      .orderBy('score', 'desc')
      .limit(100)
      .get();
    
    const leaderboard = [];
    let rank = 1;
    snapshot.forEach(doc => {
      const data = doc.data();
      leaderboard.push({
        rank: rank++,
        name: data.name,
        registerNo: data.registerNo,
        score: data.score || 0,
        correctAnswers: data.correctAnswers || 0,
        totalQuestions: data.totalQuestions || 0,
        timeTaken: data.timeTaken || 0,
        timeTaken: data.timeTaken || 0,
        submittedAt: data.submittedAt,
        userId: data.userId || ''
      });
    });
    
    res.json({ leaderboard });
    
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Get user detailed responses
router.get('/user-details/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user doc
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
    
    const userData = userDoc.data();
    if (!userData.responses) return res.json({ responses: [] });
    
    // Fetch question texts to make it readable
    const questionsSnapshot = await db.collection(COLLECTIONS.QUIZ_QUESTIONS).get();
    const questionsMap = {};
    questionsSnapshot.forEach(doc => {
      questionsMap[doc.id] = doc.data();
    });
    
    // Enrich responses
    const enriched = userData.responses.map(r => {
      const q = questionsMap[r.questionId];
      return {
        question: q ? q.question : 'Unknown Question',
        userAnswer: r.userAnswer,
        correctAnswer: r.correctAnswer,
        isCorrect: r.isCorrect,
        options: q ? q.options : [],
        type: q ? q.type : 'single'
      };
    });
    
    res.json({ responses: enriched, user: userData });
    
  } catch (error) {
    console.error('User details error:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

// Delete question
router.delete('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.collection(COLLECTIONS.QUIZ_QUESTIONS).doc(id).delete();
    
    res.json({ 
      success: true, 
      message: 'Question deleted successfully' 
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Export user data (CSV format)
router.get('/export/users', async (req, res) => {
  try {
    const usersRef = db.collection(COLLECTIONS.USERS);
    const snapshot = await usersRef.get();
    
    let csv = 'Name,Register No,Email,Score,Correct Answers,Total Questions,Submitted At\n';
    
    snapshot.forEach(doc => {
      const user = doc.data();
      if (user.hasAttempted) {
        let submittedAt = 'Not submitted';
        if (user.submittedAt) {
          submittedAt = user.submittedAt.toDate ? user.submittedAt.toDate().toISOString() : new Date(user.submittedAt).toISOString();
        }
        csv += `"${user.name}","${user.registerNo}","${user.email}",${user.score || 0},${user.correctAnswers || 0},${user.totalQuestions || 0},"${submittedAt}"\n`;
      }
    });
    
    res.header('Content-Type', 'text/csv');
    res.attachment('users_data.csv');
    res.send(csv);
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});



router.get('/activate', async (req, res) => {
  await db
    .collection(COLLECTIONS.ADMIN_SETTINGS)
    .doc('quiz_settings')
    .set({ isActive: true }, { merge: true });

  res.json({ success: true, message: "Quiz activated" });
});










// Reset quiz for a user
router.post('/reset/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
    
    await userRef.update({
      hasAttempted: false,
      attemptCount: 0,
      score: 0,
      correctAnswers: 0,
      totalQuestions: 0,
      submittedAt: null,
      assignedQuestions: [],
      quizStartedAt: null,
      responses: []
    });
    
    // Remove from leaderboard
    const leaderboardRef = db.collection(COLLECTIONS.LEADERBOARD);
    const snapshot = await leaderboardRef.where('userId', '==', userId).get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    res.json({ 
      success: true, 
      message: 'User quiz reset successfully' 
    });
    
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Failed to reset user' });
  }
});

// WIPE ALL USERS (For fresh exam start)
router.post('/wipe-all-users', async (req, res) => {
  try {
    const usersRef = db.collection(COLLECTIONS.USERS);
    const snapshot = await usersRef.get();
    
    if (snapshot.empty) {
       return res.json({ message: 'No users to delete' });
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Also clear leaderboard
    const lbRef = db.collection(COLLECTIONS.LEADERBOARD);
    const lbSnap = await lbRef.get();
    lbSnap.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    
    console.log('✅ Wiped all users and leaderboard for fresh start.');
    res.json({ message: 'All users and leaderboard data wiped successfully.' });

  } catch (error) {
    console.error('Wipe error:', error);
    res.status(500).json({ error: 'Failed to wipe users' });
  }
});

module.exports = router;