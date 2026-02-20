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
                else if (key === 'gender' || key === 'ziSect') hashData[key] = value;
                else if (['unknown', 'useSolar', 'showBazi', 'showZiwei', 'showAstro'].includes(key)) hashData[key] = value === 'true';
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
    const showBaziCheck = document.getElementById('showBazi'), showZiweiCheck = document.getElementById('showZiwei'), showAstroCheck = document.getElementById('showAstro');

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
        const y = parseInt(yearSel.value) || new Date().getFullYear();
        const type = getCalType();
        const prevM = monthSel.value;
        const prevD = daySel.value;
        
        if (type === 'solar') {
            // 确保公历月份是 01-12
            const isSolar = monthSel.options.length === 12 && monthSel.options[0].text.indexOf('月') !== -1 && monthSel.options[0].text.indexOf('闰') === -1;
            if (!isSolar) {
                monthSel.options.length = 0;
                for(let i=1; i<=12; i++) {
                    const val = String(i);
                    monthSel.add(new Option(val.padStart(2, '0') + '月', val));
                }
                if (prevM && parseInt(prevM) >= 1 && parseInt(prevM) <= 12) monthSel.value = prevM;
                else monthSel.value = String(defM || 1);
            }

            const mVal = parseInt(monthSel.value) || 1;
            const last = new Date(y, mVal, 0).getDate();
            
            // 仅在天数变化时更新
            if (daySel.options.length !== last) {
                daySel.options.length = 0;
                for(let i=1; i<=last; i++) {
                    const val = String(i);
                    daySel.add(new Option(val.padStart(2, '0') + '日', val));
                }
            }
            
            // 恢复日期并限位
            const targetD = parseInt(prevD) || defD || 1;
            daySel.value = String(Math.min(targetD, last));
        } else {
            const months = LunarYear.fromYear(y).getMonths();
            monthSel.options.length = 0;
            months.forEach(m => monthSel.add(new Option(m.isLeap() ? "闰" + LUNAR_MONTHS[m.getMonth()-1] : LUNAR_MONTHS[m.getMonth()-1], String(m.getMonth() * (m.isLeap() ? -1 : 1)))));
            
            if (prevM && Array.from(monthSel.options).some(o => o.value === prevM)) monthSel.value = prevM;
            else if (String(defM) && Array.from(monthSel.options).some(o => o.value === String(defM))) monthSel.value = String(defM);
            else monthSel.value = monthSel.options[0].value;

            const mVal = parseInt(monthSel.value); 
            const m = months.find(mm => mm.getMonth() === Math.abs(mVal) && mm.isLeap() === (mVal < 0)) || months[0];
            const dCount = m.getDayCount();

            if (daySel.options.length !== dCount) {
                daySel.options.length = 0;
                for(let i=1; i<=dCount; i++) daySel.add(new Option(LUNAR_DAYS[i-1], String(i)));
            }
            
            const targetD = parseInt(prevD) || defD || 1;
            daySel.value = String(Math.min(targetD, dCount));
        }
    }

    const triggerUpdate = () => { updateDayOptions(); };
    document.querySelectorAll('input[name="calType"]').forEach(r => r.onchange = triggerUpdate);
    yearSel.onchange = triggerUpdate; monthSel.onchange = triggerUpdate;
    yearSel.oninput = triggerUpdate; monthSel.oninput = triggerUpdate;
    
    daySel.onchange = null; hourSel.onchange = null; minSel.onchange = null;
    provSel.onchange = () => { updateCityOptions(); updateDisplay(); }; citySel.onchange = () => { updateDistOptions(); updateDisplay(); }; distSel.onchange = updateDisplay;
    solarCheck.onchange = updateDisplay;
    unkCheck.onchange = () => { document.getElementById('timeInputGroup').style.opacity = unkCheck.checked ? "0.3" : "1"; updateDisplay(); };
    showBaziCheck.onchange = updateDisplay; showZiweiCheck.onchange = updateDisplay; showAstroCheck.onchange = updateDisplay;
    document.querySelectorAll('input[name="ziSect"]').forEach(r => r.onchange = updateDisplay);

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
    showBaziCheck.checked = lastData.showBazi !== undefined ? lastData.showBazi : true;
    showZiweiCheck.checked = lastData.showZiwei !== undefined ? lastData.showZiwei : true;
    showAstroCheck.checked = lastData.showAstro !== undefined ? lastData.showAstro : true;
    if (lastData.ziSect) {
        const targetRadio = document.querySelector(`input[name="ziSect"][value="${lastData.ziSect}"]`);
        if (targetRadio) targetRadio.checked = true;
    }
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
        const showBazi = document.getElementById('showBazi').checked, showZiwei = document.getElementById('showZiwei').checked, showAstro = document.getElementById('showAstro').checked;
        const ziSectValue = document.querySelector('input[name="ziSect"]:checked').value;
        
        const inputData = { y, m, d, hh, mm, gender: gen, unknown: unk, province: prov, city, district: dist, useSolar, cal: type, showBazi, showZiwei, showAstro, ziSect: ziSectValue };
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

        // --- 子时流派处理 ---
        const isLateZi = !unk && cSol.getHour() === 23;
        const ziHourPanel = document.getElementById('ziHourPanel');
        if (isLateZi) {
            ziHourPanel.classList.remove('hidden');
        } else {
            ziHourPanel.classList.add('hidden');
        }
        const ziSect = parseInt(document.querySelector('input[name="ziSect"]:checked').value);

        const lunar = Lunar.fromSolar(cSol), baZi = lunar.getEightChar();
        baZi.setSect(ziSect); // 设置子时流派

        // --- 核心改进：处理显示用的农历日期 ---
        // 如果是古法换日且处于 23 点后，显示用的农历对象应指向第二天
        let displayLunar = lunar;
        if (isLateZi && ziSect === 2) {
            displayLunar = Lunar.fromSolar(cSol.next(1));
        }

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

        // --- 天文计算必须使用原始标准时间 (solar)，而非修正后的真太阳时 (cSol) ---
        const asc = unk ? "?" : getAscendant(solar.getYear(), solar.getMonth(), solar.getDay(), solar.getHour(), solar.getMinute(), lng, lat);
        const sunSignData = getExactSunSign(solar);
        const utcD = new Date(Date.UTC(solar.getYear(), solar.getMonth()-1, solar.getDay(), solar.getHour(), solar.getMinute(), 0) - 8 * 3600000);
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
        if (showZiwei && !unk) {
            // 紫微斗数规则：子初即换日。如果是 23 点以后，农历日期强制采用“第二天”
            let zwLunar = lunar;
            if (cSol.getHour() === 23) {
                const nextSolar = cSol.next(1);
                zwLunar = Lunar.fromSolar(nextSolar);
            }
            zwData = calculateZiWei(
                Math.abs(zwLunar.getMonth()), 
                zwLunar.getDay(), 
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

        const astroInfo = showAstro ? `<span class="cursor-help" data-tip="太阳星座：代表一个人的基本性格。${sunSignData.isCusp ? '\\n⚠️' + sunSignData.cuspDetail : ''}">${sunSignData.name}${sunSignData.isCusp ? '*' : ''}</span><span class="text-red-800 font-bold cursor-help" data-tip="上升星座：代表给人的第一印象。">(${asc}座)</span>` : '';
        document.getElementById('basicInfo').innerHTML = `<div class="text-[12px] md:text-[13px] font-bold">${cSol.toYmd()} ${unk ? '' : String(cSol.getHour()).padStart(2, '0')+':'+String(cSol.getMinute()).padStart(2, '0')}</div><div class="text-[10px] md:text-[11px] text-yellow-900">${displayLunar.getMonthInChinese()}月 ${displayLunar.getDayInChinese()} ${unk ? '' : '('+baZi.getTimeZhi()+'时)'}</div><div class="flex flex-wrap justify-center gap-x-1 text-[8px] md:text-[9px] mt-0.5 opacity-80"><span>${displayLunar.getYearShengXiao()}</span>${astroInfo}</div>`;
        
        const baziEl = document.getElementById('baziDisplay');
        if (showBazi) {
            baziEl.style.display = 'flex';
            baziEl.innerHTML = `${renderPillar('年', baZi.getYearGan(), baZi.getYearZhi(), baZi.getYearHideGan().join(''), baZi.getYearShiShenGan(), baZi.getYearShiShenZhi()[0], displayLunar.getYearNaYin())}${renderPillar('月', baZi.getMonthGan(), baZi.getMonthZhi(), baZi.getMonthHideGan().join(''), baZi.getMonthShiShenGan(), baZi.getMonthShiShenZhi()[0], displayLunar.getMonthNaYin())}${renderPillar('日', baZi.getDayGan(), baZi.getDayZhi(), baZi.getDayHideGan().join(''), '日主', baZi.getDayShiShenZhi()[0], displayLunar.getDayNaYin(), true)}${unk ? '<div class="flex flex-col items-center opacity-20"><span class="text-[9px] text-yellow-800">时</span><span class="text-xl font-bold text-gray-300">?</span></div>' : renderPillar('时', baZi.getTimeGan(), baZi.getTimeZhi(), baZi.getTimeHideGan().join(''), baZi.getTimeShiShenGan(), baZi.getTimeShiShenZhi()[0], displayLunar.getTimeNaYin())}`;
        } else {
            baziEl.style.display = 'none';
        }

        BRANCHES.forEach((branch, index) => {
            const cell = document.getElementById(`pos-${index}`);
            const isT = !unk && baZi.getTimeZhi() === branch, isY = baZi.getYearZhi() === branch;
            const pName = palaceMap[branch];
            
            let zwContent = '';
            if (showZiwei && zwData) {
                const zwPalace = zwData.palaceNames[index];
                const zwStars = zwData.starsPos[index];
                const starHtml = zwStars.map(s => {
                    const isHua = s.includes('[');
                    const starBase = isHua ? s.split('[')[0] : s;
                    const tip = TERM_DICT[starBase] || '';
                    return `<span class="${isHua ? 'text-red-600 font-bold' : 'text-yellow-800'} cursor-help" ${tip ? `data-tip="${tip}"` : ''}>${s}</span>`;
                }).join('<span class="text-gray-300 mx-0.5">,</span>');
                const palaceTip = TERM_DICT[zwPalace] || '';
                zwContent = `
                    <div class="mt-1 flex flex-col border-t border-yellow-100 pt-1">
                        <span class="text-[10px] font-bold text-blue-800 cursor-help" ${palaceTip ? `data-tip="${palaceTip}"` : ''}>${zwPalace}</span>
                        <div class="text-[9px] leading-tight flex flex-wrap items-center">${starHtml || '<span class="text-gray-300">空宫</span>'}</div>
                    </div>
                `;
            }

            const branchInfo = showBazi ? `<span class="text-base font-bold ${getWuXingClass(branch)}">${branch}</span>` : `<span class="text-[10px] text-gray-400">${branch}</span>`;

            cell.innerHTML = `
                <div class="flex justify-between items-start">
                    ${branchInfo}
                    <div class="flex flex-col items-end">
                        ${(showBazi && isT)?'<span class="bg-red-700 text-white text-[7px] px-0.5 rounded">时</span>':''}
                        ${(showBazi && isY)?'<span class="bg-yellow-700 text-white text-[7px] px-0.5 rounded">年</span>':''}
                    </div>
                </div>
                ${zwContent}
                <div class="text-[9px] md:text-[10px] text-yellow-900 text-right mt-auto opacity-30 cursor-help" ${TERM_DICT[pName] ? `data-tip="[八字] ${TERM_DICT[pName]}"` : ''}>${pName}</div>
            `;
            cell.style.backgroundColor = isT ? "rgba(254, 243, 199, 0.8)" : "";
            if (pName === '命宫') cell.classList.add('ring-1', 'ring-red-300');
            else cell.classList.remove('ring-1', 'ring-red-300');
        });

        const genderTerm = gen === '1' ? '乾造' : '坤造';
        const sc = STYLE_CONFIG[currentReportStyle];
        const gc = GOAL_CONFIG[currentReportGoal];

        // --- 构造子夜预警 Markdown ---
        let edgeCaseMd = "";
        if (isLateZi) {
            const sectName = ziSect === 2 ? "古法子初换日" : "保留夜子时";
            edgeCaseMd = `
### 🌗 【极高危时空预警：子夜交界降生 (Edge Case)】
*(系统对大模型的强力指令：经天文高精度校准，命主出生于真太阳时 ${cSol.getHour()}:${String(cSol.getMinute()).padStart(2, '0')}。处于 23:00~24:00 的“夜子时”区间。旧日的太阳已落下，明日的生机正在萌动，天地阴阳之气处于最剧烈的交替之中！)*

- **当前程序采用流派**: [${sectName}] 
- **系统锁定的日柱**: [${baZi.getDayGan()}${baZi.getDayZhi()}] (${displayLunar.getMonthInChinese()}月${displayLunar.getDayInChinese()}) | **系统锁定的时柱**: [${baZi.getTimeGan()}${baZi.getTimeZhi()}]
*(⚠️ 警告大模型：你必须绝对信任上述日柱数据，切勿自行讨论换日问题！)*
`;
        }

        let mdText = `# 问天星算 · 命理档案 (${sc.name}风格 | ${gc.name}侧重)

---
### 📅 基础档案
- **时间**: ${cSol.toYmd()} ${unk ? '（不详）' : String(cSol.getHour()).padStart(2, '0')+':'+String(cSol.getMinute()).padStart(2, '0')}
- **农历**: ${displayLunar.getYearInChinese()}年 ${displayLunar.getMonthInChinese()}月 ${displayLunar.getDayInChinese()}
- **修正**: 真太阳修正 ${off.total.toFixed(2)}m (已应用)
- **核心**: **${genderTerm}** / ${displayLunar.getYearShengXiao()} / ${displayLunar.getYearNaYin()} ${showAstro ? '/ 上升'+asc+'座' : ''}
${edgeCaseMd}
${(showZiwei && zwMd) ? zwMd : ''}
${showBazi ? `
---
### ☯️ 命局骨架 (Structural Data)

| 四柱 | 年柱 | 月柱 | 日柱 | 时柱 |
| :--- | :--- | :--- | :--- | :--- |
| **${sc.label}** | ${baZi.getYearShiShenGan()} | ${baZi.getMonthShiShenGan()} | **命主** | ${unk?'?':baZi.getTimeShiShenGan()} |
| **${sc.code}** | ${baZi.getYearGan()}${baZi.getYearZhi()} | ${baZi.getMonthGan()}${baZi.getMonthZhi()} | ${baZi.getDayGan()}${baZi.getDayZhi()} | ${unk?'??':baZi.getTimeGan()+baZi.getTimeZhi()} |
| **${sc.element}** | ${displayLunar.getYearNaYin()} | ${displayLunar.getMonthNaYin()} | ${displayLunar.getDayNaYin()} | ${unk?'?':displayLunar.getTimeNaYin()} |

#### 📊 能量参数
- **五行统计**: ${wxStats}
- **主导格局**: **${mainGe}**
- **当前坐标**: ${nowTime.getFullYear()} ${currentYearGZ}年 | 大运 [${currentDaYun}] | 虚岁 ${age}
- **空间作用**: ${[...interactions.gan, ...interactions.zhi.chong, ...interactions.zhi.he, ...interactions.zhi.xing, ...interactions.zhi.hai].join(' | ') || '无明显作用'}
` : ''}
${showAstro ? `
---
### 🪐 天文星象 (Planet Data)
- **日月核心**: 太阳 ${sunSignData.name} | 月亮 ${ephs.moon.zN} | 上升 ${asc}座
- **星体状态**: 
  - 水星: ${ephs.mercury.zN}${ephs.mercury.isR?' [℞]':''} | 金星: ${ephs.venus.zN}${ephs.venus.isR?' [℞]':''} | 火星: ${ephs.mars.zN}${ephs.mars.isR?' [℞]':''}
  - 木星: ${ephs.jupiter.zN}${ephs.jupiter.isR?' [℞]':''} | 土星: ${ephs.saturn.zN}${ephs.saturn.isR?' [℞]':''}
` : ''}
---
### 🤖 AI 综合解盘指令 (Unified Prompt)

**【专家设定】**
你是一位${
    currentReportStyle === 'cure' ? '温柔且洞察力极强的“心灵占星师”' :
    currentReportStyle === 'pro' ? '精通传统命理（'+[showBazi?'子平八字':null,showZiwei?'紫微斗数':null,showAstro?'西洋占星':null].filter(x=>x).join('、')+'）的玄学宗师' :
    currentReportStyle === 'sharp' ? '深谙人性与社会法则、言辞犀利的“商业教练”' :
    '追求万物共振与灵魂本源的灵性导师'
}。请基于上方${(showBazi||showZiwei||showAstro)?'['+[showBazi?'八字':null,showZiwei?'紫微':null,showAstro?'占星':null].filter(x=>x).join('、')+']':''}综合档案，针对命主【${gc.name}】的需求进行深度穿透。

**【解盘逻辑集 (必须严格执行)】**
${(() => {
    const rules = [];
    rules.push(`**核心诉求定位**：${gc.focus}`);
    if (showZiwei) rules.push(`**紫微死磕化忌**：重点定位 \`[忌]\` 星所在宫位，指出命主潜意识中最易受挫、最放不下的“宿命课题”，并给出具体破局建议。`);
    if (showBazi) rules.push(`**八字格局穿透**：结合主导格局“${mainGe}”与日主能量“${energies}”，分析命主性格底色是适合“守成安稳”还是“折腾创业”。`);
    if (showAstro) rules.push(`**星象性格整合**：利用太阳/上升/月亮的相位逻辑，结合东方命理，平衡“宿命论”与“性格决定论”。`);
    rules.push(`**避坑指南**：${(showBazi && warnings.length > 0) ? '针对岁运警报（'+warnings.join(',')+'）' : '结合星象状态'}，给出极其务实、不带套话的近期行动建议。`);
    return rules.map((r, i) => (i + 1) + ". " + r).join("\n");
})()}

**【文风要求】**
- ${
    currentReportStyle === 'cure' ? '语气亲切、感性且富有治愈感，像闺蜜聊天一样娓娓道来，多用鼓励性话语。' :
    currentReportStyle === 'pro' ? '严谨、学术、专业，保留对核心术语的精准引用，给出逻辑缜密的推导过程。' :
    currentReportStyle === 'sharp' ? '直接、高效、理性，直击命门，不谈虚词，多给具体策略建议。' :
    '空灵、深邃、富有哲理，侧重于灵魂进化、潜意识图景与能量场平衡。'
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
