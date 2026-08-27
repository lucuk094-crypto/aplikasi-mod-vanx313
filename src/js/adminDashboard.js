// Admin Dashboard JavaScript
// VAN//MOD - Admin Dashboard Management

let currentUser = null;

// ==================== AUTH CHECK ====================
function checkAuth() {
    VANMOD.checkAuthState((user) => {
        if (!user) {
            window.location.href = 'adminlogin.html';
        } else {
            currentUser = user;
            loadDashboardData();
        }
    });
}

// ==================== LOAD DASHBOARD DATA ====================
async function loadDashboardData() {
    loadStatistics();
    loadRecentApps();
    loadRecentTransmissions();
}

// ==================== STATISTICS ====================
async function loadStatistics() {
    try {
        const stats = await VANMOD.getGlobalStats();
        
        // Update traffic volume
        const trafficElement = document.querySelector('[data-stat="traffic"]');
        if (trafficElement) {
            const traffic = Math.floor(Math.random() * 1000000) + 8000000;
            trafficElement.textContent = traffic.toLocaleString();
        }
        
        // Update server capacity
        updateServerCapacity();
        
        // Update active deployments
        const deploymentsElement = document.querySelector('[data-stat="deployments"]');
        if (deploymentsElement) {
            const totalApps = (stats.totalApps || 0) + (stats.totalGames || 0) + (stats.totalTools || 0);
            deploymentsElement.textContent = `// ${totalApps}`;
        }
        
    } catch (error) {
        console.error('Failed to load statistics:', error);
    }
}

function updateServerCapacity() {
    const capacities = ['CORE_01', 'CORE_02', 'STORAGE_ARRAY'];
    
    capacities.forEach(core => {
        const element = document.querySelector(`[data-capacity="${core}"]`);
        if (element) {
            const percentage = Math.floor(Math.random() * 30) + 40;
            element.style.width = percentage + '%';
            element.previousElementSibling.querySelector('.text-primary-container').textContent = percentage + '%';
        }
    });
}

