@AGENTS.md

## 部署

- 镜像在本地通过 `docker buildx build --platform linux/amd64 -t cc-kanban:latest --load .` 构建（Mac ARM 需交叉编译为 x86）
- 通过 `docker save | ssh root@geminiwen.com docker load` 传输到远端服务器
- 服务器部署目录: `/data/kanban/`，使用 `docker compose up -d` 启动
- DATABASE_URL 通过服务器上的 docker-compose.yml 环境变量注入，不硬编码在代码中
