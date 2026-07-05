#!/usr/bin/env bash
# ============================================================
#  🔧 TestForge — 主執行腳本
#  用於本地測試或在非 GitHub Actions 環境中執行
#
#  用法：
#    bash scripts/run-testforge.sh <專案路徑> [選項]
#
#  範例：
#    bash scripts/run-testforge.sh ./sample-vue-project
#    bash scripts/run-testforge.sh ./my-project --framework vue --threshold 80
# ============================================================

set -euo pipefail

# ---- 顏色定義（支援無色彩終端） ----
if [ -t 1 ] && command -v tput &>/dev/null; then
  RED=$(tput setaf 1)
  GREEN=$(tput setaf 2)
  YELLOW=$(tput setaf 3)
  BLUE=$(tput setaf 4)
  CYAN=$(tput setaf 6)
  BOLD=$(tput bold)
  RESET=$(tput sgr0)
else
  RED="" GREEN="" YELLOW="" BLUE="" CYAN="" BOLD="" RESET=""
fi

# ---- 輔助函數 ----
log_info()    { echo "${BLUE}ℹ️  $*${RESET}"; }
log_success() { echo "${GREEN}✅ $*${RESET}"; }
log_warn()    { echo "${YELLOW}⚠️  $*${RESET}"; }
log_error()   { echo "${RED}❌ $*${RESET}"; }
log_step()    { echo ""; echo "${BOLD}${CYAN}── $* ──${RESET}"; }

# ---- 參數解析 ----
PROJECT_PATH="${1:-.}"
FRAMEWORK="auto"
THRESHOLD=80
SKIP_INSTALL=false

shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --framework)    FRAMEWORK="$2"; shift 2 ;;
    --threshold)    THRESHOLD="$2"; shift 2 ;;
    --skip-install) SKIP_INSTALL=true; shift ;;
    --help|-h)
      echo "用法：bash scripts/run-testforge.sh <專案路徑> [選項]"
      echo ""
      echo "選項："
      echo "  --framework <auto|vue|react|node>  指定框架（預設：auto）"
      echo "  --threshold <數字>                  覆蓋率門檻百分比（預設：80）"
      echo "  --skip-install                      跳過依賴安裝"
      echo "  --help, -h                          顯示此說明"
      exit 0
      ;;
    *) log_error "未知參數：$1"; exit 1 ;;
  esac
done

