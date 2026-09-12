import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

export interface CodeSandboxResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  error?: string;
}

export async function childProcessRunCode(code: string, timeoutMs = 3000): Promise<CodeSandboxResult> {
  const startTime = Date.now();
  const tmpDir = os.tmpdir();
  const scriptPath = path.join(tmpDir, `nova_sandbox_${uuidv4()}.js`);

  try {
    fs.writeFileSync(scriptPath, code, 'utf-8');

    return await new Promise<CodeSandboxResult>((resolve) => {
      let stdout = '';
      let stderr = '';

      const child = spawn(process.execPath, [scriptPath], {
        timeout: timeoutMs,
        env: { NODE_ENV: 'sandbox' },
      });

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const durationMs = Date.now() - startTime;
        cleanup();
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code,
          durationMs,
        });
      });

      child.on('error', (err) => {
        const durationMs = Date.now() - startTime;
        cleanup();
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: 1,
          durationMs,
          error: err.message,
        });
      });

      function cleanup() {
        if (fs.existsSync(scriptPath)) {
          try { fs.unlinkSync(scriptPath); } catch (e) {}
        }
      }
    });
  } catch (err: any) {
    return {
      stdout: '',
      stderr: '',
      exitCode: 1,
      durationMs: Date.now() - startTime,
      error: err.message,
    };
  }
}
