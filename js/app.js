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

window.onload = function() {
    const lastData = JSON.parse(localStorage.getItem('bazi_last_input')) || {};
    const now = new Date();
    const defY = lastData.y || now.getFullYear(), defM = lastData.m || (now.getMonth() + 1), defD = lastData.d || now.getDate();
    const defH = lastData.hh !== undefined ? lastData.hh : now.getHours(), defMin = lastData.mm !== undefined ? lastData.mm : now.getMinutes();
    const defGen = lastData.gender || "1", defUnk = lastData.unknown || false, defCal = lastData.cal || "solar";
    let defProv = lastData.province || "北京", defCity = lastData.city || "北京市", defDist = lastData.district || "全境", defUseSolar = lastData.useSolar || false;
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
    document.getElementById('btnCalculate').onclick = updateDisplay;
    updateDisplay();
};

function updateDisplay() {
    try {
        const y = parseInt(document.getElementById('inputYear').value), m = parseInt(document.getElementById('inputMonth').value), d = parseInt(document.getElementById('inputDay').value);
        const hh = parseInt(document.getElementById('inputHour').value), mm = parseInt(document.getElementById('inputMin').value);
        const type = document.querySelector('input[name="calType"]:checked').value;
        const gen = document.querySelector('input[name="gender"]:checked').value, unk = document.getElementById('timeUnknown').checked;
        const prov = document.getElementById('provinceSel').value, city = document.getElementById('citySel').value, dist = document.getElementById('distSel').value, useSolar = document.getElementById('useSolarTime').checked;
        localStorage.setItem('bazi_last_input', JSON.stringify({ y, m, d, hh, mm, gender: gen, unknown: unk, province: prov, city, district: dist, useSolar, cal: type }));

        let solar;
        if (type === 'solar') solar = Solar.fromYmdHms(y, m, d, hh, mm, 0);
        else { const lunar = Lunar.fromYmd(y, Math.abs(m), d); if (m < 0) lunar.setLeap(true); solar = lunar.getSolar(); solar = Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), hh, mm, 0); }

        let coords = [116.4, 39.9]; // Default Beijing
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

        if (!unk) {
            let st = cSol.getHour() % 2 === 0 ? cSol.getHour() - 1 : cSol.getHour(); if (st === -1) st = 23;
            document.getElementById('shichenInfo').innerHTML = `时辰:${String(st).padStart(2, '0')}:00~${String((st+2)%24).padStart(2, '0')}:00 | 修正:${off.total.toFixed(1)}分`;
            document.querySelectorAll('.sc-btn').forEach(btn => btn.innerText.startsWith(baZi.getTimeZhi()) ? btn.classList.add('bg-yellow-700', 'text-white') : btn.classList.remove('bg-yellow-700', 'text-white'));
        } else { document.getElementById('shichenInfo').innerText = "出生时辰不详"; }

        document.getElementById('basicInfo').innerHTML = `<div class="text-[12px] md:text-[13px] font-bold">${cSol.toYmd()} ${unk ? '' : String(cSol.getHour()).padStart(2, '0')+':'+String(cSol.getMinute()).padStart(2, '0')}</div><div class="text-[10px] md:text-[11px] text-yellow-900">${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()} ${unk ? '' : '('+baZi.getTimeZhi()+'时)'}</div><div class="flex flex-wrap justify-center gap-x-1 text-[8px] md:text-[9px] mt-0.5 opacity-80"><span>${lunar.getYearShengXiao()}</span><span class="cursor-help" data-tip="太阳星座：代表一个人的基本性格。${sunSignData.isCusp ? '
⚠️' + sunSignData.cuspDetail : ''}">${sunSignData.name}${sunSignData.isCusp ? '*' : ''}</span><span class="text-red-800 font-bold cursor-help" data-tip="上升星座：代表给人的第一印象。">(${asc}座)</span></div>`;
        document.getElementById('baziDisplay').innerHTML = `${renderPillar('年', baZi.getYearGan(), baZi.getYearZhi(), baZi.getYearHideGan().join(''), baZi.getYearShiShenGan(), baZi.getYearShiShenZhi()[0], lunar.getYearNaYin())}${renderPillar('月', baZi.getMonthGan(), baZi.getMonthZhi(), baZi.getMonthHideGan().join(''), baZi.getMonthShiShenGan(), baZi.getMonthShiShenZhi()[0], lunar.getMonthNaYin())}${renderPillar('日', baZi.getDayGan(), baZi.getDayZhi(), baZi.getDayHideGan().join(''), '日主', baZi.getDayShiShenZhi()[0], lunar.getDayNaYin(), true)}${unk ? '<div class="flex flex-col items-center opacity-20"><span class="text-[9px] text-yellow-800">时</span><span class="text-xl font-bold text-gray-300">?</span></div>' : renderPillar('时', baZi.getTimeGan(), baZi.getTimeZhi(), baZi.getTimeHideGan().join(''), baZi.getTimeShiShenGan(), baZi.getTimeShiShenZhi()[0], lunar.getTimeNaYin())}`;

        BRANCHES.forEach((branch, index) => {
            const cell = document.getElementById(`pos-${index}`);
            const isT = !unk && baZi.getTimeZhi() === branch, isY = baZi.getYearZhi() === branch;
            const pName = palaceMap[branch];
            cell.innerHTML = `<div class="flex justify-between items-start"><span class="text-base font-bold ${getWuXingClass(branch)}">${branch}</span><div class="flex flex-col items-end">${isT?'<span class="bg-red-700 text-white text-[7px] px-0.5 rounded">时</span>':''}${isY?'<span class="bg-yellow-700 text-white text-[7px] px-0.5 rounded">年</span>':''}</div></div><div class="text-[9px] md:text-[10px] text-yellow-900 text-right mt-auto">${pName}</div>`;
            cell.style.backgroundColor = isT ? "rgba(254, 243, 199, 0.8)" : "";
            if (pName === '命宫') cell.classList.add('ring-1', 'ring-red-300');
            else cell.classList.remove('ring-1', 'ring-red-300');
        });

        let mdText = `### 问天星算排盘报告

- **公历**: ${cSol.toYmd()} ${unk ? '不详' : String(cSol.getHour()).padStart(2, '0')+':'+String(cSol.getMinute()).padStart(2, '0')}
- **地点**: ${prov}-${city} (${lng}, ${lat})
- **农历**: ${lunar.getYearInChinese()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}
- **${unk?'六字':'八字'}**: ${baZi.getYearGan()}${baZi.getYearZhi()}年 ${baZi.getMonthGan()}${baZi.getMonthZhi()}月 ${baZi.getDayGan()}${baZi.getDayZhi()}日${unk?'':' '+baZi.getTimeGan()+baZi.getTimeZhi()+'时'}
- **真太阳时修正**: ${off.total.toFixed(2)} 分钟
- **性别**: ${gen==='1'?'男':'女'} / **生肖**: ${lunar.getYearShengXiao()} (${lunar.getYearNaYin()})

### 🪐 占星本命星盘配置 (高精度天文数学推演)
*(⚠️ 核心天文数据已由本地程序计算完毕，大模型请绝对信任此落座数据，切勿自行推演计算)*

- **[发光体]**
- **太阳 (Sun)**: ${sunSignData.name} ${sunSignData.isCusp ? '*(边界星座 Cusp)*' : ''}
- **月亮 (Moon)**: ${ephs.moon.zN} (${ephs.moon.zE}) *(代表内在情绪、潜意识安全感)*
- **上升 (Asc)**: ${asc}座 *(基于地理坐标结合地方恒星时精确推导)*

- **[个人内行星]**
- **水星 (Mercury)**: ${ephs.mercury.zN}${ephs.mercury.isR?' [⚠️ **℞ 逆行**]':''} *(思维、沟通与逻辑)*
- **金星 (Venus)**: ${ephs.venus.zN}${ephs.venus.isR?' [⚠️ **℞ 逆行**]':''} *(爱情观、审美与价值取向)*
- **火星 (Mars)**: ${ephs.mars.zN}${ephs.mars.isR?' [⚠️ **℞ 逆行**]':''} *(行动力与原始驱动力)*

- **[社会外行星]**
- **木星 (Jupiter)**: ${ephs.jupiter.zN}${ephs.jupiter.isR?' [⚠️ **℞ 逆行**]':''} *(扩张、幸运与机遇)*
- **土星 (Saturn)**: ${ephs.saturn.zN}${ephs.saturn.isR?' [⚠️ **℞ 逆行**]':''} *(责任、压力与业力边界)*

---
**【大模型占星解析系统指令】**：
你是一位顶级的中西合璧命理大师。请综合以上数据进行深度解析：
1. **深挖逆行**：若水、金、火、木、土星出现逆行，请重点解析其能量内敛或滞后的宿命感。
2. **日月核心**：剖析外在性格(日)、内在灵魂(月)与生命动机(升)的联动张力。${sunSignData.isCusp ? '
3. **边界星座**：由于太阳处于星座交界处(' + sunSignData.cuspDetail + ')，请重点解析其双重性格特质。' : ''}

#### 生辰八字 (${unk?'六字' : '八字'})
| 四柱 | 年柱 | 月柱 | 日柱 | 时柱 |
| :--- | :--- | :--- | :--- | :--- |
| **十神** | ${baZi.getYearShiShenGan()} | ${baZi.getMonthShiShenGan()} | 日主 | ${unk?'?':baZi.getTimeShiShenGan()} |
| **干支** | ${baZi.getYearGan()}${baZi.getYearZhi()} | ${baZi.getMonthGan()}${baZi.getMonthZhi()} | ${baZi.getDayGan()}${baZi.getDayZhi()} | ${unk?'??':baZi.getTimeGan()+baZi.getTimeZhi()} |
| **地势** | ${baZi.getYearShiShenZhi()[0]} | ${baZi.getMonthShiShenZhi()[0]} | ${baZi.getDayShiShenZhi()[0]} | ${unk?'?':baZi.getTimeShiShenZhi()[0]} |
| **纳音** | ${lunar.getYearNaYin()} | ${lunar.getMonthNaYin()} | ${lunar.getDayNaYin()} | ${unk?'?':lunar.getTimeNaYin()} |
| **藏干** | ${baZi.getYearHideGan().join('')} | ${baZi.getMonthHideGan().join('')} | ${baZi.getDayHideGan().join('')} | ${unk?'?':baZi.getTimeHideGan().join('')} |

### 📊 命局五行与基础参数
- **五行统计**：${wxStats}
- **空亡**：日空[${dayKong}] | 年空[${yearKong}]
- **三垣**：胎元[${taiYuan}] | 命宫[${mingGong}] | 身宫[${shenGong}]

### 🌟 四柱神煞 (解盘关键取象)
- **年柱** (${baZi.getYearGan()}${baZi.getYearZhi()}): [${shensN.join(', ') || '无'}]
- **月柱** (${baZi.getMonthGan()}${baZi.getMonthZhi()}): [${shensY.join(', ') || '无'}]
- **日柱** (${baZi.getDayGan()}${baZi.getDayZhi()}): [${shensR.join(', ') || '无'}]
- **时柱** (${unk?'??' : baZi.getTimeGan()+baZi.getTimeZhi()}): [${shensS.join(', ') || '无'}]

### ⏳ 命运轨迹 (大运走势)
**交运时间**: 出生后 ${yun.getStartYear()} 年 ${yun.getStartMonth()} 个月 ${yun.getStartDay()} 天交运 (公历 ${startSolar.toYmd()} 起运)
| 步数 | 虚岁 | 起运年份 | 大运干支 |
| --- | --- | --- | --- |
`;
        
        dayuns.slice(1, 9).forEach((dy, i) => {
            mdText += `| ${i+1} | ${dy.getStartAge()}岁 | ${dy.getStartYear()} | ${dy.getGanZhi()} |
`;
        });

        mdText += `
### 🌌 十二宫位分布
`;
        const pList = BRANCHES.map(b => `- **${b}宫**: ${palaceMap[b]}宫`).join(' | ');
        mdText += pList + `

---
*报告由问天星算生成，${useSolar?'已应用真太阳时修正':'未应用修正'}*`;

        document.getElementById('mdOutput').value = mdText;
    } catch (e) { console.error(e); }
}

function copyMd() {
    const area = document.getElementById('mdOutput');
    const btn = document.getElementById('copyBtn');
    area.select();
    document.execCommand('copy');
    btn.innerText = '已复制';
    setTimeout(() => { btn.innerText = '复制'; }, 1500);
}