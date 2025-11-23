#!/bin/bash

# ==========================================
# MySQL 資料庫恢復腳本
# ==========================================
# 用途：從備份檔案恢復 MySQL 資料庫
# 使用方式：./scripts/backup/db-restore.sh <backup_file>

set -e  # 遇到錯誤立即停止

# ==========================================
# 配置區
# ==========================================

# 從環境變數讀取資料庫連線資訊
DB_URL="${DATABASE_URL:-}"

# 備份檔案路徑（從命令行參數取得）
BACKUP_FILE="$1"

# ==========================================
# 顏色輸出
# ==========================================
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==========================================
# 函數定義
# ==========================================

# 顯示使用方式
show_usage() {
    echo "使用方式："
    echo "  $0 <backup_file>"
    echo ""
    echo "範例："
    echo "  $0 backups/backup_20250115_120000.sql.gz"
    echo "  $0 backups/backup_20250115_120000.sql"
    echo ""
    echo "列出可用的備份："
    echo "  ls -lh backups/"
    exit 1
}

# 解析 DATABASE_URL
parse_database_url() {
    if [ -z "$DB_URL" ]; then
        echo -e "${RED}❌ 錯誤：DATABASE_URL 環境變數未設定${NC}"
        echo "請設定 DATABASE_URL，例如："
        echo "  export DATABASE_URL='mysql://user:password@host:port/database'"
        exit 1
    fi

    # 解析 URL
    DB_INFO="${DB_URL#mysql://}"
    USER_PASS="${DB_INFO%%@*}"
    DB_USER="${USER_PASS%%:*}"
    DB_PASS="${USER_PASS#*:}"
    HOST_DB="${DB_INFO#*@}"
    HOST_PORT="${HOST_DB%%/*}"
    DB_HOST="${HOST_PORT%%:*}"
    DB_PORT="${HOST_PORT#*:}"
    DB_NAME="${HOST_DB#*/}"

    if [ "$DB_PORT" = "$DB_HOST" ]; then
        DB_PORT="3306"
    fi
}

# 檢查備份檔案
check_backup_file() {
    if [ -z "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ 錯誤：請指定備份檔案${NC}"
        echo ""
        show_usage
    fi

    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ 錯誤：備份檔案不存在：${BACKUP_FILE}${NC}"
        echo ""
        echo "可用的備份檔案："
        ls -lh backups/*.sql* 2>/dev/null || echo "  （沒有備份檔案）"
        exit 1
    fi

    echo -e "${GREEN}✅ 找到備份檔案：${BACKUP_FILE}${NC}"
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "  檔案大小: ${FILE_SIZE}"
    echo ""
}

# 確認恢復操作
confirm_restore() {
    echo -e "${YELLOW}⚠️  警告：此操作將會覆蓋現有資料庫！${NC}"
    echo ""
    echo "  資料庫: ${DB_NAME}"
    echo "  主機: ${DB_HOST}:${DB_PORT}"
    echo "  備份檔案: ${BACKUP_FILE}"
    echo ""
    echo -e "${RED}這將會刪除現有的所有資料並恢復到備份時的狀態。${NC}"
    echo ""
    read -p "確定要繼續嗎？(輸入 'yes' 確認): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        echo -e "${YELLOW}❌ 操作已取消${NC}"
        exit 0
    fi

    echo ""
}

# 建立當前資料庫的備份（安全措施）
create_safety_backup() {
    echo -e "${BLUE}🔄 建立安全備份（以防萬一）...${NC}"

    SAFETY_BACKUP_DIR="./backups/safety"
    mkdir -p "$SAFETY_BACKUP_DIR"

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    SAFETY_BACKUP_FILE="${SAFETY_BACKUP_DIR}/before_restore_${TIMESTAMP}.sql"

    mysqldump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        --password="$DB_PASS" \
        --single-transaction \
        "$DB_NAME" > "$SAFETY_BACKUP_FILE" 2>/dev/null

    if [ $? -eq 0 ]; then
        gzip "$SAFETY_BACKUP_FILE"
        echo -e "${GREEN}✅ 安全備份已建立：${SAFETY_BACKUP_FILE}.gz${NC}"
    else
        echo -e "${YELLOW}⚠️  無法建立安全備份（可能資料庫為空）${NC}"
    fi
    echo ""
}

# 執行恢復
perform_restore() {
    echo -e "${GREEN}🔄 開始恢復資料庫...${NC}"
    echo ""

    # 判斷檔案是否為 gzip 壓縮
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        echo "📦 解壓縮並恢復備份..."
        gunzip -c "$BACKUP_FILE" | mysql \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --user="$DB_USER" \
            --password="$DB_PASS" \
            "$DB_NAME"
    else
        echo "📂 直接恢復備份..."
        mysql \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --user="$DB_USER" \
            --password="$DB_PASS" \
            "$DB_NAME" < "$BACKUP_FILE"
    fi

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ 資料庫恢復成功！${NC}"
        echo ""
        return 0
    else
        echo ""
        echo -e "${RED}❌ 資料庫恢復失敗！${NC}"
        echo "請檢查錯誤訊息並嘗試使用安全備份恢復。"
        exit 1
    fi
}

# 驗證恢復結果
verify_restore() {
    echo -e "${BLUE}🔍 驗證恢復結果...${NC}"

    # 檢查表的數量
    TABLE_COUNT=$(mysql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        --password="$DB_PASS" \
        "$DB_NAME" \
        -e "SHOW TABLES;" 2>/dev/null | wc -l)

    # 減去標題行
    TABLE_COUNT=$((TABLE_COUNT - 1))

    if [ "$TABLE_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ 資料庫包含 ${TABLE_COUNT} 個表${NC}"

        # 顯示表列表
        echo ""
        echo "📋 資料庫表列表："
        mysql \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --user="$DB_USER" \
            --password="$DB_PASS" \
            "$DB_NAME" \
            -e "SHOW TABLES;" 2>/dev/null
    else
        echo -e "${YELLOW}⚠️  警告：資料庫中沒有表${NC}"
    fi
    echo ""
}

# ==========================================
# 主程序
# ==========================================

main() {
    echo "=========================================="
    echo "🔄 MySQL 資料庫恢復工具"
    echo "=========================================="
    echo ""

    # 檢查備份檔案
    check_backup_file

    # 解析資料庫連線資訊
    parse_database_url

    # 確認恢復操作
    confirm_restore

    # 建立安全備份
    create_safety_backup

    # 執行恢復
    perform_restore

    # 驗證恢復結果
    verify_restore

    echo "=========================================="
    echo -e "${GREEN}✅ 恢復流程完成！${NC}"
    echo "=========================================="
    echo ""
    echo "安全備份位置："
    ls -lh backups/safety/ 2>/dev/null || echo "  （沒有安全備份）"
}

# 執行主程序
main
