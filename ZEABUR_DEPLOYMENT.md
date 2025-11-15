# Zeabur 部署指南

本文件說明如何將會員管理系統後端部署到 Zeabur。

---

## 📋 前置準備

### 1. 準備 Zeabur 帳號
- 註冊 Zeabur 帳號：https://zeabur.com
- 連結 GitHub 帳號（推薦）

### 2. 準備 MySQL 資料庫
可以選擇：
- 使用 Zeabur 提供的 MySQL 服務
- 使用外部 MySQL 資料庫（如 PlanetScale、AWS RDS 等）

---

## 🚀 Zeabur 部署步驟

### 方法一：使用 Git 部署（推薦）

#### 1. 推送程式碼到 GitHub

```bash
cd member-management-api

# 初始化 git（如果尚未初始化）
git init

# 添加所有檔案
git add .

# 提交
git commit -m "feat: add Dockerfile for Zeabur deployment"

# 推送到 GitHub
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

#### 2. 在 Zeabur 建立專案

1. 登入 Zeabur Dashboard
2. 點擊「Create Project」
3. 選擇「Deploy from GitHub」
4. 選擇您的 repository
5. Zeabur 會自動檢測到 Dockerfile 並開始部署

#### 3. 設定環境變數

在 Zeabur 專案的 Environment Variables 中設定：

```env
# 資料庫連線（必填）
DATABASE_URL=mysql://username:password@host:3306/member_management

# JWT 密鑰（必填，使用強密碼）
JWT_SECRET=your-strong-secret-key-at-least-32-characters

# CORS 設定（必填，填入前端網址）
CORS_ORIGIN=https://your-frontend-domain.zeabur.app

# 以下為選填項目
API_PREFIX=api/v1
BCRYPT_ROUNDS=12
LOG_LEVEL=info
ENABLE_LOGGING=true
TZ=Asia/Taipei
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=100
```

**⚠️ 重要提醒**：
- `DATABASE_URL`: 如果使用 Zeabur MySQL，連線字串會自動提供
- `JWT_SECRET`: 使用以下命令生成強密碼
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

#### 4. 執行資料庫遷移

部署成功後，需要在 Zeabur 中執行資料庫遷移：

**選項 A - 使用 Zeabur Terminal**:
1. 在 Zeabur Dashboard 找到您的服務
2. 點擊「Terminal」
3. 執行：
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

**選項 B - 本地執行（連接到遠端資料庫）**:
```bash
# 設定遠端資料庫 URL
export DATABASE_URL="your-zeabur-mysql-url"

# 執行遷移
npx prisma migrate deploy

# 載入種子資料
npx prisma db seed
```

### 方法二：使用 Zeabur CLI

#### 1. 安裝 Zeabur CLI

```bash
npm install -g @zeabur/cli
```

#### 2. 登入

```bash
zeabur login
```

#### 3. 部署

```bash
cd member-management-api
zeabur deploy
```

---

## 🔧 使用 Zeabur MySQL

### 1. 新增 MySQL 服務

1. 在 Zeabur 專案中點擊「Add Service」
2. 選擇「MySQL」
3. Zeabur 會自動建立 MySQL 實例

### 2. 連結到應用程式

1. Zeabur 會自動產生 `DATABASE_URL` 環境變數
2. 格式：`mysql://username:password@host:port/database`
3. 無需手動設定，會自動注入到應用程式

### 3. 執行遷移

使用 Zeabur Terminal 或本地連線執行：
```bash
npx prisma migrate deploy
npx prisma db seed
```

---

## 📊 Dockerfile 說明

### 多階段建置架構

```dockerfile
階段 1: deps (依賴安裝)
  ↓
階段 2: builder (建置應用)
  ↓
階段 3: runner (運行環境)
```

### 建置期參數（寫死在 Dockerfile）

這些參數在建置時就已確定，寫在 `ENV` 指令中：

```dockerfile
# 階段 2: 建置階段
ENV DATABASE_URL="mysql://user:password@localhost:3306/member_management"
ENV NODE_ENV="production"

# 階段 3: 運行階段
ENV NODE_ENV="production"
ENV PORT=3001
```

**為什麼建置時需要 DATABASE_URL？**
- Prisma 在生成 Client 時需要知道資料庫 schema
- 使用假的 URL 即可，實際連線在運行時才會使用真實 URL

### 運行期參數（從環境變數讀取）

這些參數在 Zeabur 環境變數中設定，運行時動態載入：

- `DATABASE_URL` - 實際的資料庫連線
- `JWT_SECRET` - JWT 簽名密鑰
- `CORS_ORIGIN` - 允許的前端網址
- `API_PREFIX` - API 路徑前綴
- `BCRYPT_ROUNDS` - 密碼加密強度
- `LOG_LEVEL` - 日誌等級
- 等其他配置...

---

## 🔍 驗證部署

### 1. 檢查服務狀態

在 Zeabur Dashboard 查看：
- Service Status 應該是 "Running"
- 沒有錯誤訊息

### 2. 測試 API

