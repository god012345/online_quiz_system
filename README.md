# 🚀 GOD-LEVEL Online Quiz System

A **production-ready, enterprise-grade** online quiz system built with **Node.js, Express.js, and Firebase Firestore**. Designed for colleges, educational institutions, and corporate training.

## ✨ Key Highlights

- 🎯 **Zero Friction Signup** - Name, Register No, Email only
- ⚡ **Instant Quiz Launch** - Auto-start after registration  
- 🔒 **Fort-Knox Security** - Server-side scoring, anti-cheat, rate limiting
- 🏆 **Real-Time Leaderboard** - Live rankings and statistics
- 👨‍💼 **Powerful Admin Panel** - Manage questions, control quiz, view analytics
- 📱 **Fully Responsive** - Works on mobile, tablet, desktop
- 🎨 **Modern UI/UX** - Smooth animations, intuitive design

---

## 📌 Complete Features

### 👤 **User Features**
- ✅ Simple one-time registration (no password needed)
- ✅ Automatic quiz availability after signup
- ✅ Multiple question types (single & multiple choice)
- ✅ Countdown timer with auto-submit
- ✅ Real-time progress bar
- ✅ Instant results with score breakdown
- ✅ Leaderboard view with rankings
- ✅ Encouraging result messages
- ✅ Mobile-optimized interface

### 👨‍💼 **Admin Features**
- ✅ Secure login with admin key authentication
- ✅ **Start/Stop quiz** for all participants
- ✅ **Question management** - Add, view, delete questions
- ✅ **Seed sample questions** - One-click setup
- ✅ **Live leaderboard** - Real-time rankings
- ✅ **Dashboard statistics** - Users, attempts, average score
- ✅ **CSV export** - Download all results
- ✅ **User reset** - Clear attempt history if needed
- ✅ **Quiz settings** - Control duration, number of questions

### 🔐 **Security & Reliability**
- ✅ Admin key-based authentication (no user accounts needed)
- ✅ **Server-side score calculation** (prevents cheating)
- ✅ Rate limiting (100 req/15 min per IP)
- ✅ Duplicate registration prevention
- ✅ Single-attempt enforcement
- ✅ Security headers via Helmet
- ✅ CORS protection
- ✅ Input validation & sanitization
- ✅ CSP compliance (inline handlers removed)
- ✅ Body size limits & timeout handling

---

## 🧠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Node.js, Express.js | RESTful API, Business Logic |
| **Database** | Firebase Firestore | Real-time NoSQL database |
| **Frontend** | HTML5, CSS3, Vanilla JS | UI without dependencies |
| **Security** | Helmet, Rate Limit, CORS | Protection & Headers |
| **Deployment** | Heroku/Render/Firebase | Cloud hosting |

---

## 📁 Project Structure

```
quiz-express-game/
├── server.js                 # Express app & middleware
├── package.json              # Dependencies
├── .env                       # Environment variables
├── firebase/
│   ├── firebaseConfig.js      # Firebase initialization
│   └── serviceAccountKey.json # (DO NOT COMMIT)
├── routes/
│   ├── userRoutes.js          # Registration endpoints
│   ├── quizRoutes.js          # Quiz & submission endpoints
│   └── adminRoutes.js         # Admin dashboard endpoints
└── public/
    ├── index.html             # Signup page
    ├── quiz.html              # Quiz interface
    ├── leaderboard.html       # Public leaderboard
    ├── admin.html             # Admin panel (login required)
    ├── signup.js              # Signup logic
    ├── quiz.js                # Quiz logic (timer, submission)
    ├── admin.js               # Admin controls & leaderboard view
    ├── leaderboard.js         # Leaderboard display
    └── style.css              # Styling
```

---

## ⚙️ Setup Instructions

### **1️⃣ Prerequisites**
- Node.js 14+ installed
- Firebase project created
- Service account key from Firebase Console

### **2️⃣ Clone / Download Project**
```bash
git clone <your-repo-url>
cd quiz-express-game
```

### **3️⃣ Install Dependencies**
```bash
npm install
```

### **4️⃣ Firebase Setup**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Firestore Database** (Start in test mode)
4. Create a **Service Account Key**:
   - Settings → Service Accounts → Generate Key
   - Download the JSON file
5. Place it in: `firebase/serviceAccountKey.json`
6. **⚠️ DO NOT upload this file to GitHub** – Add to `.gitignore`

### **5️⃣ Environment Variables**

Create a `.env` file in the root directory:

```env
PORT=3000
ADMIN_KEY=GODMODE123
```

### **6️⃣ Start the Server**

```bash
npm run dev
```

Or for production:
```bash
npm start
```

Server runs on: **http://localhost:3000**

---

## 🎯 User Flow

### **1. Sign Up**
- User opens: http://localhost:3000
- Enters: Name, Register Number, Email
- Clicks: "Start Quiz"
- ✅ Account created, quiz loads automatically

### **2. Take Quiz**
- Questions displayed with timer (default: 10 minutes)
- Can navigate between questions (Previous/Next)
- Automatic submission when timer expires
- Or manual submission via "Submit Quiz" button

### **3. View Results**
- Score displayed immediately
- Correct answers breakdown shown
- Automatically added to leaderboard
- Redirected to leaderboard page

---

## 🔐 Admin Flow

### **1. Admin Login**
- Open: http://localhost:3000/admin
- Enter admin key: `GODMODE123` (from `.env`)
- Click: "Login"
- Authenticated in session

### **2. Admin Tabs**

#### **Quiz Control Tab**
- Start Quiz: Makes quiz available for users
- Stop Quiz: Prevents new registrations
- *Note: Quiz is ACTIVE by default*

