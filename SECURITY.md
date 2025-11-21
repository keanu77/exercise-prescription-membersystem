# 安全指南 🔒

本文件說明專案的安全最佳實踐和注意事項。

---

## 🚨 敏感資訊管理

### 絕對不可提交到 Git 的檔案

```
❌ .env                    # 開發環境變數
❌ .env.local              # 本地環境變數
❌ .env.production         # 生產環境變數
❌ .env.*.local            # 任何本地環境變數
❌ *.pem, *.key, *.crt     # SSL 憑證和私鑰
❌ credentials.json        # API 憑證檔案
❌ serviceAccount.json     # 服務帳號金鑰
```

### 檢查清單

在提交程式碼前，請確認：

- [ ] 沒有硬編碼的密碼、API 金鑰或 Token
- [ ] 所有敏感資訊都使用環境變數
- [ ] `.gitignore` 包含所有敏感檔案
- [ ] 檢查 Git 歷史記錄是否包含敏感資訊
- [ ] 文檔中使用占位符而非真實密碼

---

## 🔐 環境變數設定

### 開發環境

1. 複製範本檔案：
```bash
cp member-management-api/.env.example member-management-api/.env
```

2. 填入開發用的設定：
```env
DATABASE_URL="mysql://root:root@localhost:3306/member_management"
JWT_SECRET="dev-secret-key-please-change-in-production"
```

### 生產環境

**絕對不要**使用開發環境的密碼！

#### 生成強密碼

```bash
# JWT Secret（至少 32 字元）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 或使用 OpenSSL
openssl rand -hex 32
```

#### Zeabur 部署

1. 前往 Zeabur Dashboard → 您的服務 → Environment Variables
2. 設定以下環境變數：

```env
DATABASE_URL=mysql://root:[從MySQL服務複製]@host:port/database
JWT_SECRET=[使用上方命令生成的32字元密鑰]
CORS_ORIGIN=https://your-frontend-domain.com
NODE_ENV=production
```

3. **切勿**在 Dockerfile 中硬編碼敏感資訊

---

## 🛡️ 已實作的安全措施

### ✅ 認證與授權
- JWT Token 認證
- bcrypt 密碼加密（12 rounds）
- Token 過期機制（預設 24 小時）

### ✅ 輸入驗證
- class-validator 自動驗證
- Pydantic 資料模型驗證
- Prisma ORM 防 SQL Injection

### ✅ CORS 配置
- 白名單機制
- 憑證控制
- 預檢請求支援

### ✅ Docker 安全
- 非 root 使用者運行
- 多階段建置（最小化映像）
- 健康檢查機制

---

## ⚠️ 需要實作的安全措施

### 🔴 高優先級（立即處理）

#### 1. Rate Limiting
防止暴力破解和 DDoS 攻擊：

```typescript
// 待實作
import { ThrottlerModule } from '@nestjs/throttler';

ThrottlerModule.forRoot({
  ttl: 60,
  limit: 10,
})
```

#### 2. Helmet 安全標頭
防止常見的 Web 漏洞：

```typescript
// 待實作
import helmet from 'helmet';
app.use(helmet());
```

#### 3. 環境變數驗證
確保必要的環境變數都已設定：

```typescript
// 待實作
import * as Joi from 'joi';

validationSchema: Joi.object({
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
})
```

### 🟡 中優先級（短期內處理）

#### 4. HTTPS 強制
生產環境必須使用 HTTPS：

```typescript
// nginx.conf
if ($scheme != "https") {
  return 301 https://$server_name$request_uri;
}
```

#### 5. CSRF 保護
防止跨站請求偽造：

```typescript
import csurf from 'csurf';
app.use(csurf());
```

#### 6. 請求大小限制
防止惡意大型請求：

```typescript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

### 🟢 低優先級（長期規劃）

#### 7. 資料加密
敏感個資欄位加密：

- 電話號碼
- Email 地址
- 身分證字號（如有）

#### 8. 操作審計日誌
記錄所有敏感操作：

- 登入/登出
- 會員資料變更
- 管理員操作

#### 9. 雙因素認證（2FA）
增強帳號安全性

---

## 🚫 常見安全錯誤

### 1. ❌ 硬編碼密碼

```typescript
// 錯誤示範 ❌
const DATABASE_URL = "mysql://root:password123@localhost:3306/db";

// 正確做法 ✅
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}
```

### 2. ❌ 明文儲存密碼

```typescript
// 錯誤示範 ❌
await prisma.admin.create({
  data: { username, password: 'plain-password' }
});

// 正確做法 ✅
const hashedPassword = await bcrypt.hash(password, 12);
await prisma.admin.create({
  data: { username, password: hashedPassword }
});
```

### 3. ❌ 洩漏錯誤資訊

```typescript
// 錯誤示範 ❌
throw new UnauthorizedException('User not found');

// 正確做法 ✅
throw new UnauthorizedException('帳號或密碼錯誤');
```

### 4. ❌ 不驗證輸入

```typescript
// 錯誤示範 ❌
@Post()
create(@Body() data: any) { }

// 正確做法 ✅
@Post()
create(@Body() data: CreateMemberDto) { }
```

---

## 🔍 安全檢查工具

### 定期執行

```bash
# 檢查 npm 套件漏洞
npm audit

# 修復可修復的漏洞
npm audit fix

# 檢查過時的套件
npm outdated

# 掃描敏感資訊（需安裝 truffleHog）
trufflehog git file://. --only-verified
```

### Git Hooks（建議安裝）

```bash
# 安裝 husky
npm install --save-dev husky

# 設定 pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run test"
```

---

## 📚 安全資源

### OWASP Top 10
https://owasp.org/www-project-top-ten/

### NestJS Security
https://docs.nestjs.com/security/helmet

### NIST Cybersecurity Framework
https://www.nist.gov/cyberframework

---

## 🆘 安全事件處理

### 如果發現安全漏洞

1. **立即通知**團隊負責人
2. **評估影響**範圍和嚴重程度
3. **修復漏洞**並測試
4. **更換密碼**所有受影響的憑證
5. **通知用戶**（如有需要）
6. **文件記錄**事件和處理過程

### 如果密碼洩漏

```bash
# 1. 立即在 Zeabur 更改密碼
# 2. 更新所有環境變數
# 3. 清理 Git 歷史（使用 BFG Repo-Cleaner）
git clone --mirror git://example.com/repo.git
java -jar bfg.jar --replace-text passwords.txt repo.git
cd repo.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force

# 4. 通知所有開發者重新 clone repository
```

---

## ✅ 安全檢查清單

定期檢查（每月）：

- [ ] npm audit 無高危漏洞
- [ ] 所有密碼都是強密碼（>32字元）
- [ ] JWT Secret 定期更換（每季）
- [ ] SSL 憑證未過期
- [ ] 資料庫備份正常運作
- [ ] 日誌檢查無異常活動
- [ ] CORS 設定正確
- [ ] 環境變數在 .gitignore 中
- [ ] 無硬編碼的敏感資訊

---

**最後更新**：2025-11-22
**版本**：1.0

如有安全問題，請聯繫專案維護者。
