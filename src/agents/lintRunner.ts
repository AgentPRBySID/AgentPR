import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { runLintAgent } from './lintAgent'; // Your actual logic

export async function lintRunner(prPayload: any) {
  const outputPath = path.resolve(__dirname, '../../eslint-output.json');

  try {
    console.log(' Running ESLint...');
    execSync(`eslint . --ext .ts --format json -o ${outputPath}`, {
      stdio: 'inherit',
    });

    // Validate output file
    if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf-8').trim() === '') {
      throw new Error('ESLint output not found or empty.');
    }

    console.log(' ESLint finished. Handing over to Lint Agent...');
    await runLintAgent(prPayload);

  } catch (error: any) {
    console.error(' lintRunner failed:', error.message);
  }
}
