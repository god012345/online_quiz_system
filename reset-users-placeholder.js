const admin = require('firebase-admin');
const db = admin.firestore();

const COLLECTIONS = {
  USERS: 'users',
  QUESTIONS: 'quiz_questions',
  LEADERBOARD: 'leaderboard'
};

async function deleteAllUsers() {
  console.log('🧹 Deleting all users to ensure fresh exam start...');
  
  try {
    const usersRef = db.collection(COLLECTIONS.USERS);
    const snapshot = await usersRef.get();
    
    if (snapshot.empty) {
      console.log('No users to delete.');
      return;
    }

    const batch = db.batch();
    let count = 0;
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });

    await batch.commit();
    console.log(`✅ Successfully deleted ${count} users.`);
    
    // Also clear leaderboard since it depends on users
    const lbRef = db.collection(COLLECTIONS.LEADERBOARD);
    const lbSnap = await lbRef.get();
    if (!lbSnap.empty) {
        const batch2 = db.batch();
        let lbCount = 0;
        lbSnap.docs.forEach((doc) => {
            batch2.delete(doc.ref);
            lbCount++;
        });
        await batch2.commit();
        console.log(`✅ Successfully deleted ${lbCount} leaderboard entries.`);
    }

  } catch (error) {
    console.error('Error deleting users:', error);
  }
}

// Check if initialized, if not, we might need to rely on existing connection or init here.
// Since we are running as a script, we need full init.
// But wait, the previous scripts used 'node-fetch' to hit the API. 
// Deleting users is an Admin API function or direct DB access.
// Since we don't have a route to delete all users, we should add one or use the direct DB script like `reset-seed-20.js` BUT `reset-seed-20.js` used API to delete questions.
// I don't have an API to delete users.
// I should use the firebase-admin directly.
// I need the service account? Or can I just use the existing `firebase/firebaseConfig.js`?
// `firebase/firebaseConfig.js` requires env vars usually.
// Let's try to add a route to `adminRoutes.js` to reset users properly, then call it.

const fetch = require('node-fetch');

async function triggerReset() {
    // I can't trigger a user reset via API because I didn't verify if that endpoint exists. 
    // `adminRoutes.js` has `/reset-users`? Let's check view_file.
    // I recall `reset user progress` but not `delete all users`.
    // Let's ADD an endpoint to wipe users since the user wants a FRESH start.
}

console.log("This script is a placeholder. I will modify adminRoutes first.");
