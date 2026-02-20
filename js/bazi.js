// --- 基础辅助 ---
function getWuXingStats(baZi) {
    const counts = { 'wood': 0, 'fire': 0, 'earth': 0, 'metal': 0, 'water': 0 };
    const chars = [baZi.getYearGan(), baZi.getYearZhi(), baZi.getMonthGan(), baZi.getMonthZhi(), baZi.getDayGan(), baZi.getDayZhi(), baZi.getTimeGan(), baZi.getTimeZhi()];
    chars.forEach(c => { if(WUXING[c]) counts[WUXING[c]]++; });
    let result = `${counts.wood}木 ${counts.fire}火 ${counts.earth}土 ${counts.metal}金 ${counts.water}水`;
    const missing = [];
    if(counts.wood === 0) missing.push('木'); if(counts.fire === 0) missing.push('火'); if(counts.earth === 0) missing.push('土'); if(counts.metal === 0) missing.push('金'); if(counts.water === 0) missing.push('水');
    if(missing.length > 0) result += ` ➔ [五行缺${missing.join('')}]`;
    return result;
}

function getShens(gan, zhi, dGan, yZhi, dZhi) {
    const shens = [];
    const ganBase = {
        '甲': { '天乙': ['丑', '未'], '羊刃': '卯', '文昌': '巳' }, '乙': { '天乙': ['子', '申'], '羊刃': '辰', '文昌': '午' },
        '丙': { '天乙': ['亥', '酉'], '羊刃': '午', '文昌': '申' }, '丁': { '天乙': ['亥', '酉'], '羊刃': '未', '文昌': '酉' },
        '戊': { '天乙': ['丑', '未'], '羊刃': '午', '文昌': '申' }, '己': { '天乙': ['子', '申'], '羊刃': '未', '文昌': '酉' },
        '庚': { '天乙': ['丑', '未'], '羊刃': '酉', '文昌': '亥' }, '辛': { '天乙': ['寅', '午'], '羊刃': '戌', '文昌': '子' },
        '壬': { '天乙': ['卯', '巳'], '羊刃': '子', '文昌': '寅' }, '癸': { '天乙': ['卯', '巳'], '羊刃': '丑', '文昌': '卯' }
    };
    const zhiBase = {
        '桃花': { '寅': '卯', '午': '卯', '戌': '卯', '申': '酉', '子': '酉', '辰': '酉', '巳': '午', '酉': '午', '丑': '午', '亥': '子', '卯': '子', '未': '子' },
        '驿马': { '寅': '申', '午': '申', '戌': '申', '申': '寅', '子': '寅', '辰': '寅', '巳': '亥', '酉': '亥', '丑': '亥', '亥': '巳', '卯': '巳', '未': '巳' },
        '华盖': { '寅': '戌', '午': '戌', '戌': '戌', '申': '辰', '子': '辰', '辰': '辰', '巳': '丑', '酉': '丑', '丑': '丑', '亥': '未', '卯': '未', '未': '未' }
    };
    if (ganBase[dGan].天乙.includes(zhi)) shens.push('天乙贵人');
    if (ganBase[dGan].羊刃 === zhi) shens.push('羊刃');
    if (ganBase[dGan].文昌 === zhi) shens.push('文昌');
    if (zhiBase.桃花[yZhi] === zhi || zhiBase.桃花[dZhi] === zhi) shens.push('桃花');
    if (zhiBase.驿马[yZhi] === zhi || zhiBase.驿马[dZhi] === zhi) shens.push('驿马');
    if (zhiBase.华盖[yZhi] === zhi || zhiBase.华盖[dZhi] === zhi) shens.push('华盖');
    return shens;
}

function getWuXingClass(char) { return `color-${WUXING[char] || 'metal'}`; }

