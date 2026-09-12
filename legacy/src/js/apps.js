// Apps Page JavaScript
// VAN//MOD - Apps Catalog Management

let currentCategory = 'all';
let currentSearch = '';
let currentSort = 'newest';
let visibleCount = 12;
let isLoading = false;

// ==================== LOAD APPS ====================
async function loadApps() {
    if (isLoading) return;

    const container = document.getElementById('apps-container');
    if (!container || !window.VANMOD) return;

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
            // Get apps (limit-based "load more", no cursor needed)
            apps = await VANMOD.appsManager.getAll(filters, visibleCount);
        }

        apps = sortItems(apps);

        const hasActiveFilter = currentSearch || currentCategory !== 'all';

        if (apps.length === 0) {
            if (!hasActiveFilter) {
                // No data yet: keep the static showcase cards in the HTML
                updateLoadMoreButton(false);
                isLoading = false;
                return;
            }
            container.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <span class="material-symbols-outlined text-[64px] text-on-surface-variant mb-4 block">search_off</span>
                    <h3 class="font-headline-md text-headline-md text-on-surface-variant mb-2">NO MODS FOUND</h3>
                    <p class="font-body-md text-on-surface-variant">Try adjusting your search or filters</p>
                </div>
            `;
            updateLoadMoreButton(false);
            isLoading = false;
            return;
        }

        let html = '';
        apps.forEach(app => {
            html += VANMOD.createItemCard(app, 'apps');
        });

        container.innerHTML = html;

        // Show/hide load more button
        updateLoadMoreButton(!currentSearch && apps.length >= visibleCount);

    } catch (error) {
        console.error('Failed to load apps:', error);
        // Only wipe the container when there is nothing to preserve
        if (!container.querySelector('article')) {
            VANMOD.showError('apps-container', 'Failed to load apps. Please try again.');
        }
    }

    isLoading = false;
}

// ==================== SORT ====================
function sortItems(items) {
    const sorted = [...items];
    switch (currentSort) {
        case 'downloads':
            sorted.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
            break;
        case 'rating':
            sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'name':
            sorted.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
            break;
        case 'newest':
        default: {
            // getAll() already returns newest-first; keep stable for search results
            const toMs = (v) => {
                const d = VANMOD.toDate(v);
                return d ? d.getTime() : 0;
            };
            sorted.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
            break;
        }
    }
    return sorted;
}

// ==================== LOAD MORE ====================
function loadMore() {
    visibleCount += 12;
    loadApps();
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
                visibleCount = 12;
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
            visibleCount = 12;
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
        currentSort = e.target.value || 'newest';
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

    try {
        localStorage.setItem('viewMode', view);
    } catch (e) {
        // Storage unavailable (private mode) — ignore
    }
}

// Make toggleView available globally
window.toggleView = toggleView;

// ==================== STATISTICS ====================
async function updateStats() {
    const statsElement = document.getElementById('total-apps');
    if (!statsElement || !window.VANMOD) return;

    try {
        const stats = await VANMOD.getGlobalStats();
        if (stats.totalApps > 0) {
            statsElement.textContent = stats.totalApps;
        }
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
    let savedView = 'grid';
    try {
        savedView = localStorage.getItem('viewMode') || 'grid';
    } catch (e) {
        // ignore
    }
    toggleView(savedView);
});
