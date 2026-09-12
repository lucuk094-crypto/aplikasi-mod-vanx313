// Detail App Page JavaScript
// VAN//MOD - App Detail View

let currentApp = null;
let currentAppId = null;
let currentAppType = null;

const VALID_TYPES = ['apps', 'games', 'tools'];

// ==================== LOAD APP DETAIL ====================
async function loadAppDetail() {
    // Get app ID and type from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentAppId = urlParams.get('id');
    currentAppType = urlParams.get('type') || 'apps';

    if (!VALID_TYPES.includes(currentAppType)) {
        currentAppType = 'apps';
    }

    if (!currentAppId) {
        showPageError('App ID not found in URL.');
        return;
    }

    if (!window.VANMOD) {
        showPageError('System offline. Failed to initialize. Please try again.');
        return;
    }

    try {
        // Show loading overlay (non-destructive: page content stays intact)
        showLoadingOverlay();

        // Get manager based on type
        const manager = VANMOD.getManager(currentAppType);

        // Fetch app details
        currentApp = await manager.getById(currentAppId);

        hideLoadingOverlay();

        if (!currentApp) {
            showPageError('Mod not found. It may have been removed.');
            return;
        }

        // Render app details
        renderAppDetails();
        renderScreenshots();
        renderTechnicalSpecs();
        renderReviews();
        initSaveButton();

    } catch (error) {
        console.error('Failed to load app details:', error);
        hideLoadingOverlay();
        showPageError('Failed to load mod data. Please try again.');
    }
}

// ==================== RENDER APP DETAILS ====================
function renderAppDetails() {
    const esc = VANMOD.escapeHtml;

    // Update header
    const headerTitle = document.getElementById('app-title');
    const headerIcon = document.getElementById('app-icon');
    const headerVersion = document.getElementById('app-version');
    const headerRating = document.getElementById('app-rating');
    const headerDownloads = document.getElementById('app-downloads');

    if (headerTitle) headerTitle.textContent = currentApp.name || 'Untitled';
    if (headerIcon) {
        headerIcon.src = currentApp.icon || VANMOD.PLACEHOLDER_ICON;
        headerIcon.alt = currentApp.name || 'App icon';
        headerIcon.onerror = function () {
            this.onerror = null;
            this.src = VANMOD.PLACEHOLDER_ICON;
        };
    }
    if (headerVersion) headerVersion.textContent = `v${currentApp.version || '1.0'}`;
    if (headerRating) headerRating.textContent = currentApp.rating ? Number(currentApp.rating).toFixed(1) : 'N/A';
    if (headerDownloads) headerDownloads.textContent = VANMOD.formatNumber(currentApp.downloads || 0);

    document.title = `// VAN//MOD - ${(currentApp.name || 'DETAIL').toUpperCase()}`;

    // Update description
    const descriptionElement = document.getElementById('app-description');
    if (descriptionElement) {
        descriptionElement.textContent = currentApp.description || 'No description available';
    }

    // Update tags / mod features (derived from tags; keep static list when empty)
    const featuresContainer = document.getElementById('app-features');
    if (featuresContainer && Array.isArray(currentApp.tags) && currentApp.tags.length > 0) {
        featuresContainer.innerHTML = currentApp.tags.map(tag => `
            <li class="flex items-center gap-sm">
                <span class="material-symbols-outlined text-primary-container" style="font-variation-settings: 'FILL' 1;">check_box</span>
                ${esc(String(tag).toUpperCase())}
            </li>
        `).join('');
    }

    const tagsContainer = document.getElementById('app-tags');
    if (tagsContainer && Array.isArray(currentApp.tags) && currentApp.tags.length > 0) {
        tagsContainer.innerHTML = currentApp.tags.map(tag =>
            `<span class="border border-outline-variant px-3 py-1 font-label-sm text-on-surface-variant uppercase">${esc(tag)}</span>`
        ).join('');
    }

    // Update metadata
    const sizeElement = document.getElementById('app-size');
    const categoryElement = document.getElementById('app-category');
    const updatedElement = document.getElementById('app-updated');

    if (sizeElement) sizeElement.textContent = currentApp.size || 'N/A';
    if (categoryElement) categoryElement.textContent = currentApp.category || 'General';
    if (updatedElement) {
        updatedElement.textContent = currentApp.updatedAt ? VANMOD.timeAgo(currentApp.updatedAt) : 'N/A';
    }
}

// ==================== RENDER SCREENSHOTS ====================
function renderScreenshots() {
    const container = document.getElementById('screenshots-container');
    if (!container) return;

    // No screenshots in data: keep the static gallery already in the HTML
    const screenshots = currentApp.screenshots;
    if (!Array.isArray(screenshots) || screenshots.length === 0) return;

    const esc = VANMOD.escapeHtml;
    let html = '';
    screenshots.forEach((screenshot, index) => {
        html += `
            <div class="snap-center shrink-0 w-[240px] md:w-[320px] aspect-[9/16] neo-brutal-card overflow-hidden cursor-pointer" onclick="openScreenshot(${index})">
                <img class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300" loading="lazy" src="${esc(screenshot)}" alt="Screenshot ${index + 1}" onerror="this.onerror=null;this.src='${VANMOD.PLACEHOLDER_ICON}'">
            </div>
        `;
    });

    container.innerHTML = html;
}

