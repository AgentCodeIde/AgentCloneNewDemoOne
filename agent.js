import dotenv from "dotenv";
dotenv.config();

import path from "path";
// Sửa lỗi: Import chính xác các hàm cần dùng từ fs/promises
import { rm, cp } from "fs/promises";
import { createPlan } from "./planner/planner.js";
import { executeTask } from "./executor/executor.js";

// ... (Các import và hàm main không đổi) ...

async function copyResultToOutput() {
  // Thay đổi thư mục nguồn ở đây
  const sourceDir = path.resolve(process.cwd(), "testing");
  const outputDir = process.env.OUTPUT_DIR;

  if (!outputDir) {
    console.log(
      "⚠️  Không có OUTPUT_DIR trong .env, bỏ qua bước xuất kết quả."
    );
    return;
  }

  const destDir = path.resolve(process.cwd(), outputDir);
  console.log(
    `\n[Exporter] 📦 Đang sao chép kết quả từ ${sourceDir} đến ${destDir}...`
  );

  try {
    await rm(destDir, { recursive: true, force: true });
    await cp(sourceDir, destDir, { recursive: true });
    console.log(
      `[Exporter] ✅ Đã xuất thành công dự án ra thư mục: ${outputDir}`
    );
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(`[Exporter] ❌ Lỗi khi xuất kết quả:`, error);
    }
  }
}

// ... (Hàm main và phần còn lại không đổi) ...

async function main() {
  let userPrompt = process.argv.slice(2).join(" ");

  if (!userPrompt) {
    console.error("❌ Vui lòng cung cấp yêu cầu cho Agent.");
    console.log(
      'Ví dụ: node agent.js "Tạo một API để lấy danh sách sản phẩm"'
    );
    return;
  }

  const originalUserPrompt = userPrompt;
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    console.log(`\n===================================================`);
    console.log(`🚀 BẮT ĐẦU LẦN THỰC THI THỨ ${attempt} / ${maxRetries}`);
    console.log(`   Yêu cầu hiện tại: "${userPrompt}"`);
    console.log(`===================================================`);

    // GIAI ĐOẠN 1: TƯ DUY (PLANNING)
    const plan = await createPlan(userPrompt);

    if (!plan) {
      console.error(`🔥 Planner đã thất bại trong việc tạo kế hoạch cho lần thử ${attempt}.`);
      if (attempt < maxRetries) {
        console.log("\n[System] Tạm nghỉ 1.5 giây trước khi thử lại...");
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      continue;
    }

    console.log("\n📋 KẾ HOẠCH THỰC THI:");
    console.log(JSON.stringify(plan, null, 2));

    // GIAI ĐOẠN 2: HÀNH ĐỘNG (EXECUTION)
    console.log("\n▶️  Bắt đầu thực thi kế hoạch...");
    let lastResult = null; // Đổi tên để lưu kết quả của task cuối cùng, bất kể là gì
    let executionFailed = false;

    for (const task of plan) {
      const result = await executeTask(task);
      lastResult = result; // Luôn cập nhật kết quả của task vừa chạy

      console.log(
        `  - Trạng thái Task #${task.task_id}: ${
          result.success ? "✅ Thành công" : "❌ Thất bại"
        }`
      );
      console.log("---------------------------------------------------");

      if (!result.success) {
        console.error(
          `\n🔥 Kế hoạch đã dừng lại do Task #${task.task_id} thất bại.`
        );
        executionFailed = true;
        break;
      }
    }

    // GIAI ĐOẠN 3: KIỂM TRA & TỰ SỬA LỖI
    // SỬA LỖI 1: Điều kiện thành công tổng quát hơn
    if (!executionFailed) {
      console.log("🎉🎉🎉 Chúc mừng! Kế hoạch đã thực thi thành công!");
      if (plan.some(task => task.action === 'run_test')) {
          console.log("   Và tất cả các bài test đã vượt qua!");
      }
      await copyResultToOutput();
      return; // THOÁT HOÀN TOÀN
    }

    // Nếu đến đây, tức là đã có lỗi ở đâu đó
    if (attempt < maxRetries) {
        console.log(
          "\n[Self-Correct] 🧐 Phát hiện lỗi. Bắt đầu quá trình tự sửa lỗi..."
        );
        // SỬA LỖI 2: Lấy log lỗi từ thuộc tính .log hoặc .error
        const errorMessage = lastResult.log || lastResult.error || "An unknown error occurred.";
        userPrompt = `Yêu cầu ban đầu là: "${originalUserPrompt}". Tuy nhiên, việc thực thi đã thất bại với log lỗi sau đây. Hãy phân tích log lỗi và tạo một kế hoạch mới để sửa các file và làm cho bài test thành công.\n\n--- LOG LỖI ---\n${errorMessage}`;
        
        console.log("\n[System] Tạm nghỉ 1.5 giây trước khi thử lại...");
        await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  console.error(
    `\n💥 Agent đã thất bại sau ${maxRetries} lần thử. Vui lòng kiểm tra lại yêu cầu.`
  );
}

// Chạy hàm main
main().catch((error) => {
  console.error("\n💥 Đã xảy ra lỗi không mong muốn trong Agent:", error);
});
