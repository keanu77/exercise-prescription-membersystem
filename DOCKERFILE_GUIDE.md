# Dockerfile 使用指南

## 📦 Dockerfile 架構說明

本專案使用**多階段建置（Multi-stage Build）**優化 Docker 映像大小和安全性。

---

## 🏗️ 三階段建置流程

### 階段 1: 依賴安裝（deps）
```dockerfile
FROM node:18-alpine AS deps
```
**目的**：安裝所有 npm 依賴
- 複製 `package.json` 和 `prisma/` 目錄
- 執行 `npm ci` 安裝所有依賴（包含 devDependencies）

### 階段 2: 建置階段（builder）
```dockerfile
FROM node:18-alpine AS builder
```
**目的**：編譯應用程式
- 設定建置期環境變數（寫死）：
  - `DATABASE_URL` - Prisma 生成 Client 用（假 URL）
  - `NODE_ENV=production`
- 執行 `npx prisma generate` 生成 Prisma Client
- 執行 `npm run build` 建置 NestJS
- 安裝僅生產環境依賴

### 階段 3: 運行階段（runner）
```dockerfile
FROM node:18-alpine AS runner
```
**目的**：建立最小化運行環境
- 安裝 `dumb-init`（正確處理系統訊號）
- 建立非 root 使用者 `nestjs`
- 只複製必要檔案：
  - `dist/` - 編譯後的程式碼
  - `node_modules/` - 生產依賴
  - `prisma/` - Prisma schema
- 設定健康檢查
- 使用非 root 使用者運行

---

## 🔧 參數分類

### 建置期參數（寫死在 Dockerfile）

這些參數在 `ENV` 指令中設定，建置時就已確定：

| 參數 | 值 | 用途 | 階段 |
|------|---|------|------|
| `DATABASE_URL` | `mysql://user:password@localhost:3306/member_management` | Prisma 生成 Client | builder |
| `NODE_ENV` | `production` | 設定生產環境 | builder, runner |
| `PORT` | `3001` | 預設端口 | runner |

**為什麼建置時需要假的 DATABASE_URL？**
- Prisma 在執行 `prisma generate` 時會驗證連線字串格式
- 建置時不需要實際連接資料庫
- 實際的資料庫連線在運行時才使用真實 URL

### 運行期參數（從環境變數讀取）

這些參數在 Zeabur（或其他部署平台）設定，運行時動態載入：

| 參數 | 必填 | 說明 |
|------|------|------|
| `DATABASE_URL` | ✅ | 實際的資料庫連線字串 |
| `JWT_SECRET` | ✅ | JWT 簽名密鑰（至少 32 字元）|
| `CORS_ORIGIN` | ✅ | 允許的前端網址 |
| `PORT` | ❌ | 端口（Zeabur 會自動設定）|
| `API_PREFIX` | ❌ | API 路徑前綴（預設 api/v1）|
| `BCRYPT_ROUNDS` | ❌ | 密碼加密強度（預設 12）|
| `LOG_LEVEL` | ❌ | 日誌等級（預設 info）|
| `TZ` | ❌ | 時區（預設 Asia/Taipei）|

---

## 📝 .dockerignore 說明

`.dockerignore` 檔案告訴 Docker 哪些檔案不要複製到映像中：

### 排除的檔案類型

1. **依賴套件**：`node_modules/`（會在容器內重新安裝）
2. **建置輸出**：`dist/`（會在容器內重新建置）
3. **環境變數**：`.env*`（敏感資訊，從外部注入）
4. **開發工具**：IDE 設定、測試檔案
5. **文件**：大部分 `.md` 文件（只保留 README.md）
6. **Git**：`.git/` 目錄

**好處**：
- 減少 Docker context 大小
- 加快建置速度
- 避免敏感資訊進入映像

---

## 🚀 本地測試 Dockerfile

### 1. 安裝 Docker

如果尚未安裝 Docker：

**macOS**:
```bash
brew install --cask docker
```

**Linux**:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io

# 啟動 Docker 服務
sudo systemctl start docker
```

### 2. 建置映像

```bash
cd member-management-api

# 建置映像（需時 3-5 分鐘）
docker build -t member-api:latest .
```

### 3. 運行容器

```bash
# 使用環境變數檔案
docker run -p 3001:3001 \
  --env-file .env.production \
  member-api:latest

# 或手動指定環境變數
docker run -p 3001:3001 \
  -e DATABASE_URL="mysql://user:pass@host:3306/db" \
  -e JWT_SECRET="your-secret-key" \
  -e CORS_ORIGIN="https://your-app.com" \
  member-api:latest
