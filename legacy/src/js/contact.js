// Contact Page JavaScript
// VAN//MOD - Contact Form Management

// ==================== INIT CONTACT FORM ====================
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleSubmit();
    });
}

// ==================== HANDLE SUBMIT ====================
async function handleSubmit() {
    const submitBtn = document.querySelector('#contact-form button[type="submit"]');
    if (!submitBtn || !window.VANMOD) return;

    const originalHtml = submitBtn.innerHTML;

    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <span class="relative z-10 flex items-center gap-2">
            <span class="animate-pulse">TRANSMITTING...</span>
        </span>
    `;

    const restoreButton = () => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
    };

    try {
        // Collect form data (null-safe: fields may be absent in older HTML)
        const formData = {
            name: document.getElementById('name')?.value.trim() || '',
            email: document.getElementById('email')?.value.trim() || '',
            subject: document.getElementById('subject')?.value.trim() || '',
            message: document.getElementById('message')?.value.trim() || '',
            priority: document.querySelector('input[name="priority"]:checked')?.value || 'normal'
        };
        
        // Validate
        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            alert('Please fill in all required fields');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHtml;
            return;
        }
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert('Please enter a valid email address');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHtml;
            return;
        }
        
        // Submit to Firebase
        const result = await VANMOD.submitContactForm(formData);
        
        if (result.success) {
            // Show success message
            showSuccessMessage();
            
            // Clear form
            document.getElementById('contact-form').reset();
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = 'transmissionsucces.html';
            }, 2000);
        } else {
            throw new Error(result.error || 'Failed to submit form');
        }
        
    } catch (error) {
        console.error('Contact form error:', error);
        alert('Failed to submit message. Please try again.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
    }
}

// ==================== SUCCESS MESSAGE ====================
function showSuccessMessage() {
    const successOverlay = document.createElement('div');
    successOverlay.className = 'fixed inset-0 bg-surface-container-lowest/90 backdrop-blur-sm z-50 flex items-center justify-center';
    successOverlay.innerHTML = `
        <div class="bg-surface-container border-2 border-primary-container p-xl text-center brutalist-shadow-hover max-w-md">
            <span class="material-symbols-outlined text-[64px] text-primary-container mb-md block animate-pulse" style="font-variation-settings: 'FILL' 1;">mark_email_read</span>
            <h2 class="font-headline-lg text-headline-lg text-primary mb-sm uppercase">TRANSMISSION RECEIVED</h2>
            <p class="font-body-md text-on-surface-variant mb-sm">Your message has been successfully transmitted to VAN//MOD operations.</p>
            <p class="font-label-sm text-on-surface-variant uppercase tracking-widest">Redirecting...</p>
        </div>
    `;
    document.body.appendChild(successOverlay);
}

// ==================== FORM VALIDATION ====================
function initFormValidation() {
    const inputs = document.querySelectorAll('input[required], textarea[required]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            validateInput(input);
        });
        
        input.addEventListener('input', () => {
            if (input.classList.contains('border-error')) {
                validateInput(input);
            }
        });
    });
}

function validateInput(input) {
    if (!input.value.trim()) {
        input.classList.add('border-error');
        input.classList.remove('border-outline-variant');
        return false;
    } else {
        input.classList.remove('border-error');
        input.classList.add('border-outline-variant');
        return true;
    }
}

// ==================== CHARACTER COUNT ====================
function initCharacterCount() {
    const messageInput = document.getElementById('message');
    const charCount = document.getElementById('char-count');
    
    if (!messageInput || !charCount) return;
    
    messageInput.addEventListener('input', () => {
        const length = messageInput.value.length;
        const maxLength = messageInput.getAttribute('maxlength') || 1000;
        charCount.textContent = `${length} / ${maxLength}`;
        
        if (length >= maxLength * 0.9) {
            charCount.classList.add('text-error');
        } else {
            charCount.classList.remove('text-error');
        }
    });
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initContactForm();
    initFormValidation();
    initCharacterCount();
});