#### **Leaderboard Tab**
- View top 100 scores
- Rank, Name, Score, Correct Answers, Time Taken
- Auto-sorts by highest score
- Refresh button for live updates

#### **Manage Questions Tab**
- Add/Edit/Delete questions
- Support for multiple-choice questions
- Set marks per question

---

## 🔒 Security Details

### **Admin Key Protection**
All admin endpoints require the `x-admin-key` header:

```bash
curl -X POST http://localhost:3000/api/admin/settings \
  -H "x-admin-key: GODMODE123" \
  -H "Content-Type: application/json" \
  -d '{"isActive": true}'
```

### **Rate Limiting**
- Limit: 100 requests per 15 minutes
- Applied globally to prevent abuse
- Adjust in `server.js` if needed

### **Duplicate Prevention**
- Users can only register **once per email/register number**
- Only one quiz attempt per user
- Server prevents multiple submissions

### **Anti-Cheat**
- Score calculated on **server side**
- Tab-switching warning displayed to user
- Cannot access quiz without valid registration

---

## 🧪 API Endpoints

### **User APIs**
| Method | Endpoint | Body | Protected |
|--------|----------|------|-----------|
| POST | `/api/users/register` | `{name, registerNo, email}` | ❌ |
| GET | `/api/users/check/:registerNo` | - | ❌ |

### **Quiz APIs**
| Method | Endpoint | Body | Protected |
|--------|----------|------|-----------|
| GET | `/api/quiz/questions/:userId` | - | ❌ |
| POST | `/api/quiz/submit` | `{userId, answers}` | ❌ |
| GET | `/api/quiz/result/:userId` | - | ❌ |

### **Admin APIs** (Require `x-admin-key` header)
| Method | Endpoint | Body | Protected |
|--------|----------|------|-----------|
| POST | `/api/admin/validate` | `{}` | ✅ |
| GET | `/api/admin/dashboard` | - | ✅ |
| POST | `/api/admin/settings` | `{isActive, quizDuration, ...}` | ✅ |
| POST | `/api/admin/questions` | `{question, options, ...}` | ✅ |
| GET | `/api/admin/questions` | - | ✅ |
| DELETE | `/api/admin/questions/:id` | - | ✅ |
| GET | `/api/admin/leaderboard` | - | ✅ |
| GET | `/api/admin/export/users` | - (CSV) | ✅ |
| POST | `/api/admin/reset/:userId` | - | ✅ |

---

## 📊 Firestore Collections

```
users/
├── userId_1: {name, registerNo, email, registeredAt, hasAttempted, score, ...}
├── userId_2: {...}

quiz_questions/
├── question_1: {question, options, type, marks, ...}
├── question_2: {...}

leaderboard/
├── entry_1: {userId, name, registerNo, score, correctAnswers, timeTaken, ...}
├── entry_2: {...}

admin_settings/
└── quiz_settings: {isActive, quizDuration, questionsPerUser, ...}
```

---

## 🚀 Deployment

### **Render.com (Recommended)**
1. Push to GitHub
2. Connect GitHub to Render
3. Create new Web Service
4. Set environment variables (PORT, ADMIN_KEY)
5. Deploy

### **Firebase Hosting + Cloud Functions**
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Configure: `firebase init`
3. Deploy: `firebase deploy`

### **Heroku** (Deprecated but still works)
1. Install Heroku CLI
2. Run: `heroku create` & `heroku config:set PORT=3000 ADMIN_KEY=GODMODE123`
3. Push: `git push heroku main`

---

## 🔮 Future Enhancements

- [ ] **Mobile responsive UI** (currently desktop-optimized)
- [ ] **PDF certificate generation** for top scorers
- [ ] **Analytics dashboard** with graphs and insights
- [ ] **Question difficulty levels** and difficulty-based scoring
- [ ] **Timed question types** (specific time per question)
- [ ] **Negative marking** for wrong answers
- [ ] **Review section** after submission
- [ ] **Email notifications** (score, placement)
- [ ] **IP restrictions** for exam integrity
- [ ] **Webcam monitoring** (advanced anti-cheat)
- [ ] **React/Vue frontend** (modern UI)

---

## 🐛 Troubleshooting

### **Port Already in Use**
```bash
# Windows (Change PORT in .env or use ENV var)
$env:PORT=3001; npm run dev

# Linux/Mac
PORT=3001 npm run dev
```

### **Firebase Connection Error**
- Verify `firebase/serviceAccountKey.json` exists
- Check Firebase project is active
- Firestore must be in **test mode** initially

### **Admin Key Not Working**
- Ensure `.env` file has `ADMIN_KEY=GODMODE123`
- Verify header: `x-admin-key: GODMODE123`
- Check for typos/extra spaces

### **Quiz Not Appearing**
- Quiz is **ACTIVE by default** on startup
- Check browser console for errors
- Verify `quizDuration` setting in Firestore

---

## 📜 License

This project is for **educational use**. You are free to modify and extend it for college projects, hackathons, and competitions.

---

## 🙌 Support

For issues or questions:
1. Check the console (F12) for error messages
2. Verify `.env` and Firebase setup
3. Ensure Node.js version 14+

---

## ✨ Credits

Built with ❤️ for God-Level Full-Stack Development

**Version:** 1.0.0  
**Last Updated:** December 2024

---

## 📝 Quick Start Checklist

- [ ] Firebase service account key downloaded
- [ ] `.env` file created with PORT & ADMIN_KEY
- [ ] `npm install` completed
- [ ] `npm run dev` started successfully
- [ ] http://localhost:3000 loads signup page
- [ ] http://localhost:3000/admin shows admin login
- [ ] Signed up & took a test quiz
- [ ] Verified score appears on leaderboard

**Congratulations! You have a production-ready quiz system! 🎉**
