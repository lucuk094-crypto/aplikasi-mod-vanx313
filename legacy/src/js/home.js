// Home Page JavaScript
// VAN//MOD - Homepage functionality

// ==================== FEATURED MODS ====================
async function loadFeaturedMods() {
    const container = document.getElementById('featured-mods');
    if (!container || !window.VANMOD) return;

    try {
        const apps = await VANMOD.appsManager.getAll({}, 3);

        // Empty/error: keep the static showcase cards already in the HTML
        if (apps.length === 0) return;

        let html = '';
        apps.forEach(app => {
            html += createFeaturedCard(app);
        });

        container.innerHTML = html;
    } catch (error) {
        console.error('Failed to load featured mods:', error);
    }
}

function createFeaturedCard(item) {
    const esc = VANMOD.escapeHtml;
    const icon = esc(item.icon || VANMOD.PLACEHOLDER_ICON);
    return `
        <div class="brutalist-card p-lg flex flex-col h-full group relative overflow-hidden">
            <div class="absolute top-md right-md bg-primary-container text-on-primary-fixed font-label-sm text-[10px] uppercase font-bold px-sm py-xs z-10 border border-primary-container">${esc(item.modType || 'PREMIUM')}</div>
            <div class="h-48 w-full border-b-2 border-outline-variant mb-md bg-surface-container-high relative overflow-hidden flex items-center justify-center">
                <img class="img-greyscale w-full h-full object-cover" loading="lazy" src="${icon}" alt="${esc(item.name)}" onerror="this.onerror=null;this.src='${VANMOD.PLACEHOLDER_ICON}'">
            </div>
            <div class="flex-grow flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-sm">
                        <h3 class="font-headline-sm text-headline-sm font-bold truncate">${esc(item.name)}</h3>
                        <div class="flex items-center gap-xs text-primary-container">
                            <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
                            <span class="font-label-sm text-label-sm">${item.rating ? Number(item.rating).toFixed(1) : 'N/A'}</span>
                        </div>
                    </div>
                    <p class="font-body-md text-body-md text-on-surface-variant line-clamp-2 mb-md">${esc(item.description || 'No description available')}</p>
                    <div class="flex gap-sm mb-lg">
                        ${item.tags ? item.tags.slice(0, 2).map(tag => `<span class="bg-surface-container-high px-sm py-xs font-label-sm text-[10px] text-primary uppercase border border-outline-variant">${esc(tag)}</span>`).join('') : ''}
                        <span class="bg-surface-container-high px-sm py-xs font-label-sm text-[10px] text-primary uppercase border border-outline-variant">V ${esc(item.version || '1.0')}</span>
                    </div>
                </div>
                <button class="brutalist-button w-full py-sm font-label-md text-label-md flex justify-center items-center gap-sm" onclick="VANMOD.viewItem('${esc(item.id)}', 'apps')">
                    <span class="material-symbols-outlined text-[18px]">download</span> GET MOD
                </button>
            </div>
        </div>
    `;
}

// ==================== TRENDING MODS ====================
async function loadTrendingMods() {
    const container = document.getElementById('trending-mods');
    if (!container || !window.VANMOD) return;

    try {
        const apps = await VANMOD.appsManager.getAll({}, 10);
        const sorted = apps.sort((a, b) => (b.downloads || 0) - (a.downloads || 0)).slice(0, 3);

        // Empty: keep the static showcase cards already in the HTML
        if (sorted.length === 0) return;

        let html = '';
        sorted.forEach((item, index) => {
            html += createTrendingCard(item, index + 1);
        });

        container.innerHTML = html;
    } catch (error) {
        console.error('Failed to load trending mods:', error);
    }
}

function createTrendingCard(item, rank) {
    const esc = VANMOD.escapeHtml;
    const downloads = item.downloads ? VANMOD.formatNumber(item.downloads) : '0';
    const timeUpdated = item.updatedAt ? VANMOD.timeAgo(item.updatedAt) : 'N/A';
    const icon = esc(item.icon || VANMOD.PLACEHOLDER_ICON);

    return `
        <div class="brutalist-card flex flex-col md:flex-row items-center p-md gap-lg">
            <div class="font-display-lg text-[64px] font-black text-outline-variant opacity-50 px-md leading-none w-24 text-center">${String(rank).padStart(2, '0')}</div>
            <div class="w-24 h-24 border-2 border-outline-variant shrink-0 bg-surface-container-high flex items-center justify-center relative overflow-hidden">
                <img class="w-full h-full object-cover img-greyscale" loading="lazy" src="${icon}" alt="${esc(item.name)}" onerror="this.onerror=null;this.src='${VANMOD.PLACEHOLDER_ICON}'">
            </div>
            <div class="flex-grow flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-md">
                <div class="space-y-xs">
                    <h3 class="font-headline-sm text-headline-sm font-bold flex items-center gap-sm">
                        ${esc(item.name)} ${rank === 1 ? '<span class="bg-primary-container text-on-primary-fixed px-xs py-[2px] font-label-sm text-[10px] uppercase font-bold">HOT</span>' : ''}
                    </h3>
                    <p class="font-body-md text-body-md text-on-surface-variant line-clamp-1">${esc(item.description || 'No description')}</p>
                    <div class="flex gap-sm">
                        <span class="text-on-surface-variant font-label-sm text-[12px] flex items-center gap-xs"><span class="material-symbols-outlined text-[14px]">download</span> ${esc(downloads)}</span>
                        <span class="text-on-surface-variant font-label-sm text-[12px] flex items-center gap-xs"><span class="material-symbols-outlined text-[14px]">update</span> ${esc(timeUpdated)}</span>
                    </div>
                </div>
                <button class="brutalist-button-secondary py-sm px-lg font-label-md text-label-md whitespace-nowrap md:w-auto w-full" onclick="VANMOD.viewItem('${esc(item.id)}', 'apps')">VIEW</button>
            </div>
        </div>
    `;
}