```

### 4. 測試 API

```bash
# 健康檢查
curl http://localhost:3001/api/v1

# 登入測試
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 5. 查看日誌

```bash
# 查看容器 ID
docker ps

# 查看日誌
docker logs <container-id>

# 即時查看日誌
docker logs -f <container-id>
```

### 6. 進入容器

```bash
# 進入容器 shell
docker exec -it <container-id> /bin/sh

# 檢查檔案結構
ls -la

# 查看環境變數
env | grep -E "DATABASE|JWT|CORS"
```

---

## 🔍 Dockerfile 最佳實踐

### ✅ 已實作的優化

1. **多階段建置**
   - 分離建置和運行環境
   - 最終映像只包含必要檔案

2. **使用 Alpine Linux**
   - 基礎映像只有 ~40 MB
   - 大幅減少映像大小

3. **安全性**
   - 使用非 root 使用者運行
   - 最小權限原則

4. **訊號處理**
   - 使用 `dumb-init` 正確處理訊號
   - 確保優雅關閉

5. **健康檢查**
   - 內建健康檢查機制
   - 自動檢測服務狀態

6. **快取優化**
   - 先複製 package.json
   - 善用 Docker layer cache

---

## 📊 映像大小預估

| 階段 | 大小 | 說明 |
|------|------|------|
| node:18-alpine | ~40 MB | 基礎映像 |
| 依賴安裝 | ~150 MB | npm packages |
| 應用程式 | ~10 MB | 編譯後的 JS |
| **總計** | **~200 MB** | 最終映像大小 |

相比使用完整 node:18 映像（~900 MB），節省了約 **77%** 的空間。

---

## 🛠️ 自訂 Dockerfile

### 修改建置期參數

如果需要修改建置期參數，編輯 Dockerfile：

```dockerfile
# 階段 2: 建置階段
ENV DATABASE_URL="mysql://custom:custom@localhost:3306/custom_db"
ENV NODE_ENV="production"
ENV CUSTOM_BUILD_VAR="value"
```

### 修改運行期預設值

```dockerfile
# 階段 3: 運行階段
ENV PORT=8080
ENV LOG_LEVEL="debug"
```

**注意**：這些只是預設值，實際部署時會被環境變數覆蓋。

---

## 🐛 疑難排解

### 問題 1: Prisma generate 失敗

**錯誤**：
```
Error: Generator 'client' failed
```

**解決**：
1. 確認 `prisma/schema.prisma` 檔案存在
2. 檢查 DATABASE_URL 格式是否正確
3. 確認 `@prisma/client` 已在 dependencies 中

### 問題 2: 建置速度慢

**原因**：npm install 每次都重新下載

**解決**：
1. 使用 `.dockerignore` 排除 node_modules
2. 善用 Docker cache（不要頻繁修改 package.json）
3. 使用 `npm ci` 而非 `npm install`

### 問題 3: 映像太大

**檢查**：
```bash
docker images member-api:latest
```

**優化**：
1. 確認使用 Alpine 映像
2. 檢查 .dockerignore 是否正確排除檔案
3. 使用 `npm ci --only=production`

### 問題 4: 容器無法啟動

**診斷**：
```bash
# 查看容器日誌
docker logs <container-id>

# 檢查容器狀態
docker ps -a

# 查看詳細資訊
docker inspect <container-id>
```

---

## 📋 部署前檢查清單

- [ ] Dockerfile 已建立
- [ ] .dockerignore 已建立
- [ ] 本地建置測試成功（如有 Docker）
- [ ] 環境變數已準備（DATABASE_URL, JWT_SECRET, CORS_ORIGIN）
- [ ] Prisma schema 正確
- [ ] package.json 包含所有依賴
- [ ] 已設定健康檢查端點
- [ ] 已準備資料庫遷移腳本

---

## 🔗 相關文件

- [Zeabur 部署指南](./ZEABUR_DEPLOYMENT.md) - Zeabur 詳細部署步驟
- [環境變數指南](../ENV_GUIDE.md) - 所有環境變數說明
- [部署說明](../DEPLOYMENT.md) - 通用部署指南

---

## 📞 技術支援

如有問題：
1. 檢查 Dockerfile 註解
2. 參考本指南疑難排解章節
3. 查看 Zeabur 官方文件
4. 檢視 Docker 建置日誌

---

**Dockerfile 版本**: 1.0.0
**支援平台**: Zeabur, Railway, Render, Fly.io
**Node.js 版本**: 18.x (Alpine)
**更新日期**: 2025-11-15
