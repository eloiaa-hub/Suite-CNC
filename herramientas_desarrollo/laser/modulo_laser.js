// ════════════════════════════════════════════════════════════════════
//  🔥 MODO LÁSER (laser.html = este mismo archivo con data-laser="1")
//  El dibujo del Calcador, o un programa G-code, pasa a un archivo .rd
//  para la cortadora láser (controladora Ruida: Atheon de Nomatech).
//  En el Calcador, el Corrector y el Tutor este bloque no hace nada.
// ════════════════════════════════════════════════════════════════════
(function () {
'use strict';
if (document.documentElement.dataset.laser !== '1') return;

// ───────── Motor RD (formato Ruida). Es el mismo del Generador RD ─────────
const RDCore = (function () {
    function swzB(b, m) { b ^= (b >> 7) & 0xFF; b ^= (b << 7) & 0xFF; b ^= (b >> 7) & 0xFF; b ^= m; return (b + 1) & 0xFF; }
    function uswzB(b, m) { b = (b - 1) & 0xFF; b ^= m; b ^= (b >> 7) & 0xFF; b ^= (b << 7) & 0xFF; b ^= (b >> 7) & 0xFF; return b; }
    function mapBytes(data, m, f) { const o = new Uint8Array(data.length); if (m < 0) { o.set(data); return o; } const L = new Uint8Array(256); for (let i = 0; i < 256; i++) L[i] = f(i, m); for (let i = 0; i < data.length; i++) o[i] = L[data[i]]; return o; }
    const swizzle = (d, m) => mapBytes(d, m, swzB), unswizzle = (d, m) => mapBytes(d, m, uswzB);
    function valid(data, m) { return data.length > 1 && uswzB(data[0], m) >= 0x80 && uswzB(data[data.length - 1], m) === 0xD7; }
    function detectMagic(data) {
        const h = new Array(256).fill(0); let prev = -1;
        for (let i = 0; i < data.length; i++) { const d = data[i]; h[d] += prev === d ? 5 : 1; prev = d; }
        let best = 0, mg = 0; for (let i = 0; i < 256; i++) if (h[i] > best) { best = h[i]; mg = (i - 1) & 0xFF; }
        if (valid(data, mg)) return mg;
        for (const m of [0x88, 0x11, 0x38]) if (valid(data, m)) return m;
        for (let i = 0; i < 256; i++) if (valid(data, i)) return i;
        return mg;
    }
    function e14(v) { v = Math.round(v); if (v < 0) v += 0x4000; return [(v >> 7) & 0x7F, v & 0x7F]; }
    const P35 = 34359738368;
    function e35(v) { v = Math.round(v); if (v < 0) v += P35; return [Math.floor(v / 268435456) & 0x7F, Math.floor(v / 2097152) & 0x7F, Math.floor(v / 16384) & 0x7F, Math.floor(v / 128) & 0x7F, v % 128]; }
    const u35 = (a, i) => (a[i] & 0x7F) * 268435456 + (a[i + 1] & 0x7F) * 2097152 + (a[i + 2] & 0x7F) * 16384 + (a[i + 3] & 0x7F) * 128 + (a[i + 4] & 0x7F);
    const s35 = (a, i) => { const v = u35(a, i); return v > 17179869183 ? v - P35 : v; };
    const u14 = (a, i) => ((a[i] & 0x7F) << 7) | (a[i + 1] & 0x7F);
    const s14 = (a, i) => { const v = u14(a, i); return v > 0x1FFF ? v - 0x4000 : v; };
    const ePow = p => e14(Math.floor(Math.max(0, Math.min(100, p)) * 16383 / 100 + 1e-7));   // Atheon trunca
    const eSpd = mms => e35(mms * 1000);
    const LASER2 = 30;   // láser 2: el valor por defecto de Atheon Design

    // job = { layers:[{ color, speed, pmin, pmax, air, paths:[[[xµm,yµm],…]] }] } en coordenadas de máquina (µm)
    // opt = { magic, start:'current'|'anchor'|'absolute', template:'atheon'|'meerk40t' }
    function build(job, opt) {
        const cmds = [];
        const C = (...a) => { const b = []; a.forEach(x => Array.isArray(x) ? b.push(...x) : b.push(x)); cmds.push(b); };
        const layers = job.layers.filter(L => L.paths.length);
        if (!layers.length) throw new Error('No hay nada que cortar');
        const bounds = paths => { const b = [Infinity, Infinity, -Infinity, -Infinity]; paths.forEach(p => p.forEach(q => { if (q[0] < b[0]) b[0] = q[0]; if (q[1] < b[1]) b[1] = q[1]; if (q[0] > b[2]) b[2] = q[0]; if (q[1] > b[3]) b[3] = q[1]; })); return b; };
        const G = bounds([].concat(...layers.map(L => L.paths)));
        if (opt.start === 'absolute') { C(0xD8, 0x10); C(0xE6, 0x01); } else if (opt.start === 'anchor') C(0xD8, 0x11); else C(0xD8, 0x12);
        if (opt.template === 'meerk40t') {
            // Variante de MeerK40t (con suma de control)
            C(0xF0); C(0xF1, 0x02, 0x00); C(0xD8, 0x00); C(0xE7, 0x06, e35(0), e35(0)); C(0xE7, 0x38, 0x00);
            C(0xE7, 0x03, e35(G[2]), e35(G[1])); C(0xE7, 0x07, e35(G[0]), e35(G[3])); C(0xE7, 0x50, e35(G[2]), e35(G[1])); C(0xE7, 0x51, e35(G[0]), e35(G[3]));
        } else {
            // Copia, orden por orden, de un .rd real de Atheon Design (Nomatech Atheon, RDC 0x88)
            C(0xE7, 0x32, 0x01, 0x50, 0x2C, 0x0E, 0x05, 0x01, 0x50, 0x2C, 0x0E, 0x05);
            C(0xD8, 0x00); C(0xE7, 0x06, e35(0), e35(0)); C(0xE7, 0x38, 0x00);
            C(0xE7, 0x03, e35(G[0]), e35(G[1])); C(0xE7, 0x07, e35(G[2]), e35(G[3])); C(0xE7, 0x50, e35(G[0]), e35(G[1])); C(0xE7, 0x51, e35(G[2]), e35(G[3]));
        }
        C(0xE7, 0x04, e14(1), e14(1), e14(0), e14(0), e14(0), e14(0), e14(0)); C(0xE7, 0x05, 0x00);
        const at = opt.template !== 'meerk40t';
        layers.forEach((L, p) => {
            const b = bounds(L.paths);
            C(0xC9, 0x04, p, eSpd(L.speed));
            C(0xC6, 0x31, p, ePow(L.pmin)); C(0xC6, 0x32, p, ePow(L.pmax));
            C(0xC6, 0x41, p, ePow(at ? LASER2 : L.pmin)); C(0xC6, 0x42, p, ePow(at ? LASER2 : L.pmax));
            C(0xCA, 0x06, p, e35(L.color || 0)); C(0xCA, 0x41, p, 0x00);
            C(0xE7, 0x52, p, e35(b[0]), e35(b[1])); C(0xE7, 0x53, p, e35(b[2]), e35(b[3]));
            C(0xE7, 0x61, p, e35(b[0]), e35(b[1])); C(0xE7, 0x62, p, e35(b[2]), e35(b[3]));
        });
        C(0xCA, 0x22, layers.length - 1);
        C(0xE7, 0x54, 0x00, e35(0)); C(0xE7, 0x54, 0x01, e35(0)); C(0xE7, 0x55, 0x00, e35(0)); C(0xE7, 0x55, 0x01, e35(0));
        if (!at) C(0xF1, 0x03, e35(0), e35(0));
        C(0xE7, 0x0A, e35(0)); C(0xEA, 0x00); C(0xE7, 0x60, 0x00); C(0xE7, 0x0B, 0x00);
        C(0xE7, 0x13, e35(G[0]), e35(G[1])); C(0xE7, 0x17, e35(G[2]), e35(G[3])); C(0xE7, 0x23, e35(0), e35(0)); C(0xE7, 0x24, 0x00);
        const w = G[2] - G[0], h = G[3] - G[1];
        if (at) { C(0xE7, 0x37, e35(w), e35(-h)); C(0xE7, 0x08, e14(1), e14(1), e35(w), e35(-h)); }
        else C(0xE7, 0x08, e14(1), e14(1), e14(0), e14(1123), e14(-3328), e14(4), e14(3480));
        let x = null, y = null;
        layers.forEach((L, p) => {
            if (at) { C(0xCA, 0x01, 0x00); C(0xCA, 0x02, p); C(0xCA, 0x01, 0x30); C(0xCA, 0x01, 0x10); }
            else { if (p > 0) { C(0xE7, 0x00); C(0xCA, 0x01, 0x00); C(0xCA, 0x01, 0x30); } C(0xCA, 0x02, p); C(0xCA, 0x01, 0x10); }
            C(0xCA, 0x01, L.air ? 0x13 : 0x12);
            C(0xC9, 0x02, eSpd(L.speed));
            if (at) { C(0xC6, 0x15, e35(0)); C(0xC6, 0x16, e35(0)); } else { C(0xC6, 0x12, e35(0)); C(0xC6, 0x13, e35(0)); }
            C(0xC6, 0x01, ePow(L.pmin)); C(0xC6, 0x02, ePow(L.pmax));
            C(0xC6, 0x21, ePow(at ? LASER2 : L.pmin)); C(0xC6, 0x22, ePow(at ? LASER2 : L.pmax));
            if (at) { C(0xCA, 0x03, 0x31); C(0xCA, 0x10, 0x00); } else C(0xCA, 0x03, 0x01);
            L.paths.forEach(path => {
                let q = path[0];
                if (at && x === q[0] && y === q[1]) C(0x89, e14(0), e14(0)); else C(0x88, e35(q[0]), e35(q[1]));
                x = q[0]; y = q[1];
                for (let i = 1; i < path.length; i++) { q = path[i]; if (q[0] === x && q[1] === y) continue; C(0xA8, e35(q[0]), e35(q[1])); x = q[0]; y = q[1]; }
            });
        });
        if (at) { C(0xEB); C(0xE7, 0x00); C(0xDA, 0x01, 0x06, 0x20, e35(400), e35(400)); C(0xD7); }
        else { C(0xE7, 0x00); C(0xCA, 0x01, 0x00); C(0xCA, 0x01, 0x30); let s = 0xD7; cmds.forEach(c => c.forEach(v => s += v)); C(0xE5, 0x05, e35(s)); C(0xD7); }
        let n = 0; cmds.forEach(c => n += c.length);
        const raw = new Uint8Array(n); let k = 0; cmds.forEach(c => { raw.set(c, k); k += c.length; });
        return { raw, bytes: swizzle(raw, opt.magic), bounds: G };
    }
    // Lista de órdenes de un .rd, para comprobarlo (descifra y describe lo principal)
    function decode(data, magic) {
        if (magic == null) magic = detectMagic(data);
        const raw = unswizzle(data, magic), out = [];
        const hex = a => Array.from(a, b => (b < 16 ? '0' : '') + b.toString(16).toUpperCase()).join(' ');
        const mm = v => (v / 1000).toFixed(3), xy = (a, i) => '(' + mm(s35(a, i)) + ', ' + mm(s35(a, i + 5)) + ') mm';
        const pw = (a, i) => (u14(a, i) * 100 / 16383).toFixed(1) + ' %';
        let mark = 0;
        const partes = []; for (let i = 1; i <= raw.length; i++) if (i === raw.length || raw[i] >= 0x80) { partes.push([mark, i]); mark = i; }
        partes.forEach(([a0, a1]) => {
            const a = raw.subarray(a0, a1), c = a[0], c2 = a[1]; let d = '';
            if (c === 0x88) d = 'Mover a ' + xy(a, 1);
            else if (c === 0x89) d = 'Mover relativo ' + mm(s14(a, 1)) + ', ' + mm(s14(a, 3)) + ' mm';
            else if (c === 0xA8) d = 'Cortar hasta ' + xy(a, 1);
            else if (c === 0xA9) d = 'Cortar relativo ' + mm(s14(a, 1)) + ', ' + mm(s14(a, 3)) + ' mm';
            else if (c === 0xC9 && c2 === 0x02) d = 'Velocidad = ' + (u35(a, 2) / 1000).toFixed(1) + ' mm/s';
            else if (c === 0xC9 && c2 === 0x04) d = 'Capa ' + a[2] + ': velocidad = ' + (u35(a, 3) / 1000).toFixed(1) + ' mm/s';
            else if (c === 0xC6 && [0x01, 0x02, 0x21, 0x22].includes(c2)) d = 'Potencia ' + (c2 & 1 ? 'mín.' : 'máx.') + ' láser ' + (c2 > 0x20 ? 2 : 1) + ' = ' + pw(a, 2);
            else if (c === 0xC6 && [0x31, 0x32, 0x41, 0x42].includes(c2)) d = 'Capa ' + a[2] + ': potencia ' + (c2 & 1 ? 'mín.' : 'máx.') + ' láser ' + (c2 > 0x40 ? 2 : 1) + ' = ' + pw(a, 3);
            else if (c === 0xCA && c2 === 0x02) d = 'Capa activa ' + a[2];
            else if (c === 0xCA && c2 === 0x01) d = ({ 0x00: 'Fin de capa', 0x10: 'Láser 1', 0x12: 'Aire apagado', 0x13: 'Aire encendido', 0x30: 'Sin desplazamiento del láser 2' })[a[2]] || 'Modo de capa';
            else if (c === 0xCA && c2 === 0x22) d = 'Última capa = ' + a[2];
            else if (c === 0xD8) d = ({ 0x00: 'Iniciar proceso', 0x10: 'Referencia: cero máquina', 0x11: 'Referencia: punto de anclaje', 0x12: 'Referencia: posición actual' })[c2] || 'D8';
            else if (c === 0xE7 && c2 === 0x03) d = 'Proceso: esquina 1 ' + xy(a, 2);
            else if (c === 0xE7 && c2 === 0x07) d = 'Proceso: esquina 2 ' + xy(a, 2);
            else if (c === 0xE7 && c2 === 0x00) d = 'Fin de bloque';
            else if (c === 0xEA) d = 'Inicio de matriz'; else if (c === 0xEB) d = 'Fin de matriz';
            else if (c === 0xE5 && c2 === 0x05) d = 'Suma de control = ' + u35(a, 2);
            else if (c === 0xDA) d = 'Parámetro ' + hex(a.subarray(2, 4));
            else if (c === 0xD7) d = 'FIN DE ARCHIVO';
            out.push({ off: a0, hex: hex(a), desc: d });
        });
        return { magic, cmds: out, bytes: raw.length };
    }
    return { build, decode, detectMagic };
})();

// ───────── Ajustes (se recuerdan en el navegador) ─────────
const CLAVE = 'laser_ajustes';
const POR_DEFECTO = () => ({
    W: 1000, H: 700, origen: 'tr', mesa: false, cpX: null, cpY: null, inicio: 'current', ref: 'bl', formato: 'atheon', magic: 136, vacio: 200, tol: 0.02, intPrimero: true, optimizar: true,
    capas: [
        { id: 'marcado', nombre: 'Marcado', color: '#0000ff', speed: 100, pmin: 15, pmax: 15, passes: 1, air: true, out: true },
        { id: 'corte', nombre: 'Corte', color: '#000000', speed: 9, pmin: 60, pmax: 60, passes: 2, air: true, out: true }
    ]
});
let A = POR_DEFECTO();
try { const g = JSON.parse(localStorage.getItem(CLAVE) || 'null'); if (g && g.capas && g.capas.length === 2) A = Object.assign(POR_DEFECTO(), g); } catch (e) {}
const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(A)); } catch (e) {} };
const capa = id => A.capas.find(c => c.id === id);

