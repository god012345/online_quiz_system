// Quiz page functionality
let quizTimer;
let timeLeft = 1200; // Default 10 minutes
let currentQuestion = 0;
let userAnswers = [];
let quizData = null;

document.addEventListener('DOMContentLoaded', async function() {
    const userId = localStorage.getItem('quizUserId');
    
    if (!userId) {
        window.location.href = '/';
        return;
    }
    
    // Add leaderboard button listener
    const leaderboardBtn = document.getElementById('leaderboardBtn');
    if (leaderboardBtn) {
      leaderboardBtn.addEventListener('click', () => {
        window.location.href = '/leaderboard';
      });
    }
    
    try {
        // Check if user can take quiz or has already taken it
        const checkResponse = await fetch(`/api/users/check/${localStorage.getItem('userRegisterNo')}`);
        const checkData = await checkResponse.json();
        
        if (!checkResponse.ok) {
            // If already attempted, show results directly
            if (checkData.error === 'You have already attempted the quiz') {
               const resultRes = await fetch(`/api/quiz/result/${userId}`);
               if (resultRes.ok) {
                   const resultData = await resultRes.json();
                   showResults(resultData);
                   
                   // Render review using enriched data from server
                   if (resultData.responses && resultData.responses.length > 0) {
                       const questions = resultData.responses.map(r => ({
                           id: r.questionId,
                           question: r.question,
                           options: r.options || [],
                           type: r.type || 'single'
                       }));
                       renderReview(questions, resultData.responses);
                   }
                   return;
               }
            }

            showMessage(checkData.error, 'danger');
            setTimeout(() => window.location.href = '/', 3000);
            return;
        }
        
        // Get quiz questions
        showMessage('Loading quiz questions...', 'warning');
        
        const response = await fetch(`/api/quiz/questions/${userId}`);
        const data = await response.json();
        
        if (!response.ok) {
            showMessage(data.error, 'danger');
            return;
        }
        
        quizData = data;
        timeLeft = 1200;
        
        // Clear message
        const msg = document.querySelector('.alert');
        if (msg) msg.remove();
        
        initializeQuiz();
        startTimer();
        loadQuestion(0);
        
    } catch (error) {
        console.error('Quiz initialization error:', error);
        showMessage('Failed to load quiz. Please try again.', 'danger');
    }
});

function initializeQuiz() {
    // Initialize answers array
    userAnswers = quizData.questions.map(question => ({
        questionId: question.id,
        selectedOption: null,
        selectedOptions: [],
        type: question.type
    }));
    
    // Create progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = '<div class="progress-fill" style="width: 0%"></div>';
    document.getElementById('quizContainer').insertBefore(progressBar, document.getElementById('questionContainer'));
    
    // Create navigation buttons
    const navContainer = document.createElement('div');
    navContainer.className = 'question-nav';
    
    navContainer.innerHTML = `
        <button class="btn btn-outline" id="prevBtn">⬅️ Previous</button>
        <span id="questionCounter" style="align-self: center; font-weight: bold;">Question 1 of ${quizData.questions.length}</span>
        <button class="btn btn-outline" id="nextBtn">Next ➡️</button>
    `;
    
    document.getElementById('quizContainer').appendChild(navContainer);
    
    // Add event listeners
    document.getElementById('prevBtn').addEventListener('click', () => navigate(-1));
    document.getElementById('nextBtn').addEventListener('click', () => navigate(1));
    
    // Add submit button
    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-success';
    submitBtn.textContent = '✅ Submit Quiz';
    submitBtn.style.width = '100%';
    submitBtn.style.marginTop = '20px';
    submitBtn.addEventListener('click', submitQuiz);
    
    document.getElementById('quizContainer').appendChild(submitBtn);
}

