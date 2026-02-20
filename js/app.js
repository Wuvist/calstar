function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.remove('active-grid', 'active-flex');
    });
    const target = document.getElementById('tab-' + tabId);
    if (tabId === 'chart') target.classList.add('active-grid');
    else target.classList.add('active-flex');
    
    document.querySelectorAll('[id^="tabBtn-"]').forEach(b => b.classList.remove('border-yellow-900', 'text-yellow-900'));
    document.querySelectorAll('[id^="tabBtn-"]').forEach(b => b.classList.add('border-transparent', 'text-gray-400'));
    document.getElementById('tabBtn-' + tabId).classList.add('border-yellow-900', 'text-yellow-900');
    document.getElementById('tabBtn-' + tabId).classList.remove('border-transparent', 'text-gray-400');
}

let currentReportStyle = 'cure';
let currentReportGoal = 'all';

const STYLE_CONFIG = {
    'cure': { name: '✨ 闺蜜', label: '性格标签', code: '能量代码', element: '五行属性' },
    'pro': { name: '⚖️ 专业', label: '十神格局', code: '干支代码', element: '纳音属性' },
    'sharp': { name: '🚀 犀利', label: '竞争权重', code: '底层逻辑', element: '生存资源' },
    'mystic': { name: '🔮 灵性', label: '灵魂契约', code: '星命代码', element: '本源能量' }
};

const GOAL_CONFIG = {
    'all': { name: '🌈 全面', focus: '全景解析性格肖像、情感模式、事业潜能及当下岁运。' },
    'love': { name: '💑 情感', focus: '深度剖析情感观、正缘特征、婚恋契机及亲密关系中的潜意识课题。' },
    'career': { name: '💰 事业', focus: '侧重于天赋才华、财富爆发点、职场竞争优势及商业决策建议。' },
    'transit': { name: '📅 运势', focus: '锁定当前流年与大运的能量互动，给出近期（1-2年）的行动避坑指南与机遇预警。' }
};

