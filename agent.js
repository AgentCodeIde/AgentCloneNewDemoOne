// agent.js — AutoDev Agent (manifest-first, robust, heartbeat, dotenv) 
import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import simpleGit from "simple-git";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(__dirname, "prompts");
const CODE_PROMPT_FILE = path.join(PROMPTS_DIR, "code_prompt.md");
const PLAN_PROMPT_FILE = path.join(PROMPTS_DIR, "plan_prompt.md");
const git = simpleGit();

// ==== Config from env ====
const SETTINGS_PATH = process.env.SETTINGS_PATH || path.join(__dirname, ".vscode", "settings.json");
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(__dirname, "agent_claude");
const LM_API_TIMEOUT = parseInt(process.env.LM_API_TIMEOUT || "600000", 10);
const LM_API_RETRIES = parseInt(process.env.LM_API_RETRIES || "2", 10);
const SINGLE_CALL_TOKEN_LIMIT = parseInt(process.env.SINGLE_CALL_TOKEN_LIMIT || "4096", 10);
const PER_FILE_MAX_TOKENS = parseInt(process.env.PER_FILE_MAX_TOKENS || "1200", 10);
const HEARTBEAT_ENABLED = (process.env.HEARTBEAT_ENABLED || "true").toLowerCase() === "true";
const HEARTBEAT_INTERVAL_MS = parseInt(process.env.HEARTBEAT_INTERVAL_MS || "120000", 10);
const TASK_WORD_THRESHOLD = parseInt(process.env.TASK_WORD_THRESHOLD || "10", 10);

// ==== ext map ====
const extMap = {
  csharp: "cs", cs: "cs", bash: "sh", sh: "sh", json: "json", xml: "xml",
  html: "html", scss: "scss", css: "css", javascript: "js", js: "js",
  typescript: "ts", ts: "ts", jsx: "jsx", react: "jsx", tsx: "tsx",
  python: "py", py: "py", markdown: "md"
};

// ==== ensure settings.json ====
if (!fs.existsSync(SETTINGS_PATH)) {
  console.error(`❌ Không tìm thấy file settings.json tại ${SETTINGS_PATH}`);
  process.exit(1);
}
const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
const models = settings["continue.models"] || [];
const modelSettings = settings["modelSettings"] || {};

function getModelConfig(modelName) {
  const base = models.find(m => (m.model || "").toLowerCase() === (modelName || "").toLowerCase());
  if (!base) throw new Error(`Không tìm thấy model ${modelName} trong settings.json`);
  const inference = modelSettings[`${base.provider}/${modelName}`] || modelSettings[modelName.toLowerCase()] || {};
  return { ...base, ...inference };
}
function safeLogConfig(cfg) {
  const safe = { ...cfg };
  if (safe.apiKey) safe.apiKey = "***";
  return safe;
}

const PLAN_MODEL = process.env.MODEL_PLAN || "gpt-oss-20b";
const CODE_MODEL = process.env.MODEL_CODE || "qwen2.5-coder-14b-instruct";
const planConfig = getModelConfig(PLAN_MODEL);
const codeConfig = getModelConfig(CODE_MODEL);

console.log("📌 Plan model config:", safeLogConfig(planConfig));
console.log("📌 Code model config:", safeLogConfig(codeConfig));
console.log("📁 Output dir:", OUTPUT_DIR);
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ==== Load prompts ====
const planSystemPrompt = fs.existsSync(PLAN_PROMPT_FILE)
  ? fs.readFileSync(PLAN_PROMPT_FILE, "utf8")
  : "Bạn là AI hỗ trợ lập trình viên tạo dự án và unit test.";
const codeSystemPrompt = fs.existsSync(CODE_PROMPT_FILE)
  ? fs.readFileSync(CODE_PROMPT_FILE, "utf8")
  : "Bạn là AI sinh code. Trả về FILE blocks hoặc code blocks.";

// ==== Heartbeat ====
function startHeartbeat(label, intervalMs) {
  if (!HEARTBEAT_ENABLED) return null;
  const id = setInterval(() => {
    console.log(`💓 [${label}] Heartbeat: ${new Date().toLocaleTimeString()} - đang xử lý...`);
  }, intervalMs);
  return id;
}