// ==================== LATEST UPDATES ====================
async function loadLatestUpdates() {
    const container = document.getElementById('latest-updates');
    if (!container || !window.VANMOD) return;

    try {
        const apps = await VANMOD.appsManager.getAll({}, 6);

        // Empty: keep the static showcase cards already in the HTML
        if (apps.length === 0) return;

        let html = createLargeFeatureBox(apps[0]);
        apps.slice(1, 5).forEach((item, index) => {
            html += createSmallBox(item, index);
        });

        container.innerHTML = html;
    } catch (error) {
        console.error('Failed to load latest updates:', error);
    }
}

function createLargeFeatureBox(item) {
    const esc = VANMOD.escapeHtml;
    const icon = esc(item.icon || VANMOD.PLACEHOLDER_ICON);
    return `
        <div class="md:col-span-2 md:row-span-2 brutalist-card p-lg flex flex-col justify-end relative overflow-hidden group min-h-[300px]">
            <div class="absolute inset-0 z-0">
                <img class="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-300 img-greyscale" loading="lazy" src="${icon}" alt="${esc(item.name)}" onerror="this.onerror=null;this.src='${VANMOD.PLACEHOLDER_ICON}'">
            </div>
            <div class="absolute top-lg right-lg bg-[#111111] text-primary border-2 border-outline-variant px-sm py-xs font-label-sm uppercase z-10">MAJOR UPDATE</div>
            <div class="relative z-10 space-y-md bg-surface-container-lowest/80 backdrop-blur-sm p-md border-l-4 border-primary-container">
                <h3 class="font-display-lg text-[32px] font-black uppercase leading-tight">${esc(item.name)}<br/>Mod V${esc(item.version || '1.0')}</h3>
                <p class="font-body-md text-on-surface-variant">${esc(item.description || 'No description available')}</p>
                <button class="brutalist-button px-lg py-sm font-label-md inline-flex items-center gap-sm" onclick="VANMOD.viewItem('${esc(item.id)}', 'apps')">
                    <span class="material-symbols-outlined text-[18px]">update</span> GET LATEST
                </button>
            </div>
        </div>
    `;
}

function createSmallBox(item, index) {
    const esc = VANMOD.escapeHtml;
    const icons = ['sports_motorsports', 'movie', 'vpn_key', 'forum'];
    const icon = icons[index % icons.length];
    const updated = item.updatedAt ? VANMOD.timeAgo(item.updatedAt) : 'N/A';

    return `
        <div class="brutalist-card p-md flex flex-col justify-between group cursor-pointer" onclick="VANMOD.viewItem('${esc(item.id)}', 'apps')">
            <div class="flex justify-between items-start mb-md">
                <div class="w-12 h-12 border-2 border-outline-variant bg-surface-container-high flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary-container">${icon}</span>
                </div>
                <span class="text-on-surface-variant font-label-sm text-[10px]">${esc(updated)}</span>
            </div>
            <div>
                <h4 class="font-headline-sm text-[16px] font-bold mb-xs">${esc(item.name)}</h4>
                <p class="font-label-sm text-on-surface-variant mb-sm">${esc(item.description ? item.description.substring(0, 30) + '...' : 'No description')}</p>
                <a class="text-primary-container font-label-sm uppercase hover:underline flex items-center gap-xs">VIEW <span class="material-symbols-outlined text-[14px]">arrow_forward</span></a>
            </div>
        </div>
    `;
}

// ==================== SEARCH FUNCTIONALITY ====================
function initSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    let debounceTimer;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const searchTerm = e.target.value.trim();
            if (searchTerm.length >= 2) {
                performSearch(searchTerm);
            }
        }, 300);
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = e.target.value.trim();
            if (searchTerm) {
                window.location.href = `apps.html?search=${encodeURIComponent(searchTerm)}`;
            }
        }
    });
}

async function performSearch(searchTerm) {
    console.log('Searching for:', searchTerm);
    // Search functionality will redirect to apps page with search parameter
}

// ==================== CATEGORY FILTERS ====================
function initCategoryFilters() {
    const filterButtons = document.querySelectorAll('[data-category]');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            if (category === 'all') {
                window.location.href = 'home.html';
            } else if (['apps', 'games', 'tools'].includes(category)) {
                window.location.href = `${category}.html`;
            } else {
                // Unknown category (e.g. "social") -> filtered apps catalog
                window.location.href = `apps.html?category=${encodeURIComponent(category)}`;
            }
        });
    });
}

// ==================== STATISTICS ====================
async function loadStatistics() {
    const statsContainer = document.getElementById('stats');
    if (!statsContainer || !window.VANMOD) return;

    try {
        const stats = await VANMOD.getGlobalStats();

        const totalApps = stats.totalApps || 0;
        const totalReviews = stats.totalReviews || 0;
        
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-md">
                    <span class="font-display-lg text-display-lg font-black text-primary-container">${totalApps}+</span>
                    <span class="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mt-sm">Apps Archived</span>
                </div>
                <div class="flex flex-col items-center justify-center py-md">
                    <span class="font-display-lg text-display-lg font-black text-primary-container">${totalReviews}K</span>
                    <span class="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mt-sm">Reviews Verified</span>
                </div>
                <div class="flex flex-col items-center justify-center py-md">
                    <span class="font-display-lg text-display-lg font-black text-primary-container">2024</span>
                    <span class="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mt-sm">System Est.</span>
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to load statistics:', error);
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedMods();
    loadTrendingMods();
    loadLatestUpdates();
    loadStatistics();
    initSearch();
    initCategoryFilters();
});
