# Calstar - 灵犀命理排盘系统

## Project Overview
Calstar (灵犀命理排盘系统) 是一个高性能、单文件的本地网页程序，专为中国传统命理（八字、紫微斗数布局）设计。它集成了精确的历法转换、干支计算、时辰范围提醒以及 Markdown 报告导出功能，旨在提供一个纯净、无广告且完全离线的排盘环境。

### Key Technologies
- **UI Framework:** [Tailwind CSS](https://tailwindcss.com/) (Local v2.2.19) - 用于构建紧凑、现代的中式审美界面。
- **Core Engine:** [lunar-javascript](https://github.com/6678/lunar-javascript) (Local) - 提供精准的公农历转换、节气切分及干支逻辑。
- **Architecture:** 单文件原生 JS + 本地资源 (Vanilla JS, Local Assets)。
- **Styling:** 使用 Noto Serif SC 衬线体，营造典雅的阅读体验。

## Directory Overview
- `index.html`: 核心主程序，包含 UI 结构、交互逻辑及渲染引擎。
- `lunar.js`: 离线版历法核心算法库。
- `tailwind.min.css`: 离线版 CSS 样式库。
- `GEMINI.md`: 本项目指令集与开发上下文。

## Key Features
1. **智能下拉输入:** 强制 YYYY-MM-DD 与 24 小时制，完全避开浏览器 AM/PM 干扰。
2. **时辰边界提醒:** 实时计算当前时辰的起始与结束时间点（如 11:00~13:00），方便用户进行真太阳时校对。
3. **实时排盘:** 所有输入项修改（年月日时分、性别）均会触发即时重绘，无需手动点击。
4. **Markdown 导出:** 侧边栏实时生成可直接复制的命理分析报告，包含纳音、藏干及四柱表格。
5. **本地存储:** 自动记忆上次输入的日期、时间及性别选择。

## Usage
### Running the Project
本项目不需要任何构建步骤。双击 `index.html` 即可在任何现代浏览器中运行。
- **环境要求:** 确保 `lunar.js` 和 `tailwind.min.css` 与 `index.html` 位于同一目录下。
- **真太阳时校对:** 输入公历时间后，观察中心区域显示的“时辰范围”，若输入时间接近边界，建议根据所在地经度进行增减校对。

### Development Conventions
- **离线优先:** 严禁引入外部 CDN 资源，所有依赖必须保持本地化。
- **样式规范:** 优先使用 Tailwind Utility Classes，特定中式样式定义在 `<style>` 标签中。
- **性能优化:** 保持单文件架构，逻辑应尽量精简。
- **数据结构:** 使用 `localStorage` (key: `bazi_last_input`) 存储用户输入状态。

## Future TODOs
- [ ] 增加详细的大运、流年排盘。
- [ ] 增加各宫位（子平格局）的初步解析逻辑。
- [ ] 优化移动端的触摸滑动交互体验。