# ---- 取得 TestForge 所在目錄（跨平台相容） ----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTFORGE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---- 解析專案路徑（相對或絕對路徑都支援） ----
if [[ "$PROJECT_PATH" = /* ]]; then
  # 絕對路徑
  ABS_PROJECT_PATH="$PROJECT_PATH"
else
  # 相對路徑：相對於 CWD
  ABS_PROJECT_PATH="$(cd "$PROJECT_PATH" 2>/dev/null && pwd)" || {
    log_error "目錄不存在：$PROJECT_PATH"
    exit 1
  }
fi

echo ""
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║     🔧 TestForge — 自動測試平台             ║"
echo "  ╚══════════════════════════════════════════════╝"
echo ""
log_info "專案路徑：$ABS_PROJECT_PATH"
log_info "TestForge：$TESTFORGE_ROOT"
log_info "框架偵測：$FRAMEWORK"
log_info "覆蓋率門檻：$THRESHOLD%"

# ============================================================
# Step 1：偵測框架
# ============================================================
log_step "Step 1：偵測專案框架"

if [ "$FRAMEWORK" = "auto" ]; then
  if [ -f "$ABS_PROJECT_PATH/package.json" ]; then
    if grep -q '"vue"' "$ABS_PROJECT_PATH/package.json" 2>/dev/null; then
      FRAMEWORK="vue"
    elif grep -q '"react"' "$ABS_PROJECT_PATH/package.json" 2>/dev/null; then
      FRAMEWORK="react"
    elif grep -q '"next"' "$ABS_PROJECT_PATH/package.json" 2>/dev/null; then
      FRAMEWORK="react"
    elif grep -q '"nuxt"' "$ABS_PROJECT_PATH/package.json" 2>/dev/null; then
      FRAMEWORK="vue"
    else
      FRAMEWORK="node"
    fi
  else
    FRAMEWORK="node"
  fi
fi

log_success "偵測到框架：$FRAMEWORK"

# ============================================================
# Step 2：安裝依賴
# ============================================================
log_step "Step 2：安裝依賴"

# 安裝 TestForge 自身依賴
if [ -f "$TESTFORGE_ROOT/package.json" ]; then
  log_info "安裝 TestForge 依賴..."
  cd "$TESTFORGE_ROOT"
  npm install --ignore-scripts --silent 2>/dev/null || npm install --ignore-scripts
  cd - > /dev/null
fi

# 安裝目標專案依賴
if [ "$SKIP_INSTALL" = false ] && [ -f "$ABS_PROJECT_PATH/package.json" ]; then
  log_info "安裝目標專案依賴..."
  cd "$ABS_PROJECT_PATH"
  npm install --silent 2>/dev/null || npm install
  
  # 安裝測試依賴
  log_info "安裝測試依賴..."
  npm install --save-dev vitest@latest 2>/dev/null || true
  
  case "$FRAMEWORK" in
    vue)
      npm install --save-dev @vue/test-utils@latest jsdom@latest @vitest/coverage-v8@latest 2>/dev/null || true
      ;;
    react)
      npm install --save-dev @testing-library/react@latest jsdom@latest @vitest/coverage-v8@latest 2>/dev/null || true
      ;;
    node)
      npm install --save-dev @vitest/coverage-v8@latest 2>/dev/null || true
      ;;
  esac
  
  cd - > /dev/null
  log_success "依賴安裝完成"
else
  log_warn "跳過依賴安裝"
fi

# ============================================================
# Step 3：產生測試腳本
# ============================================================
log_step "Step 3：產生測試腳本"

node "$TESTFORGE_ROOT/testforge.js" "$ABS_PROJECT_PATH"

log_success "測試腳本產生完成"

# ============================================================
# Step 4：確保 vitest 設定存在
# ============================================================
log_step "Step 4：檢查 vitest 設定"

# 1. 如果已有 vitest 專用設定 → 跳過
HAS_VITEST_CONFIG=false
for f in "$ABS_PROJECT_PATH/vitest.config.ts" \
         "$ABS_PROJECT_PATH/vitest.config.js"; do
  if [ -f "$f" ]; then
    HAS_VITEST_CONFIG=true
    log_success "找到 vitest 設定：$(basename "$f")，跳過建立"
    break
  fi
done

if [ "$HAS_VITEST_CONFIG" = false ]; then
  # 2. 如果有 vite.config → 建立 vitest.config.ts 合併設定並加入 jsdom
  VITE_CONFIG=""
  for f in "$ABS_PROJECT_PATH/vite.config.ts" \
           "$ABS_PROJECT_PATH/vite.config.js"; do
    if [ -f "$f" ]; then
      VITE_CONFIG="$(basename "$f")"
      break
    fi
  done

  if [ -n "$VITE_CONFIG" ]; then
    log_warn "找到 $VITE_CONFIG 但沒有 vitest 專用設定，建立 vitest.config.ts 合併設定..."
    VITE_CONFIG_NAME="${VITE_CONFIG%.*}"
    cat > "$ABS_PROJECT_PATH/vitest.config.ts" << EOF
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './${VITE_CONFIG_NAME}';

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'jsdom',
    include: ['__generated_tests__/**/*.test.ts', '__generated_tests__/**/*.test.js'],
  },
}));
EOF
    log_success "已建立 vitest.config.ts（合併 $VITE_CONFIG）"
  else
    # 3. 完全沒有設定 → 建立獨立 vitest.config.ts
    log_warn "找不到 vitest/vite 設定，建立基本設定..."
    cat > "$ABS_PROJECT_PATH/vitest.config.ts" << 'VITEST_CONFIG'
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['__generated_tests__/**/*.test.ts', '__generated_tests__/**/*.test.js'],
  },
});
VITEST_CONFIG
    log_success "已建立 vitest.config.ts"
  fi
fi

# ============================================================
# Step 5：執行測試
# ============================================================
log_step "Step 5：執行測試 & 覆蓋率分析"

cd "$ABS_PROJECT_PATH"

# 執行測試（即使部分失敗也繼續）
# --update：自動更新快照（TestForge 每次重新產生測試，舊快照無意義）
TEST_EXIT_CODE=0
npx vitest run \
  --update \
  --reporter=default \
  --reporter=json \
  --outputFile=testforge-results.json \
  --coverage \
  --coverage.reporter=json-summary \
  --coverage.reporter=text \
  2>&1 || TEST_EXIT_CODE=$?

cd - > /dev/null

if [ "$TEST_EXIT_CODE" -eq 0 ]; then
  log_success "所有測試通過！"
else
  log_warn "部分測試失敗（exit code: $TEST_EXIT_CODE）"
fi

# ============================================================
# Step 6：產生報告
# ============================================================
log_step "Step 6：產生報告"

node "$TESTFORGE_ROOT/scripts/generate-report.js" \
  "$ABS_PROJECT_PATH" \
  "$THRESHOLD"

log_success "報告產生完成"

# ============================================================
# 完成摘要
# ============================================================
echo ""
echo "  ═══════════════════════════════════════════════"
echo "  ${GREEN}${BOLD}✅ TestForge 執行完成！${RESET}"
echo "  ═══════════════════════════════════════════════"
echo ""

# 顯示報告路徑
if [ -f "$ABS_PROJECT_PATH/TestForge-Report.md" ]; then
  log_info "📄 報告：$ABS_PROJECT_PATH/TestForge-Report.md"
fi
if [ -d "$ABS_PROJECT_PATH/coverage" ]; then
  log_info "📊 覆蓋率：$ABS_PROJECT_PATH/coverage/index.html"
fi

echo ""
