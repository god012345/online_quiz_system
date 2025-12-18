// Admin UI script: login, tab switching, leaderboard, and controls

function getStoredKey() {
  return sessionStorage.getItem('adminKey');
}

function setStoredKey(key) {
  if (key) sessionStorage.setItem('adminKey', key);
  else sessionStorage.removeItem('adminKey');
}

async function validateKey(key) {
  const res = await fetch('/api/admin/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': key
    },
    body: JSON.stringify({})
  });
  return res.ok;
}

async function setUIAuthenticated(auth) {
  document.getElementById('controls').style.display = auth ? 'block' : 'none';
  if (auth) {
      await loadDashboard(); // Load stats and status
      await loadLeaderboard();
  }
}

async function loadDashboard() {
  const key = getStoredKey();
  try {
      const res = await fetch('/api/admin/dashboard', { headers: { 'x-admin-key': key } });
      if(res.ok) {
          const data = await res.json();
          // Update Status
          const statusEl = document.getElementById('status');
          if (data.settings && data.settings.isActive) {
              statusEl.innerHTML = '<i class="fas fa-check-circle"></i> SYSTEM ONLINE (Quiz Active)';
              statusEl.style.borderColor = 'var(--neon-green)';
              statusEl.style.color = 'var(--neon-green)';
              statusEl.style.background = 'rgba(0, 255, 100, 0.1)';
          } else {
              statusEl.innerHTML = '<i class="fas fa-stop-circle"></i> SYSTEM OFFLINE (Quiz Inactive)';
              statusEl.style.borderColor = 'var(--neon-red)';
              statusEl.style.color = 'var(--neon-red)';
              statusEl.style.background = 'rgba(255, 0, 85, 0.1)';
          }
          
          // Render Stats if container exists, else create it
          let statsContainer = document.getElementById('dashboardStats');
          if (!statsContainer) {
              statsContainer = document.createElement('div');
              statsContainer.id = 'dashboardStats';
              statsContainer.className = 'stats-grid';
              statsContainer.style.marginBottom = '30px';
              // Insert after status
              statusEl.after(statsContainer);
          }
          
          const s = data.statistics || {};
          statsContainer.innerHTML = `
              <div class="stat-card" style="padding:15px;">
                  <div class="stat-value" style="font-size:1.5rem">${s.totalUsers || 0}</div>
                  <div class="stat-label">REGISTERED</div>
              </div>
              <div class="stat-card" style="padding:15px;">
                  <div class="stat-value" style="font-size:1.5rem">${s.attemptedUsers || 0}</div>
                  <div class="stat-label">ATTEMPTED</div>
              </div>
              <div class="stat-card" style="padding:15px;">
                  <div class="stat-value" style="font-size:1.5rem">${s.averageScore || 0}</div>
                  <div class="stat-label">AVG SCORE</div>
              </div>
              <div class="stat-card" style="padding:15px;">
                  <div class="stat-value" style="font-size:1.5rem">${s.completionRate || 0}%</div>
                  <div class="stat-label">COMPLETION</div>
              </div>
          `;
      }
  } catch(e) { console.error('Dashboard load error', e); }
}

function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => btn.classList.remove('active'));
  
  // Show selected tab
  const tabElement = document.getElementById(tabName);
  if (tabElement) tabElement.classList.add('active');
  
  // Highlight active button
  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    }
  });
  
  // Load content based on tab
  if (tabName === 'leaderboard') {
    loadLeaderboard();
  } else if (tabName === 'questions') {
    loadQuestions();
  }
}

async function startQuiz() {
  const key = getStoredKey();
  const res = await fetch('/api/admin/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': key
    },
    body: JSON.stringify({ isActive: true })
  });
  const data = await res.json();
  document.getElementById('status').innerText = data.message || '✅ Quiz Started';
}

