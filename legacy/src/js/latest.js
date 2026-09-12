// Latest Page JavaScript
// VAN//MOD - Latest Deployments Feed (apps + games + tools merged)

let currentType = 'all';
let currentSearch = '';
let visibleCount = 8;
let isLoading = false;
let cacheLoaded = false;
let cache = [];

// ==================== FETCH ALL ====================
async function fetchAllItems() {
    if (cacheLoaded) return cache;

    const [apps, games, tools] = await Promise.all([
        VANMOD.appsManager.getAll({}, 50),
        VANMOD.gamesManager.getAll({}, 50),
        VANMOD.toolsManager.getAll({}, 50)
    ]);

    cache = [
        ...apps.map(a => ({ ...a, _type: 'apps' })),
        ...games.map(g => ({ ...g, _type: 'games' })),
        ...tools.map(t => ({ ...t, _type: 'tools' }))
    ];
    cacheLoaded = true;
    return cache;
}

function getFilteredItems() {
    const toMs = (v) => {
        const d = VANMOD.toDate(v);
        return d ? d.getTime() : 0;
    };

    let items = [...cache];

    if (currentType !== 'all') {
        items = items.filter(i => i._type === currentType);
    }

    if (currentSearch) {
        const term = currentSearch.toLowerCase();
        items = items.filter(i =>
            String(i.name || '').toLowerCase().includes(term) ||
            String(i.description || '').toLowerCase().includes(term) ||
            String(i.category || '').toLowerCase().includes(term)
        );
    }

    // Newest first
    items.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));

    return items;
}

// ==================== LOAD FEED ====================
async function loadFeed() {
    if (isLoading) return;

    const container = document.getElementById('latest-feed');
    if (!container || !window.VANMOD) return;

    isLoading = true;

    try {
        await fetchAllItems();
        const items = getFilteredItems();
        const hasActiveFilter = currentSearch || currentType !== 'all';

        if (items.length === 0) {
            if (!hasActiveFilter) {
                // No data yet: keep the static showcase cards in the HTML
                updateLoadMoreButton(false);
                isLoading = false;
                return;
            }
            container.innerHTML = `
                <div class="text-center py-20">
                    <span class="material-symbols-outlined text-[64px] text-on-surface-variant mb-4 block">search_off</span>
                    <h3 class="font-headline-md text-headline-md text-on-surface-variant mb-2">NO DEPLOYMENTS FOUND</h3>
                    <p class="font-body-md text-on-surface-variant">Try adjusting your search or filters</p>
                </div>
            `;
            updateLoadMoreButton(false);
            isLoading = false;
            return;
        }

        const shown = items.slice(0, visibleCount);
        let html = '';
        shown.forEach((item, index) => {
            html += createFeedCard(item, index);
        });

        container.innerHTML = html;
        updateLoadMoreButton(items.length > visibleCount);

    } catch (error) {
        console.error('Failed to load latest feed:', error);
        // Only wipe the container when there is nothing to preserve
        if (!container.querySelector('article')) {
            VANMOD.showError('latest-feed', 'Failed to load deployments. Please try again.');
        }
    }

    isLoading = false;
}

