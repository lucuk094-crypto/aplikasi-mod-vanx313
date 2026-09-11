// Main Application JavaScript
// VAN//MOD - High-End Brutalist Ecosystem

// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    setDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    increment,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Single source of truth for Firebase credentials
import { firebaseConfig } from '../../config/firebaseConfig.js';

// Initialize Firebase (guarded so the UI helpers still work offline / on misconfig)
let app = null;
let auth = null;
let db = null;
let storage = null;
let firebaseReady = false;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    firebaseReady = true;
} catch (error) {
    console.error('Firebase initialization failed:', error);
}

function requireDb() {
    if (!db) {
        throw new Error('Database not initialized. Check Firebase config / connection.');
    }
}

// ==================== UTILITY FUNCTIONS ====================

// Convert Firestore Timestamp / Date / millis / ISO string into a Date (or null)
function toDate(value) {
    if (!value) return null;
    try {
        if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
        if (typeof value.toDate === 'function') return value.toDate();
        if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
        if (typeof value === 'number') return new Date(value);
        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? null : parsed;
    } catch (e) {
        return null;
    }
}

// Escape user-controlled text before injecting into HTML (XSS protection)
function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Offline-friendly placeholder icon (inline SVG data URI, no external dependency)
const PLACEHOLDER_ICON = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">` +
    `<rect width="256" height="256" fill="#111111"/>` +
    `<rect x="8" y="8" width="240" height="240" fill="none" stroke="#424a33" stroke-width="4"/>` +
    `<text x="128" y="148" font-family="monospace" font-size="64" font-weight="bold" fill="#b2f800" text-anchor="middle">//</text>` +
    `</svg>`
);

// Format number with K/M suffix
function formatNumber(num) {
    const n = typeof num === 'number' ? num : Number(num);
    if (!isFinite(n)) return '0';
    if (n >= 1000000) {
        return (n / 1000000).toFixed(1) + 'M';
    } else if (n >= 1000) {
        return (n / 1000).toFixed(1) + 'K';
    }
    return Math.floor(n).toString();
}