function loadQuestion(index) {
    currentQuestion = index;
    const question = quizData.questions[index];
    const container = document.getElementById('questionContainer');
    
    // Update progress bar
    const progress = ((index + 1) / quizData.questions.length) * 100;
    document.querySelector('.progress-fill').style.width = `${progress}%`;
    
    // Update counter
    document.getElementById('questionCounter').textContent = 
        `Question ${index + 1} of ${quizData.questions.length}`;
    
    // Update navigation buttons
    document.getElementById('prevBtn').disabled = index === 0;
    const isLastQuestion = index === quizData.questions.length - 1;
    const nextBtn = document.getElementById('nextBtn');
    
    if (isLastQuestion) {
        nextBtn.textContent = 'Finish 🏁';
        nextBtn.classList.remove('btn-outline');
        nextBtn.classList.add('btn-success');
    } else {
        nextBtn.textContent = 'Next ➡️';
        nextBtn.classList.add('btn-outline');
        nextBtn.classList.remove('btn-success');
    }
    
    // Build question HTML
    let optionsHTML = '';
    
    if (question.type === 'multiple') {
        optionsHTML = question.options.map((option, optIndex) => {
            const isChecked = userAnswers[index].selectedOptions.includes(`opt${optIndex + 1}`);
            return `
                <label class="option-label ${isChecked ? 'selected' : ''}">
                    <input type="checkbox" value="opt${optIndex + 1}" 
                           ${isChecked ? 'checked' : ''}>
                    ${option.text}
                </label>
            `;
        }).join('');
    } else {
        optionsHTML = question.options.map((option, optIndex) => {
            const isChecked = userAnswers[index].selectedOption === `opt${optIndex + 1}`;
            return `
                <label class="option-label ${isChecked ? 'selected' : ''}">
                    <input type="radio" name="question${index}" value="opt${optIndex + 1}"
                           ${isChecked ? 'checked' : ''}>
                    ${option.text}
                </label>
            `;
        }).join('');
    }
    
    container.innerHTML = `
        <div class="question-card">
            <div class="question-header">
                <span class="question-number">${index + 1}</span>
                <span class="question-marks">[${question.marks || 1} Mark${question.marks > 1 ? 's' : ''}]</span>
            </div>
            <h3>${question.question}</h3>
            <div class="question-options">
                ${optionsHTML}
            </div>
        </div>
    `;
    
    // Add event listeners to options
    const optionInputs = container.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    optionInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            saveAnswer(index, e.target);
            
            // Update UI
            const labels = container.querySelectorAll('.option-label');
            labels.forEach(label => label.classList.remove('selected'));
            
            if (question.type === 'multiple') {
                const checkedInputs = container.querySelectorAll('input[type="checkbox"]:checked');
                checkedInputs.forEach(input => {
                    input.closest('.option-label').classList.add('selected');
                });
            } else {
                const checkedInput = container.querySelector('input[type="radio"]:checked');
                if (checkedInput) {
                    checkedInput.closest('.option-label').classList.add('selected');
                }
            }
        });
    });
}

function saveAnswer(index, input) {
    if (quizData.questions[index].type === 'multiple') {
        const checkedInputs = document.querySelectorAll(`#questionContainer input[type="checkbox"]:checked`);
        userAnswers[index].selectedOptions = Array.from(checkedInputs).map(input => input.value);
    } else {
        userAnswers[index].selectedOption = input.value;
    }
}

function navigate(direction) {
    const newIndex = currentQuestion + direction;
    
    if (newIndex >= 0 && newIndex < quizData.questions.length) {
        loadQuestion(newIndex);
    } else if (newIndex === quizData.questions.length && direction === 1) {
        // Handle Finish button click
        submitQuiz();
    }
}