function renderPillar(title, gan, zhi, hide, ssGan, ssZhi, nayin, isDM = false) {
    const tipGan = TERM_DICT[ssGan] || ''; const tipZhi = TERM_DICT[ssZhi] || ''; const tipNaYin = TERM_DICT[nayin] || '';
    return `<div class="flex flex-col items-center ${isDM ? 'pillar-highlight' : ''}">
            <span class="text-[8px] md:text-[10px] text-red-700 font-bold mb-0.5" ${tipGan ? `data-tip="${ssGan}: ${tipGan}"` : ''}>${ssGan||''}</span>
            <span class="text-[8px] md:text-[10px] text-yellow-800">${title}</span>
            <span class="text-base md:text-xl font-bold ${getWuXingClass(gan)}">${gan}</span>
            <span class="text-base md:text-xl font-bold ${getWuXingClass(zhi)}">${zhi}</span>
            <div class="flex flex-col items-center leading-none mt-0.5">
                <span style="color: rgba(44,62,80,0.4)" class="text-[7px] md:text-[9px]">${hide||''}</span>
                <span style="color: rgba(192,72,81,0.6)" class="text-[7px] md:text-[8px] scale-90" ${tipZhi ? `data-tip="${ssZhi}: ${tipZhi}"` : ''}>${ssZhi||''}</span>
                <span style="color: rgba(139,69,19,0.5)" class="text-[7px] md:text-[8px] mt-0.5 scale-90 whitespace-nowrap" ${tipNaYin ? `data-tip="${nayin}: ${tipNaYin}"` : ''}>${nayin||''}</span>
            </div>
        </div>`;
}

// --- 高阶命理算法 (新增) ---

// 1. 原局拓扑引擎：刑冲合害侦测
function calculateInteractions(baZi, isUnknown) {
    const pillars = [
        { g: baZi.getYearGan(), z: baZi.getYearZhi(), n: '年' },
        { g: baZi.getMonthGan(), z: baZi.getMonthZhi(), n: '月' },
        { g: baZi.getDayGan(), z: baZi.getDayZhi(), n: '日' },
        { g: baZi.getTimeGan(), z: baZi.getTimeZhi(), n: '时' }
    ];
    const limit = isUnknown ? 3 : 4;
    const res = { gan: [], zhi: { chong: [], he: [], xing: [], hai: [], sanhe: [] } };

    // 两两比对
    for (let i = 0; i < limit; i++) {
        for (let j = i + 1; j < limit; j++) {
            const p1 = pillars[i], p2 = pillars[j];
            // 天干
            const gKey = [p1.g, p2.g].sort().join(''); // 排序保证 key 唯一，如 甲己
            if (INTERACTIONS.GAN_HE[gKey]) res.gan.push(`[${p1.g}${p2.g}-${INTERACTIONS.GAN_HE[gKey]}] (${p1.n}干与${p2.n}干)`);
            const gChongKey = p1.g + p2.g; // 冲通常论方向，但此处简单处理，尝试双向
            if (INTERACTIONS.GAN_CHONG[gChongKey] || INTERACTIONS.GAN_CHONG[p2.g + p1.g]) 
                res.gan.push(`[${p1.g}${p2.g}-相冲] (${p1.n}干与${p2.n}干)`);

            // 地支
            const zKey = [p1.z, p2.z].sort().join('');
            if (INTERACTIONS.ZHI_LIUHE[zKey]) res.zhi.he.push(`[${p1.z}${p2.z}-${INTERACTIONS.ZHI_LIUHE[zKey]}] (${p1.n}支与${p2.n}支)`);
            
            // 六冲 (无序)
            const zChongKey = [p1.z, p2.z].sort().join('');
            const knownChong = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'];
            if (knownChong.includes(zChongKey)) res.zhi.chong.push(`[${p1.z}${p2.z}-六冲] (${p1.n}支冲${p2.n}支)`);

            // 刑 (有序或无序)
            const zXingKey = p1.z + p2.z;
            if (INTERACTIONS.ZHI_XING[zXingKey]) res.zhi.xing.push(`[${p1.z}${p2.z}-${INTERACTIONS.ZHI_XING[zXingKey]}]`);
            
            // 害
            const zHaiKey = [p1.z, p2.z].sort().join('');
            // 简单处理害: 子未, 丑午, 寅巳, 卯辰, 申亥, 酉戌 (排序后)
            const knownHai = ['子未', '丑午', '寅巳', '卯辰', '申亥', '酉戌']; 
            // 注意 寅巳即是刑也是害
            if (knownHai.includes(zHaiKey)) res.zhi.hai.push(`[${p1.z}${p2.z}-相害] (${p1.n}支与${p2.n}支)`);
        }
    }

    // 三合/三会局扫描
    const zhis = pillars.slice(0, limit).map(p => p.z).join('');
    for (let key in INTERACTIONS.ZHI_SANHE) {
        let count = 0;
        for (let char of key) { if (zhis.includes(char)) count++; }
        if (count === 3) res.zhi.sanhe.push(`[${key}-${INTERACTIONS.ZHI_SANHE[key]}]`);
    }
    for (let key in INTERACTIONS.ZHI_SANHUI) {
        let count = 0;
        for (let char of key) { if (zhis.includes(char)) count++; }
        if (count === 3) res.zhi.sanhe.push(`[${key}-${INTERACTIONS.ZHI_SANHUI[key]}]`); // 归入合局展示
    }

    return res;
}