// Fuente de lo que se corta: el dibujo o un programa G-code abierto
let gcode = null;   // { nombre, trazados, avisos }

// ───────── Geometría: del dibujo y del G-code a polilíneas (mm, Y hacia arriba) ─────────
function pasosArco(r, ang) { const t = Math.min(Math.max(0.001, +A.tol || 0.02), r * 0.5); let a = 2 * Math.acos(Math.max(-1, 1 - t / Math.max(r, 1e-9))); if (!(a > 0)) a = 0.2; return Math.max(2, Math.min(4000, Math.ceil(Math.abs(ang) / a))); }
function puntosArco(c, r, a1, th, p2, pts) { const n = pasosArco(r, th); for (let i = 1; i < n; i++) { const a = a1 + th * i / n; pts.push([c.x + r * Math.cos(a), c.y + r * Math.sin(a)]); } pts.push([p2.x, p2.y]); }
function polilineaContorno(c) {
    const pts = [];
    tramos(c).forEach((t, k) => {
        if (k === 0) pts.push([t.p1.x, t.p1.y]);
        const a = t.b ? arcoDeBulge(t.p1, t.p2, t.b) : null;
        if (!a) pts.push([t.p2.x, t.p2.y]); else puntosArco(a.c, a.r, a.a1, a.theta, t.p2, pts);
    });
    if (c.cerrado && pts.length > 2) pts.pop();
    return pts;
}
function esMarcado(c) { return !c.cerrado || !!c.texto || !!c.deTexto || esGrabado(c) || esCajera(c) || esIsla(c); }
function trazadosDibujo() {
    return contornos.filter(c => c && c.pts && c.pts.length >= 2).map(c => ({ capa: esMarcado(c) ? 'marcado' : 'corte', cerrado: !!c.cerrado, pts: polilineaContorno(c) })).filter(t => t.pts.length >= 2);
}
// G1, G2 y G3 cortan; G0 no. Sin Z ni compensación: el láser sigue el contorno programado
function trazadosGcode(texto) {
    const prog = interpretarISO(texto), out = [];
    let cur = null;
    const cerca = (a, b) => Math.abs(a[0] - b.x) < 1e-6 && Math.abs(a[1] - b.y) < 1e-6;
    prog.segs.forEach(s => {
        if (s.rapido) { cur = null; return; }
        if (!cur || !cerca(cur.pts[cur.pts.length - 1], s.p1)) { cur = { capa: 'corte', cerrado: false, pts: [[s.p1.x, s.p1.y]] }; out.push(cur); }
        if (s.tipo === 'A' && s.c && s.r > 0) puntosArco(s.c, s.r, s.a1, s.theta, s.p2, cur.pts); else cur.pts.push([s.p2.x, s.p2.y]);
    });
    out.forEach(t => { const p = t.pts, a = p[0], b = p[p.length - 1]; if (p.length > 3 && Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-4) { t.cerrado = true; p.pop(); } });
    const avisos = (prog.notas || []).filter(n => n.tipo === 'error').map(n => n.msg);
    return { trazados: out.filter(t => t.pts.length >= 2), avisos };
}
const trazadosActuales = () => gcode ? gcode.trazados : trazadosDibujo();

