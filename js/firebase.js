// ── Firebase Firestore Leaderboard ────────────────────────────
// Uses Firebase Compat SDK loaded via <script> tags in index.html

const PLAYER_ID_KEY = 'boxters_player_id';
const LEADERBOARD_CACHE_KEY = 'boxters_leaderboard_cache';
const LEADERBOARD_SIZE = 30;
const SUBMIT_COOLDOWN_MS = 5000;

let db = null;
let _lastSubmitTime = 0;

// ── Initialize Firebase ──────────────────────────────────────
export function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK not loaded');
        return false;
    }

    const firebaseConfig = {
        apiKey: "AIzaSyB954_RsNafx5p5yLnJi1LtfQq-bP4EBHM",
        authDomain: "boxters-72827.firebaseapp.com",
        projectId: "boxters-72827",
        storageBucket: "boxters-72827.firebasestorage.app",
        messagingSenderId: "1056804826029",
        appId: "1:1056804826029:web:56c252eaee4cb853690f24",
        measurementId: "G-RVH0EB9KLD"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    return true;
}

// ── Player ID Management ─────────────────────────────────────
export function getPlayerId() {
    let id = localStorage.getItem(PLAYER_ID_KEY);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(PLAYER_ID_KEY, id);
    }
    return id;
}

// ── Submit Score ─────────────────────────────────────────────
export async function submitScore(player) {
    if (!db) return;

    const now = Date.now();
    if (now - _lastSubmitTime < SUBMIT_COOLDOWN_MS) return;
    _lastSubmitTime = now;

    const playerId = getPlayerId();

    const modeOrder = ['simple', 'clear', 'chain', 'illuminate'];
    let highestMode = 'simple';
    if (player.unlockedModes) {
        for (const m of modeOrder) {
            if (player.unlockedModes.includes(m)) highestMode = m;
        }
    }

    const name = (player.name || 'Anonymous').substring(0, 20);
    const data = {
        name,
        nameLower: name.toLowerCase(),
        totalScore: Math.round(player.totalScore || 0),
        levelsCompleted: Math.round(player.levelsCompleted || 0),
        highestMode,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('leaderboard').doc(playerId).set(data, { merge: true });
    } catch (err) {
        console.warn('Leaderboard submit failed:', err.message);
    }
}

// ── Fetch Leaderboard ────────────────────────────────────────
export async function fetchLeaderboard() {
    if (!db) return _getCachedLeaderboard();

    try {
        const snapshot = await db.collection('leaderboard')
            .orderBy('totalScore', 'desc')
            .limit(LEADERBOARD_SIZE)
            .get();

        const entries = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            entries.push({
                id: doc.id,
                name: d.name,
                totalScore: d.totalScore,
                levelsCompleted: d.levelsCompleted,
                highestMode: d.highestMode
            });
        });

        _cacheLeaderboard(entries);
        return entries;
    } catch (err) {
        console.warn('Leaderboard fetch failed:', err.message);
        return _getCachedLeaderboard();
    }
}

// ── Check Name Availability ──────────────────────────────────
export async function checkNameAvailable(name) {
    if (!db) return { available: true };
    try {
        const lower = name.toLowerCase();
        // Check nameLower field first (new documents)
        let snapshot = await db.collection('leaderboard')
            .where('nameLower', '==', lower)
            .limit(1)
            .get();
        if (!snapshot.empty) return { available: false };
        // Fallback: check all documents for legacy entries without nameLower
        snapshot = await db.collection('leaderboard').get();
        const taken = snapshot.docs.some(doc => {
            const d = doc.data();
            return !d.nameLower && d.name && d.name.toLowerCase() === lower;
        });
        return { available: !taken };
    } catch (err) {
        console.warn('Name check failed:', err.message);
        return { available: true };
    }
}

// ── Find Player Rank ─────────────────────────────────────────
export function findPlayerRank(entries) {
    const playerId = getPlayerId();
    const idx = entries.findIndex(e => e.id === playerId);
    return idx >= 0 ? idx + 1 : -1;
}

// ── Cache Helpers ────────────────────────────────────────────
function _cacheLeaderboard(entries) {
    try {
        localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify({
            entries,
            cachedAt: Date.now()
        }));
    } catch { /* ignore quota errors */ }
}

function _getCachedLeaderboard() {
    try {
        const raw = localStorage.getItem(LEADERBOARD_CACHE_KEY);
        if (raw) {
            const cached = JSON.parse(raw);
            return cached.entries || [];
        }
    } catch { /* ignore */ }
    return [];
}