window.onload = function() {
    let lastData = JSON.parse(localStorage.getItem('bazi_last_input')) || {};
    
    if (window.location.hash) {
        try {
            const params = new URLSearchParams(window.location.hash.substring(1));
            const hashData = {};
            for (const [key, value] of params.entries()) {
                if (['y','m','d','hh','mm'].includes(key)) hashData[key] = parseInt(value);
                else if (key === 'gender') hashData[key] = value;
                else if (key === 'unknown' || key === 'useSolar') hashData[key] = value === 'true';
                else if (['province','city','district','cal','style','goal'].includes(key)) hashData[key] = decodeURIComponent(value);
            }
            if (Object.keys(hashData).length > 0) lastData = hashData;
        } catch(e) { console.error("Hash parse error", e); }
    }

    const now = new Date();
    const defY = lastData.y || now.getFullYear(), defM = lastData.m || (now.getMonth() + 1), defD = lastData.d || now.getDate();
    const defH = lastData.hh !== undefined ? lastData.hh : now.getHours(), defMin = lastData.mm !== undefined ? lastData.mm : now.getMinutes();
    const defGen = lastData.gender || "1", defUnk = lastData.unknown || false, defCal = lastData.cal || "solar";
    let defProv = lastData.province || "北京", defCity = lastData.city || "北京市", defDist = lastData.district || "全境", defUseSolar = lastData.useSolar || false;
    
    if (lastData.style) currentReportStyle = lastData.style;
    if (lastData.goal) currentReportGoal = lastData.goal;

    if (!CITY_DATA[defProv]) {
        const norm = defProv.replace(/[市省]$/, "");
        if (CITY_DATA[norm]) defProv = norm;
        else if (CITY_DATA[defProv + "省"]) defProv = defProv + "省";
        else defProv = Object.keys(CITY_DATA)[0];
    }

    const yearSel = document.getElementById('inputYear'), monthSel = document.getElementById('inputMonth'), daySel = document.getElementById('inputDay');
    const hourSel = document.getElementById('inputHour'), minSel = document.getElementById('inputMin');
    const unkCheck = document.getElementById('timeUnknown'), provSel = document.getElementById('provinceSel'), citySel = document.getElementById('citySel'), distSel = document.getElementById('distSel'), solarCheck = document.getElementById('useSolarTime');

    for(let i=1900; i<=2100; i++) yearSel.add(new Option(i + '年', i, i===defY, i===defY));
    for(let i=0; i<24; i++) hourSel.add(new Option(String(i).padStart(2, '0') + '时', i, i===defH, i===defH));
    for(let i=0; i<60; i++) minSel.add(new Option(String(i).padStart(2, '0') + '分', i, i===defMin, i===defMin));
    Object.keys(CITY_DATA).forEach(p => provSel.add(new Option(p, p, p===defProv, p===defProv)));

    function getCalType() { return document.querySelector('input[name="calType"]:checked').value; }
    function updateCityOptions() {
        citySel.innerHTML = ''; const p = provSel.value;
        if (!CITY_DATA[p]) return;
        Object.keys(CITY_DATA[p][2]).forEach(c => citySel.add(new Option(c, c, c===defCity, c===defCity)));
        updateDistOptions();
    }
    function updateDistOptions() {
        distSel.innerHTML = ''; distSel.add(new Option("全境", "全境"));
        const p = provSel.value, c = citySel.value;
        if (CITY_DATA[p] && CITY_DATA[p][2][c] && CITY_DATA[p][2][c][2]) {
            Object.keys(CITY_DATA[p][2][c][2]).forEach(d => distSel.add(new Option(d, d, d===defDist, d===defDist)));
        }
    }
    function updateDayOptions() {
        const y = parseInt(yearSel.value), type = getCalType(); monthSel.innerHTML = ''; daySel.innerHTML = '';
        if (type === 'solar') {
            for(let i=1; i<=12; i++) monthSel.add(new Option(String(i).padStart(2, '0') + '月', i, i===defM, i===defM));
            const last = new Date(y, parseInt(monthSel.value), 0).getDate();
            for(let i=1; i<=last; i++) daySel.add(new Option(String(i).padStart(2, '0') + '日', i, i===Math.min(defD, last), i===Math.min(defD, last)));
        } else {
            const months = LunarYear.fromYear(y).getMonths();
            months.forEach(m => monthSel.add(new Option(m.isLeap() ? "闰" + LUNAR_MONTHS[m.getMonth()-1] : LUNAR_MONTHS[m.getMonth()-1], m.getMonth() * (m.isLeap() ? -1 : 1))));
            const mVal = parseInt(monthSel.value); const m = months.find(mm => mm.getMonth() === Math.abs(mVal) && mm.isLeap() === (mVal < 0)) || months[0];
            for(let i=1; i<=m.getDayCount(); i++) daySel.add(new Option(LUNAR_DAYS[i-1], i));
        }
    }

    document.querySelectorAll('input[name="calType"]').forEach(r => r.onchange = () => { updateDayOptions(); updateDisplay(); });
    yearSel.onchange = () => { updateDayOptions(); updateDisplay(); };
    monthSel.onchange = () => { updateDisplay(); };
    daySel.onchange = updateDisplay; hourSel.onchange = updateDisplay; minSel.onchange = updateDisplay;
    provSel.onchange = () => { updateCityOptions(); updateDisplay(); }; citySel.onchange = () => { updateDistOptions(); updateDisplay(); }; distSel.onchange = updateDisplay;
    solarCheck.onchange = updateDisplay;
    unkCheck.onchange = () => { document.getElementById('timeInputGroup').style.opacity = unkCheck.checked ? "0.3" : "1"; updateDisplay(); };

    const shichenGrid = document.getElementById('shichenGrid');
    BRANCHES.forEach((b, i) => {
        const btn = document.createElement('button'); btn.innerText = b + '时';
        btn.className = "px-2 py-0.5 text-[9px] border border-yellow-300 rounded hover:bg-yellow-100 transition sc-btn";
        btn.onclick = () => { unkCheck.checked = false; hourSel.value = (i * 2 + 23) % 24; minSel.value = 0; updateDisplay(); };
        shichenGrid.appendChild(btn);
    });

    updateCityOptions(); updateDistOptions(); updateDayOptions(); 
    document.querySelector(`input[name="calType"][value="${defCal}"]`).checked = true;
    unkCheck.checked = defUnk; solarCheck.checked = defUseSolar;
    document.getElementById('timeInputGroup').style.opacity = defUnk ? "0.3" : "1";
    document.querySelector(`input[name="gender"][value="${defGen}"]`).checked = true;
    
    setReportStyle(currentReportStyle);
    setReportGoal(currentReportGoal);

    document.getElementById('btnCalculate').onclick = updateDisplay;
    updateDisplay();
};

