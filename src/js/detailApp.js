// Detail App Page JavaScript
// VAN//MOD - App Detail View

let currentApp = null;
let currentAppId = null;
let currentAppType = null;

// ==================== LOAD APP DETAIL ====================
async function loadAppDetail() {
    // Get app ID and type from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentAppId = urlParams.get('id');
    currentAppType = urlParams.get('type') || 'apps';
    
    if (!currentAppId) {
        showError('App ID not found');
        return;
    }
    
    try {
        // Show loading
        showLoading();
        
        // Get manager based on type
        let manager;
        switch (currentAppType) {
            case 'games':
                manager = VANMOD.gamesManager;
                break;
            case 'tools':
                manager = VANMOD.toolsManager;
                break;
            default:
                manager = VANMOD.appsManager;
        }
        
        // Fetch app details
        currentApp = await manager.getById(currentAppId);
        
        if (!currentApp) {
            showError('App not found');
            return;
        }
        
        // Render app details
        renderAppDetails();
        renderScreenshots();
        renderTechnicalSpecs();
        renderReviews();
        
    } catch (error) {
        console.error('Failed to load app details:', error);
        showError('Failed to load app details. Please try again.');
    }
}

// ==================== RENDER APP DETAILS ====================
function renderAppDetails() {
    // Update header
    const headerTitle = document.getElementById('app-title');
    const headerIcon = document.getElementById('app-icon');
    const headerVersion = document.getElementById('app-version');
    const headerRating = document.getElementById('app-rating');
    const headerDownloads = document.getElementById('app-downloads');
    
    if (headerTitle) headerTitle.textContent = currentApp.name;
    if (headerIcon) headerIcon.src = currentApp.icon || 'https://via.placeholder.com/128';
    if (headerVersion) headerVersion.textContent = `v${currentApp.version || '1.0'}`;
    if (headerRating) headerRating.textContent = currentApp.rating ? currentApp.rating.toFixed(1) : 'N/A';
    if (headerDownloads) headerDownloads.textContent = VANMOD.formatNumber(currentApp.downloads || 0);
    
    // Update description
    const descriptionElement = document.getElementById('app-description');
    if (descriptionElement) {
        descriptionElement.textContent = currentApp.description || 'No description available';
    }
    
    // Update tags
    const tagsContainer = document.getElementById('app-tags');
    if (tagsContainer && currentApp.tags) {
        tagsContainer.innerHTML = currentApp.tags.map(tag => 
            `<span class="border border-outline-variant px-3 py-1 font-label-sm text-on-surface-variant uppercase">${tag}</span>`
        ).join('');
    }
    
    // Update metadata
    const sizeElement = document.getElementById('app-size');
    const categoryElement = document.getElementById('app-category');
    const updatedElement = document.getElementById('app-updated');
    
    if (sizeElement) sizeElement.textContent = currentApp.size || 'N/A';
    if (categoryElement) categoryElement.textContent = currentApp.category || 'General';
    if (updatedElement) {
        const updated = currentApp.updatedAt ? VANMOD.timeAgo(currentApp.updatedAt.toDate()) : 'N/A';
        updatedElement.textContent = updated;
    }
}