// ==================== RENDER TECHNICAL SPECS ====================
function renderTechnicalSpecs() {
    const container = document.getElementById('tech-specs-container');
    if (!container) return;

    const esc = VANMOD.escapeHtml;
    const specs = [
        { label: 'VERSION', value: currentApp.version || '1.0' },
        { label: 'SIZE', value: currentApp.size || 'N/A' },
        { label: 'ANDROID', value: currentApp.androidVersion || '5.0+' },
        { label: 'CATEGORY', value: currentApp.category || 'General' },
        { label: 'DEVELOPER', value: currentApp.developer || 'Unknown' },
        { label: 'PACKAGE', value: currentApp.packageName || 'N/A' },
        { label: 'LICENSE', value: currentApp.license || 'Freeware' },
        { label: 'UPDATED', value: currentApp.updatedAt ? VANMOD.timeAgo(currentApp.updatedAt) : 'N/A' }
    ];

    let html = '';
    specs.forEach(spec => {
        html += `
            <div class="flex justify-between items-center py-xs border-b border-surface-variant">
                <span class="text-on-surface-variant font-label-md text-label-md">${esc(spec.label)}</span>
                <span class="font-body-md font-bold text-right break-all ml-4">${esc(spec.value)}</span>
            </div>
        `;
    });
    html += `
        <div class="flex justify-between items-center py-xs mt-auto">
            <span class="text-on-surface-variant font-label-md text-label-md">MOD STATUS</span>
            <span class="text-primary-container font-label-md text-label-md uppercase font-bold px-sm py-xs border border-primary-container">VERIFIED SECURE</span>
        </div>
    `;

    container.innerHTML = html;
}