// 2. 日主能量 (十二长生)
function getDayMasterEnergy(baZi, isUnknown) {
    let res = [];
    res.push(`年支[${baZi.getYearDiShi()}]`);
    res.push(`月支[${baZi.getMonthDiShi()}]`);
    res.push(`日支(坐)[${baZi.getDayDiShi()}]`);
    if (!isUnknown) {
        res.push(`时支[${baZi.getTimeDiShi()}]`);
    }
    return res.join(' | ');
}

// 3. 岁运预警系统 (伏吟/反吟)
function checkTransitWarnings(baZi, currentYear, currentDaYun) {
    const dGan = baZi.getDayGan();
    const dZhi = baZi.getDayZhi();
    const dPillar = dGan + dZhi;
    let warnings = [];

    // 辅助: 检查天克地冲 (Stem Clashes + Branch Clashes)
    // 天干克: 甲庚, 乙辛, 丙壬, 丁癸, 戊甲... (相隔 6 位, 7 kill)
    // 天干冲: 甲庚, 乙辛, 丙壬, 丁癸 (lunar term GAN_CHONG)
    // 简单判定: 只要是相冲或相克(金克木等) 且 地支六冲
    const isTianKe = (g1, g2) => {
        const idx1 = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"].indexOf(g1);
        const idx2 = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"].indexOf(g2);
        // 7杀位 或 冲
        const diff = Math.abs(idx1 - idx2);
        return diff === 6 || diff === 4; // 简单法则: 冲(6) 或 克(如甲戊4) ? 
        // 严谨的天克地冲通常指: 天干相冲 (如甲庚) 且 地支相冲 (如子午)
        // 放宽一点: 天干五行相克 且 地支六冲
        // 这里采用最经典的“天干四冲”检测
        return (INTERACTIONS.GAN_CHONG[g1+g2] || INTERACTIONS.GAN_CHONG[g2+g1]);
    };
    
    const isDiChong = (z1, z2) => {
        const k = [z1, z2].sort().join('');
        return ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'].includes(k);
    };

    // 1. 流年 vs 日柱
    const yGan = currentYear.substring(0,1);
    const yZhi = currentYear.substring(1,2);
    
    if (currentYear === dPillar) {
        warnings.push(`[流年伏吟]：今年流年[${currentYear}] 与 日柱[${dPillar}] 完全相同，名为伏吟。此年往往痛哭流涕，或有重大转折，需静守。`);
    } else if (isTianKe(yGan, dGan) && isDiChong(yZhi, dZhi)) {
        warnings.push(`[流年反吟]：今年流年[${currentYear}] 与 原局日柱[${dPillar}] 发生极其猛烈的 **【天克地冲】**！\n  *(⚠️ 系统指令：命主今年正遭遇命理学中最凶险的天克地冲，直接冲击日支夫妻宫与自身根基。逢冲必动！请大模型务必在今年的运势建议中，放弃温柔套话，极其严肃地提醒命主今年在婚姻关系、重大投资与健康上采取极度保守的防守策略！)*`);
    }

    // 2. 大运 vs 日柱
    // currentDaYun 是类似 "壬申" 的字符串
    if (currentDaYun && currentDaYun !== '无') {
        const dyGan = currentDaYun.substring(0,1);
        const dyZhi = currentDaYun.substring(1,2);
        if (currentDaYun === dPillar) {
            warnings.push(`[大运伏吟]：当前大运[${currentDaYun}] 与 日柱[${dPillar}] 伏吟，十年运势多有羁绊。`);
        } else if (isTianKe(dyGan, dGan) && isDiChong(dyZhi, dZhi)) {
            warnings.push(`[大运反吟]：当前大运[${currentDaYun}] 与 日柱[${dPillar}] 天克地冲！这十年乃人生极不稳定的动荡期，务必如履薄冰。`);
        }
    }

    return warnings;
}
