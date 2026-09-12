// Games Page JavaScript
// VAN//MOD - Games Catalog

let currentCategory = 'all';
let currentSearch = '';
let currentSort = 'newest';
let visibleCount = 12;
let isLoading = false;

// ==================== LOAD GAMES ====================
async function loadGames() {
    if (isLoading) return;

    const container = document.getElementById('games-container');
    if (!container || !window.VANMOD) return;

    isLoading = true;

    try {
        const filters = {};
        if (currentCategory !== 'all') {
            filters.category = currentCategory;
        }

        let games = [];

        if (currentSearch) {
            games = await VANMOD.gamesManager.search(currentSearch);
        } else {
            games = await VANMOD.gamesManager.getAll(filters, visibleCount);
        }

        games = sortItems(games);

        const hasActiveFilter = currentSearch || currentCategory !== 'all';

        if (games.length === 0) {
            if (!hasActiveFilter) {
                // No data yet: keep the static showcase cards in the HTML
                updateLoadMoreButton(false);
                isLoading = false;
                return;
            }
            container.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <span class="material-symbols-outlined text-[64px] text-on-surface-variant mb-4 block">sports_esports</span>
                    <h3 class="font-headline-md text-headline-md text-on-surface-variant mb-2">NO GAMES FOUND</h3>
                    <p class="font-body-md text-on-surface-variant">Try adjusting your search or filters</p>
                </div>
            `;
            updateLoadMoreButton(false);
            isLoading = false;
            return;
        }

        let html = '';
        games.forEach(game => {
            html += VANMOD.createItemCard(game, 'games');
        });

        container.innerHTML = html;

        updateLoadMoreButton(!currentSearch && games.length >= visibleCount);

    } catch (error) {
        console.error('Failed to load games:', error);
        // Only wipe the container when there is nothing to preserve
        if (!container.querySelector('article')) {
            VANMOD.showError('games-container', 'Failed to load games. Please try again.');
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
    loadGames();
}

window.loadMore = loadMore;

function updateLoadMoreButton(show) {
    const loadMoreContainer = document.getElementById('load-more-container');
    if (loadMoreContainer) {
        if (show) {
            loadMoreContainer.innerHTML = `
                <button onclick="loadMore()" class="brutalist-button-secondary px-xl py-md font-label-md text-label-md uppercase">
                    <span class="material-symbols-outlined mr-2">expand_more</span>
                    LOAD MORE GAMES
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
                loadGames();
            }
        }, 500);
    });

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
            filterButtons.forEach(btn => {
                btn.classList.remove('border-primary-container', 'text-primary-container');
                btn.classList.add('border-outline-variant', 'text-on-surface-variant');
            });

            button.classList.remove('border-outline-variant', 'text-on-surface-variant');
            button.classList.add('border-primary-container', 'text-primary-container');

            currentCategory = button.dataset.filter;
            visibleCount = 12;
            loadGames();
        });
    });

    // Check URL for category parameter
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
        currentCategory = categoryParam;
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
        loadGames();
    });
}

// ==================== VIEW TOGGLE ====================
function toggleView(view) {
    const container = document.getElementById('games-container');
    if (!container) return;

    const gridBtn = document.querySelector('[data-view="grid"]');
    const listBtn = document.querySelector('[data-view="list"]');

    if (view === 'grid') {
        container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl';
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

window.toggleView = toggleView;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initFilters();
    initSort();
    loadGames();

    let savedView = 'grid';
    try {
        savedView = localStorage.getItem('viewMode') || 'grid';
    } catch (e) {
        // ignore
    }
    toggleView(savedView);
});
