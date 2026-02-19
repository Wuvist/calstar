# Calstar - 问天星算专业命理排盘系统

## Project Overview
Calstar (问天星算) 是一个高性能、单文件的本地网页程序，专为中国传统命理（八字、紫微斗数布局）设计。它集成了精确的历法转换、干支计算、时辰范围提醒以及 Markdown 报告导出功能，旨在提供一个纯净、无广告且完全离线的排盘环境。

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
1. **智能下拉输入:** 支持公历/农历一键切换，强制 YYYY-MM-DD 与 24 小时制，完全避开浏览器 AM/PM 干扰。
2. **真太阳时校正:** 内置中国各省市经度库（包含通化市等大量地级市），支持基于经度差与均时差（EOT）的自动真太阳时修正。
3. **时辰边界提醒:** 实时计算当前时辰范围（如 11:00~13:00）并展示修正分钟数，方便进行精确排盘判断。
4. **实时排盘:** 所有输入项修改（年月日时分、性别、地点、修正开关）均会触发即时重绘。
5. **响应式架构:** 针对移动端采用 Tab 切换机制（命盘/报告），确保 4x4 井字布局在手机端完美展示并支持报告全屏阅读。
6. **专业术语简介:** 针对十神、纳音及星座提供全量 Hover Tooltips。采用置顶层级（z-9999）与溢出可见逻辑，确保简介不被边框或相邻容器遮挡。
7. **Markdown 导出:** 侧边栏实时生成报告，支持移动端一键复制。
8. **本地存储:** 自动记忆上次输入的日期（公/农历）、时间、性别及地点选择。

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
