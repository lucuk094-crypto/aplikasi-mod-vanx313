// Popular Page JavaScript
// VAN//MOD - Popular Leaderboard (apps + games + tools by downloads)

let currentSearch = '';
let visibleCount = 7;
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

function getRankedItems() {
    let items = [...cache];

    if (currentSearch) {
        const term = currentSearch.toLowerCase();
        items = items.filter(i =>
            String(i.name || '').toLowerCase().includes(term) ||
            String(i.description || '').toLowerCase().includes(term) ||
            String(i.category || '').toLowerCase().includes(term)
        );
    }

    // Most downloaded first
    items.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));

    return items;
}

// ==================== LOAD BOARD ====================
async function loadBoard() {
    if (isLoading) return;

    const container = document.getElementById('popular-board');
    if (!container || !window.VANMOD) return;

    isLoading = true;

    try {
        await fetchAllItems();
        const items = getRankedItems();

        if (items.length === 0) {
            if (!currentSearch) {
                // No data yet: keep the static showcase board in the HTML
                isLoading = false;
                return;
            }
            container.innerHTML = `
                <div class="col-span-1 md:col-span-12 text-center py-20">
                    <span class="material-symbols-outlined text-[64px] text-on-surface-variant mb-4 block">search_off</span>
                    <h3 class="font-headline-md text-headline-md text-on-surface-variant mb-2">NO MODS FOUND</h3>
                    <p class="font-body-md text-on-surface-variant">Try adjusting your search</p>
                </div>
            `;
            isLoading = false;
            return;
        }

        const shown = items.slice(0, visibleCount);
        let html = '';

        if (shown[0]) html += createHeroCard(shown[0], 1);
        if (shown[1]) html += createRankCard(shown[1], 2);
        if (shown[2]) html += createRankCard(shown[2], 3);

        const rest = shown.slice(3);
        if (rest.length > 0) {
            html += '<div class="col-span-1 md:col-span-12 lg:col-span-8 flex flex-col gap-md">';
            rest.forEach((item, i) => {
                html += createListRow(item, i + 4);
            });
            if (items.length > visibleCount) {
                html += `
                    <button onclick="loadMore()" class="mt-md w-full py-md border-2 border-outline-variant text-on-surface-variant font-label-md uppercase hover:bg-surface-container-highest hover:text-primary transition-colors flex items-center justify-center gap-sm">
                        LOAD MORE DATA <span class="material-symbols-outlined text-[18px]">expand_more</span>
                    </button>
                `;
            } else {
                html += `
                    <p class="text-center text-on-surface-variant font-label-sm uppercase tracking-widest mt-md">
                        // END OF LEADERBOARD
                    </p>
                `;
            }
            html += '</div>';
        } else if (items.length > visibleCount) {
            // Few items but more available: full-width load more
            html += `
                <div class="col-span-1 md:col-span-12 flex justify-center">
                    <button onclick="loadMore()" class="mt-md px-2xl py-md border-2 border-outline-variant text-on-surface-variant font-label-md uppercase hover:bg-surface-container-highest hover:text-primary transition-colors flex items-center justify-center gap-sm">
                        LOAD MORE DATA <span class="material-symbols-outlined text-[18px]">expand_more</span>
                    </button>
                </div>
            `;
        }

        container.innerHTML = html;

    } catch (error) {
        console.error('Failed to load popular board:', error);
    }

    isLoading = false;
}

function createHeroCard(item, rank) {
    const esc = VANMOD.escapeHtml;
    const type = item._type || 'apps';
    const icon = esc(item.icon || VANMOD.PLACEHOLDER_ICON);
    const downloads = VANMOD.formatNumber(item.downloads || 0);

    return `
        <div class="col-span-1 md:col-span-12 lg:col-span-8 bg-[#111111] brutalist-border-active p-lg brutalist-shadow-hover transition-all duration-300 flex flex-col justify-between min-h-[400px] relative overflow-hidden group cursor-pointer" onclick="VANMOD.viewItem('${esc(item.id)}', '${esc(type)}')">
            <div class="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity grayscale group-hover:grayscale-0" style="background-image: url('${icon}')"></div>
            <div class="relative z-10 flex justify-between items-start">
                <div class="bg-primary-container text-[#080808] font-headline-lg text-headline-lg font-black px-md py-sm border-2 border-primary-container">
                    #${String(rank).padStart(2, '0')}
                </div>
                <div class="flex space-x-sm">
                    <span class="bg-[#111111] text-primary border-2 border-primary font-label-sm text-label-sm uppercase px-sm py-xs">TRENDING</span>
                    <span class="bg-[#93000a] text-primary border-2 border-[#93000a] font-label-sm text-label-sm uppercase px-sm py-xs flex items-center gap-xs">
                        <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">local_fire_department</span> HOT
                    </span>
                </div>
            </div>
            <div class="relative z-10 mt-auto bg-[#080808]/80 backdrop-blur-md border-2 border-outline-variant p-md">
                <div class="flex justify-between items-end gap-md">
                    <div>
                        <div class="flex items-center gap-sm mb-xs">
                            <span class="bg-surface-container-high text-primary font-label-sm px-xs py-1 text-[10px] uppercase border border-outline-variant">${esc(item.category || type.toUpperCase())}</span>
                        </div>
                        <h2 class="font-headline-lg text-headline-lg font-bold text-primary mb-xs">${esc(item.name || 'Untitled')}</h2>
                        <p class="font-body-md text-body-md text-on-surface-variant line-clamp-2">${esc(item.description || 'No description available')}</p>
                    </div>
                    <div class="text-right shrink-0">
                        <div class="font-headline-sm text-headline-sm font-bold text-primary-container">${esc(downloads)}</div>
                        <div class="font-label-sm text-label-sm text-on-surface-variant uppercase">Active DLs</div>
                    </div>
                </div>
                <div class="w-full h-[2px] bg-outline-variant my-md relative">
                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#080808] px-sm font-label-sm text-outline-variant">//</div>
                </div>
                <button class="w-full bg-[#B7FF00] text-[#080808] font-label-md uppercase py-sm border-2 border-[#B7FF00] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[4px_4px_0px_0px_#FFFFFF] transition-all font-bold">
                    INSTALL // INITIALIZE
                </button>
            </div>
        </div>
    `;
}