// ==== HTTP helper ====
async function callChatWithRetry(config, messages, opts = {}) {
  const maxRetries = opts.retries ?? LM_API_RETRIES;
  const timeout = opts.timeout ?? LM_API_TIMEOUT;
  const temperature = opts.temperature ?? 0.2;
  const max_tokens = opts.max_tokens ?? SINGLE_CALL_TOKEN_LIMIT;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const payload = { model: config.model, messages, temperature, max_tokens };
      const resp = await axios.post(`${config.apiBase}/chat/completions`, payload, {
        timeout,
        headers: { "Content-Type": "application/json" }
      });
      return resp.data?.choices?.[0]?.message?.content ?? "";
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
}

// ==== parse code blocks ====
function parseCodeBlocks(output) {
  const blocks = [];
  if (!output || typeof output !== "string") return blocks;
  const regex = /```(?:FILE:([^\n\r]+)|([a-zA-Z0-9+#._-]+)?)(?:\r?\n)?([\s\S]*?)```/g;
  let match, count = 1;
  while ((match = regex.exec(output)) !== null) {
    let [, filePath, lang, code] = match;
    code = (code || "").replace(/^\n+/, "").replace(/\s+$/, "");
    if (!code) continue;
    if (filePath) {
      blocks.push({ file: filePath.trim(), code });
    } else {
      const ext = extMap[(lang || "").toLowerCase().trim()] || "txt";
      blocks.push({ file: `snippet_${count}.${ext}`, code });
      count++;
    }
  }
  return blocks;
}

