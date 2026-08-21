# 바른투어｜巴伦旅游中国入境游演示站

面向韩国旅客来中国旅游的中韩双语预订演示站。前台以韩文为主、中文为辅助，当前提供两条可浏览与测试预订的路线：

- 西安：3 晚 4 日，兵马俑、华清宫、大雁塔与西安城墙。
- 丝绸之路：10 晚 11 日，西安至乌鲁木齐，覆盖河西走廊、敦煌与吐鲁番等主要行程段。

每个产品包含逐日路线、重点景点图文、轻量旅程地图、可售演示团期、人数计价和测试订单。本站只用于演示：不接收真实支付、不收集护照号码或支付卡资料。

## 本地运行

```powershell
npm install
$env:LOCAL_DEMO='1'
$env:ADMIN_INITIAL_PASSWORD='choose-a-local-test-password'
npm start
```

打开 `http://localhost:3023`。本地演示使用内存数据库，会自动放入两条路线的演示团期；进程停止后订单和后台数据会消失。

## 验证

```powershell
npm test
```

测试覆盖产品目录、两条路线的天数、测试订单计价、库存扣减和测试支付状态流转。

## 图片与授权

```powershell
npm run images:download
```

命令会将已登记来源的图片转换为 `public/assets/` 下的 WebP。图片来自 Wikimedia Commons 或 Unsplash 等授权明确来源；作者、许可证和原始页面记录在 `catalog.js`，并在 `/attribution.html` 对外展示。不要用旅行网站图片热链替换本地资源。

## Railway 演示部署

生产演示建议添加 Railway PostgreSQL，并设置：

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `DATABASE_SSL=false`（按 Railway 实际服务配置调整）
- `ADMIN_INITIAL_USERNAME`
- `ADMIN_INITIAL_PASSWORD`
- `NODE_ENV=production`

服务通过 `npm start` 启动，并读取 Railway 提供的 `PORT`。未连接 PostgreSQL 时，Railway 仅作为临时公开演示使用内存数据；重启后订单会清空，不能作为真实交易环境。
