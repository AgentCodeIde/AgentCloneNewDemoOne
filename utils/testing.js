import { exec } from "child_process";
import fs from "fs";

import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Chuyển đổi đường dẫn Windows (C:\...) thành đường dẫn POSIX (/c/...)
 */
function toPosixPath(windowsPath) {
  return windowsPath
    .replace(/\\/g, "/")
    .replace(/^([A-Za-z]):/, (_, p1) => `/${p1.toLowerCase()}`);
}

export function runTests() {
  return new Promise((resolve) => {
    const workingDir = path.resolve(__dirname, "..", "testing");
    const scriptPath = path.join(workingDir, "run_tests.sh");
    const scriptPathPosix = toPosixPath(scriptPath);

    // Kiểm tra file tồn tại
    if (!fs.existsSync(scriptPath)) {
      console.error(`[Tester] ❌ Không tìm thấy file: ${scriptPath}`);
      return resolve({
        success: false,
        log: "File run_tests.sh không tồn tại",
      });
    }

    // Nếu là Git Bash hoặc Linux → cấp quyền thực thi
    try {
      fs.chmodSync(scriptPath, 0o755);
      console.log(`[Tester] ✅ Đã cấp quyền thực thi cho run_tests.sh`);
    } catch (err) {
      console.warn(`[Tester] ⚠ Không thể chmod file: ${err.message}`);
    }

    console.log(`[Tester] 🚀 Đang chạy script kiểm thử: ${scriptPath}`);
    console.log(`[Tester] 📁 Trong thư mục làm việc: ${workingDir}`);

    const command = `bash ./run_tests.sh`;

    exec(command, { cwd: workingDir }, (error, stdout, stderr) => {
      const fullLog = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
      console.log("fullLog:", fullLog);

      if (error) {
        console.error(`[Tester] ❌ Test thất bại!`);
        resolve({ success: false, log: fullLog });
      } else {
        console.log(`[Tester] ✅ Test thành công!`);
        resolve({ success: true, log: stdout });
      }
    });
  });
}