// ==================== RECENT APPS ====================
async function loadRecentApps() {
    const container = document.getElementById('recent-apps');
    if (!container) return;
    
    try {
        const apps = await VANMOD.appsManager.getAll({}, 3);
        
        if (apps.length === 0) {
            container.innerHTML = `
                <div class="col-span-2 text-center p-xl text-on-surface-variant font-label-md uppercase">
                    No apps available
                </div>
            `;
            return;
        }
        
        let html = '';
        apps.forEach(app => {
            html += createAppManagementCard(app);
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Failed to load apps:', error);
    }
}

function createAppManagementCard(app) {
    const status = app.status || 'online';
    const statusClass = status === 'online' ? 'bg-primary-container' : 'bg-on-surface-variant';
    const statusText = status === 'online' ? 'SYS.ONLINE' : 'SYS.STANDBY';
    
    return `
        <div class="bg-surface-container border-2 border-outline-variant p-lg group hover:border-primary transition-colors flex flex-col">
            <div class="flex justify-between items-start mb-6">
                <div>
                    <div class="flex items-center space-x-2 mb-2">
                        <span class="w-3 h-3 ${statusClass} rounded-sm animate-pulse"></span>
                        <span class="font-label-sm text-label-sm terminal-text text-primary-container">${statusText}</span>
                    </div>
                    <h3 class="font-headline-md text-headline-md font-bold text-primary tracking-tight truncate w-48" title="// ${app.name}">
                        // ${app.name}
                    </h3>
                </div>
                <div class="bg-surface-container-highest px-2 py-1 font-label-sm text-label-sm terminal-text text-on-surface-variant border border-outline-variant">
                    ID: 0x${app.id.substring(0, 4).toUpperCase()}
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-6 text-sm terminal-text text-on-surface-variant font-label-sm">
                <div><span class="text-primary block mb-1">REQ_VOL:</span> ${VANMOD.formatNumber(app.downloads || 0)}/h</div>
                <div><span class="text-primary block mb-1">LATENCY:</span> ${Math.floor(Math.random() * 50)}ms</div>
            </div>
            <div class="mt-auto pt-4 border-t-2 border-outline-variant flex space-x-2">
                <button class="flex-1 bg-surface-container-highest border-2 border-outline-variant py-2 font-label-sm text-label-sm uppercase hover:border-primary hover:text-primary transition-colors flex justify-center items-center" onclick="editApp('${app.id}')">
                    <span class="material-symbols-outlined text-[18px] mr-1">edit</span> MOD
                </button>
                <button class="flex-1 bg-surface-container-highest border-2 border-outline-variant py-2 font-label-sm text-label-sm uppercase hover:border-primary hover:text-primary transition-colors flex justify-center items-center" onclick="viewAppAnalytics('${app.id}')">
                    <span class="material-symbols-outlined text-[18px] mr-1">analytics</span> ANLYT
                </button>
            </div>
        </div>
    `;
}

// ==================== RECENT TRANSMISSIONS ====================
async function loadRecentTransmissions() {
    const container = document.getElementById('recent-transmissions');
    if (!container) return;
    
    try {
        // Get recent contacts/transmissions
        const transmissions = [
            {
                type: 'URGENT',
                category: 'CONTACT_FORM',
                title: 'API Rate Limit Exceeded',
                description: 'Multiple nodes reporting 429 Too Many Requests from external auth provider.',
                time: '2m',
                priority: 'error'
            },
            {
                type: 'LOG',
                category: 'DEPLOYMENT',
                title: 'Module V2.4.1 Pushed',
                description: 'Successful deployment of // BROWSE_APPS UI updates.',
                time: '14m',
                priority: 'success'
            },
            {
                type: 'USER',
                category: 'REVIEW_QUEUE',
                title: 'New App Submission',
                description: 'User submitted tool for ecosystem review.',
                time: '45m',
                priority: 'normal'
            }
        ];
        
        let html = '';
        transmissions.forEach(trans => {
            html += createTransmissionCard(trans);
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Failed to load transmissions:', error);
    }
}

function createTransmissionCard(trans) {
    const borderColor = trans.priority === 'error' ? 'border-error' : trans.priority === 'success' ? 'border-primary-container' : 'border-outline';
    const textColor = trans.priority === 'error' ? 'text-error' : trans.priority === 'success' ? 'text-primary-container' : 'text-outline';
    
    return `
        <div class="border-l-4 ${borderColor} bg-surface-container p-sm group hover:bg-surface-container-high transition-colors cursor-pointer">
            <div class="flex justify-between items-start mb-2">
                <span class="font-label-sm text-label-sm terminal-text ${textColor}">${trans.type} // ${trans.category}</span>
                <span class="font-label-sm text-label-sm terminal-text text-on-surface-variant">T-${trans.time}</span>
            </div>
            <h4 class="font-label-md text-label-md uppercase text-primary mb-1">${trans.title}</h4>
            <p class="font-body-md text-body-md text-on-surface-variant text-sm line-clamp-2">${trans.description}</p>
        </div>
    `;
}

// ==================== APP MANAGEMENT ====================
function editApp(appId) {
    window.location.href = `adminsettings.html?edit=${appId}`;
}

function viewAppAnalytics(appId) {
    window.location.href = `systemlogdetail.html?id=${appId}`;
}

// ==================== LOGOUT ====================
async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        const result = await VANMOD.adminLogout();
        if (result.success) {
            window.location.href = 'adminlogin.html';
        }
    }
}

// Make logout available globally
window.logout = logout;

// ==================== REAL-TIME UPDATES ====================
function startRealTimeUpdates() {
    // Update traffic every 5 seconds
    setInterval(() => {
        const trafficElement = document.querySelector('[data-stat="traffic"]');
        if (trafficElement) {
            const currentValue = parseInt(trafficElement.textContent.replace(/,/g, ''));
            const change = Math.floor(Math.random() * 1000) - 500;
            const newValue = Math.max(8000000, currentValue + change);
            trafficElement.textContent = newValue.toLocaleString();
        }
    }, 5000);
    
    // Update server capacity every 10 seconds
    setInterval(() => {
        updateServerCapacity();
    }, 10000);
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    startRealTimeUpdates();
});
