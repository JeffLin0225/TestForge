const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function recover() {
  const fileStream = fs.createReadStream('/Users/jeff/.gemini/antigravity-ide/brain/77ced6ce-8a9a-4104-969c-89c68e85d43b/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const files = {};

  for await (const line of rl) {
    try {
      const entry = JSON.parse(line);
      if (entry.type === 'PLANNER_RESPONSE' && entry.tool_calls) {
        for (const call of entry.tool_calls) {
          if (call.name === 'write_to_file') {
            const target = call.args.TargetFile || call.args.targetFile;
            const content = call.args.CodeContent || call.args.codeContent;
            if (target && content) {
              files[target] = content;
            }
          }
        }
      }
    } catch (e) {}
  }

  for (const [filepath, content] of Object.entries(files)) {
    if (filepath.includes('/utils/') || filepath.includes('/handlers/') || filepath.endsWith('testforge.js')) {
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filepath, content, 'utf8');
      console.log('Recovered:', filepath);
    }
  }
}

recover();
