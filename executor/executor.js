import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";
// Import các công cụ từ hộp dụng cụ dùng chung
import {
  getModelConfig,
  callChatWithRetry,
  startHeartbeat,
} from "../utils/llm.js";
import { webSearch } from "../utils/search.js"; // <-- THÊM DÒNG NÀY

import { runTests } from "../utils/testing.js"; // <-- THÊM DÒNG NÀY

const WORKSPACE_DIR = "testing";
const EDIT_CODE_PROMPT_FILE = path.resolve(
  process.cwd(),
  "prompts",
  "edit_code_prompt.md"
);

/**
 * Hàm này nhận một task và thực thi nó dựa trên thuộc tính 'action'.
 * @param {object} taskItem - Một đối tượng task từ kế hoạch.
 */
export async function executeTask(taskItem) {
  console.log(
    `\n[Executor] ⚡ Bắt đầu Task #${taskItem.task_id}: "${taskItem.description}"`
  );

  // Dùng switch-case để chọn hành động phù hợp
  switch (taskItem.action) {
    case "web_search":
      // Sửa lỗi: Lấy từ khóa từ 'query' hoặc 'target'
      try {
        const searchQuery = taskItem.query || taskItem.target;
        const searchResult = await webSearch(searchQuery);
        return { success: true, data: searchResult };
      } catch (error) {
        console.error(`[Search] ❌ Lỗi khi tìm kiếm trên web:`, error.message);
        // TRẢ VỀ THẤT BẠI KHI CÓ LỖI
        return { success: false, log: error.message };
      }
    case "create_file":
      return await handleCreateFile(taskItem);

    case "read_file":
      return await handleReadFile(taskItem);

    case "edit_file":
      return await handleEditFile(taskItem);
    case "shell_command":
      return handleShellCommand(taskItem);
    case "run_test":
      return await runTests();
    case "log_result":
      console.log(`  - ✅ LOG: ${taskItem.message}`);
      return { success: true, details: taskItem.message };

    default:
      console.warn(`  - ⚠️ Hành động không xác định: ${taskItem.action}`);
      return {
        success: false,
        details: `Hành động không được hỗ trợ: ${taskItem.action}`,
      };
  }
}

// --- CÁC HÀM HỖ TRỢ THỰC THI ---

// Trong executor/executor.js
async function handleCreateFile(task) {
  // SỬA LỖI Ở ĐÂY: Không ghép WORKSPACE_DIR vào nữa vì AI đã cung cấp
  const safePath = path.resolve(process.cwd(), task.target);

  try {
    let finalContent = task.content || "";
    // Logic xử lý JSON vẫn giữ nguyên, nó rất quan trọng
    if (task.target.endsWith(".json")) {
      try {
        const jsonObject = JSON.parse(finalContent);
        finalContent = JSON.stringify(jsonObject, null, 2);
      } catch (e) {
        console.error(`  - ❌ Lỗi nghiêm trọng khi xử lý JSON cho ${task.target}:`, e.message);
        return { success: false, error: `Invalid JSON content for ${task.target}: ${e.message}` };
      }
    }
    
    await fs.mkdir(path.dirname(safePath), { recursive: true });
    await fs.writeFile(safePath, finalContent);

    console.log(`  - Đã tạo thành công file mới: ${task.target}`);
    return { success: true, details: `File ${task.target} đã được tạo.` };
  } catch (error) {
    console.error(`  - ❌ Lỗi khi tạo file ${task.target}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Thay thế hàm handleReadFile cũ bằng hàm này
async function handleReadFile(task) {
  // SỬA LỖI Ở ĐÂY:
  const safePath = path.resolve(process.cwd(), task.target);
  try {
    const content = await fs.readFile(safePath, "utf-8");
    console.log(`  - Đã đọc thành công file: ${task.target}`);
    return { success: true, data: content.substring(0, 500) + "..." };
  } catch (error) {
    console.error(`  - ❌ Lỗi khi đọc file ${task.target}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Thay thế hàm handleEditFile cũ bằng hàm này
async function handleEditFile(task) {
    // SỬA LỖI Ở ĐÂY:
    const safePath = path.resolve(process.cwd(), task.target);
    const heartbeat = startHeartbeat(`AI đang chỉnh sửa file ${task.target}`);

    try {
        // ... toàn bộ logic còn lại của hàm không đổi ...
        const originalCode = await fs.readFile(safePath, "utf-8");
        // ...
        await fs.writeFile(safePath, newCode);
        // ...
    } catch (error) {
        // ...
    } finally {
        clearInterval(heartbeat);
    }
}

// Hàm handleShellCommand của bạn đã đúng, không cần sửa
function handleShellCommand(task) {
  try {
    // Thư mục làm việc là 'testing', điều này là chính xác
    const workDir = path.resolve(process.cwd(), WORKSPACE_DIR);
    console.log(`  - Đang chạy lệnh trong thư mục ${workDir}: "${task.command}"`);
    const output = execSync(task.command, {
      encoding: "utf-8",
      cwd: workDir,
      stdio: "pipe",
    });
    console.log(`  - Kết quả lệnh:\n---S T A R T---\n${output.trim()}\n----E N D----`);
    return { success: true, data: output };
  } catch (error) {
    const errorMessage = error.stderr || error.stdout || error.message;
    console.error(`  - ❌ Lỗi khi chạy lệnh "${task.command}":`, errorMessage);
    return { success: false, error: errorMessage };
  }
}
