// Games Page JavaScript
// VAN//MOD - Games Catalog (Similar to apps.js but for games)

let currentCategory = 'all';
let currentSearch = '';
let lastVisible = null;
let isLoading = false;

// ==================== LOAD GAMES ====================
async function loadGames(append = false) {
    if (isLoading) return;
    
    const container = document.getElementById('games-container');
    if (!container) return;
    
    if (!append) {
        VANMOD.showLoading('games-container');
        lastVisible = null;
    }
    
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
            games = await VANMOD.gamesManager.getAll(filters, 12, lastVisible);
        }
        
        if (games.length === 0 && !append) {
            container.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <span class="material-symbols-outlined text-[64px] text-on-surface-variant mb-4 block">sports_esports</span>
                    <h3 class="font-headline-md text-headline-md text-on-surface-variant mb-2">NO GAMES FOUND</h3>
                    <p class="font-body-md text-on-surface-variant">Try adjusting your search or filters</p>
                </div>
            `;
            isLoading = false;
            return;
        }
        
        let html = '';
        games.forEach(game => {
            html += VANMOD.createItemCard(game, 'games');
        });
        
        if (append) {
            container.innerHTML += html;
        } else {
            container.innerHTML = html;
        }
        
        if (games.length > 0) {
            lastVisible = games[games.length - 1];
        }
        
        updateLoadMoreButton(games.length >= 12);
        
    } catch (error) {
        console.error('Failed to load games:', error);
        VANMOD.showError('games-container', 'Failed to load games. Please try again.');
    }
    
    isLoading = false;
}

function loadMore() {
    loadGames(true);
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
            loadGames();
        });
    });
}

function toggleView(view) {
    const container = document.getElementById('games-container');
    if (!container) return;
    
    const gridBtn = document.querySelector('[data-view="grid"]');
    const listBtn = document.querySelector('[data-view="list"]');
    
    if (view === 'grid') {
        container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md';
        gridBtn?.classList.add('bg-primary-container', 'text-on-primary-fixed');
        listBtn?.classList.remove('bg-primary-container', 'text-on-primary-fixed');
    } else {
        container.className = 'flex flex-col gap-md';
        listBtn?.classList.add('bg-primary-container', 'text-on-primary-fixed');
        gridBtn?.classList.remove('bg-primary-container', 'text-on-primary-fixed');
    }
}

window.toggleView = toggleView;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initFilters();
    loadGames();
    
    const savedView = localStorage.getItem('viewMode') || 'grid';
    toggleView(savedView);
});