function cajaPts(lista) { const b = [Infinity, Infinity, -Infinity, -Infinity]; lista.forEach(t => t.pts.forEach(q => { if (q[0] < b[0]) b[0] = q[0]; if (q[1] < b[1]) b[1] = q[1]; if (q[0] > b[2]) b[2] = q[0]; if (q[1] > b[3]) b[3] = q[1]; })); return b; }
function dentro(p, pol) { let d = false; for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) { const a = pol[i], b = pol[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) d = !d; } return d; }
const largo = p => { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; };

// Orden de corte: primero Marcado y después Corte; interiores antes que el contorno que los rodea; el más cercano
function plan() {
    const todos = trazadosActuales(), res = [];
    // como Atheon Design: se empieza por la esquina de la pieza más cercana al cero máquina
    let pos = null;
    if (todos.length) { const b = cajaPts(todos); pos = [A.origen[1] === 'r' ? b[2] : b[0], A.origen[0] === 't' ? b[3] : b[1]]; }
    ['marcado', 'corte'].forEach(id => {
        const L = capa(id); if (!L.out) return;
        const items = todos.filter(t => t.capa === id).map(t => ({ t, b: cajaPts([t]), hijos: [] }));
        if (!items.length) return;
        if (A.intPrimero) items.forEach(a => items.forEach(c => { if (a === c || !c.t.cerrado) return; if (a.b[0] >= c.b[0] && a.b[1] >= c.b[1] && a.b[2] <= c.b[2] && a.b[3] <= c.b[3] && dentro(a.t.pts[0], c.t.pts)) c.hijos.push(a); }));
        const hecho = new Set(), seq = [];
        while (seq.length < items.length) {
            let mejor = null, bd = Infinity, bi = 0, inv = false;
            for (const it of items) {
                if (hecho.has(it) || (A.intPrimero && it.hijos.some(h => !hecho.has(h)))) continue;
                if (!A.optimizar || !pos) { if (!mejor) { mejor = it; bi = 0; inv = false; } if (!A.optimizar) break; continue; }
                const P = it.t.pts;
                if (it.t.cerrado) P.forEach((q, i) => { const d = Math.hypot(q[0] - pos[0], q[1] - pos[1]); if (d < bd) { bd = d; mejor = it; bi = i; inv = false; } });
                else { const d0 = Math.hypot(P[0][0] - pos[0], P[0][1] - pos[1]), d1 = Math.hypot(P[P.length - 1][0] - pos[0], P[P.length - 1][1] - pos[1]); if (d0 < bd) { bd = d0; mejor = it; bi = 0; inv = false; } if (d1 < bd) { bd = d1; mejor = it; bi = 0; inv = true; } }
            }
            if (!mejor) { mejor = items.find(it => !hecho.has(it)); bi = 0; inv = false; }
            hecho.add(mejor);
            let pts = mejor.t.pts.slice();
            if (mejor.t.cerrado) { pts = pts.slice(bi).concat(pts.slice(0, bi)); pts.push(pts[0]); } else if (inv) pts.reverse();
            seq.push(pts); pos = pts[pts.length - 1];
        }
        let todas = []; for (let n = 0; n < Math.max(1, A.capas.find(c => c.id === id).passes | 0); n++) todas = todas.concat(seq);
        res.push({ L, seq: todas });
    });
    return res;
}
// Máquina: el cero pieza está en (cpX, cpY) contado desde el cero máquina, en el sentido de sus ejes
// (con el cero arriba a la derecha, X hacia la izquierda e Y hacia abajo, como en el panel de la Atheon)
function aMaquina(x, y) { asegurarCero(); const o = A.origen; return [Math.round((o[1] === 'r' ? A.cpX - x : A.cpX + x) * 1000), Math.round((o[0] === 't' ? A.cpY - y : A.cpY + y) * 1000)]; }
// La mesa en coordenadas del dibujo (cero pieza = 0,0): rectángulo y cero máquina
function mesaMundo() {
    asegurarCero(); const o = A.origen;
    const zx = o[1] === 'r' ? A.cpX : -A.cpX, zy = o[0] === 't' ? A.cpY : -A.cpY;     // el cero máquina, visto desde el cero pieza
    const x0 = o[1] === 'r' ? zx - A.W : zx, y0 = o[0] === 't' ? zy - A.H : zy;
    return { x0, y0, x1: x0 + A.W, y1: y0 + A.H, zx, zy };
}
// Primera vez: la pieza centrada en la mesa
function asegurarCero() { if (A.cpX == null || A.cpY == null) centrarEnMesa(true); }
function centrarEnMesa(sinGuardar) {
    let b = null; try { const t = trazadosActuales(); if (t.length) b = cajaPts(t); } catch (e) {}
    if (!b || !isFinite(b[0])) b = [0, 0, 0, 0];
    const o = A.origen, cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    // el centro de la pieza, en el centro de la mesa
    A.cpX = +(A.W / 2 + (o[1] === 'r' ? cx : -cx)).toFixed(1); A.cpY = +(A.H / 2 + (o[0] === 't' ? cy : -cy)).toFixed(1);
    if (!sinGuardar) guardar();
}
// ¿Cabe la pieza? Devuelve lo que se sale por cada lado (mm)
function fueraDeMesa(b) { const m = mesaMundo(); return { izq: Math.max(0, m.x0 - b[0]), der: Math.max(0, b[2] - m.x1), abajo: Math.max(0, m.y0 - b[1]), arriba: Math.max(0, b[3] - m.y1) }; }
function generarRD() {
    const p = plan();
    if (!p.length) throw new Error(gcode ? 'El programa no tiene tramos de corte (G1, G2 o G3)' : 'Dibuja o abre primero la pieza');
    const job = { layers: p.map(o => ({ color: parseInt(o.L.color.slice(1), 16), speed: o.L.speed, pmin: o.L.pmin, pmax: o.L.pmax, air: o.L.air, paths: o.seq.map(s => s.map(q => aMaquina(q[0], q[1]))) })) };
    if (A.inicio === 'current') {   // coordenadas relativas al punto que queda bajo el cabezal (como Atheon Design)
        const b = cajaPts([].concat(...p.map(o => o.seq.map(s => ({ pts: s }))))), r = A.ref;
        const R = aMaquina(r === 'c' ? (b[0] + b[2]) / 2 : (r[1] === 'l' ? b[0] : b[2]), r === 'c' ? (b[1] + b[3]) / 2 : (r[0] === 'b' ? b[1] : b[3]));
        job.layers.forEach(L => { L.paths = L.paths.map(s => s.map(q => [q[0] - R[0], q[1] - R[1]])); });
    }
    return { rd: RDCore.build(job, { magic: +A.magic, start: A.inicio, template: A.formato }), plan: p };
}
function resumen(p) {
    let corte = 0, vacio = 0, t = 0, pos = null; const vv = Math.max(1, +A.vacio || 200);
    p.forEach(o => o.seq.forEach(s => { if (pos) { const d = Math.hypot(s[0][0] - pos[0], s[0][1] - pos[1]); vacio += d; t += d / vv; } const l = largo(s); corte += l; t += l / Math.max(0.1, o.L.speed); pos = s[s.length - 1]; }));
    return { corte, vacio, t: t * 1.1 };
}
const fmtT = s => { s = Math.round(s); const m = Math.floor(s / 60); return m ? m + ' min ' + (s % 60) + ' s' : s + ' s'; };
const f1 = v => (Math.round(v * 10) / 10).toLocaleString('es-ES');

