function getEOT(doy) { const b = (2 * Math.PI * (doy - 81)) / 365; return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b); }
function getSolarTimeOffset(lng, y, m, d) {
    const longOff = (lng - 120.0) * 4;
    const date = new Date(y, m - 1, d);
    const start = new Date(y, 0, 0);
    const doy = Math.floor((date - start) / 86400000);
    const eotOff = getEOT(doy);
    return { total: longOff + eotOff, longOff, eotOff };
}

function getExactSunSign(solarObj) {
    const zodiacNames = ["摩羯", "水瓶", "双鱼", "白羊", "金牛", "双子", "巨蟹", "狮子", "处女", "天秤", "天蝎", "射手"];
    const zhongQiNames = ["冬至", "大寒", "雨水", "春分", "谷雨", "小满", "夏至", "大暑", "处暑", "秋分", "霜降", "小雪"];
    const years = [solarObj.getYear() - 1, solarObj.getYear(), solarObj.getYear() + 1];
    let allZhongQi = [];
    years.forEach(y => {
        const l = Lunar.fromYmd(y, 1, 1);
        const table = l.getJieQiTable();
        zhongQiNames.forEach(name => {
            if (table[name]) allZhongQi.push({ name, jd: table[name].getJulianDay() });
        });
    });
    allZhongQi.sort((a, b) => a.jd - b.jd);
    const currentJd = solarObj.getJulianDay();
    for (let i = 0; i < allZhongQi.length - 1; i++) {
        if (currentJd >= allZhongQi[i].jd && currentJd < allZhongQi[i+1].jd) {
            const signIndex = zhongQiNames.indexOf(allZhongQi[i].name);
            const prevZhongQi = allZhongQi[i];
            const nextZhongQi = allZhongQi[i+1];
            const diffPrev = (currentJd - prevZhongQi.jd) * 24;
            const diffNext = (nextZhongQi.jd - currentJd) * 24;
            let isCusp = false, cuspDetail = "";
            if (diffPrev < 24) {
                isCusp = true;
                cuspDetail = `距离${prevZhongQi.name}节气/进入${zodiacNames[signIndex]}座仅 ${diffPrev.toFixed(1)} 小时。`;
            } else if (diffNext < 24) {
                isCusp = true;
                cuspDetail = `距离${nextZhongQi.name}节气/进入${zodiacNames[(signIndex+1)%12]}座仅 ${diffNext.toFixed(1)} 小时。`;
            }
            return { name: zodiacNames[signIndex] + "座", isCusp, cuspDetail };
        }
    }
    return { name: solarObj.getXingZuo() + "座", isCusp: false, cuspDetail: "" };
}

function getAscendant(year, month, day, hh, mm, lng, lat) {
    const date = new Date(Date.UTC(year, month - 1, day, hh, mm));
    const jd = (date.getTime() / 86400000) + 2440587.5;
    const t = (jd - 2451545.0) / 36525.0;
    let gmst = 6.697374558 + 0.06570982441908 * (jd - 2451545.0) + 1.00273790935 * (hh + mm / 60);
    gmst = gmst % 24; if (gmst < 0) gmst += 24;
    let lst = gmst + lng / 15;
    lst = lst % 24; if (lst < 0) lst += 24;
    const ram = lst * 15 * Math.PI / 180;
    const eps = (23.4393 - 0.013 * t) * Math.PI / 180;
    const phi = lat * Math.PI / 180;
    let asc = Math.atan2(Math.cos(ram), -Math.sin(ram) * Math.cos(eps) - Math.tan(phi) * Math.sin(eps));
    asc = asc * 180 / Math.PI; if (asc < 0) asc += 360;
    return ZODIAC_SIGNS[Math.floor(asc / 30)];
}