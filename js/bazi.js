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