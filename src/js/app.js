// Main Application JavaScript
// VAN//MOD - High-End Brutalist Ecosystem

// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit, 
    startAfter,
    onSnapshot,
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

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyB1ccnYtBwYYELE_JYr3AlSVzYf3KRxPU0",
    authDomain: "vanmod-website.firebaseapp.com",
    projectId: "vanmod-website",
    storageBucket: "vanmod-website.firebasestorage.app",
    messagingSenderId: "706013336903",
    appId: "1:706013336903:web:70053ec43cf8a8c03c6862",
    measurementId: "G-LWKVY3WQK2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ==================== UTILITY FUNCTIONS ====================

// Format number with K/M suffix
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Format date to relative time
function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
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
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ==================== DATABASE OPERATIONS ====================

// Apps/Games/Tools CRUD Operations
class ItemManager {
    constructor(collectionName) {
        this.collectionName = collectionName;
        this.collectionRef = collection(db, collectionName);
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
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    }
    
    // Get all items with optional filters
    async getAll(filters = {}, pageSize = 20, lastDoc = null) {
        let q = query(this.collectionRef, orderBy('createdAt', 'desc'), limit(pageSize));
        
        if (filters.category) {
            q = query(q, where('category', '==', filters.category));
        }
        if (filters.tag) {
            q = query(q, where('tags', 'array-contains', filters.tag));
        }
        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }
        
        const querySnapshot = await getDocs(q);
        const items = [];
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        
        return items;
    }
    
    // Update item
    async update(id, data) {
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    }
    
    // Delete item
    async delete(id) {
        const docRef = doc(db, this.collectionName, id);
        await deleteDoc(docRef);
    }
    
    // Increment download count
    async incrementDownloads(id) {
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, {
            downloads: increment(1)
        });
    }
    
    // Add review
    async addReview(id, review) {
        const item = await this.getById(id);
        const reviews = item.reviews || [];
        reviews.push({
            id: generateId(),
            ...review,
            createdAt: serverTimestamp()
        });
        
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        
        await this.update(id, {
            reviews,
            rating: avgRating
        });
    }
    
    // Search items
    async search(searchTerm) {
        const q = query(
            this.collectionRef,
            where('name', '>=', searchTerm),
            where('name', '<=', searchTerm + '\uf8ff'),
            orderBy('name'),
            limit(20)
        );
        
        const querySnapshot = await getDocs(q);
        const items = [];
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        
        return items;
    }
}

// Initialize managers
const appsManager = new ItemManager('apps');
const gamesManager = new ItemManager('games');
const toolsManager = new ItemManager('tools');

// ==================== AUTHENTICATION ====================

// Admin Login
async function adminLogin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// Admin Logout
async function adminLogout() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
}

// Check Auth State
function checkAuthState(callback) {
    onAuthStateChanged(auth, (user) => {
        callback(user);
    });
}

// ==================== CONTACT FORM ====================

// Submit contact form
async function submitContactForm(formData) {
    try {
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

// ==================== STATISTICS ====================

// Get global statistics
async function getGlobalStats() {
    const statsRef = doc(db, 'stats', 'global');
    const statsSnap = await getDoc(statsRef);
    
    if (statsSnap.exists()) {
        return statsSnap.data();
    }
    return {
        totalApps: 0,
        totalGames: 0,
        totalTools: 0,
        totalDownloads: 0,
        totalUsers: 0
    };
}

// Update global statistics
async function updateGlobalStats() {
    const statsRef = doc(db, 'stats', 'global');
    
    const appsSnapshot = await getDocs(collection(db, 'apps'));
    const gamesSnapshot = await getDocs(collection(db, 'games'));
    const toolsSnapshot = await getDocs(collection(db, 'tools'));
    
    await updateDoc(statsRef, {
        totalApps: appsSnapshot.size,
        totalGames: gamesSnapshot.size,
        totalTools: toolsSnapshot.size,
        updatedAt: serverTimestamp()
    });
}

// ==================== FILE UPLOAD ====================

// Upload file to Firebase Storage
async function uploadFile(file, path) {
    try {
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
                ${message}
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
                ${message}
            </div>
        `;
    }
}

// Create item card HTML
function createItemCard(item, type) {
    const rating = item.rating ? item.rating.toFixed(1) : 'N/A';
    const downloads = item.downloads ? formatNumber(item.downloads) : '0';
    
    return `
        <article class="bg-[#111111] border-2 border-[#1F1F1F] p-lg flex flex-col gap-md transition-all duration-300 mod-shadow hover:border-primary-container relative overflow-hidden group cursor-pointer" onclick="viewItem('${item.id}', '${type}')">
            <div class="flex justify-between items-start">
                <div class="w-16 h-16 bg-surface-container-highest border border-outline-variant flex items-center justify-center filter-grayscale overflow-hidden">
                    <img class="w-full h-full object-cover" src="${item.icon || 'https://via.placeholder.com/64'}" alt="${item.name}">
                </div>
                <span class="bg-primary-container text-[#080808] font-label-sm px-2 py-1 uppercase tracking-wider font-bold">${item.modType || 'MOD'}</span>
            </div>
            <div class="border-t-2 border-outline-variant/50 pt-md mt-sm flex-1">
                <h2 class="font-headline-sm text-headline-sm text-primary mb-1 truncate">${item.name}</h2>
                <div class="flex items-center gap-2 font-label-sm text-on-surface-variant uppercase mb-4">
                    <span class="material-symbols-outlined text-[16px] text-surface-tint" style="font-variation-settings: 'FILL' 1;">star</span>
                    <span>${rating}</span>
                    <span>//</span>
                    <span>v${item.version || '1.0'}</span>
                    <span>//</span>
                    <span>${item.size || '0MB'}</span>
                </div>
            </div>
            <div class="flex gap-2">
                ${item.tags ? item.tags.map(tag => `<span class="border border-outline-variant px-2 py-1 font-label-sm text-xs text-on-surface-variant uppercase">${tag}</span>`).join('') : ''}
            </div>
        </article>
    `;
}

// View item detail
function viewItem(id, type) {
    window.location.href = `detailapp.html?id=${id}&type=${type}`;
}

// ==================== INITIALIZATION ====================

// Initialize page
function initPage() {
    // Check if user is on admin pages
    if (window.location.pathname.includes('admin') || window.location.pathname.includes('dashbord')) {
        checkAuthState((user) => {
            if (!user && !window.location.pathname.includes('adminlogin')) {
                window.location.href = 'adminlogin.html';
            }
        });
    }
}

// Run initialization
document.addEventListener('DOMContentLoaded', initPage);

// Export functions for global use
window.VANMOD = {
    // Managers
    appsManager,
    gamesManager,
    toolsManager,
    
    // Auth
    adminLogin,
    adminLogout,
    checkAuthState,
    
    // Contact
    submitContactForm,
    
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
    generateId
};
