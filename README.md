# 黑珍珠海域

在线游玩：https://zainyang11.github.io/black-pearl/

AI 主持人通过 `worker/` 里的 Cloudflare Worker 调用 Claude API，API Key 只保存在 Worker 的密钥里。
部署好 Worker 后，把它的地址填进 `config.js` 的 `BP_PROXY`。
