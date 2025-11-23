#!/bin/bash

# ==========================================
# MySQL 資料庫備份腳本
# ==========================================
# 用途：將 MySQL 資料庫備份到本地或遠端儲存
# 使用方式：./scripts/backup/db-backup.sh

set -e  # 遇到錯誤立即停止

# ==========================================
# 配置區
# ==========================================

# 從環境變數讀取資料庫連線資訊，或使用預設值
DB_URL="${DATABASE_URL:-}"

# 備份目錄
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# 保留天數（自動刪除超過此天數的備份）
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# ==========================================
# 顏色輸出
# ==========================================
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ==========================================
# 函數定義
# ==========================================

# 解析 DATABASE_URL
parse_database_url() {
    if [ -z "$DB_URL" ]; then
        echo -e "${RED}❌ 錯誤：DATABASE_URL 環境變數未設定${NC}"
        echo "請設定 DATABASE_URL，例如："
        echo "  export DATABASE_URL='mysql://user:password@host:port/database'"
        exit 1
    fi

    # 解析 URL: mysql://user:password@host:port/database
    # 移除 mysql:// 前綴
    DB_INFO="${DB_URL#mysql://}"

    # 分離使用者和密碼
    USER_PASS="${DB_INFO%%@*}"
    DB_USER="${USER_PASS%%:*}"
    DB_PASS="${USER_PASS#*:}"

    # 分離主機和資料庫
    HOST_DB="${DB_INFO#*@}"
    HOST_PORT="${HOST_DB%%/*}"
    DB_HOST="${HOST_PORT%%:*}"
    DB_PORT="${HOST_PORT#*:}"
    DB_NAME="${HOST_DB#*/}"

    # 如果沒有指定 port，使用預設值
    if [ "$DB_PORT" = "$DB_HOST" ]; then
        DB_PORT="3306"
    fi
}

# 建立備份目錄
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${YELLOW}📁 建立備份目錄：${BACKUP_DIR}${NC}"
        mkdir -p "$BACKUP_DIR"
    fi
}

# 執行備份
perform_backup() {
    echo -e "${GREEN}🔄 開始備份資料庫...${NC}"
    echo "  資料庫: ${DB_NAME}"
    echo "  主機: ${DB_HOST}:${DB_PORT}"
    echo "  備份檔案: ${BACKUP_PATH}"
    echo ""

    # 使用 mysqldump 備份
    # --single-transaction: 對 InnoDB 表使用一致性讀取
    # --routines: 備份存儲過程和函數
    # --triggers: 備份觸發器
    # --events: 備份事件
    mysqldump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        --password="$DB_PASS" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        "$DB_NAME" > "$BACKUP_PATH"

    if [ $? -eq 0 ]; then
        # 壓縮備份檔案
        echo -e "${GREEN}🗜️  壓縮備份檔案...${NC}"
        gzip "$BACKUP_PATH"
        BACKUP_PATH="${BACKUP_PATH}.gz"

        # 計算檔案大小
        BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)

        echo -e "${GREEN}✅ 備份成功！${NC}"
        echo "  檔案位置: ${BACKUP_PATH}"
        echo "  檔案大小: ${BACKUP_SIZE}"
        echo ""

        return 0
    else
        echo -e "${RED}❌ 備份失敗！${NC}"
        return 1
    fi
}

# 清理舊備份
cleanup_old_backups() {
    echo -e "${YELLOW}🧹 清理超過 ${RETENTION_DAYS} 天的舊備份...${NC}"

    # 找出並刪除超過保留天數的備份
    DELETED_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l)

    if [ "$DELETED_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ 已刪除 ${DELETED_COUNT} 個舊備份${NC}"
    else
        echo -e "${GREEN}✅ 沒有需要刪除的舊備份${NC}"
    fi
    echo ""
}

# 列出所有備份
list_backups() {
    echo -e "${GREEN}📋 現有備份列表：${NC}"
    echo "─────────────────────────────────────────────────"

    if [ -d "$BACKUP_DIR" ]; then
        BACKUP_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | wc -l)

        if [ "$BACKUP_COUNT" -gt 0 ]; then
            find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -exec ls -lh {} \; | \
                awk '{print $9 " (" $5 ") - " $6 " " $7 " " $8}'
            echo "─────────────────────────────────────────────────"
            echo -e "${GREEN}總計: ${BACKUP_COUNT} 個備份${NC}"
        else
            echo "（沒有備份檔案）"
            echo "─────────────────────────────────────────────────"
        fi
    else
        echo "（備份目錄不存在）"
        echo "─────────────────────────────────────────────────"
    fi
    echo ""
}

# ==========================================
# 主程序
# ==========================================

main() {
    echo "=========================================="
    echo "🔒 MySQL 資料庫備份工具"
    echo "=========================================="
    echo ""

    # 解析資料庫連線資訊
    parse_database_url

    # 建立備份目錄
    create_backup_dir

    # 執行備份
    perform_backup

    # 清理舊備份
    cleanup_old_backups

    # 列出所有備份
    list_backups

    echo "=========================================="
    echo -e "${GREEN}✅ 備份流程完成！${NC}"
    echo "=========================================="
}

# 執行主程序
main
