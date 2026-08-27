// Admin Login Page JavaScript
// VAN//MOD - Admin Authentication

// ==================== LOGIN FORM ====================
function initLoginForm() {
    const loginForm = document.querySelector('form');
    const errorMessage = document.getElementById('error-message');
    
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Hide error message
        if (errorMessage) {
            errorMessage.classList.add('hidden');
        }
        
        // Get form values
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Show loading state
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <span class="relative z-10 flex items-center gap-2">
                <span class="animate-pulse">AUTHENTICATING...</span>
            </span>
        `;
        
        try {
            // Attempt login
            const result = await VANMOD.adminLogin(email, password);
            
            if (result.success) {
                // Success - redirect to dashboard
                showSuccessAnimation();
                setTimeout(() => {
                    window.location.href = 'dashbordadmin.html';
                }, 1500);
            } else {
                // Show error
                if (errorMessage) {
                    errorMessage.classList.remove('hidden');
                    errorMessage.querySelector('p').textContent = result.error || 'INVALID ADMIN CREDENTIALS.';
                }
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }
        } catch (error) {
            console.error('Login error:', error);
            if (errorMessage) {
                errorMessage.classList.remove('hidden');
                errorMessage.querySelector('p').textContent = 'SYSTEM ERROR. PLEASE TRY AGAIN.';
            }
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    });
}

// ==================== PASSWORD TOGGLE ====================
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = event.currentTarget;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = 'HIDE';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = 'SHOW';
    }
}

// Make togglePassword available globally
window.togglePassword = togglePassword;

// ==================== SUCCESS ANIMATION ====================
function showSuccessAnimation() {
    const body = document.body;
    const successOverlay = document.createElement('div');
    successOverlay.className = 'fixed inset-0 bg-primary-container/20 backdrop-blur-sm z-50 flex items-center justify-center';
    successOverlay.innerHTML = `
        <div class="bg-surface-container-lowest border-2 border-primary-container p-xl text-center brutalist-shadow-hover">
            <span class="material-symbols-outlined text-[64px] text-primary-container mb-md block" style="font-variation-settings: 'FILL' 1;">check_circle</span>
            <h2 class="font-headline-lg text-headline-lg text-primary mb-sm">ACCESS GRANTED</h2>
            <p class="font-label-md text-on-surface-variant uppercase tracking-widest">Redirecting to admin terminal...</p>
        </div>
    `;
    body.appendChild(successOverlay);
}

// ==================== CHECK IF ALREADY LOGGED IN ====================
function checkExistingAuth() {
    VANMOD.checkAuthState((user) => {
        if (user) {
            // Already logged in, redirect to dashboard
            window.location.href = 'dashbordadmin.html';
        }
    });
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    checkExistingAuth();
    initLoginForm();
});
