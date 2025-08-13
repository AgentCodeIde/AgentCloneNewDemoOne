import fs from "fs";
import { execSync } from "child_process";

// Nhận prompt từ command line (ví dụ: node agent.js "Thêm API login")
const userPrompt = process.argv[2];

if (!userPrompt) {
  console.log("Vui lòng nhập prompt ví dụ: node agent.js \"Tạo file test.js\"");
  process.exit(1);
}

// Bước 1: THINK & PLAN - tạo kế hoạch dựa trên prompt
function createPlan(prompt) {
  // Ở bước này, ta chỉ làm cơ bản: chia prompt thành các bước
  // Ví dụ: nếu prompt chứa "Tạo file", agent sẽ lên kế hoạch tạo file và viết code mẫu
  const plan = [];

  if (prompt.toLowerCase().includes("tạo file")) {
    const match = prompt.match(/Tạo file (\S+)/i);
    const fileName = match ? match[1] : "newfile.js";
    plan.push({ action: "create_file", file: fileName, content: "// TODO: Viết code" });
  }

  if (prompt.toLowerCase().includes("chạy test")) {
    plan.push({ action: "run_test", command: "npm test" });
  }

  return plan;
}

// Bước 2: ACT - thực hiện từng hành động
function executePlan(plan) {
  for (const step of plan) {
    try {
      if (step.action === "create_file") {
        fs.writeFileSync(step.file, step.content, "utf8");
        console.log(`[SUCCESS] Tạo file ${step.file}`);
      } else if (step.action === "run_test") {
        console.log(`[RUNNING] Chạy test: ${step.command}`);
        const output = execSync(step.command, { stdio: "pipe" }).toString();
        console.log(output);
      }
    } catch (error) {
      console.log(`[ERROR] ${error.message}`);
      // Ở bước này, ta chỉ log lỗi, bước sau sẽ thêm tự sửa
    }
  }
}

// Bước 3: OBSERVE - hiển thị kết quả
function observe() {
  console.log("Hoàn tất kế hoạch. Agent đã thực hiện xong các bước.");
}

// **Vòng lặp chính**
const plan = createPlan(userPrompt);
executePlan(plan);
observe();