function createRankCard(item, rank) {
    const esc = VANMOD.escapeHtml;
    const type = item._type || 'apps';
    const typeLabel = type === 'games' ? 'GAME' : type === 'tools' ? 'TOOL' : 'APP';
    const icon = esc(item.icon || VANMOD.PLACEHOLDER_ICON);
    const downloads = VANMOD.formatNumber(item.downloads || 0);

    return `
        <div class="col-span-1 md:col-span-6 lg:col-span-4 bg-[#111111] brutalist-border p-md brutalist-shadow-hover transition-all duration-300 flex flex-col group cursor-pointer" onclick="VANMOD.viewItem('${esc(item.id)}', '${esc(type)}')">
            <div class="flex justify-between items-start mb-md">
                <div class="bg-surface-variant text-primary font-headline-md text-headline-md font-bold px-sm py-xs border-2 border-outline-variant">
                    #${String(rank).padStart(2, '0')}
                </div>
                <span class="bg-surface-container-high text-primary border-2 border-outline-variant font-label-sm text-label-sm uppercase px-sm py-xs">${typeLabel}</span>
            </div>
            <div class="w-full h-32 mb-md border-2 border-outline-variant overflow-hidden bg-surface-container-highest">
                <img class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" loading="lazy" src="${icon}" alt="${esc(item.name)}" onerror="this.onerror=null;this.src='${VANMOD.PLACEHOLDER_ICON}'">
            </div>
            <div class="flex-grow">
                <h3 class="font-headline-md text-headline-md font-bold text-primary mb-xs">${esc(item.name || 'Untitled')}</h3>
                <p class="font-body-md text-body-md text-on-surface-variant text-sm line-clamp-2">${esc(item.description || 'No description available')}</p>
            </div>
            <div class="mt-md flex justify-between items-center border-t-2 border-outline-variant pt-sm">
                <div class="flex items-center gap-xs text-on-surface-variant">
                    <span class="material-symbols-outlined text-[16px]">download</span>
                    <span class="font-label-sm font-bold">${esc(downloads)}</span>
                </div>
                <button class="bg-transparent text-primary border-2 border-primary font-label-sm uppercase px-md py-xs hover:bg-primary hover:text-[#080808] transition-colors font-bold">
                    GET
                </button>
            </div>
        </div>
    `;
}

function createListRow(item, rank) {
    const esc = VANMOD.escapeHtml;
    const type = item._type || 'apps';
    const icon = esc(item.icon || VANMOD.PLACEHOLDER_ICON);
    const downloads = VANMOD.formatNumber(item.downloads || 0);

    return `
        <div class="bg-[#111111] brutalist-border p-sm flex items-center justify-between brutalist-shadow-hover transition-all duration-200 cursor-pointer group" onclick="VANMOD.viewItem('${esc(item.id)}', '${esc(type)}')">
            <div class="flex items-center gap-md">
                <div class="w-12 h-12 bg-surface-variant border-2 border-outline-variant flex items-center justify-center font-headline-sm font-bold text-on-surface-variant">
                    ${String(rank).padStart(2, '0')}
                </div>
                <img class="w-12 h-12 border-2 border-outline-variant grayscale group-hover:grayscale-0 object-cover" loading="lazy" src="${icon}" alt="${esc(item.name)}" onerror="this.onerror=null;this.src='${VANMOD.PLACEHOLDER_ICON}'">
                <div>
                    <h4 class="font-headline-sm text-headline-sm font-bold text-primary group-hover:text-primary-container transition-colors">${esc(item.name || 'Untitled')}</h4>
                    <div class="flex gap-sm mt-xs">
                        <span class="bg-surface-container-high text-primary font-label-sm px-xs py-px text-[10px] uppercase border border-outline-variant">${esc(item.category || type.toUpperCase())}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-xl">
                <div class="hidden sm:block text-right">
                    <div class="font-label-md text-primary">${esc(downloads)}</div>
                    <div class="font-label-sm text-on-surface-variant text-[10px]">USERS</div>
                </div>
                <span class="material-symbols-outlined text-outline-variant group-hover:text-primary-container transition-colors">arrow_forward</span>
            </div>
        </div>
    `;
}

// ==================== LOAD MORE ====================
function loadMore() {
    visibleCount += 6;
    loadBoard();
}

window.loadMore = loadMore;

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
                visibleCount = 7;
                loadBoard();
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

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    loadBoard();
});
