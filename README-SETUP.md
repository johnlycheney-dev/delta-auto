# 三角洲交易行 · 全自动提醒站部署指南

> 目标：**不用手动导入**。GitHub Actions 按 SGT 指定时点自动抓取中位价 M，生成 `public/market-today.json`，前端页面自动展示“今天几点买/卖什么、用多少价”。

## 一分钟总览
1. 新建 GitHub 仓库（公开或私有均可）。
2. 把本仓全部文件上传（`frontend/`、`fetcher/`、`public/`、`.github/workflows/` 等）。
3. **修改 `fetcher/config.json`**：把每个 SKU 的 `url` 与 `selector` 改成你可访问的行情页与价格选择器（或填 `jsonPath` 读官方/社区接口）。
4. 打开 GitHub Pages（Settings → Pages → Source 选 `main` 分支 `/(root)` 或 `docs`）。
5. 等计划任务触发（或在 Actions 里点 **Run workflow**），会生成 `/public/market-today.json`。
6. 打开 `https://<你的用户名>.github.io/<仓库名>/frontend/` 查看页面，点“立即刷新数据”。

> 若你没有可抓取的**网页或API**，则无法做到“完全无人值守”。你可以：  
> - 向我提供任意一个**稳定的网页/接口**（显示各 SKU 的价格/中位价），我帮你填写选择器；  
> - 或选择“半自动采集”：用浏览器扩展或书签脚本从你常看的页面一键上报到 `public/market-today.json`（我可额外提供）。

---

## 目录结构
- `frontend/index.html` —— 前端页面（会自动拉取 `/market-today.json` 并生成日程）
- `public/market-today.json` —— 抓取器输出（Actions 生成）
- `fetcher/index.mjs` —— Node 抓取脚本（undici + cheerio）
- `fetcher/config.json` —— **需要你填写**的数据来源（URL + CSS选择器 或 JSON 路径）
- `.github/workflows/schedule.yml` —— 定时任务（已按 SGT 定在 10:00 / 12:30 / 15:00 / 18:30 / 21:30 / 23:00）
- `package.json` —— 依赖定义

## 配置 `fetcher/config.json`
示例：
```json
{
  "skus": ["5.56x45 M855","9x19 PST","7.62x39 PS","7.62x51 M80"],
  "sources": {
    "5.56x45 M855": {
      "url": "https://example.com/market/556-m855",
      "selector": ".price .median",
      "regex": "[\\d.]+",
      "headers": { "User-Agent": "delta-fetcher/1.0" }
    }
  }
}
```
三种抓法：
1. **CSS 选择器**：页面上能看到中位价，就 `selector` 指到具体元素，必要时再用 `regex` 过滤纯数字；  
2. **JSON 接口**：填 `jsonPath`（如 `"data.items.0.median"`），不用 `selector`；  
3. **自有微接口**：你可以把价格写到你自己的 JSON 文件里，这个抓取器直接读取。

> **合规提醒**：别抓需要登录、反爬限制明显或违反服务条款的页面；尽量使用官方或公开的社区数据。

## GitHub Pages
- Settings → Pages → 选择 `main` 分支，根目录（或 `docs`）。
- 部署完成后，访问：`https://<user>.github.io/<repo>/frontend/`。  
  页面默认去相对路径 `/market-today.json` 拉数据。

## 修改提醒时点/手续费
- 前端页面顶部可以改：手续费、提醒时间点（逗号分隔）。
- 页面支持“导出 ICS 到日历”，到点就提醒。

## 手工测试
```bash
# 本地测试抓取
npm ci
npm run fetch
# 会生成 public/market-today.json
```

## 常见问题
- **看不到数据**：检查 `public/market-today.json` 是否被 Actions 成功生成并提交；浏览器网络面板里查看该 JSON 是否 200 返回。
- **价格抓不到**：更新 `selector` 或 `jsonPath`，或告诉我页面链接，我帮你写选择器。
- **需要更细节的提醒规则**：你可以在 `frontend/index.html` 里修改各 SKU 的 α/β 系数，或我帮你做成配置化。
