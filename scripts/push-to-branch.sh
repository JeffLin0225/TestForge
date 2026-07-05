#!/usr/bin/env bash
# ============================================================
#  📤 TestForge — 報告推送到分支
#
#  用法：
#    bash scripts/push-to-branch.sh <專案路徑> <分支名稱>
#
#  說明：
#    將 TestForge 報告推送到指定的 Git 分支。
#    此腳本主要用於 GitHub Actions 環境中。
#    在本地環境中也可以使用，但需要有 push 權限。
# ============================================================

set -euo pipefail

PROJECT_PATH="${1:-.}"
BRANCH_NAME="${2:-testforge/reports}"

ABS_PROJECT_PATH="$(cd "$PROJECT_PATH" && pwd)"

echo "📤 推送報告到分支：$BRANCH_NAME"

# ---- 找到 repo 根目錄 ----
REPO_ROOT="$(git -C "$ABS_PROJECT_PATH" rev-parse --show-toplevel 2>/dev/null || echo "")"

if [ -z "$REPO_ROOT" ]; then
  echo "⚠️  不在 Git 倉庫中，跳過分支推送"
  exit 0
fi

cd "$REPO_ROOT"

# ---- 收集要提交的報告檔案 ----
REPORT_FILES=()

# 搜尋專案路徑下的報告
for f in "$ABS_PROJECT_PATH/TestForge-Report.md" \
         "$ABS_PROJECT_PATH/testforge-results.json"; do
  if [ -f "$f" ]; then
    REPORT_FILES+=("$f")
  fi
done

# 搜尋 repo 根目錄的報告
for f in "$REPO_ROOT/UnitTest-Report.md" \
         "$REPO_ROOT/Coverage-Report.md"; do
  if [ -f "$f" ]; then
    REPORT_FILES+=("$f")
  fi
done

# 覆蓋率目錄
COVERAGE_DIR="$ABS_PROJECT_PATH/coverage"

if [ ${#REPORT_FILES[@]} -eq 0 ] && [ ! -d "$COVERAGE_DIR" ]; then
  echo "⚠️  沒有找到報告檔案，跳過推送"
  exit 0
fi

# ---- 設定 Git ----
# 在 GitHub Actions 中使用 github-actions bot
if [ -n "${GITHUB_ACTIONS:-}" ]; then
  git config user.name "github-actions[bot]"
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
fi

# ---- 保存目前分支 ----
CURRENT_BRANCH="$(git branch --show-current 2>/dev/null || git rev-parse --short HEAD)"

# ---- 建立暫存目錄來存放報告 ----
TEMP_DIR="$(mktemp -d)"
trap "rm -rf $TEMP_DIR" EXIT

# 複製報告到暫存目錄
for f in "${REPORT_FILES[@]}"; do
  cp "$f" "$TEMP_DIR/"
done

# 複製覆蓋率目錄（如果存在）
if [ -d "$COVERAGE_DIR" ]; then
  cp -r "$COVERAGE_DIR" "$TEMP_DIR/coverage"
fi

# ---- 暫存工作目錄的變更（CI 跑完測試後會有很多未提交的檔案） ----
echo "📦 暫存工作目錄變更..."
git stash --include-untracked --quiet 2>/dev/null || true

# ---- 切換到報告分支 ----
# 檢查遠端分支是否存在
if git ls-remote --heads origin "$BRANCH_NAME" | grep -q "$BRANCH_NAME"; then
  echo "📥 報告分支已存在，拉取最新..."
  git fetch origin "$BRANCH_NAME" --depth=1
  git checkout "$BRANCH_NAME"
else
  echo "📝 建立新的報告分支..."
  git checkout --orphan "$BRANCH_NAME"
  git rm -rf . 2>/dev/null || true
fi

# ---- 複製報告到分支 ----
# 清除舊報告
rm -f TestForge-Report.md UnitTest-Report.md Coverage-Report.md testforge-results.json
rm -rf coverage/

# 複製新報告
cp "$TEMP_DIR/"*.md . 2>/dev/null || true
cp "$TEMP_DIR/"*.json . 2>/dev/null || true
if [ -d "$TEMP_DIR/coverage" ]; then
  cp -r "$TEMP_DIR/coverage" .
fi

# 建立 index 頁面
cat > README.md << 'EOF'
# 📊 TestForge 測試報告

此分支由 [TestForge](https://github.com/JeffLin0225/testforge) 自動產生，包含最新的測試報告和覆蓋率資料。

## 📄 報告檔案

- [TestForge-Report.md](./TestForge-Report.md) — 完整測試報告
- [coverage/](./coverage/) — 互動式覆蓋率報告

> ⚠️ 請勿手動修改此分支，它會在每次測試執行時自動更新。
EOF

# ---- 提交 & 推送 ----
git add -A
git commit -m "📊 TestForge: 更新測試報告 ($(date '+%Y-%m-%d %H:%M'))" \
  --allow-empty 2>/dev/null || true

if [ -n "${GITHUB_ACTIONS:-}" ]; then
  git push origin "$BRANCH_NAME" --force
  echo "✅ 報告已推送到 $BRANCH_NAME 分支"
  
  # 設定 output
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    REPO_URL="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:-}"
    echo "report-branch=$BRANCH_NAME" >> "$GITHUB_OUTPUT"
    echo "report-url=$REPO_URL/tree/$BRANCH_NAME" >> "$GITHUB_OUTPUT"
  fi
else
  echo "💡 本地模式：報告已 commit 到 $BRANCH_NAME 分支"
  echo "   執行 git push origin $BRANCH_NAME 來推送到遠端"
fi

# ---- 切回原本的分支 ----
git checkout "$CURRENT_BRANCH" 2>/dev/null || git checkout -

# ---- 還原工作目錄的變更 ----
echo "📦 還原工作目錄..."
git stash pop --quiet 2>/dev/null || true
