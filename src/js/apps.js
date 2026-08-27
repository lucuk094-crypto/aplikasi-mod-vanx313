// Apps Page JavaScript
// VAN//MOD - Apps Catalog Management

let currentCategory = 'all';
let currentSearch = '';
let lastVisible = null;
let isLoading = false;

// ==================== LOAD APPS ====================
async function loadApps(append = false) {
    if (isLoading) return;
    
    const container = document.getElementById('apps-container');
    if (!container) return;
    
    if (!append) {
        VANMOD.showLoading('apps-container');
        lastVisible = null;
    }
    
    isLoading = true;
    
    try {
        const filters = {};
        if (currentCategory !== 'all') {
            filters.category = currentCategory;
        }
        
        let apps = [];
        
        if (currentSearch) {
            // Perform search
            apps = await VANMOD.appsManager.search(currentSearch);
        } else {
            // Get all apps with pagination
            apps = await VANMOD.appsManager.getAll(filters, 12, lastVisible);
        }
        
        if (apps.length === 0 && !append) {
            container.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <span class="material-symbols-outlined text-[64px] text-on-surface-variant mb-4 block">search_off</span>
                    <h3 class="font-headline-md text-headline-md text-on-surface-variant mb-2">NO MODS FOUND</h3>
                    <p class="font-body-md text-on-surface-variant">Try adjusting your search or filters</p>
                </div>
            `;
            isLoading = false;
            return;
        }
        
        let html = '';
        apps.forEach(app => {
            html += VANMOD.createItemCard(app, 'apps');
        });
        
        if (append) {
            container.innerHTML += html;
        } else {
            container.innerHTML = html;
        }
        
        // Update last visible for pagination
        if (apps.length > 0) {
            lastVisible = apps[apps.length - 1];
        }
        
        // Show/hide load more button
        updateLoadMoreButton(apps.length >= 12);
        
    } catch (error) {
        console.error('Failed to load apps:', error);
        VANMOD.showError('apps-container', 'Failed to load apps. Please try again.');
    }
    
    isLoading = false;
}

// ==================== LOAD MORE ====================
function loadMore() {
    loadApps(true);
}

// Make loadMore available globally
window.loadMore = loadMore;

function updateLoadMoreButton(show) {
    const loadMoreContainer = document.getElementById('load-more-container');
    if (loadMoreContainer) {
        if (show) {
            loadMoreContainer.innerHTML = `
                <button onclick="loadMore()" class="brutalist-button-secondary px-xl py-md font-label-md text-label-md uppercase">
                    <span class="material-symbols-outlined mr-2">expand_more</span>
                    LOAD MORE ARCHIVES
                </button>
            `;
        } else {
            loadMoreContainer.innerHTML = `
                <p class="text-on-surface-variant font-label-sm uppercase tracking-widest">
                    // END OF ARCHIVE
                </p>
            `;
        }
    }
}

// ==================== SEARCH ====================
function initSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    let debounceTimer;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentSearch = e.target.value.trim();
            if (currentSearch.length >= 2 || currentSearch.length === 0) {
                loadApps();
            }
        }, 500);
    });
    
    // Check URL for search parameter
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
        searchInput.value = searchParam;
        currentSearch = searchParam;
    }
}

// ==================== FILTERS ====================
function initFilters() {
    const filterButtons = document.querySelectorAll('[data-filter]');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => {
                btn.classList.remove('border-primary-container', 'text-primary-container');
                btn.classList.add('border-outline-variant', 'text-on-surface-variant');
            });
            
            // Add active class to clicked button
            button.classList.remove('border-outline-variant', 'text-on-surface-variant');
            button.classList.add('border-primary-container', 'text-primary-container');
            
            // Update current category
            currentCategory = button.dataset.filter;
            
            // Reload apps
            loadApps();
        });
    });
    
    // Check URL for category parameter
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
        currentCategory = categoryParam;
        // Activate corresponding button
        const activeButton = document.querySelector(`[data-filter="${categoryParam}"]`);
        if (activeButton) {
            activeButton.click();
        }
    }
}

// ==================== SORT ====================
function initSort() {
    const sortSelect = document.getElementById('sort-select');
    if (!sortSelect) return;
    
    sortSelect.addEventListener('change', (e) => {
        const sortValue = e.target.value;
        console.log('Sort by:', sortValue);
        // TODO: Implement sorting logic
        loadApps();
    });
}

// ==================== VIEW TOGGLE ====================
function toggleView(view) {
    const container = document.getElementById('apps-container');
    if (!container) return;
    
    const gridBtn = document.querySelector('[data-view="grid"]');
    const listBtn = document.querySelector('[data-view="list"]');
    
    if (view === 'grid') {
        container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md';
        gridBtn?.classList.add('bg-primary-container', 'text-on-primary-fixed');
        gridBtn?.classList.remove('bg-surface-container-highest');
        listBtn?.classList.remove('bg-primary-container', 'text-on-primary-fixed');
        listBtn?.classList.add('bg-surface-container-highest');
    } else {
        container.className = 'flex flex-col gap-md';
        listBtn?.classList.add('bg-primary-container', 'text-on-primary-fixed');
        listBtn?.classList.remove('bg-surface-container-highest');
        gridBtn?.classList.remove('bg-primary-container', 'text-on-primary-fixed');
        gridBtn?.classList.add('bg-surface-container-highest');
    }
    
    localStorage.setItem('viewMode', view);
}

// Make toggleView available globally
window.toggleView = toggleView;

// ==================== STATISTICS ====================
async function updateStats() {
    const statsElement = document.getElementById('total-apps');
    if (!statsElement) return;
    
    try {
        const stats = await VANMOD.getGlobalStats();
        const total = (stats.totalApps || 0) + (stats.totalGames || 0) + (stats.totalTools || 0);
        statsElement.textContent = total;
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initFilters();
    initSort();
    loadApps();
    updateStats();
    
    // Restore view mode
    const savedView = localStorage.getItem('viewMode') || 'grid';
    toggleView(savedView);
});