function createFeedCard(item, index) {
    const esc = VANMOD.escapeHtml;
    const type = item._type || 'apps';
    const typeLabel = type === 'games' ? 'GAME' : type === 'tools' ? 'TOOL' : 'APP';
    const time = item.updatedAt || item.createdAt ? VANMOD.timeAgo(item.updatedAt || item.createdAt) : 'N/A';
    const icon = esc(item.icon || VANMOD.PLACEHOLDER_ICON);
    const badge = index === 0
        ? '<div class="absolute top-sm left-sm bg-primary-container text-on-primary-container font-label-sm text-label-sm px-sm py-xs uppercase font-bold">JUST IN</div>'
        : index === 1
            ? '<div class="absolute top-sm left-sm bg-primary-container text-on-primary-container font-label-sm text-label-sm px-sm py-xs uppercase font-bold">NEW</div>'
            : '';

    return `
        <article class="bg-surface-container-low border-2 border-outline-variant brutalist-card relative overflow-hidden group cursor-pointer" onclick="VANMOD.viewItem('${esc(item.id)}', '${esc(type)}')">
            <div class="grid grid-cols-1 md:grid-cols-12">
                <div class="md:col-span-4 h-48 md:h-auto border-b-2 md:border-b-0 md:border-r-2 border-outline-variant relative bg-surface-container-highest">
                    <img class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" loading="lazy" src="${icon}" alt="${esc(item.name)}" onerror="this.onerror=null;this.src='${VANMOD.PLACEHOLDER_ICON}'">
                    ${badge}
                </div>
                <div class="md:col-span-8 p-lg flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-start mb-sm">
                            <div class="flex items-center gap-sm">
                                <span class="bg-surface-bright text-on-surface font-label-sm text-label-sm px-sm py-xs uppercase border border-outline-variant">${typeLabel}</span>
                                <span class="text-on-surface-variant font-label-sm text-label-sm uppercase flex items-center gap-xs">
                                    <span class="material-symbols-outlined text-[14px]">schedule</span> ${esc(time)}
                                </span>
                            </div>
                            <span class="material-symbols-outlined text-outline-variant group-hover:text-primary-container transition-colors">download</span>
                        </div>
                        <h2 class="font-headline-lg text-headline-lg text-primary uppercase mb-xs group-hover:text-primary-container transition-colors">${esc(item.name || 'Untitled')}</h2>
                        <p class="font-body-md text-body-md text-on-surface-variant mb-md max-w-xl">${esc(item.description || 'No description available')}</p>
                    </div>
                    <div class="flex flex-wrap gap-lg border-t-2 border-outline-variant pt-md mt-auto">
                        <div class="flex flex-col">
                            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">VERSION</span>
                            <span class="font-label-md text-label-md text-primary">v${esc(item.version || '1.0')}</span>
                        </div>
                        <div class="flex flex-col">
                            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">SIZE</span>
                            <span class="font-label-md text-label-md text-primary">${esc(item.size || 'N/A')}</span>
                        </div>
                        <div class="flex flex-col">
                            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">DOWNLOADS</span>
                            <span class="font-label-md text-label-md text-primary">${esc(VANMOD.formatNumber(item.downloads || 0))}</span>
                        </div>
                        <div class="flex flex-col">
                            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">RATING</span>
                            <span class="font-label-md text-label-md text-primary">${item.rating ? esc(Number(item.rating).toFixed(1)) : 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    `;
}

// ==================== LOAD MORE ====================
function loadMore() {
    visibleCount += 8;
    loadFeed();
}

window.loadMore = loadMore;

function updateLoadMoreButton(show) {
    const loadMoreContainer = document.getElementById('load-more-container');
    if (loadMoreContainer) {
        if (show) {
            loadMoreContainer.innerHTML = `
                <button onclick="loadMore()" class="bg-transparent text-primary font-label-md text-label-md uppercase px-2xl py-md border-2 border-primary hover:bg-primary hover:text-background transition-colors brutalist-btn flex items-center gap-sm">
                    <span class="material-symbols-outlined">sync</span> LOAD OLDER DEPLOYMENTS
                </button>
            `;
        } else {
            loadMoreContainer.innerHTML = `
                <p class="text-on-surface-variant font-label-sm uppercase tracking-widest">
                    // END OF FEED
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
                visibleCount = 8;
                loadFeed();
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
const ACTIVE_CLASSES = ['bg-primary-container', 'text-on-primary-container', 'border-primary-container'];
const INACTIVE_CLASSES = ['bg-surface-container-lowest', 'text-primary', 'border-outline-variant'];

function initFilters() {
    const filterButtons = document.querySelectorAll('[data-feed-filter]');
    if (filterButtons.length === 0) return;

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => {
                btn.classList.remove(...ACTIVE_CLASSES);
                btn.classList.add(...INACTIVE_CLASSES);
            });

            button.classList.remove(...INACTIVE_CLASSES);
            button.classList.add(...ACTIVE_CLASSES);

            currentType = button.dataset.feedFilter || 'all';
            visibleCount = 8;
            loadFeed();
        });
    });
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initFilters();
    loadFeed();
});
