import axios from 'axios';
// 🔽🔽 SỬA LỖI 1: Thêm 'fsSync' từ 'fs' 🔽🔽
import fsSync from 'fs'; 
import path from 'path';

// --- CÁC HÀM HỖ TRỢ ---
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const SETTINGS_FILE = path.resolve(process.cwd(), '.vscode', 'settings.json');

export function getModelConfig(modelName) {
  if (!fsSync.existsSync(SETTINGS_FILE)) {
    throw new Error(`❌ Không tìm thấy file settings.json tại ${SETTINGS_FILE}`);
  }
  const settings = JSON.parse(fsSync.readFileSync(SETTINGS_FILE, 'utf8'));
  const models = settings["continue.models"] || [];
  
  const modelInfo = models.find(m => m.model === modelName);
  if (!modelInfo) {
    throw new Error(`❌ Không tìm thấy cấu hình cho model '${modelName}' trong file settings.json`);
  }
  return {
    url: `${modelInfo.apiBase}/chat/completions`, // URL chuẩn cho API chat
    apiKey: modelInfo.apiKey,
    model: modelInfo.model,
  };
}

export async function callChatWithRetry(config, messages, params, retries = 3) {
  let lastError = null;
  for (let i = 0; i < retries; i++) {
    try {
      // 🔽🔽 SỬA LỖI 2: Thêm log để debug URL 🔽🔽
      console.log(`[Debugger] Đang thử gọi API tới URL: ${config.url}`);
      
      const response = await axios.post(config.url, {
        model: config.model,
        messages: messages,
        ...params
      }, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 600000,
      });
      return response.data.choices[0].message.content;
    } catch (error) {
      lastError = error;
      // Thay đổi message để rõ hơn
      console.warn(`\n⚠️ Lỗi khi gọi API (lần ${i + 1}/${retries}): ${error.message}. Thử lại...`);
    }
  }
  throw new Error(`❌ Gọi API thất bại sau ${retries} lần. Lỗi cuối cùng: ${lastError.message}`);
}

export function startHeartbeat(label, interval = 5000) {
    process.stdout.write(`⏳ ${label}...`);
    const timer = setInterval(() => {
        process.stdout.write('.');
    }, interval);
    return timer;
}