// ==================== RENDER SCREENSHOTS ====================
function renderScreenshots() {
    const container = document.getElementById('screenshots-container');
    if (!container) return;
    
    const screenshots = currentApp.screenshots || [
        'https://via.placeholder.com/800x450',
        'https://via.placeholder.com/800x450',
        'https://via.placeholder.com/800x450'
    ];
    
    let html = '';
    screenshots.forEach((screenshot, index) => {
        html += `
            <div class="border-2 border-outline-variant bg-surface-container-high flex items-center justify-center overflow-hidden h-64 cursor-pointer" onclick="openScreenshot(${index})">
                <img class="w-full h-full object-cover img-greyscale hover:filter-none transition-all" src="${screenshot}" alt="Screenshot ${index + 1}">
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ==================== RENDER TECHNICAL SPECS ====================
function renderTechnicalSpecs() {
    const container = document.getElementById('tech-specs-container');
    if (!container) return;
    
    const specs = [
        { label: 'VERSION', value: currentApp.version || '1.0' },
        { label: 'SIZE', value: currentApp.size || 'N/A' },
        { label: 'ANDROID', value: currentApp.androidVersion || '5.0+' },
        { label: 'CATEGORY', value: currentApp.category || 'General' },
        { label: 'DEVELOPER', value: currentApp.developer || 'Unknown' },
        { label: 'PACKAGE', value: currentApp.packageName || 'N/A' },
        { label: 'LICENSE', value: currentApp.license || 'Freeware' },
        { label: 'LAST UPDATE', value: currentApp.updatedAt ? VANMOD.timeAgo(currentApp.updatedAt.toDate()) : 'N/A' }
    ];
    
    let html = '';
    specs.forEach(spec => {
        html += `
            <div class="border-l-4 border-primary-container bg-surface-container p-md">
                <span class="font-label-sm text-primary-container uppercase block mb-1">${spec.label}</span>
                <span class="font-label-md text-primary">${spec.value}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ==================== RENDER REVIEWS ====================
function renderReviews() {
    const container = document.getElementById('reviews-container');
    if (!container) return;
    
    const reviews = currentApp.reviews || [];
    
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
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const timeAgo = review.createdAt ? VANMOD.timeAgo(review.createdAt.toDate()) : 'Recently';
    
    return `
        <div class="bg-surface-container border-l-4 border-primary-container p-lg">
            <div class="flex justify-between items-start mb-md">
                <div>
                    <h4 class="font-label-md text-primary uppercase mb-xs">${review.userName || 'Anonymous'}</h4>
                    <div class="text-primary-container text-xl">${stars}</div>
                </div>
                <span class="font-label-sm text-on-surface-variant uppercase">${timeAgo}</span>
            </div>
            <p class="font-body-md text-on-surface-variant">${review.comment || 'No comment'}</p>
        </div>
    `;
}

// ==================== DOWNLOAD ====================
async function downloadApp() {
    if (!currentApp) return;
    
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        const originalHtml = downloadBtn.innerHTML;
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = `
            <span class="relative z-10 flex items-center gap-2">
                <span class="animate-pulse">PROCESSING...</span>
            </span>
        `;
        
        try {
            // Increment download count
            let manager;
            switch (currentAppType) {
                case 'games':
                    manager = VANMOD.gamesManager;
                    break;
                case 'tools':
                    manager = VANMOD.toolsManager;
                    break;
                default:
                    manager = VANMOD.appsManager;
            }
            
            await manager.incrementDownloads(currentAppId);
            
            // Update UI
            currentApp.downloads = (currentApp.downloads || 0) + 1;
            const downloadsElement = document.getElementById('app-downloads');
            if (downloadsElement) {
                downloadsElement.textContent = VANMOD.formatNumber(currentApp.downloads);
            }
            
            // Redirect to download URL or show success
            if (currentApp.downloadUrl) {
                window.open(currentApp.downloadUrl, '_blank');
            } else {
                alert('Download link will be available soon!');
            }
            
            // Show success page
            setTimeout(() => {
                window.location.href = 'transmissionsucces.html';
            }, 1000);
            
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to process download. Please try again.');
        }
        
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalHtml;
    }
}

// Make downloadApp available globally
window.downloadApp = downloadApp;

// ==================== ADD REVIEW ====================
async function submitReview() {
    const rating = document.querySelector('input[name="rating"]:checked');
    const comment = document.getElementById('review-comment');
    
    if (!rating) {
        alert('Please select a rating');
        return;
    }
    
    if (!comment || !comment.value.trim()) {
        alert('Please write a review');
        return;
    }
    
    try {
        const reviewData = {
            rating: parseInt(rating.value),
            comment: comment.value.trim(),
            userName: 'Anonymous User', // Replace with actual user name if logged in
            createdAt: new Date()
        };
        
        let manager;
        switch (currentAppType) {
            case 'games':
                manager = VANMOD.gamesManager;
                break;
            case 'tools':
                manager = VANMOD.toolsManager;
                break;
            default:
                manager = VANMOD.appsManager;
        }
        
        await manager.addReview(currentAppId, reviewData);
        
        // Clear form
        comment.value = '';
        rating.checked = false;
        
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
    const screenshots = currentApp.screenshots || [];
    if (screenshots.length === 0) return;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-lg';
    modal.innerHTML = `
        <div class="relative max-w-6xl w-full">
            <button onclick="this.closest('.fixed').remove()" class="absolute top-4 right-4 bg-surface-container border-2 border-outline-variant p-md text-primary-container hover:border-primary-container transition-colors">
                <span class="material-symbols-outlined">close</span>
            </button>
            <img src="${screenshots[index]}" class="w-full h-auto border-4 border-outline-variant" alt="Screenshot">
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Make openScreenshot available globally
window.openScreenshot = openScreenshot;

// ==================== UTILITY FUNCTIONS ====================
function showLoading() {
    document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center">
            <div class="text-center">
                <span class="material-symbols-outlined text-[64px] text-primary-container animate-pulse mb-4 block">downloading</span>
                <p class="font-label-md text-on-surface-variant uppercase tracking-widest">LOADING MOD DATA...</p>
            </div>
        </div>
    `;
}

function showError(message) {
    document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-lg">
            <div class="bg-surface-container border-2 border-error p-xl text-center max-w-lg">
                <span class="material-symbols-outlined text-[64px] text-error mb-4 block">error</span>
                <h2 class="font-headline-md text-headline-md text-error mb-sm uppercase">ERROR</h2>
                <p class="font-body-md text-on-surface-variant mb-lg">${message}</p>
                <button onclick="window.history.back()" class="brutalist-button-secondary px-lg py-md">
                    <span class="material-symbols-outlined mr-2">arrow_back</span>
                    GO BACK
                </button>
            </div>
        </div>
    `;
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    loadAppDetail();
});