```bash
# 取得您的 Zeabur URL（例如：https://your-app.zeabur.app）
ZEABUR_URL="https://your-app.zeabur.app"

# 測試健康檢查
curl $ZEABUR_URL/api/v1

# 測試登入
curl -X POST $ZEABUR_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 3. 查看日誌

在 Zeabur Dashboard 的「Logs」頁面查看應用程式日誌。

---

## 🌐 設定自訂網域

### 1. 在 Zeabur 添加網域

1. 進入您的服務設定
2. 點擊「Domains」
3. 添加自訂網域（例如：api.your-domain.com）

### 2. 設定 DNS

在您的 DNS 提供商添加 CNAME 記錄：

```
Type: CNAME
Name: api
Value: <zeabur-provided-domain>
```

### 3. 啟用 HTTPS

Zeabur 會自動為您的網域配置 SSL 憑證（使用 Let's Encrypt）。

### 4. 更新 CORS 設定

記得在環境變數更新 `CORS_ORIGIN`：
```env
CORS_ORIGIN=https://your-frontend-domain.com
```

---

## 📈 效能優化

### 1. 啟用 Health Check

Dockerfile 已包含健康檢查設定：
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3
```

### 2. 資源配置

在 Zeabur 中調整資源：
- CPU: 建議至少 0.5 vCPU
- Memory: 建議至少 512 MB

### 3. 資料庫連線池

在環境變數中設定：
```env
DB_POOL_MIN=2
DB_POOL_MAX=10
```

---

## 🔐 安全最佳實踐

### 1. 環境變數安全

- ✅ 使用 Zeabur 的環境變數功能（已加密）
- ✅ 不要在程式碼中硬編碼敏感資訊
- ✅ 使用強 JWT_SECRET（至少 32 字元）

### 2. CORS 設定

```env
# 只允許特定網域
CORS_ORIGIN=https://your-frontend.com

# 多個網域（用逗號分隔）
CORS_ORIGIN=https://app.com,https://admin.app.com
```

### 3. 密碼加密

```env
# 生產環境使用更高的加密強度
BCRYPT_ROUNDS=12
```

---

## 🐛 疑難排解

### 問題 1: 建置失敗

**錯誤**：Prisma generate 失敗

**解決**：
1. 確認 `DATABASE_URL` 在建置階段有設定（Dockerfile 中已包含）
2. 檢查 `prisma/schema.prisma` 檔案是否正確

### 問題 2: 資料庫連線失敗

**錯誤**：Cannot connect to database

**檢查**：
1. Zeabur MySQL 服務是否運行中
2. `DATABASE_URL` 環境變數是否正確
3. 資料庫遷移是否已執行

### 問題 3: CORS 錯誤

**錯誤**：CORS policy blocked

**解決**：
1. 確認 `CORS_ORIGIN` 設定正確
2. 檢查前端網址協議（http/https）是否匹配
3. 重新部署使設定生效

### 問題 4: 端口衝突

**錯誤**：Port already in use

**解決**：
Zeabur 會自動設定 `PORT` 環境變數，應用程式會自動使用正確的端口。確認程式碼中使用：
```typescript
const port = process.env.PORT || 3001;
```

---

## 📦 Docker 映像大小優化

### 目前優化措施

1. ✅ 使用 Alpine Linux（體積小）
2. ✅ 多階段建置（只複製必要檔案）
3. ✅ 只安裝生產依賴
4. ✅ 使用 `.dockerignore` 排除不必要檔案

### 預期映像大小

- 基礎映像（node:18-alpine）：~40 MB
- 應用程式 + 依賴：~150-200 MB
- 總計：~200-250 MB

---

## 🔄 CI/CD 自動部署

### GitHub Actions 範例

建立 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Zeabur

on:
  push:
    branches: [ main ]
    paths:
      - 'member-management-api/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Zeabur
        env:
          ZEABUR_TOKEN: ${{ secrets.ZEABUR_TOKEN }}
        run: |
          npx @zeabur/cli deploy
```

---

## 📝 環境變數完整清單

### 必填項目

| 變數 | 說明 | 範例 |
|------|------|------|
| `DATABASE_URL` | 資料庫連線字串 | `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | JWT 簽名密鑰 | `生成的 64 字元隨機字串` |
| `CORS_ORIGIN` | 允許的前端網址 | `https://app.zeabur.app` |

### 選填項目

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `PORT` | 3001 | API 端口（Zeabur 自動設定）|
| `API_PREFIX` | api/v1 | API 路徑前綴 |
| `BCRYPT_ROUNDS` | 12 | 密碼加密強度 |
| `LOG_LEVEL` | info | 日誌等級 |
| `ENABLE_LOGGING` | true | 是否啟用日誌 |
| `TZ` | Asia/Taipei | 時區 |
| `DEFAULT_PAGE_SIZE` | 10 | 預設分頁大小 |
| `MAX_PAGE_SIZE` | 100 | 最大分頁大小 |

---

## 🎯 部署檢查清單

部署前請確認：

- [ ] Dockerfile 已建立
- [ ] .dockerignore 已建立
- [ ] 程式碼已推送到 GitHub
- [ ] Zeabur 專案已建立
- [ ] MySQL 服務已設定
- [ ] 所有必填環境變數已設定
- [ ] JWT_SECRET 已使用強密碼
- [ ] CORS_ORIGIN 已設定正確網址
- [ ] 資料庫遷移已執行
- [ ] 種子資料已載入
- [ ] API 測試通過
- [ ] 自訂網域已設定（如需要）

---

## 🔗 相關連結

- Zeabur 官方網站：https://zeabur.com
- Zeabur 文件：https://zeabur.com/docs
- Prisma 文件：https://www.prisma.io/docs
- NestJS 文件：https://docs.nestjs.com

---

## 📞 支援

如有問題，請參考：
- [README.md](../README.md) - 專案說明
- [DEPLOYMENT.md](../DEPLOYMENT.md) - 通用部署指南
- [ENV_GUIDE.md](../ENV_GUIDE.md) - 環境變數指南

---

**版本**: 1.0.0
**更新日期**: 2025-11-15