async function stopQuiz() {
  const key = getStoredKey();
  const res = await fetch('/api/admin/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': key
    },
    body: JSON.stringify({ isActive: false })
  });
  const data = await res.json();
  document.getElementById('status').innerText = data.message || '⏹️ Quiz Stopped';
}

async function loadLeaderboard() {
  const key = getStoredKey();
  try {
    const res = await fetch('/api/admin/leaderboard', {
      method: 'GET',
      headers: {
        'x-admin-key': key
      }
    });
    
    if (!res.ok) {
      document.getElementById('leaderboardBody').innerHTML = 
        '<tr><td colspan="6" style="text-align: center; color: #ef4444;">Failed to load leaderboard</td></tr>';
      return;
    }
    
    const data = await res.json();
    const tbody = document.getElementById('leaderboardBody');
    
    if (!data.leaderboard || data.leaderboard.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">No submissions yet</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.leaderboard.map(entry => `
      <tr>
        <td><div class="rank-badge">${entry.rank}</div></td>
        <td><span style="font-weight: bold; color: black;">${entry.name}</span></td>
        <td style="font-family: monospace; color: var(--neon-blue);">${entry.registerNo}</td>
        <td><strong style="color: var(--neon-purple);">${entry.score}</strong></td>
        <td>
           <div style="font-size: 0.9rem;">
             <i class="fas fa-check" style="color: var(--neon-green)"></i> ${entry.correctAnswers} / ${entry.totalQuestions}
           </div>
        </td>
        <td>${Math.floor(entry.timeTaken / 60)}m ${entry.timeTaken % 60}s</td>
        <td>
          <button class="btn btn-outline view-details-btn" style="padding: 4px 12px; font-size: 0.8rem;" data-userid="${entry.userId}">
             <i class="fas fa-eye"></i> Details
          </button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Leaderboard error:', error);
    document.getElementById('leaderboardBody').innerHTML = 
      '<tr><td colspan="7" style="text-align: center; color: var(--neon-red);">Error loading leaderboard</td></tr>';
  }
}

// Login / Logout / UI handlers
document.addEventListener('DOMContentLoaded', async () => {
  let refreshInterval = null; // Defined at top scope

  const stored = getStoredKey();
  if (stored) {
    const ok = await validateKey(stored);
    await setUIAuthenticated(ok);
    if (!ok) setStoredKey(null);
  } else {
    await setUIAuthenticated(false);
  }

  // Login button
  document.getElementById('loginBtn').addEventListener('click', async () => {
    const key = document.getElementById('adminKey').value.trim();
    if (!key) {
      document.getElementById('loginMsg').innerText = '❌ Enter admin key';
      document.getElementById('loginMsg').style.color = 'var(--neon-red)';
      return;
    }
    const ok = await validateKey(key);
    if (ok) {
      setStoredKey(key);
      document.getElementById('loginMsg').innerText = '✅ ACCESS GRANTED';
      document.getElementById('loginMsg').style.color = 'var(--neon-green)';
      await setUIAuthenticated(true);
    } else {
      document.getElementById('loginMsg').innerText = '❌ ACCESS DENIED';
      document.getElementById('loginMsg').style.color = 'var(--neon-red)';
    }
  });

  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', () => {
    setStoredKey(null);
    setUIAuthenticated(false);
    if (refreshInterval) clearInterval(refreshInterval); // Clear refresh on logout
    document.getElementById('adminKey').value = '';
    document.getElementById('loginMsg').innerText = '';
  });

  // Start/Stop buttons
  document.getElementById('startBtn').addEventListener('click', startQuiz);
  document.getElementById('stopBtn').addEventListener('click', stopQuiz);

  // Refresh leaderboard button
  document.getElementById('refreshLeaderboard').addEventListener('click', loadLeaderboard);



  // Header Listener for delegation
  document.getElementById('questionsList').addEventListener('click', (e) => {
    if (e.target.closest('.delete-btn')) {
      const btn = e.target.closest('.delete-btn');
      const id = btn.getAttribute('data-id');
      deleteQuestion(id);
    }
  });
  
  // Leaderboard Details Delegation
  document.getElementById('leaderboardBody').addEventListener('click', (e) => {
    if (e.target.closest('.view-details-btn')) {
      const btn = e.target.closest('.view-details-btn');
      const userId = btn.getAttribute('data-userid');
      viewUserDetails(userId);
    }
  });

  document.getElementById('optionsContainer').addEventListener('click', (e) => {
    if (e.target.closest('.remove-option-btn')) {
      e.target.closest('.form-group').remove();
    }
    
    // Enforce single choice radio behavior
    if (e.target.classList.contains('option-correct')) {
        const type = document.getElementById('questionType').value;
        if (type === 'single' && e.target.checked) {
            // Uncheck all others
            document.querySelectorAll('.option-correct').forEach(cb => {
                if (cb !== e.target) cb.checked = false;
            });
        }
    }
  });

  // Initialize question management form
  initQuestionForm();

  // Unified Tab Switching Logic
  document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
           const tab = btn.getAttribute('data-tab');
           if(!tab) return; // e.g. seedBtn
           
           // Clear existing interval
           if (refreshInterval) {
               clearInterval(refreshInterval);
               refreshInterval = null;
           }

           // UI Update
           document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
           document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
           
           const target = document.getElementById(tab);
           if(target) target.style.display = 'block';
           btn.classList.add('active');
           
           // Logic per tab
           if (tab === 'leaderboard') {
              loadLeaderboard();
              refreshInterval = setInterval(loadLeaderboard, 5000); 
           } else if (tab === 'questions') {
              loadQuestions();
           }
      });
  });
});

