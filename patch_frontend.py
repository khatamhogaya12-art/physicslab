import re

def patch_file(filepath):
    with open(filepath, "r") as f:
        content = f.read()

    # 1. Update headers pattern
    pattern = re.compile(
        r'const customKey = localStorage\.getItem\("yantra_nidhi_gemini_api_key"\);\s*const headers: Record<string, string> = \{\s*"Content-Type": "application/json"\s*\};\s*if \(customKey\) \{\s*headers\["x-gemini-api-key"\] = customKey;\s*\}',
        re.MULTILINE
    )
    
    replacement = """const customKey = localStorage.getItem("yantra_nidhi_gemini_api_key");
      const aiModel = localStorage.getItem("yantra_nidhi_ai_model") || "gemini-3.5-flash";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-ai-model": aiModel
      };
      if (customKey) {
        headers["x-gemini-api-key"] = customKey;
      }"""
      
    content = pattern.sub(replacement, content)
    
    with open(filepath, "w") as f:
        f.write(content)
    print(f"Patched headers in {filepath}")

patch_file("src/App.tsx")
patch_file("src/components/OceanAnalysisCard.tsx")

# 2. Update App.tsx state and UI for model selector
with open("src/App.tsx", "r") as f:
    app_content = f.read()

# State injection
state_pattern = """  // API Key Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");

  // Sync tempApiKey with localStorage when opening the settings modal
  useEffect(() => {
    if (isSettingsOpen) {
      setTempApiKey(localStorage.getItem("yantra_nidhi_gemini_api_key") || "");
    }
  }, [isSettingsOpen]);

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      localStorage.setItem("yantra_nidhi_gemini_api_key", tempApiKey.trim());
    } else {
      localStorage.removeItem("yantra_nidhi_gemini_api_key");
    }
    setIsSettingsOpen(false);
  };"""

state_repl = """  // API Key Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.5-flash");
  const [tempModel, setTempModel] = useState<string>("gemini-3.5-flash");

  // Sync tempApiKey with localStorage when opening the settings modal
  useEffect(() => {
    if (isSettingsOpen) {
      setTempApiKey(localStorage.getItem("yantra_nidhi_gemini_api_key") || "");
      setTempModel(localStorage.getItem("yantra_nidhi_ai_model") || "gemini-3.5-flash");
    }
  }, [isSettingsOpen]);

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      localStorage.setItem("yantra_nidhi_gemini_api_key", tempApiKey.trim());
    } else {
      localStorage.removeItem("yantra_nidhi_gemini_api_key");
    }
    localStorage.setItem("yantra_nidhi_ai_model", tempModel);
    setSelectedModel(tempModel);
    setIsSettingsOpen(false);
  };"""

app_content = app_content.replace(state_pattern, state_repl)

# UI injection
ui_pattern = """              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-2">
                  Stored securely in your browser's localStorage. Required for the AI Proctor, Talk to AI Guru, and OCEAN Profiler.
                </p>
              </div>"""

ui_repl = """              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Select AI Model
                </label>
                <select
                  value={tempModel}
                  onChange={(e) => setTempModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono mb-4 appearance-none"
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                  <option value="nvidia/nemotron-3-super-120b-a12b:free">Nvidia Nemotron 3 Super 120B</option>
                  <option value="meta-llama/llama-3.3-70b-instruct:free">Meta LLaMA 3.3 70B</option>
                  <option value="google/gemma-4-26b-a4b-it:free">Google Gemma 4 26B</option>
                  <option value="openai/gpt-oss-120b:free">OpenAI GPT OSS 120B</option>
                  <option value="z-ai/glm-4.5-air:free">Z-AI GLM 4.5 Air</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Gemini / OpenRouter API Key
                </label>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="sk-or-... or AIzaSy..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-2">
                  Stored securely in your browser's localStorage. The system falls back automatically if the selected model fails.
                </p>
              </div>"""

app_content = app_content.replace(ui_pattern, ui_repl)

with open("src/App.tsx", "w") as f:
    f.write(app_content)

print("App.tsx State & UI patched.")
