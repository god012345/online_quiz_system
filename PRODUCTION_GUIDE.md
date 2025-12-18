# 🚀 GOD-LEVEL Quiz System - Production Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [System Architecture](#system-architecture)
3. [Features](#features)
4. [Configuration](#configuration)
5. [Deployment](#deployment)
6. [Security](#security)
7. [Troubleshooting](#troubleshooting)
8. [API Documentation](#api-documentation)

---

## Quick Start

### Prerequisites
- Node.js 14+ installed
- Firebase Admin SDK credentials (.json file)
- npm or yarn package manager

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Add your Firebase credentials and admin key to .env
ADMIN_KEY=your_secure_admin_key_here
PORT=3001

# 4. Start development server
npm run dev

# 5. Open browser to http://localhost:3001
```

---

## System Architecture

### Frontend Components
- **index.html** - Landing page with signup form
- **quiz.html** - Quiz interface with timer and questions
- **admin.html** - Admin dashboard for quiz management
- **leaderboard.html** - Public leaderboard view

### Backend Stack
- **Express.js** - Web framework
- **Firebase Firestore** - NoSQL database
- **Firebase Admin SDK** - Backend authentication
- **Helmet** - Security middleware
- **Express Rate Limit** - DDoS protection

### Database Collections
```
users
  ├── userId (auto-generated)
  ├── name
  ├── registerNo
  ├── email
  ├── registeredAt (Timestamp)
  ├── hasAttempted
  ├── score
  └── submittedAt

quiz_questions
  ├── questionId (auto-generated)
  ├── question
  ├── options
  │   ├── id
  │   ├── text
  │   └── isCorrect
  ├── type (single/multiple)
  ├── marks
  └── isActive

leaderboard
  ├── userId
  ├── name
  ├── registerNo
  ├── score
  ├── correctAnswers
  ├── totalQuestions
  ├── timeTaken
  └── submittedAt (Timestamp)

admin_settings
  └── quiz_settings
      ├── isActive
      ├── quizDuration
      ├── questionsPerUser
      └── title
```

---

## Features

### ✅ User Features
- **One-Time Registration**: Prevents duplicate attempts
- **Secure Quiz Taking**: Timer, progress tracking, anti-cheat
- **Real-Time Results**: Instant score calculation
- **Leaderboard**: View rankings and performance metrics
- **Multiple Question Types**: Single-choice and multiple-choice
- **Auto-Submit**: Quiz submits automatically when time ends

### ✅ Admin Features
- **Quiz Control**: Start/stop quiz for all participants
- **Question Management**: Add, edit, view questions
- **Sample Questions**: One-click sample data population
- **Live Leaderboard**: Real-time rankings and statistics
- **User Management**: View, reset, and manage participants
- **CSV Export**: Download results for analysis

### ✅ Security Features
- **Admin Key Authentication**: Secure admin panel access
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS Protection**: Cross-origin request validation
- **Helmet Security Headers**: XSS, clickjacking protection
- **Body Size Limits**: Prevent memory exhaustion
- **CSP Compliance**: Content Security Policy adherence

---

## Configuration

### Environment Variables (.env)

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Admin Access
ADMIN_KEY=GODMODE123

# Firebase (from your Firebase project)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email@firebase.gserviceaccount.com

# Optional
QUIZ_DURATION=600
QUESTIONS_PER_USER=10
```

### Quiz Settings
Modify in Firestore `admin_settings/quiz_settings`:
```javascript
{
  isActive: true,           // Quiz is available
  quizDuration: 600,        // Seconds (10 minutes)
  questionsPerUser: 10,     // Number of questions per user
  title: "GOD-LEVEL Quiz"   // Quiz title
}
```

---

## Deployment

### Deploy to Heroku

```bash
# 1. Install Heroku CLI
npm install -g heroku

# 2. Login to Heroku
heroku login

# 3. Create Heroku app
heroku create your-app-name

# 4. Set environment variables
heroku config:set ADMIN_KEY=your_secure_key
heroku config:set FIREBASE_PROJECT_ID=your_project_id
# ... set other variables

# 5. Deploy
git push heroku main

# 6. View logs
heroku logs --tail
```

### Deploy to Render

```bash
# 1. Create account on render.com
# 2. Create new Web Service
# 3. Connect GitHub repository
# 4. Add environment variables in dashboard
# 5. Deploy with auto-deploy on push
```

### Deploy to Firebase Hosting

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Initialize Firebase
firebase init hosting

# 3. Build for production
npm run build

# 4. Deploy
firebase deploy
```

---

## Security

### Best Practices

1. **Admin Key Management**
   - Use strong, random admin key
   - Change regularly (monthly recommended)
   - Never commit to version control
   - Use environment variables only

2. **Database Security**
   - Enable Firestore security rules
   - Implement role-based access
   - Regular backups
   - Audit logging

3. **API Security**
   - Always use HTTPS in production
   - Implement rate limiting
   - Validate all inputs
   - Use secure headers (Helmet)

4. **CORS Configuration**
   - Whitelist trusted domains
   - Restrict methods (GET, POST, DELETE)
   - Never use wildcard in production

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - public read, no write
    match /users/{document=**} {
      allow read;
      allow create: if request.auth != null;
    }
    
    // Questions - public read
    match /quiz_questions/{document=**} {
      allow read;
    }
    
    // Leaderboard - public read
    match /leaderboard/{document=**} {
      allow read;
    }
    
    // Admin settings - only admin
    match /admin_settings/{document=**} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```

---

## Troubleshooting

### Issue: Server won't start
**Solution**: Check Firebase credentials in .env
```bash
npm run dev
# Check console for errors
```

### Issue: Quiz questions not loading
**Solution**: Verify questions exist in Firestore
```bash
# Add sample questions via admin panel
# Click "Seed Sample Questions" button
```

### Issue: Admin login fails
**Solution**: Verify admin key in .env
```bash
# Check .env ADMIN_KEY matches
# Default: GODMODE123
```

### Issue: High memory usage
**Solution**: Optimize database queries
```javascript
// Good - Limit results
.limit(20).get()

// Bad - Fetch all documents
.get()
```

---

## API Documentation

### User Routes

#### Register User
```http
POST /api/users/register
Content-Type: application/json

{
  "name": "John Doe",
  "registerNo": "REG123",
  "email": "john@example.com"
}

Response: { userId: "doc_id", message: "User registered" }
```

#### Check User Status
```http
GET /api/users/check/:registerNo

Response: { 
  registered: true,
  hasAttempted: false,
  score: 0 
}
```

### Quiz Routes

#### Get Questions
```http
GET /api/quiz/questions/:userId

Response: {
  questions: [
    {
      id: "q1",
      question: "What is 2+2?",
      type: "single",
      marks: 1,
      options: [...]
    }
  ],
  timer: 600
}
```

#### Submit Quiz
```http
POST /api/quiz/submit
Content-Type: application/json
x-admin-key: admin_key_here

{
  "userId": "user_123",
  "responses": [
    { "questionId": "q1", "selectedOption": ["opt1"] }
  ],
  "timeTaken": 300
}

Response: { score: 8, totalMarks: 10, status: "completed" }
```

### Admin Routes

#### Validate Admin Key
```http
POST /api/admin/validate
x-admin-key: admin_key

Response: { valid: true }
```

#### Start/Stop Quiz
```http
POST /api/admin/settings
x-admin-key: admin_key
Content-Type: application/json

{ "isActive": true }

Response: { message: "Quiz started" }
```

#### Get Leaderboard
```http
GET /api/admin/leaderboard
x-admin-key: admin_key

Response: {
  leaderboard: [
    {
      rank: 1,
      name: "John Doe",
      score: 95,
      correctAnswers: 19
    }
  ]
}
```

#### Add Question
```http
POST /api/admin/questions
x-admin-key: admin_key
Content-Type: application/json

{
  "question": "What is AI?",
  "type": "single",
  "marks": 2,
  "options": [
    { "text": "Option 1", "isCorrect": true },
    { "text": "Option 2", "isCorrect": false }
  ]
}

Response: { success: true, questionId: "q_123" }
```

#### Delete Question
```http
DELETE /api/admin/questions/:questionId
x-admin-key: admin_key

Response: { success: true, message: "Question deleted" }
```

---

## Monitoring & Maintenance

### Regular Tasks
- ✅ Weekly: Check server logs for errors
- ✅ Monthly: Review database usage and optimize
- ✅ Quarterly: Update Node.js dependencies
- ✅ Annually: Security audit and penetration testing

### Performance Optimization
```javascript
// Use indexing for frequently queried fields
db.collection('users').where('hasAttempted', '==', true)
   .where('registeredAt', '>=', timestamp)
   .get()

// Implement caching for leaderboard
const cache = new Map();
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
```

### Scaling Considerations
- Use CDN for static assets
- Implement caching layer
- Database read replicas for high traffic
- Load balancing for multiple instances

---

## Support & Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Express.js Docs**: https://expressjs.com
- **Node.js Best Practices**: https://nodejs.org/en/docs/guides
- **Security Guidelines**: https://owasp.org

---

**Created**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅
