const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Firestore collections
const COLLECTIONS = {
  USERS: 'users',
  QUIZ_QUESTIONS: 'quiz_questions',
  QUIZ_RESPONSES: 'quiz_responses',
  LEADERBOARD: 'leaderboard',
  ADMIN_SETTINGS: 'admin_settings'
};

// Initialize default collections
const initializeCollections = async () => {
  try {
    const collections = await db.listCollections();
    const collectionIds = collections.map(col => col.id);
    
    // Create collections if they don't exist
    for (const collection of Object.values(COLLECTIONS)) {
      if (!collectionIds.includes(collection)) {
        await db.collection(collection).doc('init').set({ initialized: true });
        console.log(`✅ Created collection: ${collection}`);
      }
    }
    
    // Ensure quiz is active by default
    const settingsRef = db.collection(COLLECTIONS.ADMIN_SETTINGS).doc('quiz_settings');
    const settingsDoc = await settingsRef.get();
    
    if (!settingsDoc.exists) {
      // Create with default active state
      await settingsRef.set({
        isActive: true,
        quizDuration: 600,
        questionsPerUser: 10,
        title: 'GOD-LEVEL Quiz',
        description: 'Test your knowledge!',
        createdAt: admin.firestore.Timestamp.now()
      });
      console.log('✅ Quiz initialized as ACTIVE by default');
    }
    
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
};

initializeCollections();

module.exports = { db, admin, COLLECTIONS };