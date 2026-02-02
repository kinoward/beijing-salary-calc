# Development Log (开发日志)

> 本项目由 **Google Antigravity** 协助开发。
> This project was developed with the assistance of **Google Antigravity**.

以下记录了从需求分析到最终上线的完整协作过程，展示了 AI 辅助编程的实际工作流。

---

## 📅 Phase 1: 核心功能开发 (Core Development)

### 1. 需求分析与项目理解
- **用户目标**：优化现有的薪资计算器，增加公积金缴纳选项、完善社保基数逻辑、并美化界面。
- **AI 行动**：
  - 快速分析了现有项目结构。
  - 确认了技术栈：Vue 3, Vite, Sass, ECharts。

### 2. 功能实现
- **复杂逻辑处理**：
  - 实现了 **2020-2026** 多年度北京社保数据支持。
  - 编写了处理“社保年度”（每年7月调整）与自然年差异的算法。
  - 增加了年终奖“单独计税”与“合并计税”的对比功能。
- **UI/UX 设计**：
  - 采用 **Glassmorphism (磨砂玻璃)** 风格重构了界面。
  - 实现了深色模式适配和响应式布局。

---

## 📝 Phase 2: 文档与开源 (Documentation & Open Source)

### 3. 文档编写
- **README 重构**：用户不再需要手动编写文档，AI 自动生成了包含功能亮点、技术栈、使用指南的详细 `README.md`。
- **双语更新日志**：生成了中英对照的 `CHANGELOG.md`，记录 v0.1.0 的初始发布特性。

### 4. 协议确认
- **开源协议**：用户选择将项目彻底开源。
- **执行**：AI 将协议修改为 **Unlicense** (Public Domain)，并自动生成了对应的 `LICENSE` 文件和 `package.json` 配置。

---

## 🚀 Phase 3: 部署与上线 (Deployment & Release)

### 5. Git 版本控制
- **仓库初始化**：从零初始化 Git 仓库，处理了 Windows 环境下的换行符问题。
- **远程关联**：协助用户解决了 Git 远程仓库关联和 SSH 配置的报错，成功推送代码。

### 6. 自动化部署 (CI/CD)
- **GitHub Pages**：
  - 修改 `vite.config.js` 配置 `base` 路径以适配 Pages。
  - 创建 `.github/workflows/deploy.yml`，配置了自动化构建和部署流程。
- **故障排除**：
  - 遇到 Actions 权限报错时，AI 准确识别出需要在 GitHub 仓库设置中开启 "Read and write permissions" 并切换部署源为 "GitHub Actions"。

---

## 🎉 结语

通过这一系列协作，我们不仅完成了一个功能完善的计算器应用，还构建了一整套标准的开源项目基础设施（文档、协议、CI/CD）。

**Code with ❤️ by User & Google Antigravity**
