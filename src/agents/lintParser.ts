import fs from 'fs';
import path from 'path';

interface LintMessage {
  ruleId: string | null;
  severity: number;
  message: string;
  line: number;
  column: number;
}

interface LintResult {
  filePath: string;
  messages: LintMessage[];
}

const lintFilePath = path.resolve(__dirname, '../../eslint-output.json'); // adjust path as needed

const rawData = fs.readFileSync(lintFilePath, 'utf-8');
const results: LintResult[] = JSON.parse(rawData);

for (const result of results) {
  const relativePath = path.relative(process.cwd(), result.filePath);
  for (const msg of result.messages) {
    const level = msg.severity === 2 ? '❌ Error' : '⚠️ Warning';
    console.log(`${level}: ${msg.message}`);
    console.log(`→ ${relativePath}:${msg.line}:${msg.column}`);
    if (msg.ruleId) console.log(`Rule: ${msg.ruleId}`);
    console.log('---');
  }
}
const dummy: any = 42;
