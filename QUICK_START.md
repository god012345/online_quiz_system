# ⚡ Quick Start (2 Minutes)

## 🚀 Get Running Now

### **1. Start Server**
```bash
cd quiz-express-game
npm run dev
```
✅ Server runs on: http://localhost:3000

### **2. Login to Admin (First Time Only)**
```
URL: http://localhost:3000/admin
Key: GODMODE123
Button: Click "🎓 Seed Sample Questions"
```
✅ Questions added (8 total)

### **3. Take a Quiz**
```
URL: http://localhost:3000
Name: John Doe
Register No: CS001
Email: john@test.com
Button: Click "Start Quiz"
```
✅ Quiz loads automatically

### **4. Answer & Submit**
- Click radio buttons (single choice)
- Click checkboxes (multiple choice)
- Click "Next" to navigate
- Click "✅ Submit Quiz" or wait for timer
- ✅ Results show with score

### **5. View Leaderboard**
- Click "🏆 View Leaderboard" on results
- Or open: http://localhost:3000/leaderboard
- ✅ Your score appears ranked

---

## 🔐 Admin Features

### View Live Leaderboard
```
URL: http://localhost:3000/admin
Login: GODMODE123
Tab: Click "Leaderboard"
Button: Click "🔄 Refresh"
```
✅ See all scores ranked

### Start/Stop Quiz
```
Tab: "Quiz Control"
Buttons: "▶️ Start" or "⏹️ Stop"
```
✅ Control who can signup

---

## 📊 Sample Questions (Auto-Seeded)

| # | Type | Answer | Marks |
|---|------|--------|-------|
| 1 | Choice | Paris | 1 |
| 2 | Multi | JS + Python | 2 |
| 3 | Choice | 120 | 1 |
| 4 | Multi | Germany + Spain | 2 |
| 5 | Choice | Au | 1 |
| 6 | Multi | A + E | 2 |
| 7 | Choice | Jupiter | 1 |
| 8 | Multi | Firestore + MongoDB + PG | 2 |

**Total: 12 marks**

---

## ✅ What's Included

- ✅ 8 sample questions (auto-seed)
- ✅ Admin login with key
- ✅ Live leaderboard
- ✅ Results page with score breakdown
- ✅ Timer with auto-submit
- ✅ Tab switching (Quiz, Leaderboard, Questions)
- ✅ Duplicate prevention
- ✅ Security headers
- ✅ Rate limiting

---

## 🆘 Issues?

**Port busy?** 
```bash
$env:PORT=3001; npm run dev
```

**No questions?**
- Admin panel → Click "Seed Sample Questions"

**Can't login?**
- Key is: `GODMODE123` (case-sensitive)
- Check `.env` file

**Firebase error?**
- Add `firebase/serviceAccountKey.json`
- From: Firebase Console → Settings → Service Accounts → Generate Key

---

## 📚 Full Documentation

- **README.md** – Complete guide
- **TESTING_GUIDE.md** – Step-by-step testing
- **CHANGELOG.md** – All changes made

---

**🎓 You now have a production-ready quiz system!**
