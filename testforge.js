#!/usr/bin/env node

// ============================================================
//  🔧 TestForge CLI — 自動掃描專案 & 產生測試案例 (模組化版)
// ============================================================

const fs = require('fs');
const path = require('path');

// ============================================================
// 設定
// ============================================================
const CONFIG = {
  ignoreDirs: ['node_modules', 'dist', '.git', '.nuxt', '.next', 'coverage', '__tests__', '__generated_tests__'],
  outputDir: '__generated_tests__',
};

// 載入處理器 (Handlers)
const handlers = {
  '.js': require('./handlers/js'),
  '.jsx': require('./handlers/js'),
  '.ts': require('./handlers/ts'),
  '.tsx': require('./handlers/ts'),
  '.vue': require('./handlers/vue'),
  '.nuxt': require('./handlers/nuxt'),
};

const supportedExtensions = Object.keys(handlers);

function detectFrameworkAndPatchHandlers(projectPath) {
  try {
    const pkgPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['nuxt']) {
        console.log('  🟢 偵測到 Nuxt 框架，將自動對 .vue 檔案套用 Nuxt 測試處理器');
        handlers['.vue'] = require('./handlers/nuxt');
      }
    }
  } catch (e) {
    // 忽略解析錯誤
  }
}

function main() {
  const targetDir = process.argv[2];

  if (!targetDir) {
    console.log('');
    console.log('  ❌ 請指定要掃描的專案目錄');
    console.log('');
    console.log('  用法：node testforge.js <專案目錄>');
    console.log('  範例：node testforge.js ./sample-vue-project');
    console.log('');
    process.exit(1);
  }

  const projectPath = path.resolve(targetDir);

  if (!fs.existsSync(projectPath)) {
    console.log(`\n  ❌ 目錄不存在：${projectPath}\n`);
    process.exit(1);
  }

  detectFrameworkAndPatchHandlers(projectPath);

  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║     🔧 TestForge — 自動測試案例產生器       ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
  console.log(`  📂 掃描目標：${projectPath}`);
  console.log('');

  // ---- Step 1：掃描檔案 ----
  console.log('  ── Step 1：掃描檔案 ──────────────────────────');
  const files = scanDirectory(projectPath);
  console.log(`  📋 找到 ${files.length} 個可分析的檔案：`);
  files.forEach(f => {
    const ext = path.extname(f);
    const icon = { '.ts': '🔷', '.js': '🟨', '.vue': '🟩', '.tsx': '🔷', '.jsx': '🟨', '.nuxt': '🟢' }[ext] || '📄';
    console.log(`     ${icon} ${path.relative(projectPath, f)}`);
  });
  console.log('');

  // ---- Step 2 & 3：分析並產生測試 ----
  console.log('  ── Step 2 & 3：分析並產生測試 ──────────────────────');
  const outputBase = path.join(projectPath, CONFIG.outputDir);

  // 清空舊的產生檔案
  if (fs.existsSync(outputBase)) {
    fs.rmSync(outputBase, { recursive: true });
  }

  let generatedCount = 0;

  for (const filePath of files) {
    const ext = path.extname(filePath);
    const handler = handlers[ext];

    if (!handler) continue;

    console.log(`  🔍 分析：${path.relative(projectPath, filePath)}`);
    const analysisResult = handler.analyze(filePath);
    
    if (!analysisResult) continue;

    const relativePath = path.relative(projectPath, filePath);
    const testDir = path.dirname(path.join(outputBase, relativePath.replace(/^src\//, '')));
    
    // import 路徑
    let importPath = path.relative(testDir, filePath).replace(/\\/g, '/');
    if (!['.vue', '.nuxt'].includes(ext)) {
      importPath = importPath.replace(/\.(ts|js|tsx|jsx)$/, '');
    }
    if (!importPath.startsWith('.')) importPath = `./${importPath}`;

    const generatedFiles = handler.generate(analysisResult, importPath);

    if (generatedFiles && generatedFiles.length > 0) {
      fs.mkdirSync(testDir, { recursive: true });
      
      for (const file of generatedFiles) {
        const baseName = path.basename(filePath, ext);
        const testFileName = baseName + file.suffix;
        const testPath = path.join(testDir, testFileName);
        
        fs.writeFileSync(testPath, file.code);
        generatedCount++;
        console.log(`  📝 產生：${path.relative(outputBase, testPath)}`);
      }
    } else {
      console.log(`  ⏭️  跳過：${path.relative(projectPath, filePath)} (沒有找到可測試的內容)`);
    }
  }

  console.log('');

  // ---- 統計摘要 ----
  console.log('  ═══════════════════════════════════════════════');
  console.log(`  ✅ 完成！共產生 ${generatedCount} 個測試檔案`);
  console.log(`  📁 輸出目錄：${path.relative(process.cwd(), outputBase)}/`);
  console.log('');
  console.log('  💡 下一步：');
  console.log('     1. npm install -D vitest @vue/test-utils');
  console.log(`     2. npx vitest run --root ${targetDir}`);
  console.log('  ═══════════════════════════════════════════════');
  console.log('');
}

// ============================================================
// 掃描器 — 遞迴找出所有要分析的檔案
// ============================================================
function scanDirectory(dir) {
  const files = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      // 跳過黑名單目錄
      if (entry.isDirectory()) {
        if (!CONFIG.ignoreDirs.includes(entry.name)) {
          walk(fullPath);
        }
        continue;
      }

      // 只看符合副檔名的檔案
      const ext = path.extname(entry.name);
      if (supportedExtensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files.sort();
}

// 啟動！
main();
