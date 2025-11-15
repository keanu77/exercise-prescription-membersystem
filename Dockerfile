# ==========================================
# 會員管理系統後端 - Dockerfile (Zeabur 部署版本)
# ==========================================
# 使用多階段建置，區分建置期和運行期參數

# ========================================
# 階段 1: 依賴安裝
# ========================================
FROM node:18-alpine AS deps

# 設定工作目錄
WORKDIR /app

# 複製 package 檔案
COPY package*.json ./
COPY prisma ./prisma/

# 安裝所有依賴（包含 devDependencies，因為建置時需要）
RUN npm ci

# ========================================
# 階段 2: 建置階段
# ========================================
FROM node:18-alpine AS builder

WORKDIR /app

# 【建置期參數 - 寫死在 Dockerfile】
# Prisma 需要 DATABASE_URL 來生成 client，這裡使用假的 URL
ENV DATABASE_URL="mysql://user:password@localhost:3306/member_management"
ENV NODE_ENV="production"

# 從 deps 階段複製 node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# 複製原始碼
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 建置 NestJS 應用
RUN npm run build

# 安裝僅生產環境的依賴
RUN npm ci --only=production && npm cache clean --force

# ========================================
# 階段 3: 運行階段
# ========================================
FROM node:18-alpine AS runner

# 安裝 dumb-init（用於正確處理訊號）
RUN apk add --no-cache dumb-init

WORKDIR /app

# 建立非 root 使用者
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# 從 builder 階段複製必要檔案
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# 【建置期參數 - 寫死】
# 設定執行環境為生產環境
ENV NODE_ENV="production"

# 【運行期參數 - 從環境變數讀取】
# 這些參數會在 Zeabur 部署時從環境變數注入
# DATABASE_URL - 資料庫連線（從 Zeabur 環境變數讀取）
# JWT_SECRET - JWT 密鑰（從 Zeabur 環境變數讀取）
# PORT - 伺服器端口（從 Zeabur 環境變數讀取，預設 3001）
# CORS_ORIGIN - 允許的前端網址（從 Zeabur 環境變數讀取）

# 預設端口（Zeabur 會覆寫此值）
ENV PORT=3001

# 暴露端口
EXPOSE 3001

# 切換到非 root 使用者
USER nestjs

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT}/api/v1', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 使用 dumb-init 啟動應用
CMD ["dumb-init", "node", "dist/main"]