// Format date to relative time (accepts Date, Firestore Timestamp, millis, ISO string)
function timeAgo(value) {
    const date = toDate(value);
    if (!date) return 'N/A';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 0) return 'Baru saja';

    const intervals = {
        tahun: 31536000,
        bulan: 2592000,
        minggu: 604800,
        hari: 86400,
        jam: 3600,
        menit: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit} lalu`;
        }
    }
    return 'Baru saja';
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ==================== DATABASE OPERATIONS ====================

// Apps/Games/Tools CRUD Operations
class ItemManager {
    constructor(collectionName) {
        this.collectionName = collectionName;
    }

    get collectionRef() {
        requireDb();
        return collection(db, this.collectionName);
    }

    // Create new item
    async create(data) {
        const itemData = {
            ...data,
            downloads: 0,
            rating: 0,
            reviews: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(this.collectionRef, itemData);
        return docRef.id;
    }

    // Read item by ID
    async getById(id) {
        if (!id) return null;
        requireDb();
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    }

    // Get items with optional filters.
    // NOTE: intentionally no orderBy() combined with where() so the query
    // never requires a composite index. Sorting is done client-side.
    async getAll(filters = {}, pageSize = 20) {
        const constraints = [];

        if (filters.category) {
            constraints.push(where('category', '==', filters.category));
        }
        if (filters.tag) {
            constraints.push(where('tags', 'array-contains', filters.tag));
        }
        constraints.push(limit(Math.max(1, pageSize)));

        const q = query(this.collectionRef, ...constraints);
        const querySnapshot = await getDocs(q);
        const items = [];
        querySnapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Newest first (missing/invalid dates sink to the bottom)
        items.sort((a, b) => {
            const da = toDate(a.createdAt);
            const dbb = toDate(b.createdAt);
            return (dbb ? dbb.getTime() : 0) - (da ? da.getTime() : 0);
        });

        return items;
    }

    // Update item
    async update(id, data) {
        requireDb();
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    }

    // Delete item
    async delete(id) {
        requireDb();
        const docRef = doc(db, this.collectionName, id);
        await deleteDoc(docRef);
    }

    // Increment download count
    async incrementDownloads(id) {
        requireDb();
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, {
            downloads: increment(1)
        });
    }

    // Add review (uses a client-side Date: serverTimestamp() is
    // forbidden inside Firestore arrays and would throw)
    async addReview(id, review) {
        const item = await this.getById(id);
        if (!item) {
            throw new Error('Item not found');
        }
        const reviews = Array.isArray(item.reviews) ? [...item.reviews] : [];
        const rating = Math.min(5, Math.max(1, Number(review.rating) || 5));
        reviews.push({
            id: generateId(),
            userName: review.userName || 'Anonymous',
            comment: review.comment || '',
            rating,
            createdAt: new Date()
        });

        const avgRating = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length;

        await this.update(id, {
            reviews,
            rating: Math.round(avgRating * 10) / 10
        });
    }

    // Search items by name prefix (single-field query, no composite index needed)
    async search(searchTerm) {
        const term = String(searchTerm || '').trim();
        if (!term) return [];
        const q = query(
            this.collectionRef,
            where('name', '>=', term),
            where('name', '<=', term + '\uf8ff'),
            orderBy('name'),
            limit(20)
        );

        const querySnapshot = await getDocs(q);
        const items = [];
        querySnapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...docSnap.data() });
        });

        return items;
    }
}

// Initialize managers
const appsManager = new ItemManager('apps');
const gamesManager = new ItemManager('games');
const toolsManager = new ItemManager('tools');

// Resolve manager by type string ('apps' | 'games' | 'tools')
function getManager(type) {
    switch (type) {
        case 'games': return gamesManager;
        case 'tools': return toolsManager;
        default: return appsManager;
    }
}

// ==================== AUTHENTICATION ====================

function friendlyAuthError(error) {
    const code = error && error.code ? error.code : '';
    switch (code) {
        case 'auth/invalid-email': return 'Format email tidak valid.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': return 'Email atau password salah.';
        case 'auth/too-many-requests': return 'Terlalu banyak percobaan. Coba lagi nanti.';
        case 'auth/network-request-failed': return 'Gagal terhubung. Periksa koneksi internet.';
        case 'auth/user-disabled': return 'Akun ini dinonaktifkan.';
        default: return (error && error.message) || 'Login gagal. Coba lagi.';
    }
}

// Admin Login
async function adminLogin(email, password) {
    try {
        if (!auth) throw new Error('Auth not initialized. Check Firebase config / connection.');
        const userCredential = await signInWithEmailAndPassword(auth, String(email).trim(), password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: friendlyAuthError(error) };
    }
}

// Admin Logout
async function adminLogout() {
    try {
        if (!auth) return { success: true };
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
}

// Check Auth State
function checkAuthState(callback) {
    if (!auth) {
        callback(null);
        return;
    }
    onAuthStateChanged(auth, (user) => {
        callback(user);
    });
}

// ==================== CONTACT FORM ====================

// Submit contact form
async function submitContactForm(formData) {
    try {
        requireDb();
        const contactsRef = collection(db, 'contacts');
        await addDoc(contactsRef, {
            ...formData,
            status: 'unread',
            createdAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Contact form error:', error);
        return { success: false, error: error.message };
    }
}

// Get recent contact transmissions (admin only per Firestore rules)
async function getRecentContacts(limitCount = 8) {
    try {
        requireDb();
        const q = query(
            collection(db, 'contacts'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        const items = [];
        querySnapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...docSnap.data() });
        });
        return items;
    } catch (error) {
        console.error('Failed to load contacts:', error);
        return [];
    }
}

// ==================== STATISTICS ====================

// Get global statistics
async function getGlobalStats() {
    const fallback = {
        totalApps: 0,
        totalGames: 0,
        totalTools: 0,
        totalDownloads: 0,
        totalUsers: 0
    };
    try {
        requireDb();
        const statsRef = doc(db, 'stats', 'global');
        const statsSnap = await getDoc(statsRef);

        if (statsSnap.exists()) {
            return { ...fallback, ...statsSnap.data() };
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
    return fallback;
}

// Update global statistics (creates the doc if missing)
async function updateGlobalStats() {
    requireDb();
    const statsRef = doc(db, 'stats', 'global');

    const [appsSnapshot, gamesSnapshot, toolsSnapshot] = await Promise.all([
        getDocs(collection(db, 'apps')),
        getDocs(collection(db, 'games')),
        getDocs(collection(db, 'tools'))
    ]);

    let totalDownloads = 0;
    [appsSnapshot, gamesSnapshot, toolsSnapshot].forEach((snap) => {
        snap.forEach((docSnap) => {
            totalDownloads += Number(docSnap.data().downloads) || 0;
        });
    });

    const existing = await getDoc(statsRef);
    const preserved = existing.exists() ? existing.data() : {};

    await setDoc(statsRef, {
        totalApps: appsSnapshot.size,
        totalGames: gamesSnapshot.size,
        totalTools: toolsSnapshot.size,
        totalDownloads,
        totalUsers: preserved.totalUsers || 0,
        totalReviews: preserved.totalReviews || 0,
        updatedAt: serverTimestamp()
    }, { merge: true });
}

// ==================== FILE UPLOAD ====================

// Upload file to Firebase Storage
async function uploadFile(file, path) {
    try {
        if (!storage) throw new Error('Storage not initialized.');
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return { success: true, url: downloadURL };
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
    }
}

// Delete file from Firebase Storage
async function deleteFile(path) {
    try {
        if (!storage) throw new Error('Storage not initialized.');
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
        return { success: true };
    } catch (error) {
        console.error('Delete error:', error);
        return { success: false, error: error.message };
    }
}

// ==================== NAVIGATION ====================

// Navigate to page
function navigateTo(page) {
    window.location.href = page;
}

// Get URL parameter
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// ==================== UI HELPERS ====================

// Show loading state
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="flex items-center justify-center p-xl">
                <div class="text-primary-container font-label-md uppercase tracking-widest">
                    <span class="animate-pulse">LOADING...</span>
                </div>
            </div>
        `;
    }
}