// ───────── Interfaz: la pestaña 🔥 Láser del panel derecho ─────────
const css = document.createElement('style');
css.textContent = `
html[data-laser="1"] #tuFuenteMaq, html[data-laser="1"] #c2Tabs, html[data-laser="1"] #c2PaneEj, html[data-laser="1"] #c2PaneCorr,
html[data-laser="1"] .c2-comprobar, html[data-laser="1"] #tuVista_contornos .param-line:has(#pmHerr), html[data-laser="1"] #tuVista_contornos .param-line:has(#pmProf),
html[data-laser="1"] #pmPuentes, html[data-laser="1"] #pmCaj { display: none !important; }
#tutorPanel.laser > :not(.tu-cab):not(#lasPanel) { display: none !important; }
/* «Mecanizado» pasa a «🔥 Láser»: fuera la fresa, la compensación, la Z y el husillo; quedan las coordenadas y el orden */
html[data-laser="1"] .tu-mec-grid > :is(label[for=tuCompSel], #tuCompSel, label[for=tuT], #tuT, label[for=tuD], #tuD, #tuHerrNota, label[for=tuHbSel], label[for=tuProf], #tuProf,
    label[for=tuPaso], #tuPaso, label[for=tuF], #tuF, label[for=tuFz], #tuFz, label[for=tuS], #tuS, label[for=tuF0], #tuF0, label[for=tuZseg], #tuZseg,
    label[for=tuEstr], #tuEstr, label[for=tuAcab], #tuAcab, label[for=tuUnid], #tuUnid, .c2-ventana-mec),
html[data-laser="1"] .tu-mec-grid > span:has(#tuHbSel), html[data-laser="1"] button[onclick="tuEnviarSimulador()"] { display: none !important; }
.las-mec-tit { grid-column: 1 / 5; font-weight: 700; font-size: 12px; margin-top: 6px; display: flex; align-items: center; gap: 6px; }
.las-mec-tit .punto { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.las-mec-tit small { font-weight: 400; color: var(--text-muted); }
.las-mec-herr { grid-column: 2 / 5; font-weight: 600; }
.las-mec-nota { grid-column: 1 / 5; font-size: 11px; color: var(--text-muted); margin-top: -2px; }
.tu-mec-grid .las-mec-aire { grid-column: 1 / 5; display: flex !important; gap: 6px; align-items: center; justify-content: flex-start; text-align: left; font-size: 12px; margin-top: 4px; color: var(--text-main); }
.tu-mec-grid .las-mec-aire input { width: auto; margin: 0; }
html[data-laser="1"] .las-mesa-chk { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; margin-left: 8px; cursor: pointer; user-select: none; white-space: nowrap; }
.las-mesa-box { position: absolute; left: 12px; top: 50px; z-index: 6; background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: var(--shadow); padding: 8px 10px; font-size: 12px; display: grid; grid-template-columns: auto auto auto auto; gap: 5px 6px; align-items: center; max-width: 330px; }
.las-mesa-box[hidden] { display: none; }
.las-mesa-box .tit { grid-column: 1 / 5; font-weight: 700; display: flex; justify-content: space-between; gap: 8px; }
.las-mesa-box .nota { grid-column: 1 / 5; color: var(--text-muted); font-size: 11px; line-height: 1.35; }
.las-mesa-box input { width: 64px; font-size: 12px; padding: 2px 4px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--canvas-bg); color: var(--text-main); }
.las-mesa-box label { color: var(--text-muted); }
.las-mesa-box .bots { grid-column: 1 / 5; display: flex; gap: 6px; }
.las-mesa-box button { font-size: 12px; padding: 3px 8px; border-radius: 5px; border: 1px solid var(--border-color); background: var(--canvas-bg); color: var(--text-main); cursor: pointer; }
.las-mesa-box .estado { grid-column: 1 / 5; font-weight: 600; }
.las-mesa-box .estado.mal { color: #c0392b; } .las-mesa-box .estado.bien { color: #1e8449; }
#lasPanel { display: none; flex-direction: column; gap: 8px; padding: 8px 10px 14px; overflow-y: auto; flex: 1; min-height: 0; font-size: 12.5px; }
#tutorPanel.laser #lasPanel { display: flex; }
.las-caja { border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 9px; background: var(--canvas-bg); }
.las-tit { font-weight: 700; font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .4px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
.las-fuente b { color: var(--accent); }
.las-fuente .las-bots { display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
#lasPanel button, #modalLaser button { font-size: 12.5px; padding: 5px 9px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-panel); color: var(--text-main); cursor: pointer; }
#lasPanel button:hover, #modalLaser button:hover { border-color: var(--accent); }
#lasPanel button.principal, #modalLaser button.principal { background: var(--accent); color: #fff; border-color: var(--accent); font-weight: 600; }
.las-capa { display: grid; grid-template-columns: 16px 1fr 58px 50px 50px; gap: 4px 6px; align-items: center; padding: 6px 0; border-top: 1px solid var(--border-color); }
.las-capa:first-of-type { border-top: 0; }
.las-capa .punto { width: 12px; height: 12px; border-radius: 50%; }
.las-capa .nom { font-weight: 600; }
.las-capa .opc { grid-column: 2 / 6; display: flex; gap: 10px; align-items: center; color: var(--text-muted); flex-wrap: wrap; }
.las-capa .opc label { display: flex; gap: 3px; align-items: center; }
#lasPanel input[type=number], #lasPanel select { font-size: 12.5px; padding: 3px 5px; border: 1px solid var(--border-color); border-radius: 5px; background: var(--bg-panel); color: var(--text-main); min-width: 0; width: 100%; }
.las-cab { display: grid; grid-template-columns: 16px 1fr 58px 50px 50px; gap: 6px; color: var(--text-muted); font-size: 11px; }
.las-grid { display: grid; grid-template-columns: auto 1fr; gap: 5px 8px; align-items: center; margin-top: 6px; }
.las-grid label { color: var(--text-muted); }
.las-mesa { display: flex; gap: 4px; align-items: center; }
.las-nota { font-size: 11.5px; color: var(--text-muted); line-height: 1.4; }
.las-res { display: grid; grid-template-columns: auto 1fr; gap: 3px 10px; }
.las-res span:nth-child(odd) { color: var(--text-muted); }
.las-aviso { font-size: 12px; color: #b03a2e; background: rgba(231,76,60,.10); border: 1px solid rgba(231,76,60,.45); border-radius: 6px; padding: 6px 8px; }
body.dark-mode .las-aviso { color: #f1948a; }
.las-acciones { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.las-acciones button { padding: 8px 6px !important; font-size: 13px !important; }
#modalLaser .modal { width: min(1100px, 96vw); max-height: 94vh; display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; }
#lasCanvas { width: 100%; height: min(62vh, 640px); border: 1px solid var(--border-color); border-radius: 8px; background: var(--canvas-bg); display: block; cursor: grab; }
.las-sim { display: flex; align-items: center; gap: 8px; }
.las-sim input[type=range] { flex: 1; }
#lasCmds { max-height: 30vh; overflow: auto; font: 12px/1.45 Consolas, Menlo, monospace; background: var(--bg-app); border: 1px solid var(--border-color); border-radius: 6px; padding: 6px 8px; white-space: pre; margin: 0; }
`;
document.head.appendChild(css);

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const $ = id => document.getElementById(id);
const sel = (id, ops, v) => `<select id="${id}">` + ops.map(([k, t]) => `<option value="${k}"${String(k) === String(v) ? ' selected' : ''}>${t}</option>`).join('') + '</select>';

function htmlPanel() {
    const filasCapas = A.capas.map(L => `
        <div class="las-capa" data-c="${L.id}">
            <span class="punto" style="background:${L.color}"></span><span class="nom">${esc(L.nombre)}</span>
            <input type="number" data-c="${L.id}" data-k="speed" value="${L.speed}" min="0.1" step="1" title="Velocidad, en mm/s">
            <input type="number" data-c="${L.id}" data-k="pmin" value="${L.pmin}" min="0" max="100" step="1" title="Potencia mínima (%): la que usa al frenar en las esquinas">
            <input type="number" data-c="${L.id}" data-k="pmax" value="${L.pmax}" min="0" max="100" step="1" title="Potencia máxima (%): a la velocidad de corte">
            <div class="opc"><label title="Enviar esta capa a la máquina"><input type="checkbox" data-c="${L.id}" data-k="out"${L.out ? ' checked' : ''}> Cortar</label>
                <label><input type="checkbox" data-c="${L.id}" data-k="air"${L.air ? ' checked' : ''}> Aire</label>
                <label>Pasadas <input type="number" data-c="${L.id}" data-k="passes" value="${L.passes}" min="1" max="50" step="1" style="width:46px"></label></div>
        </div>`).join('');
    return `
    <div class="las-caja las-fuente" id="lasFuente"></div>
    <div class="las-caja">
        <div class="las-tit">Capas</div>
        <div class="las-cab"><span></span><span></span><span>mm/s</span><span>Mín %</span><span>Máx %</span></div>
        ${filasCapas}
        <div class="las-nota" style="margin-top:6px">Primero se marca y después se corta; los interiores, antes que el contorno que los rodea. <b>Corte</b>: contornos cerrados. <b>Marcado</b>: abiertos, textos, grabados y cajeras.</div>
    </div>
    <div class="las-caja" id="lasResumen"></div>
    <div class="las-acciones">
        <button id="lasVer" title="El recorrido del láser, con simulación y las órdenes del archivo">👁 Vista previa…</button>
        <button id="lasExp" class="principal" title="Descarga el archivo .rd para la máquina">⬇ Exportar .rd</button>
    </div>
    <details class="las-caja" id="lasMaq">
        <summary class="las-tit" style="cursor:pointer;margin:0">⚙️ Máquina</summary>
        <div class="las-grid">
            <label>Mesa (mm)</label><span class="las-mesa"><input type="number" id="lasW" value="${A.W}" min="10"> × <input type="number" id="lasH" value="${A.H}" min="10"></span>
            <label>Origen</label>${sel('lasOrigen', [['tr', 'Arriba-derecha'], ['tl', 'Arriba-izquierda'], ['br', 'Abajo-derecha'], ['bl', 'Abajo-izquierda']], A.origen)}
            <label>Inicio</label>${sel('lasInicio', [['current', 'Posición actual del cabezal'], ['anchor', 'Punto de anclaje'], ['absolute', 'Coordenadas de la mesa']], A.inicio)}
            <label title="Qué punto de la pieza queda bajo el cabezal (con «posición actual»)">Referencia</label>${sel('lasRef', [['bl', 'Esquina inf. izquierda (Atheon)'], ['br', 'Esquina inf. derecha'], ['tl', 'Esquina sup. izquierda'], ['tr', 'Esquina sup. derecha'], ['c', 'Centro de la pieza']], A.ref)}
            <label>Formato</label>${sel('lasFormato', [['atheon', 'Atheon Design'], ['meerk40t', 'Genérico Ruida (MeerK40t)']], A.formato)}
            <label>Controlador</label>${sel('lasMagic', [[136, '0x88 · RDC644x'], [17, '0x11 · RDC634x'], [56, '0x38']], A.magic)}
            <label>Vel. en vacío</label><span class="las-mesa"><input type="number" id="lasVacio" value="${A.vacio}" min="1"> mm/s</span>
            <label>Tolerancia arcos</label><span class="las-mesa"><input type="number" id="lasTol" value="${A.tol}" min="0.001" step="0.01"> mm</span>
            <label></label><label style="color:inherit"><input type="checkbox" id="lasInt"${A.intPrimero ? ' checked' : ''}> Interiores primero</label>
            <label></label><label style="color:inherit"><input type="checkbox" id="lasOpt"${A.optimizar ? ' checked' : ''}> Optimizar recorrido y entradas</label>
        </div>
        <div class="las-nota" style="margin-top:6px">Con «posición actual» el archivo va referido al cabezal, como los de Atheon Design: la mesa y el origen solo cuentan con «coordenadas de la mesa».</div>
    </details>
    <input type="file" id="lasFileNC" accept=".nc,.txt,.iso,.cnc,.tap,.gcode,.ngc,.mpf,.h" hidden>`;
}

