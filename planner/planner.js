import axios from 'axios';
import fs from 'fs/promises';
import fsSync from 'fs'; // Dùng cho các hàm đồng bộ như existsSync
import path from 'path';
import { fileURLToPath } from 'url';
// Trong planner/planner.js
import { getModelConfig, callChatWithRetry, startHeartbeat } from '../utils/llm.js';

// --- CÁC HÀM HỖ TRỢ ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');
const PLAN_PROMPT_FILE = path.join(PROMPTS_DIR, 'plan_prompt.md');
const SETTINGS_FILE = path.join(__dirname, '..', '.vscode', 'settings.json');


// ... code còn lại của planner ...

// Hàm gọi API đến AI với cơ chế thử lại


// --- "BỘ NÃO" CHÍNH ---
export async function createPlan(userPrompt) {
  console.log(`[Planner] 🧠 Đang tư duy và tạo kế hoạch cho: "${userPrompt}"`);

  const planSystemPrompt = await fs.readFile(PLAN_PROMPT_FILE, 'utf-8');
  const messages = [
    { role: 'system', content: planSystemPrompt },
    { role: 'user', content: userPrompt }
  ];

  // 🔽🔽 THAY ĐỔI QUAN TRỌNG Ở ĐÂY 🔽🔽
  // Lấy tên model từ file .env
  const planModelName = process.env.MODEL_PLAN; // Ví dụ: "gpt-oss-20b"
  if (!planModelName) {
    throw new Error("❌ Vui lòng định nghĩa MODEL_PLAN trong file .env");
  }

  // Tự động tìm thông tin chi tiết trong settings.json
  const planConfig = getModelConfig(planModelName);
  console.log(`[Planner] Đã tìm thấy cấu hình cho model: ${planModelName}`);

  try {
    const responseText = await callChatWithRetry(planConfig, messages, { temperature: 0.1 });

    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```|(\[[\s\S]*\])/);
    if (!jsonMatch) {
      throw new Error("AI không trả về một khối JSON hợp lệ.");
    }

    const jsonString = jsonMatch[1] || jsonMatch[2];
    const plan = JSON.parse(jsonString);
    
    console.log('[Planner] ✅ Đã tạo kế hoạch động từ AI thành công!');
    return plan;
  } catch (error) {
    console.error(`[Planner] ❌ Lỗi nghiêm trọng khi tạo kế hoạch:`, error.message);
    return null;
  }
}