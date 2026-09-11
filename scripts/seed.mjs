#!/usr/bin/env node
/**
 * VAN//MOD - Firestore Seed Script
 * ---------------------------------
 * Uploads sample apps / games / tools + global stats to Firestore
 * using an admin email+password (no service-account key needed).
 *
 *   1. npm install
 *   2. node scripts/seed.mjs --email admin@vanmod.com --password <rahasia>
 *
 * Options:
 *   --email <addr>        Admin email (or env SEED_EMAIL)
 *   --password <pass>     Admin password (or env SEED_PASSWORD)
 *   --force               Seed even if collections already contain docs
 *   --help                Show this help
 *
 * The script aborts if apps/games/tools already have documents,
 * unless --force is passed.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    limit,
    doc,
    setDoc,
    serverTimestamp
} from 'firebase/firestore';
import { firebaseConfig } from '../config/firebaseConfig.js';

// ---------------- args ----------------
function parseArgs() {
    const args = { force: false, help: false };
    const argv = process.argv.slice(2);
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--email') args.email = argv[++i];
        else if (a === '--password') args.password = argv[++i];
        else if (a === '--force') args.force = true;
        else if (a === '--help' || a === '-h') args.help = true;
    }
    args.email = args.email || process.env.SEED_EMAIL || '';
    args.password = args.password || process.env.SEED_PASSWORD || '';
    return args;
}

function usage() {
    console.log(`
VAN//MOD seed script

Usage:
  node scripts/seed.mjs --email <admin-email> --password <admin-password> [--force]

Environment alternative:
  SEED_EMAIL=admin@vanmod.com SEED_PASSWORD=secret npm run seed
`);
}

// ---------------- helpers ----------------
function svgIcon(bg, initials) {
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">` +
        `<rect width="256" height="256" fill="${bg}"/>` +
        `<rect x="10" y="10" width="236" height="236" fill="none" stroke="#0b1005" stroke-width="6"/>` +
        `<text x="128" y="156" font-family="Arial,sans-serif" font-size="92" font-weight="bold" fill="#b2f800" text-anchor="middle">${initials}</text>` +
        `</svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

const shots = (slug) => [
    `https://picsum.photos/seed/${slug}-1/640/360`,
    `https://picsum.photos/seed/${slug}-2/640/360`
];

const H = 3600 * 1000;
const NOW = Date.now();
const ago = (hours) => new Date(NOW - hours * H);

function avg(reviews) {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
}

// ---------------- sample data (matches the app schema: name/icon/androidVersion/tags) ----------------
const SEED = [
    // ================= APPS =================
    {
        collection: 'apps',
        name: 'Spotify Premium Plus',
        description: 'Listen to unlimited music with no ads, offline mode, and premium features unlocked. High-quality audio streaming up to 320kbps.',
        version: '8.8.8', size: '124MB', category: 'Music', modType: 'MOD',
        developer: 'Spotify AB (Mod)', packageName: 'com.spotify.music',
        androidVersion: '5.0+', license: 'Freeware',
        downloadUrl: 'https://example.com/downloads/spotify-premium-plus.apk',
        tags: ['premium', 'no-ads', 'offline'], icon: svgIcon('#1DB954', 'SP'),
        screenshots: shots('spotify-mod'), downloads: 45230,
        reviews: [
            { id: 'r-sp-1', userName: 'Andini', rating: 5, comment: 'Works flawlessly, no ads at all!', createdAt: ago(30) },
            { id: 'r-sp-2', userName: 'Bima', rating: 5, comment: 'Offline download works great.', createdAt: ago(70) }
        ],
        createdAt: ago(96), updatedAt: ago(30)
    },
    {
        collection: 'apps',
        name: 'InstaMod Pro',
        description: 'Enhanced Instagram with download capabilities, ghost mode, and premium features. Save stories, posts, and reels easily.',
        version: '275.0.0.24', size: '68MB', category: 'Social', modType: 'PREMIUM',
        developer: 'Meta (Mod)', packageName: 'com.instagram.android',
        androidVersion: '6.0+', license: 'Freeware',
        downloadUrl: 'https://example.com/downloads/instamod-pro.apk',
        tags: ['premium', 'downloader', 'ghost-mode'], icon: svgIcon('#E1306C', 'IG'),
        screenshots: shots('instamod'), downloads: 89450,
        reviews: [
            { id: 'r-ig-1', userName: 'Citra', rating: 5, comment: 'Story downloader is a lifesaver.', createdAt: ago(50) },
            { id: 'r-ig-2', userName: 'Dimas', rating: 4, comment: 'Great mod, ghost mode works.', createdAt: ago(120) }
        ],
        createdAt: ago(140), updatedAt: ago(50)
    },
    {
        collection: 'apps',
        name: 'CapCut Pro Mod',
        description: 'All pro features unlocked, export without watermark, and access to the premium effects library.',
        version: '11.2.0', size: '89MB', category: 'Video', modType: 'PRO',
        developer: 'ByteDance (Mod)', packageName: 'com.lemon.lv',
        androidVersion: '5.0+', license: 'Freeware',
        downloadUrl: 'https://example.com/downloads/capcut-pro-mod.apk',
        tags: ['pro', 'no-watermark', 'editor'], icon: svgIcon('#111111', 'CC'),
        screenshots: shots('capcut-mod'), downloads: 67210,
        reviews: [
            { id: 'r-cc-1', userName: 'Eka', rating: 5, comment: 'No watermark exports, perfect!', createdAt: ago(20) }
        ],
        createdAt: ago(60), updatedAt: ago(20)
    },
    {
        collection: 'apps',
        name: 'PicsArt Gold',
        description: 'Gold membership unlocked with all premium stickers, filters, and AI tools. Create stunning edits in seconds.',
        version: '24.5.1', size: '72MB', category: 'Photo', modType: 'GOLD',
        developer: 'PicsArt (Mod)', packageName: 'com.picsart.studio',
        androidVersion: '5.1+', license: 'Freeware',
        downloadUrl: 'https://example.com/downloads/picsart-gold.apk',
        tags: ['gold', 'unlocked', 'editor'], icon: svgIcon('#FFB300', 'PA'),
        screenshots: shots('picsart-gold'), downloads: 34880,
        reviews: [
            { id: 'r-pa-1', userName: 'Farhan', rating: 5, comment: 'All gold filters unlocked.', createdAt: ago(90) },
            { id: 'r-pa-2', userName: 'Gita', rating: 4, comment: 'Good, minor UI lag sometimes.', createdAt: ago(150) }
        ],
        createdAt: ago(200), updatedAt: ago(90)
    },
    {
        collection: 'apps',
        name: 'MX Player Pro',
        description: 'Pro codec pack unlocked with hardware acceleration, background play, and zero ads.',
        version: '1.75.2', size: '45MB', category: 'Media', modType: 'PRO',
        developer: 'MX Media (Mod)', packageName: 'com.mxtech.videoplayer.pro',
        androidVersion: '5.0+', license: 'Freeware',
        downloadUrl: 'https://example.com/downloads/mx-player-pro.apk',
        tags: ['pro', 'no-ads', 'codec'], icon: svgIcon('#3D5AFE', 'MX'),
        screenshots: shots('mxplayer-pro'), downloads: 52140,
        reviews: [
            { id: 'r-mx-1', userName: 'Hendra', rating: 5, comment: 'Best video player, no ads now.', createdAt: ago(110) }
        ],
        createdAt: ago(260), updatedAt: ago(110)
    },
    {
        collection: 'apps',
        name: 'Nova Launcher Prime',
        description: 'Prime features unlocked with Tesla Unread included. The most customizable launcher on Android.',
        version: '8.0.14', size: '18MB', category: 'Utility', modType: 'PRIME',
        developer: 'TeslaCoil (Mod)', packageName: 'com.teslacoilsw.launcher',
        androidVersion: '5.0+', license: 'Freeware',
        downloadUrl: 'https://example.com/downloads/nova-launcher-prime.apk',
        tags: ['prime', 'unlocked', 'launcher'], icon: svgIcon('#FF5722', 'NV'),
        screenshots: shots('nova-prime'), downloads: 28760,
        reviews: [
            { id: 'r-nv-1', userName: 'Irma', rating: 5, comment: 'Gestures + prime, love it.', createdAt: ago(160) }
        ],
        createdAt: ago(320), updatedAt: ago(160)
    },
    // ================= GAMES =================
    {
        collection: 'games',
        name: 'PUBG Mobile MOD',
        description: 'Battle Royale with unlimited UC, all skins unlocked, and anti-ban protection. 100 players drop on one island.',
        version: '2.9.0', size: '896MB', category: 'Action', modType: 'MOD',
        developer: 'Tencent Games (Mod)', packageName: 'com.tencent.ig',
        androidVersion: '5.1+', license: 'Freeware',
        downloadUrl: 'https://example.com/downloads/pubg-mobile-mod.apk',
        tags: ['unlimited-uc', 'skins', 'anti-ban'], icon: svgIcon('#F9A825', 'PG'),
        screenshots: shots('pubg-mod'), downloads: 234560,
        reviews: [
            { id: 'r-pg-1', userName: 'Joko', rating: 5, comment: 'UC shop works, account still safe.', createdAt: ago(40) },
            { id: 'r-pg-2', userName: 'Kirana', rating: 4, comment: 'Great skins, use a guest account to be safe.', createdAt: ago(100) }
        ],
        createdAt: ago(120), updatedAt: ago(40)
    },
    {
        collection: 'games',
        name: 'Minecraft PE Premium',
        description: 'Sandbox game with premium unlocked, unlimited resources, and all skins. Build anything you imagine.',
        version: '1.20.50', size: '145MB', category: 'Adventure', modType: 'PREMIUM',
        developer: 'Mojang (Mod)', packageName: 'com.mojang.minecraftpe',
        androidVersion: '5.0+', license: 'Freeware',
        downloadUrl: 'https://example.com/downloads/minecraft-pe-premium.apk',
        tags: ['premium', 'unlocked', 'sandbox'], icon: svgIcon('#4CAF50', 'MC'),
        screenshots: shots('minecraft-pe'), downloads: 456780,
        reviews: [
            { id: 'r-mc-1', userName: 'Lukman', rating: 5, comment: 'Multiplayer with friends works!', createdAt: ago(10) },
            { id: 'r-mc-2', userName: 'Maya', rating: 5, comment: 'Full version unlocked, amazing.', createdAt: ago(55) }
        ],
        createdAt: ago(80), updatedAt: ago(10)
    },
    {
        collection: 'games',
        name: 'Cyber Strike Mod',
        description: 'Custom mod menu with unlimited credits, all weapons unlocked, and anti-ban secure core.',
        version: '2.4.1', size: '1.2GB', category: 'Action', modType: 'MOD MENU',
        developer: 'NeonWorks (Mod)', packageName: 'com.neonworks.cyberstrike',
        androidVersion: '7.0+', license: 'Freeware',
        downloadUrl: 'https://example.com/downloads/cyber-strike-mod.apk',
        tags: ['mod-menu', 'unlimited', 'anti-ban'], icon: svgIcon('#00E5FF', 'CS'),
        screenshots: shots('cyber-strike'), downloads: 98740,
        reviews: [
            { id: 'r-cs-1', userName: 'Nadia', rating: 5, comment: 'Mod menu is clean and stable.', createdAt: ago(75) }
        ],
        createdAt: ago(180), updatedAt: ago(75)
    },
    {
        collection: 'games',
        name: 'Velocity Drift Mod',
        description: 'All cars unlocked with infinite nitro. Arcade drift racing with brutalist neon tracks.',
        version: '3.0.2', size: '2.1GB', category: 'Racing', modType: 'MOD',
        developer: 'Apex Studio (Mod)', packageName: 'com.apex.velocitydrift',
        androidVersion: '7.0+', license: 'Freeware',
        downloadUrl: 'https://example.com/downloads/velocity-drift-mod.apk',
        tags: ['unlocked', 'nitro', 'racing'], icon: svgIcon('#D500F9', 'VD'),
        screenshots: shots('velocity-drift'), downloads: 76520,
        reviews: [
            { id: 'r-vd-1', userName: 'Oscar', rating: 4, comment: 'Fun and fast, big download though.', createdAt: ago(130) }
        ],
        createdAt: ago(240), updatedAt: ago(130)
    },
    // ================= TOOLS =================
    {
        collection: 'tools',
        name: 'Lucky Patcher Pro',
        description: 'Patch Android apps, remove ads, modify permissions, and bypass license verification.',
        version: '10.5.8', size: '12MB', category: 'Utility', modType: 'PRO',
        developer: 'ChelpuS', packageName: 'com.chelpus.luckypatcher',
        androidVersion: '4.0+', license: 'Freeware',
        downloadUrl: 'https://example.com/downloads/lucky-patcher-pro.apk',
        tags: ['patcher', 'no-ads', 'root'], icon: svgIcon('#FFEB3B', 'LP'),
        screenshots: shots('lucky-patcher'), downloads: 678920,
        reviews: [
            { id: 'r-lp-1', userName: 'Putri', rating: 5, comment: 'Essential tool, works on Android 13.', createdAt: ago(15) },
            { id: 'r-lp-2', userName: 'Rian', rating: 4, comment: 'Powerful but read the guide first.', createdAt: ago(65) }
        ],
        createdAt: ago(90), updatedAt: ago(15)
    },
    {
        collection: 'tools',
        name: 'APK Editor Pro',
        description: 'Edit APK files directly on your device. Change app name, icon, permissions, and resources.',
        version: '2.1.8', size: '18MB', category: 'Utility', modType: 'PRO',
        developer: 'SteelWorks', packageName: 'com.gmail.heagoo.apkeditor.pro',
        androidVersion: '4.4+', license: 'Freeware',
        downloadUrl: 'https://example.com/downloads/apk-editor-pro.apk',
        tags: ['apk', 'editor', 'developer'], icon: svgIcon('#607D8B', 'AE'),
        screenshots: shots('apk-editor'), downloads: 345120,
        reviews: [
            { id: 'r-ae-1', userName: 'Sinta', rating: 5, comment: 'Rebuilt my modded APK easily.', createdAt: ago(85) }
        ],
        createdAt: ago(170), updatedAt: ago(85)
    },
    {
        collection: 'tools',
        name: 'System Injector',
        description: 'Advanced kernel-level memory utility with 0.2ms latency and 99.9% success rate.',
        version: '2.1.0', size: '8MB', category: 'System', modType: 'TOOL',
        developer: 'VAN//MOD Labs', packageName: 'com.vanmod.sysinjector',
        androidVersion: '8.0+', license: 'Freeware',
        downloadUrl: 'https://example.com/downloads/system-injector.apk',
        tags: ['system', 'root', 'memory'], icon: svgIcon('#00C853', 'SI'),
        screenshots: shots('sys-injector'), downloads: 45630,
        reviews: [
            { id: 'r-si-1', userName: 'Tono', rating: 4, comment: 'Fast, but needs root as expected.', createdAt: ago(140) }
        ],
        createdAt: ago(280), updatedAt: ago(140)
    },
    {
        collection: 'tools',
        name: 'Log Cleaner',
        description: 'Deep system scrubbing utility. Removes temp files, crash dumps, and telemetry leftovers.',
        version: '0.9.8', size: '5MB', category: 'Cleaner', modType: 'TOOL',
        developer: 'VAN//MOD Labs', packageName: 'com.vanmod.logcleaner',
        androidVersion: '5.0+', license: 'Freeware',
        downloadUrl: 'https://example.com/downloads/log-cleaner.apk',
        tags: ['cleaner', 'privacy', 'system'], icon: svgIcon('#9E9E9E', 'LC'),
        screenshots: shots('log-cleaner'), downloads: 21340,
        reviews: [
            { id: 'r-lc-1', userName: 'Wulan', rating: 4, comment: 'Freed 2GB on first run!', createdAt: ago(190) }
        ],
        createdAt: ago(350), updatedAt: ago(190)
    }
];

// ---------------- main ----------------
async function main() {
    const args = parseArgs();
    if (args.help) {
        usage();
        process.exit(0);
    }
    if (!args.email || !args.password) {
        console.error('❌ Admin email & password required.\n');
        usage();
        process.exit(1);
    }

    console.log('🔥 VAN//MOD seeder');
    console.log(`📦 Project: ${firebaseConfig.projectId}`);

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log(`🔑 Signing in as ${args.email} ...`);
    try {
        await signInWithEmailAndPassword(auth, args.email, args.password);
    } catch (err) {
        console.error('❌ Login failed:', err.message);
        console.error('   Make sure the admin user exists in Firebase Authentication.');
        process.exit(1);
    }
    console.log('✅ Authenticated');

    // Safety: abort when collections already have docs (unless --force)
    if (!args.force) {
        for (const col of ['apps', 'games', 'tools']) {
            const snap = await getDocs(query(collection(db, col), limit(1)));
            if (!snap.empty) {
                console.error(`❌ Collection "${col}" already has documents. Aborting.`);
                console.error('   Re-run with --force to seed anyway (adds new documents).');
                await signOut(auth);
                process.exit(1);
            }
        }
    }

    let totalDownloads = 0;
    let totalReviews = 0;
    const counts = { apps: 0, games: 0, tools: 0 };

    for (const item of SEED) {
        const { collection: col, ...data } = item;
        const reviews = data.reviews || [];
        totalReviews += reviews.length;
        totalDownloads += data.downloads || 0;
        counts[col]++;

        await addDoc(collection(db, col), {
            ...data,
            rating: avg(reviews)
        });
        console.log(`✅ [${col}] ${data.name}`);
    }

    // Global stats
    await setDoc(doc(db, 'stats', 'global'), {
        totalApps: counts.apps,
        totalGames: counts.games,
        totalTools: counts.tools,
        totalDownloads,
        totalReviews,
        totalUsers: 0,
        updatedAt: serverTimestamp()
    }, { merge: true });
    console.log('✅ [stats/global] updated');

    console.log(`\n🎉 Done! Seeded ${SEED.length} documents (${counts.apps} apps, ${counts.games} games, ${counts.tools} tools).`);

    await signOut(auth);
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
