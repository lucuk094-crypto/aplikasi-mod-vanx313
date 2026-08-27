// Home Page JavaScript
// VAN//MOD - Homepage functionality

// ==================== FEATURED MODS ====================
async function loadFeaturedMods() {
    const container = document.getElementById('featured-mods');
    if (!container) return;
    
    showLoading('featured-mods');
    
    try {
        const apps = await VANMOD.appsManager.getAll({}, 3);
        
        if (apps.length === 0) {
            container.innerHTML = `
                <div class="col-span-3 text-center p-xl text-on-surface-variant font-label-md uppercase">
                    No featured mods available
                </div>
            `;
            return;
        }
        
        let html = '';
        apps.forEach(app => {
            html += createFeaturedCard(app);
        });
        
        container.innerHTML = html;
    } catch (error) {
        showError('featured-mods', 'Failed to load featured mods');
    }
}

function createFeaturedCard(item) {
    return `
        <div class="brutalist-card p-lg flex flex-col h-full group relative overflow-hidden">
            <div class="absolute top-md right-md bg-primary-container text-on-primary-fixed font-label-sm text-[10px] uppercase font-bold px-sm py-xs z-10 border border-primary-container">${item.modType || 'PREMIUM'}</div>
            <div class="h-48 w-full border-b-2 border-outline-variant mb-md bg-surface-container-high relative overflow-hidden flex items-center justify-center">
                <img class="img-greyscale w-full h-full object-cover" src="${item.icon || 'https://via.placeholder.com/300x200'}" alt="${item.name}">
            </div>
            <div class="flex-grow flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-sm">
                        <h3 class="font-headline-sm text-headline-sm font-bold truncate">${item.name}</h3>
                        <div class="flex items-center gap-xs text-primary-container">
                            <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
                            <span class="font-label-sm text-label-sm">${item.rating ? item.rating.toFixed(1) : '4.9'}</span>
                        </div>
                    </div>
                    <p class="font-body-md text-body-md text-on-surface-variant line-clamp-2 mb-md">${item.description || 'No description available'}</p>
                    <div class="flex gap-sm mb-lg">
                        ${item.tags ? item.tags.slice(0, 2).map(tag => `<span class="bg-surface-container-high px-sm py-xs font-label-sm text-[10px] text-primary uppercase border border-outline-variant">${tag}</span>`).join('') : ''}
                        <span class="bg-surface-container-high px-sm py-xs font-label-sm text-[10px] text-primary uppercase border border-outline-variant">V ${item.version || '1.0'}</span>
                    </div>
                </div>
                <button class="brutalist-button w-full py-sm font-label-md text-label-md flex justify-center items-center gap-sm" onclick="VANMOD.viewItem('${item.id}', 'apps')">
                    <span class="material-symbols-outlined text-[18px]">download</span> GET MOD
                </button>
            </div>
        </div>
    `;
}

// ==================== TRENDING MODS ====================
async function loadTrendingMods() {
    const container = document.getElementById('trending-mods');
    if (!container) return;
    
    showLoading('trending-mods');
    
    try {
        const apps = await VANMOD.appsManager.getAll({}, 10);
        const sorted = apps.sort((a, b) => (b.downloads || 0) - (a.downloads || 0)).slice(0, 3);
        
        if (sorted.length === 0) {
            container.innerHTML = `
                <div class="text-center p-xl text-on-surface-variant font-label-md uppercase">
                    No trending mods available
                </div>
            `;
            return;
        }
        
        let html = '';
        sorted.forEach((item, index) => {
            html += createTrendingCard(item, index + 1);
        });
        
        container.innerHTML = html;
    } catch (error) {
        showError('trending-mods', 'Failed to load trending mods');
    }
}

