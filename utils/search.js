import { search } from "duck-duck-scrape";

/**
 * Tìm kiếm thông tin trên web bằng DuckDuckGo.
 * @param {string} query - Câu hỏi hoặc từ khóa cần tìm.
 * @returns {Promise<string>} - Một chuỗi chứa các kết quả tìm kiếm đã được tóm tắt.
 */
export async function webSearch(query) {
  console.log(`[Search] 🔎 Đang tìm kiếm trên web với từ khóa: "${query}"`);
  
  await new Promise((resolve) => setTimeout(resolve, 1500));

  try {
    const searchResults = await search(query, {
      safeSearch: "STRICT",
      vertical: "web", // Chỉ tìm kiếm web
    });

    // Lấy 3 kết quả đầu tiên và định dạng lại
    const summary = searchResults.results
      .slice(0, 3)
      .map(
        (res, i) =>
          `Kết quả ${i + 1}:\n- Tiêu đề: ${res.title}\n- Tóm tắt: ${
            res.description
          }\n- URL: ${res.url}`
      )
      .join("\n\n");

    return `Đây là các kết quả tìm kiếm hàng đầu cho "${query}":\n\n${summary}`;
  } catch (error) {
    console.error(`[Search] ❌ Lỗi khi tìm kiếm trên web:`, error.message);
    return `Lỗi khi thực hiện tìm kiếm cho: "${query}".`;
  }
}