// Show error message
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="bg-error-container/20 border-2 border-error p-lg text-error">
                <span class="material-symbols-outlined mr-sm">warning</span>
                ${escapeHtml(message)}
            </div>
        `;
    }
}

// Show success message
function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="bg-primary-container/20 border-2 border-primary-container p-lg text-primary-container">
                <span class="material-symbols-outlined mr-sm">check_circle</span>
                ${escapeHtml(message)}
            </div>
        `;
    }
}

// Create item card HTML
function createItemCard(item, type) {
    const safeId = escapeHtml(item.id);
    const safeType = escapeHtml(type);
    const safeName = escapeHtml(item.name || 'Untitled');
    const safeVersion = escapeHtml(item.version || '1.0');
    const safeSize = escapeHtml(item.size || '0MB');
    const safeModType = escapeHtml(item.modType || 'MOD');
    const safeIcon = escapeHtml(item.icon || PLACEHOLDER_ICON);
    const rating = item.rating ? Number(item.rating).toFixed(1) : 'N/A';
    const downloads = item.downloads ? formatNumber(item.downloads) : '0';
    const tags = Array.isArray(item.tags)
        ? item.tags.map(tag => `<span class="border border-outline-variant px-2 py-1 font-label-sm text-xs text-on-surface-variant uppercase">${escapeHtml(tag)}</span>`).join('')
        : '';

    return `
        <article class="bg-[#111111] border-2 border-[#1F1F1F] p-lg flex flex-col gap-md transition-all duration-300 mod-shadow hover:border-primary-container relative overflow-hidden group cursor-pointer" onclick="VANMOD.viewItem('${safeId}', '${safeType}')">
            <div class="flex justify-between items-start">
                <div class="w-16 h-16 bg-surface-container-highest border border-outline-variant flex items-center justify-center filter-grayscale overflow-hidden">
                    <img class="w-full h-full object-cover" loading="lazy" src="${safeIcon}" alt="${safeName}" onerror="this.onerror=null;this.src='${PLACEHOLDER_ICON}'">
                </div>
                <span class="bg-primary-container text-[#080808] font-label-sm px-2 py-1 uppercase tracking-wider font-bold">${safeModType}</span>
            </div>
            <div class="border-t-2 border-outline-variant/50 pt-md mt-sm flex-1">
                <h2 class="font-headline-sm text-headline-sm text-primary mb-1 truncate">${safeName}</h2>
                <div class="flex items-center gap-2 font-label-sm text-on-surface-variant uppercase mb-4">
                    <span class="material-symbols-outlined text-[16px] text-surface-tint" style="font-variation-settings: 'FILL' 1;">star</span>
                    <span>${escapeHtml(rating)}</span>
                    <span>//</span>
                    <span>v${safeVersion}</span>
                    <span>//</span>
                    <span>${safeSize}</span>
                </div>
                <div class="font-label-sm text-on-surface-variant uppercase">DL: ${escapeHtml(downloads)}</div>
            </div>
            <div class="flex gap-2 flex-wrap">
                ${tags}
            </div>
        </article>
    `;
}

// View item detail
function viewItem(id, type) {
    window.location.href = `detailapp.html?id=${encodeURIComponent(id)}&type=${encodeURIComponent(type || 'apps')}`;
}

// Back-compat for any inline onclick="viewItem(...)" handlers
window.viewItem = viewItem;

// ==================== INITIALIZATION ====================

// Initialize page
function initPage() {
    // Check if user is on admin pages
    const path = window.location.pathname || '';
    const isAdminArea = path.includes('admin') || path.includes('dashbord') || path.includes('systemlog');
    if (isAdminArea) {
        checkAuthState((user) => {
            if (!user && !path.includes('adminlogin')) {
                window.location.href = 'adminlogin.html';
            }
        });
    }
}

// Run initialization
document.addEventListener('DOMContentLoaded', initPage);

// Export functions for global use
window.VANMOD = {
    ready: firebaseReady,

    // Managers
    appsManager,
    gamesManager,
    toolsManager,
    getManager,

    // Auth
    adminLogin,
    adminLogout,
    checkAuthState,

    // Contact
    submitContactForm,
    getRecentContacts,

    // Stats
    getGlobalStats,
    updateGlobalStats,

    // File
    uploadFile,
    deleteFile,

    // Navigation
    navigateTo,
    getUrlParam,

    // UI
    showLoading,
    showError,
    showSuccess,
    createItemCard,
    viewItem,

    // Utils
    formatNumber,
    timeAgo,
    toDate,
    escapeHtml,
    generateId,
    PLACEHOLDER_ICON
};