function createTrendingCard(item, rank) {
    const downloads = item.downloads ? VANMOD.formatNumber(item.downloads) : '0';
    const timeUpdated = item.updatedAt ? VANMOD.timeAgo(item.updatedAt.toDate()) : 'N/A';
    
    return `
        <div class="brutalist-card flex flex-col md:flex-row items-center p-md gap-lg">
            <div class="font-display-lg text-[64px] font-black text-outline-variant opacity-50 px-md leading-none w-24 text-center">${String(rank).padStart(2, '0')}</div>
            <div class="w-24 h-24 border-2 border-outline-variant shrink-0 bg-surface-container-high flex items-center justify-center relative overflow-hidden">
                <img class="w-full h-full object-cover img-greyscale" src="${item.icon || 'https://via.placeholder.com/96'}" alt="${item.name}">
            </div>
            <div class="flex-grow flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-md">
                <div class="space-y-xs">
                    <h3 class="font-headline-sm text-headline-sm font-bold flex items-center gap-sm">
                        ${item.name} ${rank === 1 ? '<span class="bg-primary-container text-on-primary-fixed px-xs py-[2px] font-label-sm text-[10px] uppercase font-bold">HOT</span>' : ''}
                    </h3>
                    <p class="font-body-md text-body-md text-on-surface-variant line-clamp-1">${item.description || 'No description'}</p>
                    <div class="flex gap-sm">
                        <span class="text-on-surface-variant font-label-sm text-[12px] flex items-center gap-xs"><span class="material-symbols-outlined text-[14px]">download</span> ${downloads}</span>
                        <span class="text-on-surface-variant font-label-sm text-[12px] flex items-center gap-xs"><span class="material-symbols-outlined text-[14px]">update</span> ${timeUpdated}</span>
                    </div>
                </div>
                <button class="brutalist-button-secondary py-sm px-lg font-label-md text-label-md whitespace-nowrap md:w-auto w-full" onclick="VANMOD.viewItem('${item.id}', 'apps')">VIEW</button>
            </div>
        </div>
    `;
}

// ==================== LATEST UPDATES ====================
async function loadLatestUpdates() {
    const container = document.getElementById('latest-updates');
    if (!container) return;
    
    showLoading('latest-updates');
    
    try {
        const apps = await VANMOD.appsManager.getAll({}, 6);
        
        if (apps.length === 0) {
            container.innerHTML = `
                <div class="col-span-4 text-center p-xl text-on-surface-variant font-label-md uppercase">
                    No updates available
                </div>
            `;
            return;
        }
        
        let html = createLargeFeatureBox(apps[0]);
        apps.slice(1, 5).forEach((item, index) => {
            html += createSmallBox(item, index);
        });
        
        container.innerHTML = html;
    } catch (error) {
        showError('latest-updates', 'Failed to load latest updates');
    }
}

function createLargeFeatureBox(item) {
    return `
        <div class="md:col-span-2 md:row-span-2 brutalist-card p-lg flex flex-col justify-end relative overflow-hidden group min-h-[300px]">
            <div class="absolute inset-0 z-0">
                <img class="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-300 img-greyscale" src="${item.icon || 'https://via.placeholder.com/600x400'}" alt="${item.name}">
            </div>
            <div class="absolute top-lg right-lg bg-[#111111] text-primary border-2 border-outline-variant px-sm py-xs font-label-sm uppercase z-10">MAJOR UPDATE</div>
            <div class="relative z-10 space-y-md bg-surface-container-lowest/80 backdrop-blur-sm p-md border-l-4 border-primary-container">
                <h3 class="font-display-lg text-[32px] font-black uppercase leading-tight">${item.name}<br/>Mod V${item.version || '1.0'}</h3>
                <p class="font-body-md text-on-surface-variant">${item.description || 'No description available'}</p>
                <button class="brutalist-button px-lg py-sm font-label-md inline-flex items-center gap-sm" onclick="VANMOD.viewItem('${item.id}', 'apps')">
                    <span class="material-symbols-outlined text-[18px]">update</span> GET LATEST
                </button>
            </div>
        </div>
    `;
}

function createSmallBox(item, index) {
    const icons = ['sports_motorsports', 'movie', 'vpn_key', 'forum'];
    const icon = icons[index % icons.length];
    
    return `
        <div class="brutalist-card p-md flex flex-col justify-between group cursor-pointer" onclick="VANMOD.viewItem('${item.id}', 'apps')">
            <div class="flex justify-between items-start mb-md">
                <div class="w-12 h-12 border-2 border-outline-variant bg-surface-container-high flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary-container">${icon}</span>
                </div>
                <span class="text-on-surface-variant font-label-sm text-[10px]">${item.timeAgo || 'N/A'}</span>
            </div>
            <div>
                <h4 class="font-headline-sm text-[16px] font-bold mb-xs">${item.name}</h4>
                <p class="font-label-sm text-on-surface-variant mb-sm">${item.description ? item.description.substring(0, 30) + '...' : 'No description'}</p>
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
            } else {
                window.location.href = `${category}.html`;
            }
        });
    });
}

// ==================== STATISTICS ====================
async function loadStatistics() {
    const statsContainer = document.getElementById('stats');
    if (!statsContainer) return;
    
    try {
        const stats = await VANMOD.getGlobalStats();
        
        const totalApps = stats.totalApps || 128;
        const totalReviews = stats.totalReviews || 4800;
        
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
