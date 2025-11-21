#!/bin/bash

# ==========================================
# Rate Limiting 測試腳本
# ==========================================
# 測試 API 速率限制功能是否正常運作

echo "🔒 Rate Limiting 測試開始"
echo "======================================"

# 設定測試 API 網址
API_URL="${API_URL:-http://localhost:3001/api/v1}"

echo ""
echo "📋 測試 1: 登入端點速率限制（每分鐘最多 5 次）"
echo "--------------------------------------"
echo "快速發送 7 次登入請求..."
echo ""

SUCCESS_COUNT=0
RATE_LIMITED_COUNT=0

for i in {1..7}; do
  echo -n "請求 #$i: "

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}')

  HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

  if [ "$HTTP_CODE" == "429" ]; then
    echo "❌ 已被限制 (HTTP 429 - Too Many Requests)"
    ((RATE_LIMITED_COUNT++))
  elif [ "$HTTP_CODE" == "401" ]; then
    echo "✅ 請求成功 (HTTP 401 - 認證失敗，但未被限制)"
    ((SUCCESS_COUNT++))
  elif [ "$HTTP_CODE" == "200" ]; then
    echo "✅ 請求成功 (HTTP 200)"
    ((SUCCESS_COUNT++))
  else
    echo "⚠️  其他狀態碼: $HTTP_CODE"
  fi

  # 短暫延遲以確保請求順序
  sleep 0.1
done

echo ""
echo "📊 測試結果："
echo "   成功請求數: $SUCCESS_COUNT"
echo "   被限制請求數: $RATE_LIMITED_COUNT"
echo ""

if [ $RATE_LIMITED_COUNT -gt 0 ]; then
  echo "✅ Rate Limiting 正常運作！"
  echo "   前 5 個請求通過，第 6-7 個請求被限制"
else
  echo "❌ Rate Limiting 可能未正常運作"
  echo "   預期應該有請求被限制 (HTTP 429)"
fi

echo ""
echo "======================================"
echo "📋 測試 2: 一般端點速率限制（每分鐘最多 100 次）"
echo "--------------------------------------"
echo "發送 10 次請求到健康檢查端點..."
echo ""

GENERAL_SUCCESS=0
GENERAL_LIMITED=0

for i in {1..10}; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}")

  if [ "$HTTP_CODE" == "429" ]; then
    ((GENERAL_LIMITED++))
  else
    ((GENERAL_SUCCESS++))
  fi
done

echo "   成功請求數: $GENERAL_SUCCESS / 10"
echo "   被限制請求數: $GENERAL_LIMITED / 10"
echo ""

if [ $GENERAL_SUCCESS -eq 10 ]; then
  echo "✅ 一般端點 Rate Limiting 正常（100次/分鐘的限制足夠）"
else
  echo "⚠️  部分請求被限制（可能需要調整限制）"
fi

echo ""
echo "======================================"
echo "📝 Rate Limiting 配置說明"
echo "--------------------------------------"
echo "登入端點: 每分鐘最多 5 次嘗試"
echo "一般端點: 每分鐘最多 100 次請求"
echo ""
echo "若要修改限制，請編輯："
echo "  - app.module.ts (全域設定)"
echo "  - auth.controller.ts (登入端點設定)"
echo ""
echo "測試完成！"