function htmlMec() {
    const fila = L => `<div class="las-mec-tit"><span class="punto" style="background:${L.color}"></span>${esc(L.nombre)} <small>${L.id === 'corte' ? 'contornos cerrados' : 'abiertos, textos y grabados'}</small></div>
        <label title="Velocidad de corte, en mm/s (en el programa, F en mm/min)">Velocidad</label><input type="number" data-c="${L.id}" data-k="speed" min="0.1" step="1" title="mm/s">
        <label title="Veces que el láser repasa cada contorno (en lugar de bajar en Z)">Pasadas</label><input type="number" data-c="${L.id}" data-k="passes" min="1" max="50" step="1">
        <label title="Potencia mínima (%): la que usa al frenar en las esquinas">Pot. mín. %</label><input type="number" data-c="${L.id}" data-k="pmin" min="0" max="100" step="1">
        <label title="Potencia de corte (%): en el programa, S = potencia × 10">Pot. máx. %</label><input type="number" data-c="${L.id}" data-k="pmax" min="0" max="100" step="1">`;
    return `<label>Herramienta</label><span class="las-mec-herr">🔥 Láser CO2</span>
        <div class="las-mec-nota">Velocidad en mm/s (F en mm/min en el programa) · potencia en % (S de 0 a 1000) · sin Z: las pasadas repiten el contorno</div>`
        + fila(capa('corte')) + fila(capa('marcado'))
        + `<label class="las-mec-aire"><input type="checkbox" data-c="todas" data-k="air"> Soplado de aire (M08 al empezar, M09 al terminar)</label>`;
}
// Escribe los valores de A en todos los campos de las dos pestañas
function sincronizar() {
    document.querySelectorAll('#tutorPanel [data-c][data-k]').forEach(inp => {
        const k = inp.dataset.k, Ls = inp.dataset.c === 'todas' ? A.capas : [capa(inp.dataset.c)];
        if (inp.type === 'checkbox') inp.checked = Ls.every(L => L[k]); else if (document.activeElement !== inp) inp.value = Ls[0][k];
    });
}

// ───────── El programa de 📋 Solución, escrito para el láser ─────────
// Como el del Calcador (G90, G91, G91 total o mixta; los mismos puntos y comentarios), pero sin fresa:
// sin T M06, sin Z ni G41/G42; M03 S… enciende el láser (S = % × 10), M05 lo apaga, y las pasadas repiten el contorno
function tuGenerarLaser() {
    const coord = tuCoord(), isT = coord === 'G91T';
    const L = [], puntos = [], etiquetas = [];
    const add = (cod, com, extra) => L.push({ cod, com, ...(extra || {}) });
    const sep = com => L.push({ cod: '', com, sep: true });
    const nombre = (TU.ejercicio && TU.ejercicio.nombre) || document.getElementById('projectName').value || 'pieza';
    let items = tuTrazados();
    items = items.filter(o => esMarcado(o.c)).concat(items.filter(o => !esMarcado(o.c)))      // primero se marca, después se corta
        .filter(o => capa(esMarcado(o.c) ? 'marcado' : 'corte').out);
    const aire = items.some(o => capa(esMarcado(o.c) ? 'marcado' : 'corte').air);
    add(`(${tuSinTildes(nombre).toUpperCase().replace(/[()]/g, '')})`, '', { titulo: true });
    add('G71 G90', coord === 'G90' ? 'milímetros y coordenadas absolutas' : 'milímetros; empezamos en absolutas');
    if (aire && items.length) add('M08', 'abre el soplado de aire');
    let modal = 'G90', cur = { x: 0, y: 0 };
    const xyAbs = p => `X${tuF(p.x)} Y${tuF(p.y)}`, xyInc = (a, b) => `X${tuF(+tuF(b.x) - +tuF(a.x))} Y${tuF(+tuF(b.y) - +tuF(a.y))}`;
    if (isT && items.length) add('G0 X0 Y0', 'encima del cero pieza: el punto de partida, desde aquí todo es G91');
    items.forEach((it, idx) => {
        const c = it.c, n = c.pts.length, cerrado = c.cerrado, nom = k => it.letra + ((k % n) + 1);
        const segs = tramos(c).map(t => ({ p1: t.p1, p2: t.p2, b: t.b || 0, a: nom(t.i), bn: nom(t.j) }));
        const filas = [];
        for (let k = 0; k < n; k++) filas.push({ nombre: nom(k), p: c.pts[k], llega: k === 0 ? null : segs[k - 1] });
        if (cerrado) filas.push({ nombre: nom(0), p: c.pts[0], llega: segs[segs.length - 1], cierra: true });
        c.pts.forEach((p, k) => etiquetas.push({ nombre: nom(k), p, tipo: it.clase, ci: it.ci }));
        const ccw = cerrado ? areaFirmada(muestrearContorno(c)) > 0 : false;
        puntos.push({ letra: it.letra, clase: it.clase, filas, lado: null, E: null, Ap: null, eNom: null, apNom: null, cerrado, debe: null, mal: false, ccw, n });
        const Lc = capa(esMarcado(c) ? 'marcado' : 'corte'), S = Math.round(Lc.pmax * 10), F = Math.round(Lc.speed * 60), np = Math.max(1, Lc.passes | 0);
        const titulo = it.clase === 'interior' ? 'Interior' : it.clase === 'abierto' ? 'Trazo abierto' : 'Exterior';
        sep(`── ${titulo}: ${it.letra}1 … ${it.letra}${n} · ${Lc.nombre.toLowerCase()}${np > 1 ? `, ${np} pasadas` : ''} ──`);
        const irA = (p, pNom, primero) => {
            if (isT) { add(`${modal === 'G91' ? '' : 'G91 '}G0 ${xyInc(cur, p)}`, `en rápido hasta ${pNom}, con el láser apagado` + (modal === 'G91' ? '' : ' (pasa a G91)'), { ci: it.ci }); modal = 'G91'; }
            else if (coord === 'G91' && !primero) { add(`${modal === 'G91' ? '' : 'G91 '}G0 ${xyInc(cur, p)}`, `en rápido hasta ${pNom}, con el láser apagado`, { ci: it.ci }); modal = 'G91'; }
            else { add((modal === 'G91' ? 'G90 ' : '') + `G0 ${xyAbs(p)}`, `en rápido hasta ${pNom}, con el láser apagado` + (modal === 'G91' ? ' (vuelve a G90)' : ''), { ci: it.ci }); modal = 'G90'; }
            cur = { ...p };
        };
        irA(segs[0].p1, segs[0].a, idx === 0);
        for (let kp = 0; kp < np; kp++) {
            if (kp > 0 && !cerrado) irA(segs[0].p1, segs[0].a, false);    // trazo abierto: vuelve al principio para repasarlo
            add(`M03 S${S}`, (np > 1 ? `pasada ${kp + 1} de ${np}: ` : '') + `enciende el láser al ${tuF(Lc.pmax)} %`, { ci: it.ci });
            let pf = ` F${F}`;
            segs.forEach((s, k) => {
                const ultimo = k === segs.length - 1, arc = !!s.b;
                let pre = '', xy;
                if (coord === 'G90' || (coord === 'mixta' && ultimo && cerrado)) { if (modal === 'G91') { pre = 'G90 '; modal = 'G90'; } xy = xyAbs(s.p2); }
                else { if (modal === 'G90') { pre = 'G91 '; modal = 'G91'; } xy = xyInc(s.p1, s.p2); }
                const ar = arc ? tuArco(s.p1, s.p2, s.b) : null;
                const ij = arc ? ` I${tuF(ar.c.x - s.p1.x)} J${tuF(ar.c.y - s.p1.y)}` : '';
                let com = arc ? `${s.a} → ${s.bn}: arco ${ar.g === 'G2' ? 'horario' : 'antihorario'} R${tuF(ar.r)}, centro X${tuF(ar.c.x)} Y${tuF(ar.c.y)}` : `${s.a} → ${s.bn}: recta`;
                if (pf) com += ` a ${tuF(Lc.speed)} mm/s`;
                if (ultimo && cerrado) com += pre.startsWith('G90') && coord !== 'G90' ? ' (cierra, en G90)' : ' (cierra)';
                else if (coord !== 'G90' && pre) com += pre.startsWith('G91') ? ' (pasa a G91)' : ' (vuelve a G90)';
                add(`${pre}${arc ? ar.g : 'G1'} ${xy}${ij}${pf}`, com, { ci: it.ci, seg: s });
                pf = ''; cur = { ...s.p2 };
            });
            add('M05', 'apaga el láser', { ci: it.ci });
        }
    });
    if (isT && items.length) { add(`G0 ${xyInc(cur, { x: 0, y: 0 })}`, 'vuelve encima del cero pieza'); add('G90', 'deja la máquina en absolutas para el siguiente programa'); }
    else if (items.length) add((modal === 'G91' ? 'G90 ' : '') + 'G0 X0 Y0', 'vuelve al cero pieza' + (modal === 'G91' ? ' (vuelve a absolutas)' : ''));
    if (aire && items.length) add('M09', 'cierra el soplado de aire');
    add('M30', 'fin del programa');
    const ancho = Math.min(30, Math.max(16, ...L.filter(l => !l.sep && !l.titulo).map(l => l.cod.length + 2)));
    L.forEach(l => { l.texto = l.sep ? '; ' + l.com : l.titulo ? l.cod : l.com ? l.cod.padEnd(ancho) + '; ' + l.com : l.cod; });
    return { malos: new Set(), ancho, lineas: L, texto: L.map(l => l.texto).join('\n') + '\n', puntos, etiquetas, vacio: !items.length, coord, comp: 'G40', R: 0, nombre };
}
if (typeof window.tuGenerar === 'function') {
    window.tuGenerar = tuGenerarLaser;
    const firma = window.tuFirma;
    if (typeof firma === 'function') window.tuFirma = () => firma() + JSON.stringify(A.capas);
}

