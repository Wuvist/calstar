function getEOT(doy) { const b = (2 * Math.PI * (doy - 81)) / 365; return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b); }
function getSolarTimeOffset(lng, y, m, d) {
    const longOff = (lng - 120.0) * 4;
    const date = new Date(y, m - 1, d);
    const start = new Date(y, 0, 0);
    const doy = Math.floor((date - start) / 86400000);
    const eotOff = getEOT(doy);
    return { total: longOff + eotOff, longOff, eotOff };
}

/**
 * 基于节气（中气）的高精度太阳星座计算
 */
function getExactSunSign(solarObj) {
    const zodiacNames = ["摩羯", "水瓶", "双鱼", "白羊", "金牛", "双子", "居蟹", "狮子", "处女", "天秤", "天蝎", "射手"];
    // 太阳进入星座对应的中气：摩羯(冬至), 水瓶(大寒), 双鱼(雨水), 白羊(春分), 金牛(谷雨), 双子(小满), 巨蟹(夏至), 狮子(大暑), 处女(处暑), 天秤(秋分), 天蝎(霜降), 射手(小雪)
    const zhongQiNames = ["冬至", "大寒", "雨水", "春分", "谷雨", "小满", "夏至", "大暑", "处暑", "秋分", "霜降", "小雪"];
    
    const year = solarObj.getYear();
    const years = [year - 1, year, year + 1];
    let allZhongQi = [];
    
    years.forEach(y => {
        const l = Lunar.fromYmd(y, 1, 1);
        const table = l.getJieQiTable();
        zhongQiNames.forEach(name => {
            if (table[name]) {
                allZhongQi.push({ name, jd: table[name].getJulianDay() });
            }
        });
    });
    
    allZhongQi.sort((a, b) => a.jd - b.jd);
    const currentJd = solarObj.getJulianDay();
    
    for (let i = 0; i < allZhongQi.length - 1; i++) {
        if (currentJd >= allZhongQi[i].jd && currentJd < allZhongQi[i+1].jd) {
            const signIndex = zhongQiNames.indexOf(allZhongQi[i].name);
            const diffPrev = (currentJd - allZhongQi[i].jd) * 24;
            const diffNext = (allZhongQi[i+1].jd - currentJd) * 24;
            
            let isCusp = false, cuspDetail = "";
            if (diffPrev < 24) {
                isCusp = true;
                cuspDetail = `距离太阳进入${zodiacNames[signIndex]}座 (${allZhongQi[i].name}) 仅 ${diffPrev.toFixed(1)} 小时。`;
            } else if (diffNext < 24) {
                isCusp = true;
                cuspDetail = `距离太阳进入${zodiacNames[(signIndex+1)%12]}座 (${allZhongQi[i+1].name}) 仅 ${diffNext.toFixed(1)} 小时。`;
            }
            
            return { name: zodiacNames[signIndex] + "座", isCusp, cuspDetail };
        }
    }
    return { name: solarObj.getXingZuo() + "座", isCusp: false, cuspDetail: "" };
}

/**
 * 高精度上升星座计算
 * 使用真恒星时 (LST) 与 黄赤交角 (Obliquity)
 */
function getAscendant(year, month, day, hh, mm, lng, lat) {
    // 1. 计算儒略日 (JD) - 修正时区误差：假设输入为北京时间 (UTC+8)，需减去 8 小时得到 UTC
    const date = new Date(Date.UTC(year, month - 1, day, hh, mm) - 8 * 3600000);
    const jd = (date.getTime() / 86400000) + 2440587.5;
    
    // 2. 计算格林威治平恒星时 (GMST)
    const d = jd - 2451545.0;
    const t = d / 36525.0;
    let gmst = 18.697374558 + 24.06570982441908 * d + 0.000024822 * t * t;
    gmst = gmst % 24;
    if (gmst < 0) gmst += 24;
    
    // 3. 计算地方平恒星时 (LST)
    let lst = gmst + lng / 15;
    lst = lst % 24;
    if (lst < 0) lst += 24;
    
    // 4. 计算上升点 (Ascendant)
    const ram = lst * 15 * Math.PI / 180; // 地方恒星时赤经
    const eps = (23.439291 - 0.0130042 * t) * Math.PI / 180; // 黄赤交角
    const phi = lat * Math.PI / 180; // 地理纬度
    
    // 上升点公式
    let ascRad = Math.atan2(Math.cos(ram), -Math.sin(ram) * Math.cos(eps) - Math.tan(phi) * Math.sin(eps));
    let ascDeg = ascRad * 180 / Math.PI;
    if (ascDeg < 0) ascDeg += 360;
    
    return ZODIAC_SIGNS[Math.floor(ascDeg / 30)];
}