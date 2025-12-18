// Signup page functionality
document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    const messageDiv = document.getElementById('message');
    
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const registerNo = document.getElementById('registerNo').value.trim();
        const email = document.getElementById('email').value.trim();
        
        // Validation
        if (!name || !registerNo || !email) {
            showMessage('Please fill in all fields', 'danger');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage('Please enter a valid email address', 'danger');
            return;
        }
        
        try {
            showMessage('Registering... Please wait', 'warning');
            
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    name,
                    registerNo,
                    email 
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store user data in localStorage
                localStorage.setItem('quizUserId', data.userId);
                // Use server data if available (fixes typo issues during login)
                const finalName = (data.userData && data.userData.name) || name;
                const finalRegNo = (data.userData && data.userData.registerNo) || registerNo;
                
                localStorage.setItem('userName', finalName);
                localStorage.setItem('userRegisterNo', finalRegNo);
                
                showMessage('✅ Registration successful! Redirecting to quiz...', 'success');
                
                // Redirect to quiz page after 2 seconds
                setTimeout(() => {
                    window.location.href = '/quiz';
                }, 2000);
            } else {
                showMessage(data.error || 'Registration failed', 'danger');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showMessage('Network error. Please check if server is running.', 'danger');
        }
    });
    
    function showMessage(text, type) {
        messageDiv.innerHTML = `<div class="alert alert-${type}">${text}</div>`;
        messageDiv.style.display = 'block';
    }
});