function uniqueSavePath(baseDir, relPath) {
  const sanitized = relPath.replace(/^\/*/, "");
  let savePath = path.join(baseDir, sanitized);
  const dir = path.dirname(savePath);
  fs.mkdirSync(dir, { recursive: true });
  const ext = path.extname(savePath) || ".txt";
  const base = path.join(dir, path.basename(savePath, ext));
  let candidate = savePath, counter = 1;
  while (fs.existsSync(candidate)) {
    candidate = `${base}_${counter}${ext}`;
    counter++;
  }
  return candidate;
}

function saveParsedFilesToDir(outputText, destDir = OUTPUT_DIR) {
  const files = parseCodeBlocks(outputText);
  if (files.length === 0) {
    console.warn("⚠️ Không tìm thấy code block");
    return [];
  }
  return files.map(f => {
    const savePath = uniqueSavePath(destDir, f.file);
    fs.writeFileSync(savePath, f.code, "utf8");
    console.log("Saved:", savePath);
    return savePath;
  });
}

// ==== run tests ====
function runTests(timeout = 180000) {
  const cmds = [
    ["docker", "compose", "-f", "sandbox/docker-compose.yml", "up", "--build", "--abort-on-container-exit"],
    ["docker-compose", "-f", "sandbox/docker-compose.yml", "up", "--build", "--abort-on-container-exit"]
  ];
  for (const cmd of cmds) {
    try {
      console.log("Running:", cmd.join(" "));
      const out = spawnSync(cmd[0], cmd.slice(1), { encoding: "utf8", timeout });
      return { status: out.status, passed: out.status === 0, stdout: out.stdout || "", stderr: out.stderr || "" };
    } catch (e) { continue; }
  }
  throw new Error("No docker compose command available.");
}

// ==== generateCodeManifestFirst ====
async function generateCodeManifestFirst(task, planJsonString) {
  console.log("🛠 Generating code manifest...");
  const manifestPrompt = `
Plan is JSON:
${planJsonString}

Task: ${task}
Return a JSON array of files to create, each with a "file" and "desc".
`;
  const manifestText = await callChatWithRetry(codeConfig, [
    { role: "system", content: codeSystemPrompt },
    { role: "user", content: manifestPrompt }
  ], { max_tokens: 1200, temperature: 0.2 });

  let manifest;
  try { manifest = JSON.parse(manifestText); } catch { throw new Error("Manifest parse failed"); }

  for (const file of manifest) {
    const filePrompt = `Create file ${file.file}:\n${file.desc}`;
    const fileCode = await callChatWithRetry(codeConfig, [
      { role: "system", content: codeSystemPrompt },
      { role: "user", content: filePrompt }
    ], { max_tokens: PER_FILE_MAX_TOKENS, temperature: 0.2 });
    saveParsedFilesToDir(fileCode, OUTPUT_DIR);
  }
}

// ==== autoFixLoop ====
async function autoFixLoop(maxIterations = 5) {
  for (let i = 0; i < maxIterations; i++) {
    const result = runTests();
    if (result.passed) return { success: true };

    console.warn(`❌ Test failed (iteration ${i + 1}/${maxIterations}). Trying auto-fix...`);
    const fixPrompt = `
Tests failed with the following output:
${result.stdout || result.stderr}

Please suggest code fixes (in FILE:filename format).
`;
    const fixCode = await callChatWithRetry(codeConfig, [
      { role: "system", content: codeSystemPrompt },
      { role: "user", content: fixPrompt }
    ], { max_tokens: 1200, temperature: 0.2 });
    saveParsedFilesToDir(fixCode, OUTPUT_DIR);

    await git.add(".");
    await git.commit(`Auto-fix iteration ${i + 1}`);
  }
  return { success: false, reason: "Max iterations reached" };
}

// ==== Main ====
const task = process.argv.slice(2).join(" ");
if (!task) {
  console.error("❌ Bạn phải nhập mô tả tác vụ");
  process.exit(1);
}

async function deployAfterPass() {
  try {
    console.log("🚀 Deploy step: committing and pushing code...");

    await git.add(".");
    // Commit “rỗng” sẽ không tạo nếu không có thay đổi — OK
    try {
      await git.commit(`Auto-deploy: ${new Date().toISOString()}`);
    } catch (_) {}

    // Branch mục tiêu
    const DEPLOY_BRANCH = process.env.DEPLOY_BRANCH || "staging";

    await git.push("origin", DEPLOY_BRANCH);
    console.log(`✅ Code pushed to ${DEPLOY_BRANCH} branch.`);

    // Nếu có script deploy tại root thì chạy
    if (fs.existsSync("deploy.sh")) {
      console.log("📦 Running deploy.sh...");
      const sh = process.platform === "win32" ? "bash" : "bash";
      const res = spawnSync(sh, ["deploy.sh"], { stdio: "inherit" });
      if (res.status !== 0) {
        throw new Error(`deploy.sh exited with code ${res.status}`);
      }
      console.log("✅ Deploy script executed.");
    } else {
      console.warn("⚠️ No deploy.sh found. Skipping deploy script step.");
    }
  } catch (err) {
    console.error("❌ Deploy failed:", err.message || err);
  }
}


(async () => {
  try {
    console.log("🚀 AutoDev Agent bắt đầu với yêu cầu:", task);

    let plan;
    if (fs.existsSync("roadmap.json")) {
      try {
        const planObj = JSON.parse(fs.readFileSync("roadmap.json", "utf8"));
        plan = JSON.stringify(planObj, null, 2);
      } catch {
        throw new Error("roadmap.json không hợp lệ");
      }
    } else {
      const hbPlan = startHeartbeat("Plan Model", HEARTBEAT_INTERVAL_MS);
      plan = await callChatWithRetry(planConfig, [
        { role: "system", content: planSystemPrompt },
        { role: "user", content: task }
      ], { max_tokens: 1200, temperature: 0.2 });
      if (hbPlan) clearInterval(hbPlan);
    }

    console.log("\n📋 Kế hoạch (tóm lược):\n", plan.slice(0, 2000));

    const words = task.trim().split(/\s+/).length;
    const useManifestFirst = words >= TASK_WORD_THRESHOLD;
    if (useManifestFirst) {
      await generateCodeManifestFirst(task, plan);
    }

    const autoFixResult = await autoFixLoop(5);
    if (autoFixResult.success) {
      console.log("✅ All tests passed (after auto-fix).");
      await deployAfterPass();     // <--- THÊM DÒNG NÀY

    } else {
      console.error("❌ Auto-fix failed:", autoFixResult.reason);
      process.exit(1);
    }

  } catch (err) {
    console.error("❌ Agent error:", err.message || err);
    process.exit(1);
  }
})();
