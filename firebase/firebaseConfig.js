const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const COLLECTIONS = {
  USERS: "users",
  QUIZ_QUESTIONS: "quiz_questions",
  QUIZ_RESPONSES: "quiz_responses",
  LEADERBOARD: "leaderboard",
  ADMIN_SETTINGS: "admin_settings",
};

module.exports = { admin, db, COLLECTIONS };
