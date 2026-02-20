/**
 * AstroEngine - 极轻量微型星历引擎 (基于 J2000.0 轨道根数)
 * 用于推算日月及五大行星地心黄经与逆行状态
 */
const AstroEngine = (() => {
    const RAD = Math.PI / 180;
    const DEG = 180 / Math.PI;
    const rev = (a) => { let r = a % 360; if (r < 0) r += 360; return r; };
    const solveKepler = (M, e) => {
        let E = M + e * Math.sin(M * RAD) * (1.0 + e * Math.cos(M * RAD));
        for (let i = 0; i < 3; i++) E = E - (E - e * DEG * Math.sin(E * RAD) - M) / (1 - e * Math.cos(E * RAD));
        return E;
    };
    const Z_SIGNS = [{ n: "白羊座", e: "Aries" }, { n: "金牛座", e: "Taurus" }, { n: "双子座", e: "Gemini" }, { n: "巨蟹座", e: "Cancer" }, { n: "狮子座", e: "Leo" }, { n: "处女座", e: "Virgo" }, { n: "天秤座", e: "Libra" }, { n: "天蝎座", e: "Scorpio" }, { n: "射手座", e: "Sagittarius" }, { n: "摩羯座", e: "Capricorn" }, { n: "水瓶座", e: "Aquarius" }, { n: "双鱼座", e: "Pisces" }];
    const calculateAll = (d) => {
        const w_s = rev(282.9404 + 4.70935E-5 * d), e_s = 0.016709 - 1.151E-9 * d, M_s = rev(356.0470 + 0.9856002585 * d);
        const E_s = solveKepler(M_s, e_s), xv_s = Math.cos(E_s * RAD) - e_s, yv_s = Math.sin(E_s * RAD) * Math.sqrt(1.0 - e_s * e_s);
        const r_s = Math.sqrt(xv_s * xv_s + yv_s * yv_s), lon_s = rev(rev(Math.atan2(yv_s, xv_s) * DEG) + w_s);
        const xs = r_s * Math.cos(lon_s * RAD), ys = r_s * Math.sin(lon_s * RAD);
        const calcMoon = (dd) => {
            const N = rev(125.1228 - 0.0529538083 * dd), i = 5.1454, w = rev(318.0634 + 0.1643573223 * dd), a = 60.2666, e = 0.0549, M = rev(115.3654 + 13.0649929509 * dd), E = solveKepler(M, e);
            const xv = a * (Math.cos(E * RAD) - e), yv = a * (Math.sqrt(1.0 - e * e) * Math.sin(E * RAD)), v = rev(Math.atan2(yv, xv) * DEG), r = Math.sqrt(xv * xv + yv * yv);
            let lm = rev(v + w); const L = rev(N + w + M), Ms = rev(356.047 + 0.9856 * dd), D = rev(L - (rev(w_s + Ms))), F = rev(L - N);
            lm += -1.274 * Math.sin((M - 2 * D) * RAD) + 0.658 * Math.sin(2 * D * RAD) - 0.185 * Math.sin(Ms * RAD) - 0.114 * Math.sin(2 * F * RAD);
            return rev(lm);
        };
        const p_els = {
            mercury: { N: 48.3313, dN: 3.24587E-5, i: 7.0047, di: 5E-8, w: 77.4564, dw: 1.55448E-7, a: 0.387098, e: 0.205635, de: 5.59E-10, M: 168.6562, dM: 4.0923344368 },
            venus: { N: 76.6799, dN: 2.4659E-5, i: 3.3946, di: 2.75E-8, w: 131.9461, dw: 1.39651E-7, a: 0.72333, e: 0.006773, de: -1.302E-9, M: 48.0052, dM: 1.6021302244 },
            mars: { N: 49.5574, dN: 2.11081E-5, i: 1.8497, di: -1.78E-8, w: 336.0408, dw: 4.44033E-7, a: 1.523688, e: 0.093405, de: 2.516E-9, M: 18.6021, dM: 0.5240207766 },
            jupiter: { N: 100.4542, dN: 2.76854E-5, i: 1.303, di: -1.557E-9, w: 273.8677, dw: 1.64505E-7, a: 5.20256, e: 0.048498, de: 4.469E-9, M: 19.895, dM: 0.0830853001 },
            saturn: { N: 113.6634, dN: 2.3898E-5, i: 2.4886, di: -1.081E-9, w: 339.3939, dw: 2.97661E-7, a: 9.55475, e: 0.055546, de: -9.499E-9, M: 316.967, dM: 0.0334442282 }
        };
        const calcP = (name, dd) => {
            const el = p_els[name], N = rev(el.N + el.dN * dd), i = el.i + el.di * dd, w = rev(el.w + el.dw * dd), a = el.a, e = el.e + el.de * dd, M = rev(el.M + el.dM * dd), E = solveKepler(M, e);
            const xv = a * (Math.cos(E * RAD) - e), yv = a * (Math.sqrt(1.0 - e * e) * Math.sin(E * RAD)), v = rev(Math.atan2(yv, xv) * DEG), r = Math.sqrt(xv * xv + yv * yv);
            const xh = r * (Math.cos(N * RAD) * Math.cos((v + w) * RAD) - Math.sin(N * RAD) * Math.sin((v + w) * RAD) * Math.cos(i * RAD)), yh = r * (Math.sin(N * RAD) * Math.cos((v + w) * RAD) + Math.cos(N * RAD) * Math.sin((v + w) * RAD) * Math.cos(i * RAD));
            return rev(Math.atan2(yh + ys, xh + xs) * DEG);
        };
        return { sun: lon_s, moon: calcMoon(d), mercury: calcP('mercury', d), venus: calcP('venus', d), mars: calcP('mars', d), jupiter: calcP('jupiter', d), saturn: calcP('saturn', d) };
    };
    return {
        getEphemeris: (date) => {
            const d = (date.getTime() / 86400000) + 2440587.5 - 2451545.0;
            const cur = calculateAll(d), pas = calculateAll(d - 0.1), res = {};
            for (let k in cur) {
                let diff = cur[k] - pas[k]; if (diff > 180) diff -= 360; if (diff < -180) diff += 360;
                const z = Z_SIGNS[Math.floor(cur[k] / 30)];
                res[k] = { lon: cur[k], zN: z.n, zE: z.e, isR: (k !== 'sun' && k !== 'moon' && diff < 0) };
            }
            return res;
        }
    };
})();