function pintarFuente() {
    const f = $('lasFuente'); if (!f) return;
    if (gcode) {
        f.innerHTML = `<div class="las-tit">Qué se corta</div>Programa G-code: <b>${esc(gcode.nombre)}</b><div class="las-nota">G1, G2 y G3 cortan; G0 se mueve sin láser. No se tienen en cuenta la Z ni la compensación G41/G42: el láser sigue el contorno programado. Todo va a la capa Corte.</div>
            <div class="las-bots"><button id="lasAbrirNC">📂 Otro programa…</button><button id="lasVolver">✏️ Volver al dibujo</button></div>`
            + (gcode.avisos.length ? `<div class="las-aviso" style="margin-top:6px">⚠ ${gcode.avisos.length} error(es) en el programa: ${esc(gcode.avisos.slice(0, 3).join(' · '))}${gcode.avisos.length > 3 ? '…' : ''}</div>` : '');
    } else {
        f.innerHTML = `<div class="las-tit">Qué se corta</div>El <b>dibujo</b> del lienzo.
            <div class="las-bots"><button id="lasAbrirNC" title="Abre un programa ISO (.nc) y corta su recorrido en la láser">📂 Desde un programa G-code…</button></div>`;
    }
    $('lasAbrirNC').onclick = () => { $('lasFileNC').value = ''; $('lasFileNC').click(); };
    if ($('lasVolver')) $('lasVolver').onclick = () => { gcode = null; pintarFuente(); pintarResumen(); };
}
function pintarResumen() {
    const r = $('lasResumen'); if (!r) return;
    let h = '<div class="las-tit">Resumen</div>';
    try {
        const p = plan(), tr = trazadosActuales();
        if (!p.length) { r.innerHTML = h + `<div class="las-nota">${tr.length ? 'Ninguna capa con trazados está marcada para cortar.' : (gcode ? 'El programa no tiene tramos de corte.' : 'Dibuja una pieza o abre un programa G-code.')}</div>`; return; }
        const b = cajaPts(tr), s = resumen(p), n = k => tr.filter(t => t.capa === k).length;
        h += `<div class="las-res"><span>Tamaño</span><span><b>${f1(b[2] - b[0])} × ${f1(b[3] - b[1])} mm</b></span>
            <span>Trazados</span><span>${n('corte')} de corte · ${n('marcado')} de marcado</span>
            <span>Recorrido</span><span>${f1(s.corte)} mm con láser · ${f1(s.vacio)} mm en vacío</span>
            <span>Tiempo</span><span><b>${fmtT(s.t)}</b> (aprox.)</span></div>`;
        if (b[2] - b[0] > A.W + 1e-6 || b[3] - b[1] > A.H + 1e-6) h += `<div class="las-aviso" style="margin-top:6px">La pieza (${f1(b[2] - b[0])} × ${f1(b[3] - b[1])} mm) no cabe en la mesa de ${A.W} × ${A.H} mm.</div>`;
        else if (A.mesa || A.inicio === 'absolute') { const f = fueraDeMesa(b), lados = Object.keys(f).filter(k => f[k] > 1e-6);
            if (lados.length) h += `<div class="las-aviso" style="margin-top:6px">La pieza se sale de la mesa: ${lados.map(k => ({ izq: 'por la izquierda', der: 'por la derecha', abajo: 'por abajo', arriba: 'por arriba' })[k] + ' ' + f1(f[k]) + ' mm').join(', ')}. Muévela en «Mesa» (junto al nombre).</div>`; }
        const abiertosCorte = tr.filter(t => t.capa === 'corte' && !t.cerrado).length;
        if (abiertosCorte) h += `<div class="las-aviso" style="margin-top:6px">${abiertosCorte} trazado(s) de corte no se cierran: la pieza puede no soltarse.</div>`;
    } catch (e) { h += `<div class="las-aviso">${esc(e.message)}</div>`; }
    r.innerHTML = h;
}
let tRes = null;
const refrescar = () => { clearTimeout(tRes); tRes = setTimeout(pintarResumen, 150); };

function montar() {
    const panel = $('tutorPanel'), modos = panel && panel.querySelector('.tu-modos');
    if (!panel || !modos || $('lasPanel')) return;
    // botón de la pestaña
    const b = document.createElement('button'); b.id = 'tuFuenteLaser'; b.textContent = '🔥 Láser'; b.title = 'Preparar el archivo .rd para la cortadora láser';
    modos.appendChild(b);
    const div = document.createElement('div'); div.id = 'lasPanel'; div.innerHTML = htmlPanel();
    panel.querySelector('.tu-cab').after(div);
    const activar = on => {
        panel.classList.toggle('laser', on); b.classList.toggle('activo', on);
        if (on) { modos.querySelectorAll('button').forEach(x => { if (x !== b) x.classList.remove('activo'); }); pintarResumen(); }
        else if (typeof tuPintarFuente === 'function') tuPintarFuente();
        try { localStorage.setItem('laser_pestana', on ? '1' : '0'); } catch (e) {}
    };
    // en la láser no hay programa «⚙️ Máquina» de fresa: siempre el de 📋 Solución, escrito para el láser
    if (typeof TU === 'object' && TU.fuente === 'maquina' && typeof tuFuente === 'function') tuFuente('solucion');
    b.onclick = () => activar(true);
    const bs = $('tuFuenteSol'); if (bs) bs.addEventListener('click', () => activar(false));
    // capas
    // los parámetros de la láser están en la pestaña 🔥 Láser y en el bloque «🔥 Láser» de 📋 Solución: los dos a la vez
    const grid = panel.querySelector('.tu-mec-grid'), ancla = grid && grid.querySelector('label[for=tuCompSel]');
    if (grid) { const tmp = document.createElement('div'); tmp.innerHTML = htmlMec(); [...tmp.childNodes].forEach(n => grid.insertBefore(n, ancla || null)); }
    const sum = panel.querySelector('#tuMec > summary'); if (sum) { sum.textContent = '🔥 Láser'; sum.title = 'La herramienta es el láser: velocidad, potencia y pasadas de cada capa, y las coordenadas del programa'; }
    panel.addEventListener('change', e => {
        const inp = e.target; if (!inp.dataset || !inp.dataset.c || !inp.dataset.k) return;
        const k = inp.dataset.k, Ls = inp.dataset.c === 'todas' ? A.capas : [capa(inp.dataset.c)];
        if (inp.type === 'checkbox') Ls.forEach(L => L[k] = inp.checked);
        else { let v = parseFloat(String(inp.value).replace(',', '.')); if (!isFinite(v)) { sincronizar(); return; }
            if (k === 'pmin' || k === 'pmax') v = Math.max(0, Math.min(100, v)); if (k === 'passes') v = Math.max(1, Math.round(v)); if (k === 'speed') v = Math.max(0.1, v);
            Ls.forEach(L => { L[k] = v; if (k === 'pmin' && L.pmax < v) L.pmax = v; if (k === 'pmax' && L.pmin > v) L.pmin = v; }); }
        guardar(); sincronizar(); pintarResumen();
        if (typeof tuRefrescar === 'function') tuRefrescar(true);
    });
    sincronizar();
    // máquina
    const campos = { lasW: 'W', lasH: 'H', lasOrigen: 'origen', lasInicio: 'inicio', lasRef: 'ref', lasFormato: 'formato', lasMagic: 'magic', lasVacio: 'vacio', lasTol: 'tol', lasInt: 'intPrimero', lasOpt: 'optimizar' };
    Object.keys(campos).forEach(id => $(id).addEventListener('change', e => {
        const k = campos[id], el = e.target;
        A[k] = el.type === 'checkbox' ? el.checked : (el.tagName === 'SELECT' && !['magic'].includes(k) ? el.value : (parseFloat(el.value) || A[k]));
        guardar(); pintarResumen();
    }));
    $('lasFileNC').addEventListener('change', e => {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = () => {
            try { const g = trazadosGcode(String(r.result)); gcode = { nombre: f.name, base: f.name.replace(/\.[^.]+$/, ''), trazados: g.trazados, avisos: g.avisos }; }
            catch (err) { snack('No se ha podido leer el programa: ' + err.message); return; }
            pintarFuente(); pintarResumen();
            snack(gcode.trazados.length ? `${f.name}: ${gcode.trazados.length} trazado(s) de corte` : `${f.name}: no hay tramos G1, G2 ni G3`);
        };
        r.readAsText(f);
    });
    $('lasExp').onclick = exportar;
    $('lasVer').onclick = abrirVista;
    pintarFuente();
    let on = true; try { on = localStorage.getItem('laser_pestana') !== '0'; } catch (e) {}
    activar(on);
    if (typeof tuRefrescar === 'function') tuRefrescar(true);
    // el resumen sigue al dibujo
    const lz = $('lienzo'); if (lz) ['pointerup', 'keyup'].forEach(ev => lz.addEventListener(ev, refrescar));
    document.addEventListener('keyup', refrescar);
    setInterval(() => { if (panel.classList.contains('laser') && !gcode) { const k = huellaGeometria(); if (k !== montar._k) { montar._k = k; pintarResumen(); } } }, 700);
}

