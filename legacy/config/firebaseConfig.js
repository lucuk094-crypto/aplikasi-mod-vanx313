// Firebase Configuration
// Single source of truth — imported by src/js/app.js
// Replace with your Firebase project credentials
const firebaseConfig = {
    apiKey: "AIzaSyB1ccnYtBwYYELE_JYr3AlSVzYf3KRxPU0",
    authDomain: "vanmod-website.firebaseapp.com",
    projectId: "vanmod-website",
    storageBucket: "vanmod-website.firebasestorage.app",
    messagingSenderId: "706013336903",
    appId: "1:706013336903:web:70053ec43cf8a8c03c6862",
    measurementId: "G-LWKVY3WQK2"
};

// ESM export (used by the site)
export { firebaseConfig };
export default firebaseConfig;

// Legacy CommonJS fallback (harmless in browsers)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
    module.exports.firebaseConfig = firebaseConfig;
    module.exports.default = firebaseConfig;
}