// ==================== RENDER REVIEWS ====================
function renderReviews() {
    const container = document.getElementById('reviews-container');
    if (!container) return;

    const reviews = Array.isArray(currentApp.reviews) ? currentApp.reviews : [];

    // Update review count badge if present
    const countElement = document.getElementById('reviews-count');
    if (countElement) {
        countElement.textContent = `${reviews.length} REVIEW${reviews.length === 1 ? '' : 'S'}`;
    }

    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="text-center py-lg text-on-surface-variant font-label-md uppercase">
                No reviews yet. Be the first to review!
            </div>
        `;
        return;
    }

    let html = '';
    reviews.forEach(review => {
        html += createReviewCard(review);
    });

    container.innerHTML = html;
}

function createReviewCard(review) {
    const esc = VANMOD.escapeHtml;
    const rating = Math.min(5, Math.max(1, Number(review.rating) || 5));
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    const time = review.createdAt ? VANMOD.timeAgo(review.createdAt) : 'Recently';

    return `
        <div class="bg-surface-container border-l-4 border-primary-container p-lg">
            <div class="flex justify-between items-start mb-md">
                <div>
                    <h4 class="font-label-md text-primary uppercase mb-xs">${esc(review.userName || 'Anonymous')}</h4>
                    <div class="text-primary-container text-xl">${stars}</div>
                </div>
                <span class="font-label-sm text-on-surface-variant uppercase">${esc(time)}</span>
            </div>
            <p class="font-body-md text-on-surface-variant">${esc(review.comment || 'No comment')}</p>
        </div>
    `;
}

// ==================== DOWNLOAD ====================
async function downloadApp() {
    if (!currentApp) return;

    const downloadBtn = document.getElementById('download-btn');
    if (!downloadBtn) {
        // Fallback when the button id is missing: open URL directly
        if (currentApp.downloadUrl) window.open(currentApp.downloadUrl, '_blank');
        return;
    }

    const originalHtml = downloadBtn.innerHTML;
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = `
        <span class="relative z-10 flex items-center gap-2">
            <span class="animate-pulse">PROCESSING...</span>
        </span>
    `;

    try {
        // Best-effort download counter: public visitors may be rejected by
        // Firestore rules on old deployments — never block the download.
        try {
            const manager = VANMOD.getManager(currentAppType);
            await manager.incrementDownloads(currentAppId);
            currentApp.downloads = (currentApp.downloads || 0) + 1;
            const downloadsElement = document.getElementById('app-downloads');
            if (downloadsElement) {
                downloadsElement.textContent = VANMOD.formatNumber(currentApp.downloads);
            }
        } catch (counterError) {
            console.warn('Download counter update skipped:', counterError);
        }

        // Redirect to download URL or show notice
        if (currentApp.downloadUrl) {
            window.open(currentApp.downloadUrl, '_blank');
            // Show success page
            setTimeout(() => {
                window.location.href = 'transmissionsucces.html';
            }, 1000);
        } else {
            alert('Download link will be available soon!');
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = originalHtml;
        }

    } catch (error) {
        console.error('Download error:', error);
        alert('Failed to process download. Please try again.');
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalHtml;
    }
}

// Make downloadApp available globally
window.downloadApp = downloadApp;

// ==================== SAVE / BOOKMARK ====================
function getSavedIds() {
    try {
        return JSON.parse(localStorage.getItem('vanmod_saved') || '[]');
    } catch (e) {
        return [];
    }
}

function initSaveButton() {
    const saveBtn = document.getElementById('save-btn');
    if (!saveBtn || !currentAppId) return;

    const paint = () => {
        const saved = getSavedIds().includes(currentAppId);
        saveBtn.classList.toggle('border-primary-container', saved);
        saveBtn.classList.toggle('text-primary-container', saved);
        const label = saveBtn.querySelector('[data-save-label]');
        if (label) label.textContent = saved ? 'SAVED' : 'SAVE';
    };

    paint();
    saveBtn.addEventListener('click', () => {
        let saved = getSavedIds();
        if (saved.includes(currentAppId)) {
            saved = saved.filter(id => id !== currentAppId);
        } else {
            saved.push(currentAppId);
        }
        try {
            localStorage.setItem('vanmod_saved', JSON.stringify(saved));
        } catch (e) {
            // ignore
        }
        paint();
    });
}

// ==================== ADD REVIEW ====================
async function submitReview() {
    const ratingInput = document.querySelector('input[name="rating"]:checked');
    const comment = document.getElementById('review-comment');
    const nameInput = document.getElementById('reviewer-name');

    if (!ratingInput) {
        alert('Please select a rating');
        return;
    }

    if (!comment || !comment.value.trim()) {
        alert('Please write a review');
        return;
    }

    if (!currentAppId) {
        alert('App ID not found');
        return;
    }

    try {
        const reviewData = {
            rating: parseInt(ratingInput.value, 10),
            comment: comment.value.trim(),
            userName: (nameInput && nameInput.value.trim()) || 'Anonymous'
        };

        const manager = VANMOD.getManager(currentAppType);
        await manager.addReview(currentAppId, reviewData);

        // Clear form
        comment.value = '';
        if (nameInput) nameInput.value = '';
        ratingInput.checked = false;

        // Reload reviews
        currentApp = await manager.getById(currentAppId);
        renderReviews();
        renderAppDetails();

        alert('Review submitted successfully!');

    } catch (error) {
        console.error('Failed to submit review:', error);
        alert('Failed to submit review. Please try again.');
    }
}

// Make submitReview available globally
window.submitReview = submitReview;

// ==================== SCREENSHOT VIEWER ====================
function openScreenshot(index) {
    const screenshots = (currentApp && currentApp.screenshots) || [];
    if (screenshots.length === 0) return;

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-lg';
    modal.innerHTML = `
        <div class="relative max-w-6xl w-full">
            <button onclick="this.closest('.fixed').remove()" class="absolute top-4 right-4 bg-surface-container border-2 border-outline-variant p-md text-primary-container hover:border-primary-container transition-colors">
                <span class="material-symbols-outlined">close</span>
            </button>
            <img src="${VANMOD.escapeHtml(screenshots[index])}" class="w-full h-auto border-4 border-outline-variant" alt="Screenshot" onerror="this.onerror=null;this.src='${VANMOD.PLACEHOLDER_ICON}'">
        </div>
    `;

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
}

// Make openScreenshot available globally
window.openScreenshot = openScreenshot;

// ==================== LOADING & ERROR STATES ====================
// NOTE: these never wipe document.body (the old code destroyed the whole
// page, including the elements it was about to render into).

function showLoadingOverlay() {
    if (document.getElementById('detail-loading')) return;
    const overlay = document.createElement('div');
    overlay.id = 'detail-loading';
    overlay.className = 'fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center';
    overlay.innerHTML = `
        <div class="text-center">
            <span class="material-symbols-outlined text-[64px] text-primary-container animate-pulse mb-4 block">downloading</span>
            <p class="font-label-md text-on-surface-variant uppercase tracking-widest">LOADING MOD DATA...</p>
        </div>
    `;
    document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
    document.getElementById('detail-loading')?.remove();
}

function showPageError(message) {
    hideLoadingOverlay();
    const main = document.querySelector('main');
    const panel = `
        <div class="max-w-lg mx-auto my-2xl">
            <div class="bg-surface-container border-2 border-error p-xl text-center">
                <span class="material-symbols-outlined text-[64px] text-error mb-4 block">error</span>
                <h2 class="font-headline-md text-headline-md text-error mb-sm uppercase">ERROR</h2>
                <p class="font-body-md text-on-surface-variant mb-lg">${VANMOD ? VANMOD.escapeHtml(message) : message}</p>
                <button onclick="window.history.back()" class="brutalist-button-secondary px-lg py-md">
                    <span class="material-symbols-outlined mr-2">arrow_back</span>
                    GO BACK
                </button>
            </div>
        </div>
    `;
    if (main) {
        main.innerHTML = panel;
    } else {
        document.body.innerHTML = panel;
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    loadAppDetail();
});