function nombreRD() { return (gcode ? gcode.base : nombreProyecto()) + '.rd'; }
function exportar() {
    let g; try { g = generarRD(); } catch (e) { snack(e.message); return; }
    descargar(g.rd.bytes, nombreRD(), 'application/octet-stream');
    snack(`${nombreRD()} exportado (${g.rd.bytes.length} bytes). Pruébalo primero con poca potencia o con el marco del panel`);
}

// ───────── Vista previa con simulación ─────────
let V = null;
function abrirVista() {
    let g; try { g = generarRD(); } catch (e) { snack(e.message); return; }
    let ov = $('modalLaser');
    if (!ov) {
        ov = document.createElement('div'); ov.className = 'modal-overlay'; ov.id = 'modalLaser';
        ov.innerHTML = `<div class="modal"><div style="display:flex;align-items:center;gap:10px"><h3 style="margin:0;flex:1">🔥 Recorrido del láser</h3><span id="lasVistaInfo" class="las-nota"></span><button onclick="document.getElementById('modalLaser').classList.remove('visible')">✕</button></div>
            <canvas id="lasCanvas"></canvas>
            <div class="las-sim"><button id="lasPlay">▶ Simular</button><input type="range" id="lasSimR" min="0" max="1000" value="1000"><span id="lasSimT" class="las-nota" style="width:40px">100 %</span>
            <button id="lasVerCmds">Órdenes del .rd</button><button id="lasExp2" class="principal">⬇ Exportar .rd</button></div>
            <pre id="lasCmds" hidden></pre></div>`;
        ov.onclick = e => { if (e.target === ov) ov.classList.remove('visible'); };
        document.body.appendChild(ov);
        $('lasSimR').oninput = e => { V.f = e.target.value / 1000; $('lasSimT').textContent = Math.round(V.f * 100) + ' %'; dibujarVista(); };
        $('lasPlay').onclick = () => {
            if (V.anim) { cancelAnimationFrame(V.anim); V.anim = null; $('lasPlay').textContent = '▶ Simular'; return; }
            const de = V.f >= 1 ? 0 : V.f; let t0 = null; $('lasPlay').textContent = '■ Parar';
            const paso = t => { if (t0 === null) t0 = t; V.f = Math.min(1, de + (t - t0) / 10000); $('lasSimR').value = Math.round(V.f * 1000); $('lasSimT').textContent = Math.round(V.f * 100) + ' %'; dibujarVista();
                if (V.f < 1 && ov.classList.contains('visible')) V.anim = requestAnimationFrame(paso); else { V.anim = null; $('lasPlay').textContent = '▶ Simular'; } };
            V.anim = requestAnimationFrame(paso);
        };
        $('lasVerCmds').onclick = () => { const c = $('lasCmds'); c.hidden = !c.hidden; };
        $('lasExp2').onclick = exportar;
        const cv = $('lasCanvas');
        cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, wx = (mx - V.ox) / V.s, wy = (V.oy - my) / V.s, k = Math.exp(-e.deltaY * 0.0015); V.s *= k; V.ox = mx - wx * V.s; V.oy = my + wy * V.s; dibujarVista(); }, { passive: false });
        let arr = null;
        cv.addEventListener('pointerdown', e => { arr = { x: e.clientX, y: e.clientY, ox: V.ox, oy: V.oy }; cv.setPointerCapture(e.pointerId); });
        cv.addEventListener('pointermove', e => { if (!arr) return; V.ox = arr.ox + e.clientX - arr.x; V.oy = arr.oy + e.clientY - arr.y; dibujarVista(); });
        cv.addEventListener('pointerup', () => { arr = null; });
    }
    ov.classList.add('visible');
    const s = resumen(g.plan);
    $('lasVistaInfo').textContent = `${f1(s.corte)} mm con láser · ${fmtT(s.t)} · ${g.rd.bytes.length} bytes`;
    const d = RDCore.decode(g.rd.bytes, +A.magic);
    $('lasCmds').textContent = d.cmds.slice(0, 3000).map(c => ('000' + c.off.toString(16).toUpperCase()).slice(-4) + '  ' + (c.hex.length > 32 ? c.hex.slice(0, 31) + '…' : c.hex).padEnd(33) + ' ' + c.desc).join('\n') + (d.cmds.length > 3000 ? `\n… (${d.cmds.length - 3000} más)` : '');
    V = { plan: g.plan, f: 1, anim: null };
    $('lasSimR').value = 1000; $('lasSimT').textContent = '100 %';
    requestAnimationFrame(() => { encajarVista(); dibujarVista(); });
}
function encajarVista() {
    const cv = $('lasCanvas'), r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    cv.width = r.width * dpr; cv.height = r.height * dpr;
    const b = cajaPts([].concat(...V.plan.map(o => o.seq.map(s => ({ pts: s }))))), w = Math.max(1, b[2] - b[0]), h = Math.max(1, b[3] - b[1]), m = 30;
    V.s = Math.min((r.width - 2 * m) / w, (r.height - 2 * m) / h); V.ox = (r.width - w * V.s) / 2 - b[0] * V.s; V.oy = (r.height + h * V.s) / 2 + b[1] * V.s;
}
function dibujarVista() {
    const cv = $('lasCanvas'), ctx = cv.getContext('2d'), dpr = window.devicePixelRatio || 1, r = cv.getBoundingClientRect();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
    const X = x => V.ox + x * V.s, Y = y => V.oy - y * V.s, oscuro = document.body.classList.contains('dark-mode');
    // rejilla de 10 mm
    let paso = 10; while (paso * V.s < 8) paso *= 10;
    ctx.strokeStyle = oscuro ? '#2c2c33' : '#eceff3'; ctx.lineWidth = 1; ctx.beginPath();
    const x0 = Math.floor(-V.ox / V.s / paso) * paso, x1 = (r.width - V.ox) / V.s, y0 = Math.floor((V.oy - r.height) / V.s / paso) * paso, y1 = V.oy / V.s;
    for (let x = x0; x <= x1; x += paso) { ctx.moveTo(Math.round(X(x)) + .5, 0); ctx.lineTo(Math.round(X(x)) + .5, r.height); }
    for (let y = y0; y <= y1; y += paso) { ctx.moveTo(0, Math.round(Y(y)) + .5); ctx.lineTo(r.width, Math.round(Y(y)) + .5); }
    ctx.stroke();
    // recorrido
    const segs = []; let pos = null, total = 0;
    V.plan.forEach(o => o.seq.forEach(s => { if (pos) { segs.push({ v: true, a: pos, b: s[0] }); total += Math.hypot(s[0][0] - pos[0], s[0][1] - pos[1]); } const col = oscuro && o.L.color === '#000000' ? '#f0f0f0' : o.L.color; segs.push({ c: col, p: s }); total += largo(s); pos = s[s.length - 1]; }));
    ctx.lineJoin = ctx.lineCap = 'round';
    if (V.f < 1) { ctx.globalAlpha = .18; segs.forEach(g => { if (g.v) return; ctx.strokeStyle = g.c; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(X(g.p[0][0]), Y(g.p[0][1])); g.p.forEach(q => ctx.lineTo(X(q[0]), Y(q[1]))); ctx.stroke(); }); ctx.globalAlpha = 1; }
    const lim = total * V.f; let acc = 0, cab = null;
    for (const g of segs) {
        if (acc >= lim) break;
        if (g.v) { const l = Math.hypot(g.b[0] - g.a[0], g.b[1] - g.a[1]), t = Math.min(1, (lim - acc) / (l || 1)); const e = [g.a[0] + (g.b[0] - g.a[0]) * t, g.a[1] + (g.b[1] - g.a[1]) * t];
            ctx.setLineDash([4, 4]); ctx.strokeStyle = '#9aa3b0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(g.a[0]), Y(g.a[1])); ctx.lineTo(X(e[0]), Y(e[1])); ctx.stroke(); ctx.setLineDash([]); cab = e; acc += l; continue; }
        ctx.strokeStyle = g.c; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(X(g.p[0][0]), Y(g.p[0][1])); cab = g.p[0];
        for (let i = 1; i < g.p.length; i++) { const a = g.p[i - 1], b = g.p[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
            if (acc + l > lim) { const t = (lim - acc) / l; cab = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; ctx.lineTo(X(cab[0]), Y(cab[1])); acc = lim; break; }
            ctx.lineTo(X(b[0]), Y(b[1])); acc += l; cab = b; }
        ctx.stroke();
        if (V.f >= 1) { ctx.fillStyle = g.c; ctx.beginPath(); ctx.arc(X(g.p[0][0]), Y(g.p[0][1]), 2.4, 0, 7); ctx.fill(); }
    }
    if (V.f < 1 && cab) { ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(X(cab[0]), Y(cab[1]), 5, 0, 7); ctx.fill(); }
    // punto de referencia del cabezal
    if (A.inicio === 'current') {
        const b = cajaPts([].concat(...V.plan.map(o => o.seq.map(s => ({ pts: s }))))), rr = A.ref;
        const px = rr === 'c' ? (b[0] + b[2]) / 2 : (rr[1] === 'l' ? b[0] : b[2]), py = rr === 'c' ? (b[1] + b[3]) / 2 : (rr[0] === 'b' ? b[1] : b[3]);
        ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(px) - 9, Y(py)); ctx.lineTo(X(px) + 9, Y(py)); ctx.moveTo(X(px), Y(py) - 9); ctx.lineTo(X(px), Y(py) + 9); ctx.stroke();
        ctx.fillStyle = '#e67e22'; ctx.font = '11px Segoe UI, sans-serif'; ctx.fillText('cabezal', X(px) + 8, Y(py) + 16);
    }
}

// ───────── 🟫 Mesa: la superficie útil, el cero máquina y la pieza con su cero pieza ─────────
function dibujarMesa() {
    if (!A.mesa) return;
    const m = mesaMundo(), p0 = aPantalla({ x: m.x0, y: m.y1 }), p1 = aPantalla({ x: m.x1, y: m.y0 }), z = aPantalla({ x: m.zx, y: m.zy });
    const oscuro = document.body.classList.contains('dark-mode');
    ctx.save();
    ctx.fillStyle = oscuro ? 'rgba(210,160,90,.07)' : 'rgba(205,150,80,.10)';
    ctx.fillRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
    ctx.strokeStyle = oscuro ? '#c89a5a' : '#b9772e'; ctx.lineWidth = 2; ctx.strokeRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
    ctx.fillStyle = ctx.strokeStyle; ctx.font = '600 12px Segoe UI, sans-serif'; ctx.textBaseline = 'bottom';
    ctx.textAlign = A.origen[1] === 'r' ? 'left' : 'right';
    ctx.fillText(`Mesa útil ${A.W} × ${A.H} mm`, A.origen[1] === 'r' ? p0.x + 4 : p1.x - 4, p0.y - 4);
    // el cero máquina y el sentido de sus ejes
    const dx = A.origen[1] === 'r' ? -1 : 1, dy = A.origen[0] === 't' ? 1 : -1;
    ctx.fillStyle = '#e67e22'; ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(z.x, z.y, 7, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(z.x, z.y); ctx.lineTo(z.x + dx * 40, z.y); ctx.moveTo(z.x, z.y); ctx.lineTo(z.x, z.y + dy * 40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(z.x + dx * 46, z.y); ctx.lineTo(z.x + dx * 38, z.y - 4); ctx.lineTo(z.x + dx * 38, z.y + 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(z.x, z.y + dy * 46); ctx.lineTo(z.x - 4, z.y + dy * 38); ctx.lineTo(z.x + 4, z.y + dy * 38); ctx.fill();
    ctx.font = '600 11px Segoe UI, sans-serif'; ctx.textBaseline = 'middle';
    ctx.textAlign = dx < 0 ? 'right' : 'left'; ctx.fillText('X', z.x + dx * 50, z.y);
    ctx.textAlign = 'center'; ctx.fillText('Y', z.x, z.y + dy * 56);
    ctx.textAlign = dx < 0 ? 'right' : 'left'; ctx.textBaseline = dy > 0 ? 'bottom' : 'top';
    ctx.fillText('Cero máquina', z.x + dx * 12, z.y - dy * 10);
    // la pieza: su caja, en rojo si se sale
    let b = null; try { const t = trazadosActuales(); if (t.length) b = cajaPts(t); } catch (e) {}
    if (b) {
        const f = fueraDeMesa(b), sale = Object.values(f).some(v => v > 1e-6), q0 = aPantalla({ x: b[0], y: b[3] }), q1 = aPantalla({ x: b[2], y: b[1] });
        ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5; ctx.strokeStyle = sale ? '#e74c3c' : '#27ae60';
        ctx.strokeRect(q0.x - 3, q0.y - 3, q1.x - q0.x + 6, q1.y - q0.y + 6); ctx.setLineDash([]);
    }
    // el cero pieza, con su posición en la máquina
    const o = aPantalla({ x: 0, y: 0 });
    ctx.fillStyle = colores.acento; ctx.font = '600 11px Segoe UI, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.textBaseline = 'bottom'; ctx.fillText(`Cero pieza · X ${f1(A.cpX)}  Y ${f1(A.cpY)}`, o.x + 8, o.y - 40);
    // el cabezal al empezar (con «posición actual»)
    if (b && A.inicio === 'current') {
        const r = A.ref, px = r === 'c' ? (b[0] + b[2]) / 2 : (r[1] === 'l' ? b[0] : b[2]), py = r === 'c' ? (b[1] + b[3]) / 2 : (r[0] === 'b' ? b[1] : b[3]), c = aPantalla({ x: px, y: py });
        ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c.x, c.y, 6, 0, 7); ctx.moveTo(c.x - 10, c.y); ctx.lineTo(c.x + 10, c.y); ctx.moveTo(c.x, c.y - 10); ctx.lineTo(c.x, c.y + 10); ctx.stroke();
        ctx.fillStyle = '#e67e22'; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('cabezal al empezar', c.x - 10, c.y + 22);
    }
    ctx.restore();
}
function pintarCajaMesa() {
    const caja = $('lasMesaBox'); if (!caja) return;
    caja.hidden = !A.mesa; if (!A.mesa) return;
    asegurarCero();
    const xs = A.origen[1] === 'r' ? '←' : '→', ys = A.origen[0] === 't' ? '↓' : '↑';
    if (document.activeElement !== $('lasCpX')) $('lasCpX').value = A.cpX;
    if (document.activeElement !== $('lasCpY')) $('lasCpY').value = A.cpY;
    $('lasMesaEjes').textContent = `X ${xs}  Y ${ys}`;
    let est = 'Dibuja o abre una pieza', cl = '';
    try { const t = trazadosActuales(); if (t.length) { const b = cajaPts(t), f = fueraDeMesa(b), lados = Object.keys(f).filter(k => f[k] > 1e-6);
        if (b[2] - b[0] > A.W || b[3] - b[1] > A.H) { est = `La pieza (${f1(b[2] - b[0])} × ${f1(b[3] - b[1])} mm) no cabe`; cl = 'mal'; }
        else if (lados.length) { est = 'Se sale ' + lados.map(k => ({ izq: 'por la izquierda', der: 'por la derecha', abajo: 'por abajo', arriba: 'por arriba' })[k] + ' ' + f1(f[k]) + ' mm').join(', '); cl = 'mal'; }
        else { est = `✓ La pieza (${f1(b[2] - b[0])} × ${f1(b[3] - b[1])} mm) cabe en la mesa`; cl = 'bien'; } } } catch (e) {}
    const e = $('lasMesaEstado'); e.textContent = est; e.className = 'estado ' + cl;
}
function verMesa() {
    const m = mesaMundo(), w = m.x1 - m.x0, h = m.y1 - m.y0;
    view.z = Math.min((W - 80) / w, (H - 80) / h); view.cx = (m.x0 + m.x1) / 2; view.cy = (m.y0 + m.y1) / 2; render();
}
function montarMesa() {
    const nom = $('projectName'); if (!nom || $('lasMesa')) return;
    const lab = document.createElement('label'); lab.className = 'las-mesa-chk'; lab.title = 'Enseña la mesa de la láser (superficie útil), el cero máquina y dónde está la pieza con su cero pieza';
    lab.innerHTML = `<input type="checkbox" id="lasMesa"${A.mesa ? ' checked' : ''}> 🟫 Mesa`;
    nom.after(lab);
    const caja = document.createElement('div'); caja.className = 'las-mesa-box'; caja.id = 'lasMesaBox'; caja.hidden = true;
    caja.innerHTML = `<div class="tit"><span>🟫 Mesa de la láser</span><span id="lasMesaEjes" class="nota" style="grid-column:auto"></span></div>
        <div class="nota">Cero pieza desde el cero máquina (como en el panel de la máquina):</div>
        <label for="lasCpX">X</label><input type="number" id="lasCpX" step="1"><label for="lasCpY">Y</label><input type="number" id="lasCpY" step="1">
        <div class="bots"><button id="lasCentrar" title="Coloca la pieza en el centro de la mesa">Centrar la pieza</button><button id="lasVerMesa" title="Encuadra toda la mesa">⤢ Ver la mesa</button></div>
        <div id="lasMesaEstado" class="estado"></div>
        <div class="nota">La mesa, su tamaño y el cero máquina se cambian en 🔥 Láser → ⚙️ Máquina.</div>`;
    cv.parentNode.appendChild(caja);
    const cambio = () => { guardar(); pintarCajaMesa(); pintarResumen(); render(); };
    $('lasMesa').addEventListener('change', e => { A.mesa = e.target.checked; asegurarCero(); cambio(); if (A.mesa) verMesa(); });
    ['lasCpX', 'lasCpY'].forEach(id => $(id).addEventListener('change', e => { const v = parseFloat(String(e.target.value).replace(',', '.')); if (isFinite(v)) A[id === 'lasCpX' ? 'cpX' : 'cpY'] = v; cambio(); }));
    $('lasCentrar').onclick = () => { centrarEnMesa(); cambio(); };
    $('lasVerMesa').onclick = verMesa;
    // la mesa se dibuja debajo de la pieza, antes de los ejes
    const ejes = window.dibujarEjes;
    if (typeof ejes === 'function') window.dibujarEjes = function () { try { dibujarMesa(); } catch (e) { console.error('Mesa', e); } return ejes.apply(this, arguments); };
    setInterval(() => { if (A.mesa) pintarCajaMesa(); }, 800);
    pintarCajaMesa(); render();
}
window.addEventListener('load', () => setTimeout(montarMesa, 200));
// si cambia la mesa en ⚙️ Máquina, se vuelve a dibujar
document.addEventListener('change', e => { if (e.target && /^las(W|H|Origen|Inicio|Ref)$/.test(e.target.id)) { pintarCajaMesa(); render(); } });

window.LASER = { mesaMundo, fueraDeMesa, centrarEnMesa, RDCore, plan, generarRD, trazadosGcode, trazadosDibujo, ajustes: () => A, abrirGcodeTexto: (texto, nombre) => { const g = trazadosGcode(texto); gcode = { nombre, base: nombre.replace(/\.[^.]+$/, ''), trazados: g.trazados, avisos: g.avisos }; pintarFuente(); pintarResumen(); return gcode; }, volverAlDibujo: () => { gcode = null; pintarFuente(); pintarResumen(); } };
window.addEventListener('load', () => setTimeout(montar, 150));
})();
