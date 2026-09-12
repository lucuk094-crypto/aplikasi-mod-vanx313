// Admin Login Page JavaScript
// VAN//MOD - Admin Authentication

// ==================== LOGIN FORM ====================
function initLoginForm() {
    const loginForm = document.getElementById('login-form') || document.querySelector('form');
    const errorMessage = document.getElementById('error-message');
    
    if (!loginForm) {
        console.error('Login form not found!');
        return;
    }
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!window.VANMOD) {
            showFormError('SYSTEM OFFLINE. PLEASE TRY AGAIN.');
            return;
        }

        // Hide error message
        if (errorMessage) {
            errorMessage.classList.add('hidden');
        }

        // Get form values
        const email = document.getElementById('email')?.value.trim() || '';
        const password = document.getElementById('password')?.value || '';

        if (!email || !password) {
            showFormError('EMAIL AND PASSWORD ARE REQUIRED.');
            return;
        }

        // Show loading state
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalText = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = `
                <span class="relative z-10 flex items-center gap-2">
                    <span class="animate-pulse">AUTHENTICATING...</span>
                </span>
            `;
        }

        const restoreButton = () => {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }
        };

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
                showFormError(result.error || 'INVALID ADMIN CREDENTIALS.');
                restoreButton();
            }
        } catch (error) {
            console.error('Login error:', error);
            showFormError('SYSTEM ERROR. PLEASE TRY AGAIN.');
            restoreButton();
        }
    });
}

// ==================== FORM ERROR ====================
function showFormError(message) {
    const errorMessage = document.getElementById('error-message');
    if (!errorMessage) {
        alert(message);
        return;
    }
    errorMessage.classList.remove('hidden');
    const errorText = errorMessage.querySelector('p');
    if (errorText) {
        errorText.textContent = message;
    }
}

// ==================== PASSWORD TOGGLE ====================
function togglePassword(btn) {
    const passwordInput = document.getElementById('password');
    // `this` is passed from the inline handler; fall back to window.event
    const toggleBtn = btn || (typeof event !== 'undefined' ? event.currentTarget : null);
    if (!passwordInput || !toggleBtn) return;

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
    if (!window.VANMOD) return;
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
