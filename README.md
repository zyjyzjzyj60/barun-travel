# 巴伦旅游｜西安 3晚4日演示站

面向韩国访华旅客的中文审核版预订演示站。前台展示西安路线、可售团期、测试下单与测试支付；后台维护团期和查看测试订单。

## 运行方式

生产环境必须配置 PostgreSQL：

```bash
cp .env.example .env
npm install
npm start
```

将 `.env` 中的 `DATABASE_URL`、`ADMIN_INITIAL_USERNAME` 与 `ADMIN_INITIAL_PASSWORD` 换成真实值。管理员账号只会在数据库为空时创建一次；不要把真实密码提交到 Git。

本机无 PostgreSQL 时可使用临时内存数据库验证界面（关闭进程后数据会消失）：

```powershell
$env:LOCAL_DEMO='1'
$env:ADMIN_INITIAL_PASSWORD='choose-a-local-test-password'
npm start
```

## 图片

运行 `npm run images:download` 会从已核实授权的 Wikimedia Commons 下载西安景点图片、压缩为 WebP 并保存到 `public/assets/`。每张图片的作者、协议与来源同时记录在 `/attribution.html`。下载网络受限时不应以未经授权的图片替换。

## Railway 免费演示发布

1. 将本项目目录通过 Git 推送至 GitHub，保留 `public/`、`scripts/` 等子目录。
2. 在 Railway 新建项目，添加 **PostgreSQL** 服务和本仓库的 Web 服务。
3. 在 Web 服务 Variables 中设置：
   - `DATABASE_URL=${{Postgres.DATABASE_URL}}`（以 Railway 实际服务名为准）
   - `DATABASE_SSL=false`
   - `ADMIN_INITIAL_USERNAME`
   - `ADMIN_INITIAL_PASSWORD`
   - `NODE_ENV=production`
4. Railway 会读取 `railway.toml` 并执行 `npm start`。部署成功后，在 Networking 中点击 **Generate Domain**，得到可外网访问的 `*.up.railway.app` HTTPS 地址。

如果首次部署时还没有连接 PostgreSQL，Railway 演示环境会临时使用内存数据库并自动放入两个演示团期，确保页面和测试下单可以验收。该模式的数据会在重启时清空；添加 PostgreSQL 服务并把其 `DATABASE_URL` 引用到网站服务后，应用会自动切换为持久数据库。
5. 访问 `/admin.html`，先创建真实或测试团期，再向外分享前台地址。

免费计划只适合演示。未提供真实团期、未完成 KakaoPay 商户签约前，请不要接收真实旅客资料或开放真实支付。