function startTimer() {
    let timerElement = document.getElementById('timer');
    
    // Create timer element only if it doesn't exist
    if (!timerElement) {
        timerElement = document.createElement('div');
        timerElement.id = 'timer';
        document.body.appendChild(timerElement);
    }
    
    updateTimerDisplay();
    
    quizTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(quizTimer);
            submitQuiz();
        }
        
        // Warning colors
        if (timeLeft <= 60) {
            timerElement.style.background = 'rgba(255, 0, 0, 0.2)';
            timerElement.style.borderColor = 'var(--neon-red)';
            timerElement.classList.add('flashing-text');
        } else if (timeLeft <= 300) {
            timerElement.style.borderColor = 'var(--neon-yellow)';
            timerElement.style.color = 'var(--neon-yellow)';
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

async function submitQuiz() {
    if (!confirm('Are you sure you want to submit the quiz?')) {
        return;
    }
    
    // Disable all buttons to prevent double submission
    const allBtns = document.querySelectorAll('button');
    allBtns.forEach(btn => btn.disabled = true);
    
    // Show spinner on the active finish/submit buttons
    const activeSubmitters = document.querySelectorAll('button.btn-success');
    activeSubmitters.forEach(btn => btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> UPLOADING...');

    clearInterval(quizTimer);
    
    try {
        const userId = localStorage.getItem('quizUserId');
        const response = await fetch('/api/quiz/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                answers: userAnswers
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResults(data);
            
            // Render detailed review immediately using returned data
            if (data.responses) {
                let questionsToRender = [];
                if (quizData && quizData.questions) {
                    questionsToRender = quizData.questions;
                } else {
                     // Fallback if somehow quizData is missing (reload scenarios usually handled by check endpoint)
                     // But for submit flow, quizData should be present.
                     console.warn("Quiz data missing for review render");
                }
                
                renderReview(questionsToRender, data.responses);
            }

        } else {
            alert(data.error || 'Submission failed');
            // Re-enable buttons
            allBtns.forEach(btn => btn.disabled = false);
            activeSubmitters.forEach(btn => btn.innerHTML = '<i class="fas fa-check"></i> SUBMIT MISSION');
        }
    } catch (error) {
        console.error('Submit error:', error);
        alert('Network error. Please try again.');
        allBtns.forEach(btn => btn.disabled = false);
        activeSubmitters.forEach(btn => btn.innerHTML = '<i class="fas fa-check"></i> SUBMIT MISSION');
    }
}

function showResults(data) {
    // Hide Timer
    const timer = document.getElementById('timer');
    if (timer) timer.style.display = 'none';

    document.getElementById('quizContainer').style.display = 'none';
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.style.display = 'block';
    
    // Scroll to top to ensure results are seen
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    document.getElementById('finalScore').textContent = data.score || 0;
    document.getElementById('correctCount').textContent = data.correctAnswers || 0;
    document.getElementById('totalCount').textContent = data.totalQuestions || 0;
    
    const percentage = data.percentage || (data.totalQuestions > 0 
      ? Math.round((data.correctAnswers / data.totalQuestions) * 100)
      : 0);
    document.getElementById('percentage').textContent = percentage + '%';
    
    // Show encouraging message
    let message = '';
    const pVal = parseFloat(percentage);
    if (pVal >= 90) message = '🌟 OUTSTANDING! YOU ARE A LEGEND!';
    else if (pVal >= 75) message = '⭐ EXCELLENT WORK! KEEP IT UP!';
    else if (pVal >= 60) message = '👍 GOOD JOB! MISSION ACCOMPLISHED!';
    else if (pVal >= 40) message = '📚 FAIR ATTEMPT. RE-TRAINING ADVISED.';
    else message = '💪 KEEP PRACTICING. YOU CAN DO BETTER!';
    
    const msgEl = document.getElementById('resultMessage');
    msgEl.innerHTML = `<i class="fas fa-comment-dots"></i> ${message}`;
    msgEl.style.color = 'white'; 
    msgEl.className = 'card flashing-text';
    msgEl.style.background = 'rgba(0,0,0,0.3)';
    msgEl.style.border = '1px solid var(--neon-blue)';
}

function renderReview(questions, responses) {
  const container = document.getElementById('reviewContainer');
  if (!container) return;

  container.innerHTML = '<h2 style="color: white; margin-bottom: 20px;">📝 MISSION DEBRIEF</h2>';

  questions.forEach((q, idx) => {
    // Find the response for this question
    const response = responses.find(r => r.questionId === q.id);
    const userAnswer = response ? response.userAnswer : null;
    const isCorrect = response ? response.isCorrect : false;
    const correctAnswer = response ? response.correctAnswer : null;

    let statusHtml = '';
    if (isCorrect) {
      statusHtml = '<span style="color: var(--neon-green); font-weight: bold;"><i class="fas fa-check"></i> CORRECT</span>';
    } else {
      statusHtml = '<span style="color: var(--neon-red); font-weight: bold;"><i class="fas fa-times"></i> INCORRECT</span>';
    }

    // Build options HTML with explicit validation labels
    let optionsHtml = '';
    
    // Normalize user/correct answers to arrays for easier checking
    const userAnsArray = Array.isArray(userAnswer) ? userAnswer : (userAnswer ? [userAnswer] : []);
    const correctAnsArray = Array.isArray(correctAnswer) ? correctAnswer : (correctAnswer ? [correctAnswer] : []);
    
    // We treat options as indexed 1-based (opt1, opt2...) if IDs are missing
    optionsHtml = q.options.map((opt, i) => {
       // Attempt to determine ID: use opt.id if exists, else construct opt{i+1}
       // Note: quizRoutes likely maps answers to opt{i+1} or similar if IDs aren't persistent.
       // Looking at admin.js, it reconstructs using index. Let's rely on index-based ID for client consistency first.
       const optId = opt.id || `opt${i+1}`; 
       
       const isSelected = userAnsArray.includes(optId);
       const isActuallyCorrect = correctAnsArray.includes(optId); // Check against server's correct answer
       // Also check if the option object itself says it's correct (for display purposes if server didn't send 'correctAnswer' field in response)
       const isOptMarkedCorrect = opt.isCorrect; // This comes from question data if available
       
       // Final truth: Use server's specific correct answer response check if available, otherwise fallback to option's own flag
       const isTrulyCorrect = (correctAnswer) ? isActuallyCorrect : isOptMarkedCorrect;
       
       // But wait! If we rely on 'correctAnswer' (array of IDs) from server response:
       // We must ensure 'optId' matches what server sends.
       // Current server code (Step 3) sends OPTION IDs.
       // Admin code (Step 100) implies options might rely on index.  
       // Let's assume server sends 'opt1', 'opt2' etc. OR real IDs.
       // Since I cannot change server right now without verifying admin routes, I will try to match BOTH.
       
       const match = isSelected;
       const isRight = correctAnswer ? correctAnsArray.includes(optId) : (opt.isCorrect === true);
       
       let styleClass = 'review-option';
       let icon = '<i class="far fa-circle"></i>';
       let label = '';
       
       if (match && isRight) {
           styleClass += ' correct-selection';
           icon = '<i class="fas fa-check-circle"></i>';
           label = '<span style="margin-left:auto; font-size:0.8rem; font-weight:bold; color:#fff;">YOUR ANSWER <i class="fas fa-check"></i></span>';
       } else if (match && !isRight) {
           styleClass += ' wrong-selection';
           icon = '<i class="fas fa-times-circle"></i>';
           label = '<span style="margin-left:auto; font-size:0.8rem; font-weight:bold; color:#fff;">YOUR ANSWER <i class="fas fa-times"></i></span>';
       } else if (isRight) {
           styleClass += ' missed-correct';
           icon = '<i class="fas fa-arrow-right"></i>';
           label = '<span style="margin-left:auto; font-size:0.8rem; font-weight:bold; color:var(--text-muted);">CORRECT ANSWER</span>';
       }
       
       return `<div class="${styleClass}">
          ${icon} <span style="margin-left: 10px;">${opt.text || opt}</span>
          ${label}
       </div>`;
    }).join('');

    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom: 15px;">
         <strong style="font-size: 1.1rem;">${idx + 1}. ${q.question}</strong>
         ${statusHtml}
      </div>
      <div>
        ${optionsHtml}
      </div>
    `;
    container.appendChild(card);
  });
}

function showMessage(text, type) {
    // Remove existing messages
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = text;
    
    const container = document.getElementById('quizContainer');
    container.insertBefore(alertDiv, container.firstChild);
}

// Prevent cheating
window.addEventListener('beforeunload', function(e) {
    if (quizTimer) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your quiz progress will be lost.';
    }
});

document.addEventListener('visibilitychange', function() {
    if (document.hidden && quizTimer) {
        showMessage('Warning: Tab switching detected!', 'danger');
    }
});