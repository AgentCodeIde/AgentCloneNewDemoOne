// planner/planner.js
import fs from 'fs/promises';

// Thêm "export" để hàm này có thể được import bởi các file khác
export async function createPlan(userPrompt) {
  console.log(`[Planner] Đã nhận yêu cầu: "${userPrompt}"`);
  console.log('[Planner] 🧠 Đang tư duy và tạo kế hoạch...');
  
  try {
    // Để an toàn hơn, chúng ta nên dùng đường dẫn tuyệt đối
    // (Phần này sẽ được tối ưu sau, trước mắt cứ để nguyên)
    const planJson = await fs.readFile('prompts/example_plan.json', 'utf-8');
    const plan = JSON.parse(planJson);
    
    console.log('[Planner] ✅ Đã tạo kế hoạch thành công!');
    return plan;

  } catch (error) {
    console.error('[Planner] ❌ Lỗi khi tạo kế hoạch:', error);
    return [];
  }
}