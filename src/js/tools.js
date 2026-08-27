// Tools Page JavaScript
// VAN//MOD - Tools Catalog

let currentCategory = 'all';
let currentSearch = '';
let lastVisible = null;
let isLoading = false;

// ==================== LOAD TOOLS ====================
async function loadTools(append = false) {
    if (isLoading) return;
    
    const container = document.getElementById('tools-container');
    if (!container) return;
    
    if (!append) {
        VANMOD.showLoading('tools-container');
        lastVisible = null;
    }
    
    isLoading = true;
    
    try {
        const filters = {};
        if (currentCategory !== 'all') {
            filters.category = currentCategory;
        }
        
        let tools = [];
        
        if (currentSearch) {
            tools = await VANMOD.toolsManager.search(currentSearch);
        } else {
            tools = await VANMOD.toolsManager.getAll(filters, 12, lastVisible);
        }
        
        if (tools.length === 0 && !append) {
            container.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <span class="material-symbols-outlined text-[64px] text-on-surface-variant mb-4 block">build</span>
                    <h3 class="font-headline-md text-headline-md text-on-surface-variant mb-2">NO TOOLS FOUND</h3>
                    <p class="font-body-md text-on-surface-variant">Try adjusting your search or filters</p>
                </div>
            `;
            isLoading = false;
            return;
        }
        
        let html = '';
        tools.forEach(tool => {
            html += VANMOD.createItemCard(tool, 'tools');
        });
        
        if (append) {
            container.innerHTML += html;
        } else {
            container.innerHTML = html;
        }
        
        if (tools.length > 0) {
            lastVisible = tools[tools.length - 1];
        }
        
        updateLoadMoreButton(tools.length >= 12);
        
    } catch (error) {
        console.error('Failed to load tools:', error);
        VANMOD.showError('tools-container', 'Failed to load tools. Please try again.');
    }
    
    isLoading = false;
}

function loadMore() {
    loadTools(true);
}

window.loadMore = loadMore;

function updateLoadMoreButton(show) {
    const loadMoreContainer = document.getElementById('load-more-container');
    if (loadMoreContainer) {
        if (show) {
            loadMoreContainer.innerHTML = `
                <button onclick="loadMore()" class="brutalist-button-secondary px-xl py-md font-label-md text-label-md uppercase">
                    <span class="material-symbols-outlined mr-2">expand_more</span>
                    LOAD MORE TOOLS
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

function initSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    let debounceTimer;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentSearch = e.target.value.trim();
            if (currentSearch.length >= 2 || currentSearch.length === 0) {
                loadTools();
            }
        }, 500);
    });
}

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
            loadTools();
        });
    });
}

function toggleView(view) {
    const container = document.getElementById('tools-container');
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

document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initFilters();
    loadTools();
    
    const savedView = localStorage.getItem('viewMode') || 'grid';
    toggleView(savedView);
});
