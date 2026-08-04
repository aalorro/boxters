// Hex math utilities for pointy-top hexagonal grids using axial coordinates (q, r)

const SQRT3 = Math.sqrt(3);

// Six neighbor directions for pointy-top hex
const DIRECTIONS = [
    { q: 1, r: 0 },   // E
    { q: 1, r: -1 },  // NE
    { q: 0, r: -1 },  // NW
    { q: -1, r: 0 },  // W
    { q: -1, r: 1 },  // SW
    { q: 0, r: 1 }    // SE
];

export function axialToPixel(q, r, size) {
    const x = size * (SQRT3 * q + SQRT3 / 2 * r);
    const y = size * (3 / 2 * r);
    return { x, y };
}

export function pixelToAxial(x, y, size) {
    const q = (SQRT3 / 3 * x - 1 / 3 * y) / size;
    const r = (2 / 3 * y) / size;
    return axialRound(q, r);
}

export function axialRound(q, r) {
    // Convert to cube, round, convert back
    const s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);

    const dq = Math.abs(rq - q);
    const dr = Math.abs(rr - r);
    const ds = Math.abs(rs - s);

    if (dq > dr && dq > ds) {
        rq = -rr - rs;
    } else if (dr > ds) {
        rr = -rq - rs;
    }
    return { q: rq, r: rr };
}

export function getNeighbors(q, r) {
    return DIRECTIONS.map(d => ({ q: q + d.q, r: r + d.r }));
}

export function areAdjacent(a, b) {
    const dq = b.q - a.q;
    const dr = b.r - a.r;
    return DIRECTIONS.some(d => d.q === dq && d.r === dr);
}

export function hexDistance(a, b) {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function hexKey(q, r) {
    return `${q},${r}`;
}

export function parseHexKey(key) {
    const [q, r] = key.split(',').map(Number);
    return { q, r };
}

// Generate a hex ring at a given radius from center
export function hexRing(center, radius) {
    if (radius === 0) return [{ q: center.q, r: center.r }];
    const results = [];
    let hex = { q: center.q - radius, r: center.r + radius }; // start at SW corner
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < radius; j++) {
            results.push({ q: hex.q, r: hex.r });
            hex = { q: hex.q + DIRECTIONS[i].q, r: hex.r + DIRECTIONS[i].r };
        }
    }
    return results;
}

// Generate a hex spiral (filled hex shape) of given radius
export function hexSpiral(center, radius) {
    const results = [];
    for (let r = 0; r <= radius; r++) {
        results.push(...hexRing(center, r));
    }
    return results;
}

// Get the 6 corner points of a hex for rendering
export function hexCorners(cx, cy, size) {
    const corners = [];
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 180 * (60 * i - 30); // pointy-top offset
        corners.push({
            x: cx + size * Math.cos(angle),
            y: cy + size * Math.sin(angle)
        });
    }
    return corners;
}