function updateHash(data) {
    const params = new URLSearchParams();
    Object.keys(data).forEach(key => params.set(key, data[key]));
    params.set('style', currentReportStyle);
    params.set('goal', currentReportGoal);
    window.history.replaceState(null, null, "#" + params.toString());
}

function setReportStyle(style) {
    currentReportStyle = style;
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.classList.remove('active-style', 'border-yellow-300', 'text-yellow-900', 'bg-yellow-100');
        btn.classList.add('border-yellow-100', 'text-gray-500');
    });
    const active = document.getElementById('style-' + style);
    if (active) {
        active.classList.add('active-style', 'border-yellow-300', 'text-yellow-900', 'bg-yellow-100');
        active.classList.remove('border-yellow-100', 'text-gray-500');
    }
    updateHint();
    if (document.getElementById('mdOutput')) updateDisplay();
}

function setReportGoal(goal) {
    currentReportGoal = goal;
    document.querySelectorAll('.goal-btn').forEach(btn => {
        btn.classList.remove('active-goal', 'border-yellow-300', 'text-yellow-900', 'bg-yellow-100');
        btn.classList.add('border-yellow-100', 'text-gray-500');
    });
    const active = document.getElementById('goal-' + goal);
    if (active) {
        active.classList.add('active-goal', 'border-yellow-300', 'text-yellow-900', 'bg-yellow-100');
        active.classList.remove('border-yellow-100', 'text-gray-500');
    }
    updateHint();
    if (document.getElementById('mdOutput')) updateDisplay();
}

function updateHint() {
    const hintEl = document.getElementById('styleHint');
    if (hintEl) hintEl.innerText = `💡 提示：当前风格：${STYLE_CONFIG[currentReportStyle].name} | 侧重：${GOAL_CONFIG[currentReportGoal].name}`;
}