// Question Management Functions
async function loadQuestions() {
  const key = getStoredKey();
  if (!key) {
    document.getElementById('questionsList').innerHTML = '<p style="text-align: center; color: var(--text-muted);">Please login to view questions</p>';
    return;
  }

  try {
    const container = document.getElementById('questionsList');
    container.innerHTML = '<div class="spinner"></div>';

    const res = await fetch('/api/admin/questions', {
      method: 'GET',
      headers: { 'x-admin-key': key }
    });

    if (!res.ok) {
      throw new Error(`Server responded with status ${res.status}`);
    }

    const data = await res.json();
    
    // Check if questions array exists and has items
    if (!data || !Array.isArray(data.questions)) {
      container.innerHTML = '<p style="text-align: center; color: var(--neon-red);">Invalid response from server</p>';
      console.error('Invalid data structure:', data);
      return;
    }

    if (data.questions.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No questions yet. Add one or seed samples.</p>';
      return;
    }

    container.innerHTML = data.questions.map((q, idx) => `
      <div class="admin-question-item">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <strong style="font-size: 1.1rem; color: white;">${idx + 1}. ${q.question || 'Untitled'}</strong>
            <p style="margin: 5px 0 0 0; color: var(--text-muted);">
              <span class="tag-badge" style="border-color: var(--neon-blue); color: var(--neon-blue);">
                ${q.type === 'single' ? 'SINGLE SELECT' : 'MULTI SELECT'}
              </span>
              <span class="tag-badge" style="border-color: var(--neon-yellow); color: var(--neon-yellow);">
                ${q.marks || 1} PTS
              </span>
            </p>
          </div>
          <button class="btn btn-danger delete-btn" style="padding: 6px 12px; font-size: 0.8rem;" data-id="${q.id}">
             <i class="fas fa-trash"></i>
          </button>
        </div>
        <div style="margin-top: 15px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
          ${(q.options || []).map((opt, i) => `
            <div style="padding: 8px 12px; border-radius: 6px; background: ${opt.isCorrect ? 'rgba(0, 255, 100, 0.1)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${opt.isCorrect ? 'var(--neon-green)' : 'rgba(255,255,255,0.1)'}; color: ${opt.isCorrect ? 'var(--neon-green)' : 'var(--text-muted)'};">
              ${opt.isCorrect ? '<i class="fas fa-check"></i>' : '<i class="far fa-circle"></i>'} ${opt.text || '(empty)'}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading questions:', error);
    const container = document.getElementById('questionsList');
    container.innerHTML = `
      <div class="alert alert-danger" style="text-align: center;">
        <strong>Error loading questions:</strong><br/>
        ${error.message || 'Unknown error'}
      </div>
    `;
  }
}

async function deleteQuestion(questionId) {
  if (!confirm('Are you sure you want to delete this question?')) return;

  const key = getStoredKey();
  try {
    const res = await fetch(`/api/admin/questions/${questionId}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': key }
    });

    if (res.ok) {
      loadQuestions();
    } else {
      alert('❌ Failed to delete question');
    }
  } catch (error) {
    console.error('Delete error:', error);
    alert('❌ Error deleting question');
  }
}

async function addOption() {
  const container = document.getElementById('optionsContainer');
  const optionCount = container.children.length;
  
  const optionDiv = document.createElement('div');
  optionDiv.className = 'form-group';
  optionDiv.style.marginBottom = '10px';
  optionDiv.innerHTML = `
    <div style="display: flex; gap: 10px; align-items: center;">
      <div style="flex: 1;">
        <input type="text" class="option-text" placeholder="Option ${optionCount + 1}" />
      </div>
      <label style="margin-bottom: 0; display: flex; align-items: center; gap: 5px; cursor: pointer; color: var(--neon-green);">
        <input type="checkbox" class="option-correct" />
        CORRECT
      </label>
      <button type="button" class="btn btn-danger remove-option-btn" style="padding: 10px;">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  container.appendChild(optionDiv);
}

async function submitQuestion() {
  const key = getStoredKey();
  if (!key) {
    alert('Please login first');
    return;
  }

  const question = document.getElementById('questionText').value.trim();
  const type = document.getElementById('questionType').value;
  const marks = parseInt(document.getElementById('questionMarks').value);

  if (!question) {
    alert('Please enter a question');
    return;
  }

  const optionElements = document.getElementById('optionsContainer').children;
  if (optionElements.length < 2) {
    alert('Please add at least 2 options');
    return;
  }

  const options = Array.from(optionElements).map(el => ({
    text: el.querySelector('.option-text').value.trim(),
    isCorrect: el.querySelector('.option-correct').checked
  }));

  if (options.some(o => !o.text)) {
    alert('Please fill all option texts');
    return;
  }

  if (!options.some(o => o.isCorrect)) {
    alert('Please mark at least one correct option');
    return;
  }

  try {
    const res = await fetch('/api/admin/questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': key
      },
      body: JSON.stringify({ question, type, marks, options })
    });

    if (res.ok) {
      alert('✅ Question added successfully');
      document.getElementById('questionText').value = '';
      document.getElementById('questionMarks').value = 1;
      document.getElementById('optionsContainer').innerHTML = '';
      loadQuestions();
    } else {
      const error = await res.json();
      alert('❌ ' + (error.error || 'Failed to add question'));
    }
  } catch (error) {
    console.error('Submit error:', error);
    alert('❌ Error adding question');
  }
}

// Initialize option form
function initQuestionForm() {
  document.getElementById('addOptionBtn').addEventListener('click', addOption);
  document.getElementById('submitQuestionBtn').addEventListener('click', submitQuestion);
  document.getElementById('questionType').addEventListener('change', () => {
    const type = document.getElementById('questionType').value;
    const label = document.querySelector('label[for="questionMarks"]');
    label.textContent = `VALUE (Marks) [${type === 'single' ? '1-5' : '1-10'}]:`;
  });
}

// User Details Modal
async function viewUserDetails(userId) {
  if (!userId) return;
  
  // Create modal if not exists
  let modal = document.getElementById('detailsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'detailsModal';
    modal.className = 'modal-backdrop';
    
    modal.innerHTML = `
      <div class="modal-panel">
        <button id="closeModalBtn" style="position: absolute; top: 20px; right: 20px; font-size: 1.5rem; cursor: pointer; background: none; border: none; color: var(--neon-red);"><i class="fas fa-times"></i></button>
        <h2 id="modalTitle" style="color: var(--neon-blue); margin-bottom: 20px;">USER PROFILE</h2>
        <div id="modalContent">Retrieving data...</div>
      </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('closeModalBtn').addEventListener('click', () => {
      modal.style.display = 'none';
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }
  
  modal.style.display = 'flex';
  document.getElementById('modalContent').innerHTML = '<div class="spinner"></div>';
  
  const key = getStoredKey();
  try {
    const res = await fetch(`/api/admin/user-details/${userId}`, {
      headers: { 'x-admin-key': key }
    });
    
    if (!res.ok) {
       document.getElementById('modalContent').innerHTML = '<p style="color:var(--neon-red)">FAILED TO DECRYPT DATA</p>';
       return;
    }
    
    const data = await res.json();
    document.getElementById('modalTitle').innerHTML = `<i class="fas fa-user-astronaut"></i> ${data.user.name} <span style="font-size: 0.8rem; color: var(--text-muted);">// ${data.user.registerNo}</span>`;
    
    if (!data.responses || data.responses.length === 0) {
      document.getElementById('modalContent').innerHTML = '<p style="color: var(--text-muted); padding: 20px; text-align: center;">NO COMBAT DATA FOUND</p>';
      return;
    }
    
    document.getElementById('modalContent').innerHTML = data.responses.map((r, idx) => {
       const isCorrect = r.isCorrect;
       let answerText = Array.isArray(r.userAnswer) ? r.userAnswer.join(', ') : r.userAnswer;
       let correctText = Array.isArray(r.correctAnswer) ? r.correctAnswer.join(', ') : r.correctAnswer;
       
       if (r.options && r.options.length) {
         if (Array.isArray(r.userAnswer)) {
           answerText = r.userAnswer.map(aid => {
              const opt = r.options.find((o, i) => `opt${i+1}` === aid);
              return opt ? opt.text : aid;
           }).join(', ');
         } else {
           const opt = r.options.find((o, i) => `opt${i+1}` === r.userAnswer);
           if (opt) answerText = opt.text;
         }
         
          if (Array.isArray(r.correctAnswer)) {
           correctText = r.correctAnswer.map(aid => {
              const opt = r.options.find((o, i) => `opt${i+1}` === aid);
              return opt ? opt.text : aid;
           }).join(', ');
         } else {
           const opt = r.options.find((o, i) => `opt${i+1}` === r.correctAnswer);
           if (opt) correctText = opt.text;
         }
       }
    
       return `
         <div class="review-card">
           <div style="font-weight: bold; margin-bottom: 10px; font-size: 1.1rem; color: white;">${idx + 1}. ${r.question}</div>
           
           <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
               <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; border: 1px solid ${isCorrect ? 'var(--neon-green)' : 'var(--neon-red)'};">
                   <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">USER SELECTED</div>
                   <div style="color: white; font-weight: bold;">${answerText || 'None'} ${isCorrect ? '<i class="fas fa-check" style="color: var(--neon-green)"></i>' : '<i class="fas fa-times" style="color: var(--neon-red)"></i>'}</div>
               </div>
               
               ${!isCorrect ? `
               <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; border: 1px dashed var(--neon-blue);">
                   <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">CORRECT DATA</div>
                   <div style="color: var(--neon-blue); font-weight: bold;">${correctText}</div>
               </div>` : ''}
           </div>
         </div>
       `;
    }).join('');
    
  } catch (err) {
    console.error(err);
    document.getElementById('modalContent').innerHTML = '<p style="color:var(--neon-red)">SYSTEM MALFUNCTION</p>';
  }
}
