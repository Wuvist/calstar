/**
 * Lightweight ZiWei DouShu Core Engine
 */

const ZW_STARS = ["紫微", "天机", "太阳", "武曲", "天同", "廉贞", "天府", "太阴", "贪狼", "巨门", "天相", "天梁", "七杀", "破军"];

const SI_HUA = {
    0: ["廉贞", "破军", "武曲", "太阳"], // 甲
    1: ["天机", "天梁", "紫微", "太阴"], // 乙
    2: ["天同", "天机", "文昌", "廉贞"], // 丙
    3: ["太阴", "天同", "天机", "巨门"], // 丁
    4: ["贪狼", "太阴", "右弼", "天机"], // 戊
    5: ["武曲", "贪狼", "天梁", "文曲"], // 己
    6: ["太阳", "武曲", "太阴", "天同"], // 庚 (庚干四化各派有别，此取太阳武曲太阴天同)
    7: ["巨门", "太阳", "文曲", "文昌"], // 辛
    8: ["天梁", "紫微", "左辅", "武曲"], // 壬
    9: ["破军", "巨门", "太阴", "贪狼"]  // 癸
};

// 五行局：水二(2), 木三(3), 金四(4), 土五(5), 火六(6)
const BUREAU_NAMES = { 2: "水二局", 3: "木三局", 4: "金四局", 5: "土五局", 6: "火六局" };

/**
 * 计算紫微斗数排盘
 * @param {number} lunarMonth 农历月 (1-12)
 * @param {number} lunarDay 农历日 (1-30)
 * @param {number} hourZhiIndex 时辰地支索引 (0-11, 子=0)
 * @param {number} yearGanIndex 年干索引 (0-9, 甲=0)
 */
function calculateZiWei(lunarMonth, lunarDay, hourZhiIndex, yearGanIndex) {
    // 1. 定命宫
    // 从寅(2)起正月，顺数月，逆数时
    const mingGongIdx = (2 + (lunarMonth - 1) - hourZhiIndex + 12) % 12;

    // 2. 定五行局
    // 五虎遁定命宫干：甲己之年丙作首...
    const startGanIdx = (yearGanIndex % 5 * 2 + 2) % 10;
    const palaceGanIdx = (startGanIdx + (mingGongIdx - 2 + 12) % 12) % 10;
    
    // 纳音五行定局
    const bureau = getBureau(palaceGanIdx, mingGongIdx);

    // 3. 定紫微星
    let x = 0;
    while ((lunarDay + x) % bureau !== 0) {
        x++;
    }
    const q = (lunarDay + x) / bureau;
    let zwPos;
    if (x % 2 === 0) {
        zwPos = (2 + q - x + 12) % 12;
    } else {
        zwPos = (2 + q + x) % 12;
    }

    // 4. 安十四主星
    const starsPos = Array(12).fill(null).map(() => []);

    // 紫微星系 (逆行)
    const zwGroup = ["紫微", "天机", null, "太阳", "武曲", "天同", null, null, "廉贞"];
    zwGroup.forEach((star, i) => {
        if (star) {
            const pos = (zwPos - i + 12) % 12;
            starsPos[pos].push(star);
        }
    });

    // 天府星系 (顺行)
    const tfPos = (16 - zwPos) % 12;
    const tfGroup = ["天府", "太阴", "贪狼", "巨门", "天相", "天梁", "七杀", null, null, null, "破军"];
    tfGroup.forEach((star, i) => {
        if (star) {
            const pos = (tfPos + i) % 12;
            starsPos[pos].push(star);
        }
    });

    // 5. 安生年四化
    const siHuaStars = SI_HUA[yearGanIndex];
    const labels = ["禄", "权", "科", "忌"];
    
    for (let i = 0; i < 12; i++) {
        starsPos[i] = starsPos[i].map(star => {
            const shIdx = siHuaStars.indexOf(star);
            if (shIdx !== -1) {
                return `${star}[${labels[shIdx]}]`;
            }
            return star;
        });
        
        // 如果是四化中的辅助星(文昌、文曲、左辅、右弼)不在14主星中，也需要特殊处理
        // 为简单起见，我们暂且只在报告中体现，或如果要在网格显示，需在此添加
        siHuaStars.forEach((shStar, shIdx) => {
            if (!ZW_STARS.includes(shStar)) {
                // 检查这个星是否已经在 grid 里（目前我们只排了14主星）
                // 暂时不把辅星排入 12 宫，但我们返回四化信息
            }
        });
    }

    // 6. 十二宫职 (逆时针铺满)
    const palaceNames = Array(12).fill("");
    const PALACE_ORDER = ["命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄", "迁移", "交友", "官禄", "田宅", "福德", "父母"];
    for (let i = 0; i < 12; i++) {
        const pos = (mingGongIdx - i + 12) % 12;
        palaceNames[pos] = PALACE_ORDER[i];
    }

    return {
        mingGongIdx,
        bureau,
        bureauName: BUREAU_NAMES[bureau],
        zwPos,
        starsPos, // 0-11 对应的星曜列表
        palaceNames, // 0-11 对应的宫职
        siHua: siHuaStars.map((s, i) => `${s}化${labels[i]}`)
    };
}

/**
 * 纳音简易定局法
 */
function getBureau(gan, zhi) {
    // 简易查表或逻辑推算
    // 纳音五行：甲乙丙丁戊... 子丑寅卯辰...
    // 此处直接通过干支索引返回局数
    const nanyiTable = [
        [4, 4, 6, 6, 3, 3, 4, 4, 6, 6, 3, 3], // 甲 (0)
        [4, 4, 6, 6, 3, 3, 4, 4, 6, 6, 3, 3], // 乙 (1)
        [2, 2, 4, 4, 5, 5, 2, 2, 4, 4, 5, 5], // 丙 (2)
        [2, 2, 4, 4, 5, 5, 2, 2, 4, 4, 5, 5], // 丁 (3)
        [3, 3, 2, 2, 6, 6, 3, 3, 2, 2, 6, 6], // 戊 (4)
        [3, 3, 2, 2, 6, 6, 3, 3, 2, 2, 6, 6], // 己 (5)
        [5, 5, 3, 3, 4, 4, 5, 5, 3, 3, 4, 4], // 庚 (6)
        [5, 5, 3, 3, 4, 4, 5, 5, 3, 3, 4, 4], // 辛 (7)
        [6, 6, 5, 5, 2, 2, 6, 6, 5, 5, 2, 2], // 壬 (8)
        [6, 6, 5, 5, 2, 2, 6, 6, 5, 5, 2, 2]  // 癸 (9)
    ];
    return nanyiTable[gan][zhi];
}