function updateDisplay() {
    try {
        const y = parseInt(document.getElementById('inputYear').value), m = parseInt(document.getElementById('inputMonth').value), d = parseInt(document.getElementById('inputDay').value);
        const hh = parseInt(document.getElementById('inputHour').value), mm = parseInt(document.getElementById('inputMin').value);
        const type = document.querySelector('input[name="calType"]:checked').value;
        const gen = document.querySelector('input[name="gender"]:checked').value, unk = document.getElementById('timeUnknown').checked;
        const prov = document.getElementById('provinceSel').value, city = document.getElementById('citySel').value, dist = document.getElementById('distSel').value, useSolar = document.getElementById('useSolarTime').checked;
        
        const inputData = { y, m, d, hh, mm, gender: gen, unknown: unk, province: prov, city, district: dist, useSolar, cal: type };
        localStorage.setItem('bazi_last_input', JSON.stringify(inputData));
        updateHash(inputData);

        let solar;
        if (type === 'solar') solar = Solar.fromYmdHms(y, m, d, hh, mm, 0);
        else { const lunar = Lunar.fromYmd(y, Math.abs(m), d); if (m < 0) lunar.setLeap(true); solar = lunar.getSolar(); solar = Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), hh, mm, 0); }

        let coords = [116.4, 39.9]; 
        if (CITY_DATA[prov] && CITY_DATA[prov][2][city]) {
            coords = CITY_DATA[prov][2][city];
            if (dist !== "全境" && coords[2] && coords[2][dist]) coords = coords[2][dist];
        }
        const [lng, lat] = coords;
        document.getElementById('lngDisplay').innerText = `(${lng.toFixed(2)},${lat.toFixed(2)})`;
        const off = getSolarTimeOffset(lng, solar.getYear(), solar.getMonth(), solar.getDay());
        let cSol = solar;
        if (useSolar && !unk) {
            const cD = new Date(new Date(solar.getYear(), solar.getMonth()-1, solar.getDay(), hh, mm).getTime() + off.total * 60000);
            cSol = Solar.fromYmdHms(cD.getFullYear(), cD.getMonth()+1, cD.getDate(), cD.getHours(), cD.getMinutes(), 0);
        }
        const lunar = Lunar.fromSolar(cSol), baZi = lunar.getEightChar();
        const yun = baZi.getYun(gen === '1' ? 1 : 0);
        const startSolar = yun.getStartSolar();
        const dayuns = yun.getDaYun();
        const wxStats = getWuXingStats(baZi);
        const taiYuan = baZi.getTaiYuan();
        const mingGong = baZi.getMingGong();
        const shenGong = baZi.getShenGong();
        const dayKong = baZi.getDayXunKong();
        const yearKong = baZi.getYearXunKong();

        const shensN = getShens(baZi.getYearGan(), baZi.getYearZhi(), baZi.getDayGan(), baZi.getYearZhi(), baZi.getDayZhi());
        const shensY = getShens(baZi.getMonthGan(), baZi.getMonthZhi(), baZi.getDayGan(), baZi.getYearZhi(), baZi.getDayZhi());
        const shensR = getShens(baZi.getDayGan(), baZi.getDayZhi(), baZi.getDayGan(), baZi.getYearZhi(), baZi.getDayZhi());
        const shensS = unk ? [] : getShens(baZi.getTimeGan(), baZi.getTimeZhi(), baZi.getDayGan(), baZi.getYearZhi(), baZi.getDayZhi());

        const mgBranch = mingGong[1];
        const mgIdx = BRANCHES.indexOf(mgBranch);
        const palaceMap = {};
        for (let i = 0; i < 12; i++) {
            const branchIdx = (mgIdx - i + 12) % 12;
            palaceMap[BRANCHES[branchIdx]] = PALACES[i];
        }

        const asc = unk ? "?" : getAscendant(cSol.getYear(), cSol.getMonth(), cSol.getDay(), cSol.getHour(), cSol.getMinute(), lng, lat);
        const sunSignData = getExactSunSign(cSol);
        const utcD = new Date(Date.UTC(cSol.getYear(), cSol.getMonth()-1, cSol.getDay(), cSol.getHour(), cSol.getMinute(), 0));
        const ephs = AstroEngine.getEphemeris(utcD);

        const nowTime = new Date();
        const currentLunar = Lunar.fromDate(nowTime);
        const currentYearGZ = currentLunar.getYearInGanZhi(); 
        
        let currentDaYun = "无";
        let daYunIdx = 0;
        const age = currentLunar.getYear() - lunar.getYear(); 
        for (let i = 0; i < dayuns.length; i++) {
            if (age >= dayuns[i].getStartAge() && age < dayuns[i].getEndAge()) {
                currentDaYun = dayuns[i].getGanZhi();
                daYunIdx = i + 1;
                break;
            }
        }
        
        const mainGe = baZi.getMonthShiShenZhi()[0] + "格";
        const interactions = calculateInteractions(baZi, unk);
        const energies = getDayMasterEnergy(baZi, unk);
        const warnings = checkTransitWarnings(baZi, currentYearGZ, currentDaYun);

        // --- 紫微斗数计算 ---
        let zwData = null;
        if (!unk) {
            zwData = calculateZiWei(
                Math.abs(lunar.getMonth()), 
                lunar.getDay(), 
                BRANCHES.indexOf(baZi.getTimeZhi()), 
                GANS.indexOf(baZi.getYearGan())
            );
        }

        let zwMd = "";
        if (zwData) {
            const mgIdx = zwData.mingGongIdx;
            zwMd = `
---
### 🌌 紫微斗数核心命盘 (十四主星精密排布)
*(⚠️ 警告大模型：以下星曜落宫由历法级算法绝对确定。切勿自行计算星曜落宫，重点基于“三方四正”和“四化”进行性格与格局解析)*

- **命理格局**: [${zwData.bureauName}] | 命宫在 [${BRANCHES[mgIdx]}] 
- **灵魂四化**: ${zwData.siHua.join(' | ')} 

- **🌟 核心三方四正 (人生主线与事业格局)**:
  - **[本命宫] (${BRANCHES[mgIdx]})**: ${zwData.starsPos[mgIdx].join(', ') || '无主星'} *(系统提示：主星决定基础性格，请重点解析)*
  - **[对宫-迁移宫] (${BRANCHES[(mgIdx + 6) % 12]})**: ${zwData.starsPos[(mgIdx + 6) % 12].join(', ') || '空宫'} *(注：空宫代表借对宫星曜或在外漂泊不定)*
  - **[三合-财帛宫] (${BRANCHES[(mgIdx + 8) % 12]})**: ${zwData.starsPos[(mgIdx + 8) % 12].join(', ') || '空宫'}
  - **[三合-官禄宫] (${BRANCHES[(mgIdx + 4) % 12]})**: ${zwData.starsPos[(mgIdx + 4) % 12].join(', ') || '空宫'}

- **👥 十2地支全景**:
  ${zwData.palaceNames.map((p, i) => `- **${BRANCHES[i]}宫 [${p}]**: ${zwData.starsPos[i].join(', ') || '空宫'}`).join('\n  ')}
`;
        }

        if (!unk) {
            let st = cSol.getHour() % 2 === 0 ? cSol.getHour() - 1 : cSol.getHour(); if (st === -1) st = 23;
            document.getElementById('shichenInfo').innerHTML = `时辰:${String(st).padStart(2, '0')}:00~${String((st+2)%24).padStart(2, '0')}:00 | 修正:${off.total.toFixed(1)}分`;
            document.querySelectorAll('.sc-btn').forEach(btn => btn.innerText.startsWith(baZi.getTimeZhi()) ? btn.classList.add('bg-yellow-700', 'text-white') : btn.classList.remove('bg-yellow-700', 'text-white'));
        } else { document.getElementById('shichenInfo').innerText = "出生时辰不详"; }

        document.getElementById('basicInfo').innerHTML = `<div class="text-[12px] md:text-[13px] font-bold">${cSol.toYmd()} ${unk ? '' : String(cSol.getHour()).padStart(2, '0')+':'+String(cSol.getMinute()).padStart(2, '0')}</div><div class="text-[10px] md:text-[11px] text-yellow-900">${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()} ${unk ? '' : '('+baZi.getTimeZhi()+'时)'}</div><div class="flex flex-wrap justify-center gap-x-1 text-[8px] md:text-[9px] mt-0.5 opacity-80"><span>${lunar.getYearShengXiao()}</span><span class="cursor-help" data-tip="太阳星座：代表一个人的基本性格。${sunSignData.isCusp ? '\\n⚠️' + sunSignData.cuspDetail : ''}">${sunSignData.name}${sunSignData.isCusp ? '*' : ''}</span><span class="text-red-800 font-bold cursor-help" data-tip="上升星座：代表给人的第一印象。">(${asc}座)</span></div>`;
        document.getElementById('baziDisplay').innerHTML = `${renderPillar('年', baZi.getYearGan(), baZi.getYearZhi(), baZi.getYearHideGan().join(''), baZi.getYearShiShenGan(), baZi.getYearShiShenZhi()[0], lunar.getYearNaYin())}${renderPillar('月', baZi.getMonthGan(), baZi.getMonthZhi(), baZi.getMonthHideGan().join(''), baZi.getMonthShiShenGan(), baZi.getMonthShiShenZhi()[0], lunar.getMonthNaYin())}${renderPillar('日', baZi.getDayGan(), baZi.getDayZhi(), baZi.getDayHideGan().join(''), '日主', baZi.getDayShiShenZhi()[0], lunar.getDayNaYin(), true)}${unk ? '<div class="flex flex-col items-center opacity-20"><span class="text-[9px] text-yellow-800">时</span><span class="text-xl font-bold text-gray-300">?</span></div>' : renderPillar('时', baZi.getTimeGan(), baZi.getTimeZhi(), baZi.getTimeHideGan().join(''), baZi.getTimeShiShenGan(), baZi.getTimeShiShenZhi()[0], lunar.getTimeNaYin())}`;

        BRANCHES.forEach((branch, index) => {
            const cell = document.getElementById(`pos-${index}`);
            const isT = !unk && baZi.getTimeZhi() === branch, isY = baZi.getYearZhi() === branch;
            const pName = palaceMap[branch];
            
            let zwContent = '';
            if (zwData) {
                const zwPalace = zwData.palaceNames[index];
                const zwStars = zwData.starsPos[index];
                const starHtml = zwStars.map(s => {
                    const isHua = s.includes('[');
                    return `<span class="${isHua ? 'text-red-600 font-bold' : 'text-yellow-800'}">${s}</span>`;
                }).join('<span class="text-gray-300 mx-0.5">,</span>');
                zwContent = `
                    <div class="mt-1 flex flex-col border-t border-yellow-100 pt-1">
                        <span class="text-[10px] font-bold text-blue-800">${zwPalace}</span>
                        <div class="text-[9px] leading-tight flex flex-wrap items-center">${starHtml || '<span class="text-gray-300">空宫</span>'}</div>
                    </div>
                `;
            }

            cell.innerHTML = `
                <div class="flex justify-between items-start">
                    <span class="text-base font-bold ${getWuXingClass(branch)}">${branch}</span>
                    <div class="flex flex-col items-end">
                        ${isT?'<span class="bg-red-700 text-white text-[7px] px-0.5 rounded">时</span>':''}
                        ${isY?'<span class="bg-yellow-700 text-white text-[7px] px-0.5 rounded">年</span>':''}
                    </div>
                </div>
                ${zwContent}
                <div class="text-[9px] md:text-[10px] text-yellow-900 text-right mt-auto opacity-30">${pName}</div>
            `;
            cell.style.backgroundColor = isT ? "rgba(254, 243, 199, 0.8)" : "";
            if (pName === '命宫') cell.classList.add('ring-1', 'ring-red-300');
            else cell.classList.remove('ring-1', 'ring-red-300');
        });

        const genderTerm = gen === '1' ? '乾造' : '坤造';
        const sc = STYLE_CONFIG[currentReportStyle];
        const gc = GOAL_CONFIG[currentReportGoal];

        let mdText = `# 问天星算 · 命理档案 (${sc.name}风格 | ${gc.name}侧重)

---
### 📅 基础档案
- **时间**: ${cSol.toYmd()} ${unk ? '（不详）' : String(cSol.getHour()).padStart(2, '0')+':'+String(cSol.getMinute()).padStart(2, '0')}
- **农历**: ${lunar.getYearInChinese()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}
- **修正**: 真太阳修正 ${off.total.toFixed(2)}m (已应用)
- **核心**: **${genderTerm}** / ${lunar.getYearShengXiao()} / ${lunar.getYearNaYin()} / 上升${asc}座
${zwMd}
---
### ☯️ 命局骨架 (Structural Data)

| 四柱 | 年柱 | 月柱 | 日柱 | 时柱 |
| :--- | :--- | :--- | :--- | :--- |
| **${sc.label}** | ${baZi.getYearShiShenGan()} | ${baZi.getMonthShiShenGan()} | **命主** | ${unk?'?':baZi.getTimeShiShenGan()} |
| **${sc.code}** | ${baZi.getYearGan()}${baZi.getYearZhi()} | ${baZi.getMonthGan()}${baZi.getMonthZhi()} | ${baZi.getDayGan()}${baZi.getDayZhi()} | ${unk?'??':baZi.getTimeGan()+baZi.getTimeZhi()} |
| **${sc.element}** | ${lunar.getYearNaYin()} | ${lunar.getMonthNaYin()} | ${lunar.getDayNaYin()} | ${unk?'?':lunar.getTimeNaYin()} |

#### 📊 能量参数
- **五行统计**: ${wxStats}
- **主导格局**: **${mainGe}**
- **当前坐标**: ${nowTime.getFullYear()} ${currentYearGZ}年 | 大运 [${currentDaYun}] | 虚岁 ${age}
- **空间作用**: ${[...interactions.gan, ...interactions.zhi.chong, ...interactions.zhi.he, ...interactions.zhi.xing, ...interactions.zhi.hai].join(' | ') || '无明显作用'}

---
### 🪐 天文星象 (Planet Data)
- **日月核心**: 太阳 ${sunSignData.name} | 月亮 ${ephs.moon.zN} | 上升 ${asc}座
- **星体状态**: 
  - 水星: ${ephs.mercury.zN}${ephs.mercury.isR?' [℞]':''} | 金星: ${ephs.venus.zN}${ephs.venus.isR?' [℞]':''} | 火星: ${ephs.mars.zN}${ephs.mars.isR?' [℞]':''}
  - 木星: ${ephs.jupiter.zN}${ephs.jupiter.isR?' [℞]':''} | 土星: ${ephs.saturn.zN}${ephs.saturn.isR?' [℞]':''}

---
### 🤖 AI 解盘指令 (Final Prompt)
**你现在是一位${
    currentReportStyle === 'cure' ? '温柔且洞察力极强的占星命理博主' :
    currentReportStyle === 'pro' ? '精通子平八字与占星学的命理宗师' :
    currentReportStyle === 'sharp' ? '深谙人性与社会法则、言辞犀利的商业教练' :
    '追求万物共振与灵魂本源的灵性导师'
}。请基于上方档案，针对【${gc.name}】进行深度全景解析。**

**【大模型紫微解盘系统指令】**：
你是一位深通紫微斗数与现代心理学的玄学宗师。请综合档案中精确算出的“三方四正”和十四主星分布进行断局：
1. **死磕化忌星**：找到 \`[忌]\` 所在的宫位，用极具心理疗愈感和宿命感的语言，一针见血地指出命主此生潜意识中最放不下、最容易受挫的领域，并给出破局之道。
2. **看命宫三方四正**：结合命、财、官、迁的星曜组合，判断其格局是适合安稳守成（如机月同梁），还是适合折腾创业（如杀破狼）。

**【分析指令】**：
1. **核心诉求**：${gc.focus}
2. **逻辑穿透**：请结合主导格局“${mainGe}”、日主能量“${energies}”以及日月升落座进行深度穿透分析。
3. **避坑指南**：若存在岁运警报（${warnings.length > 0 ? warnings.join(',') : '无'}）或行星逆行，给出极其务实的行动建议。
**【文风要求】**：
- ${
    currentReportStyle === 'cure' ? '语气亲切、感性且富有治愈感，像闺蜜聊天一样娓娓道来。' :
    currentReportStyle === 'pro' ? '严谨、学术、专业，保留对传统术语（十神、神煞、格局）的精准解释。' :
    currentReportStyle === 'sharp' ? '直接、高效、理性，直击利害关系，多给出行动建议，拒绝套话。' :
    '空灵、深邃、富有哲理，侧重于灵魂进化、潜意识图景与能量平衡。'
}

---
*报告由问天星算生成 | 已应用真太阳时修正*`;

        document.getElementById('mdOutput').value = mdText;
    } catch (e) { console.error(e); }
}

function copyMd() {
    const area = document.getElementById('mdOutput');
    const btn = document.getElementById('copyBtn');
    area.select();
    document.execCommand('copy');
    btn.innerText = '已复制';
    setTimeout(() => { btn.innerText = '复制报告词'; }, 1500);
}
