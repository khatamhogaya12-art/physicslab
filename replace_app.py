import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Replace State
chunk1 = """  // Navigation & Page State
  const [activeTab, setActiveTab] = useState<"workspace" | "ocean" | "ai_guru" | "blackbox_id">("workspace");

  // API Key Settings Modal
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
  };

  const [activeExpId, setActiveExpId] = useState<string>("black_box");"""

repl1 = """  // Navigation & Page State
  const [activeSection, setActiveSection] = useState<"fully_fledged" | "available" | "ai_guru" | "ocean">("available");
  const [activeBlackBox, setActiveBlackBox] = useState<"simulation" | "lab">("simulation");

  // API Key Settings Modal
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
  };

  const [activeExpId, setActiveExpId] = useState<string>("laser_diffraction");"""

content = content.replace(chunk1, repl1)

# Replace Layout
chunk2 = """    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* Left Sidebar Navigation Rail */}
      <aside className="w-64 flex flex-col border-r border-slate-800 bg-slate-900/40 shrink-0">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-teal-400">YANTRA NIDHI</h1>
              <p className="text-[9px] uppercase tracking-widest text-slate-500">Virtual Physics Lab</p>
            </div>
          </div>
        </div>

        {/* Experiment Navigation Tabs */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 list-none">
          <div className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-2 tracking-wider">
            Available Experiments
          </div>
          {EXPERIMENTS_LIST.map((exp) => {
            const isActive = activeExpId === exp.id && activeTab === "workspace";
            return (
              <button
                key={exp.id}
                onClick={() => {
                  setActiveExpId(exp.id);
                  setActiveTab("workspace");
                }}
                className={`w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? "bg-teal-500/10 border-teal-500/30 text-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.06)]"
                    : "border-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isActive ? "bg-teal-400" : "bg-slate-700"}`}></span>
                <div>
                  <div className="text-xs font-bold font-sans">{exp.title}</div>
                  <div className="text-[8.5px] text-slate-500 truncate max-w-[170px]">{exp.subtitle}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom OCEAN and Sub-apps triggers */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 space-y-2">
          <button
            onClick={() => setActiveTab("ocean")}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "ocean"
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg ring-2 ring-indigo-500/30"
                : "bg-indigo-900/20 hover:bg-indigo-900/30 text-indigo-400 border border-indigo-500/25"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            OCEAN Analytics Test
          </button>
          
          <button
            onClick={() => setActiveTab("ai_guru")}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "ai_guru"
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg ring-2 ring-blue-500/30"
                : "bg-blue-900/20 hover:bg-blue-900/30 text-blue-400 border border-blue-500/25"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Talk to AI Guru
          </button>

          <button
            onClick={() => setActiveTab("blackbox_id")}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "blackbox_id"
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg ring-2 ring-emerald-500/30"
                : "bg-emerald-900/20 hover:bg-emerald-900/30 text-emerald-400 border border-emerald-500/25"
            }`}
          >
            <Box className="w-4 h-4" />
            Black Box Lab
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Core Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Workbench</span>
            <span>/</span>
            <span className="text-slate-200 font-sans font-bold flex items-center gap-1">
              {activeTab === "workspace" ? (
                <>
                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                  {activeExp.title}
                </>
              ) : activeTab === "ai_guru" ? (
                <>
                  <Brain className="w-3.5 h-3.5 text-blue-400" />
                  Talk to AI Guru
                </>
              ) : activeTab === "blackbox_id" ? (
                <>
                  <Box className="w-3.5 h-3.5 text-emerald-400" />
                  Black Box Lab
                </>
              ) : (
                <>
                  <Brain className="w-3.5 h-3.5 text-indigo-400" />
                  OCEAN Character Analyzer
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-500 font-mono font-bold leading-none hidden sm:block">
              Time Protocol: 2026-05-29
            </span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-355 rounded-full text-xs font-bold border border-slate-850 hover:border-slate-700 transition-all cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              Configure AI Key
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Virtual Lab Online
            </div>
          </div>
        </header>

        {/* Content Body Switch */}
        {activeTab === "ocean" ? (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
            <div className="max-w-5xl mx-auto">
              <OceanAnalysisCard
                labStats={labStats}
                onResetStats={handleResetTelemetryStats}
              />
            </div>
          </div>
        ) : activeTab === "ai_guru" ? (
          <div className="flex-1 overflow-y-auto bg-slate-950">
            <TalkToAiGuru />
          </div>
        ) : activeTab === "blackbox_id" ? (
          <div className="flex-1 overflow-y-auto bg-slate-950">
            <BlackBoxIdentification />
          </div>
        ) : ("""

repl2 = """    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* Top Header & Navigation */}
      <header className="flex flex-col border-b border-slate-800 shrink-0">
        {/* Core Branding and User Bar */}
        <div className="h-16 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-teal-400">YANTRA NIDHI</h1>
                <p className="text-[9px] uppercase tracking-widest text-slate-500">Virtual Physics Lab</p>
              </div>
            </div>
            
            <div className="h-8 w-px bg-slate-800 mx-2 hidden md:block"></div>
            
            <div className="items-center gap-3 text-xs text-slate-400 hidden md:flex">
              <span>Workbench</span>
              <span>/</span>
              <span className="text-slate-200 font-sans font-bold flex items-center gap-1">
                {activeSection === "available" ? (
                  <>
                    <Activity className="w-3.5 h-3.5 text-teal-400" />
                    {activeExp.title}
                  </>
                ) : activeSection === "ai_guru" ? (
                  <>
                    <Brain className="w-3.5 h-3.5 text-blue-400" />
                    Talk to AI Guru
                  </>
                ) : activeSection === "fully_fledged" ? (
                  <>
                    <Box className="w-3.5 h-3.5 text-emerald-400" />
                    Fully Fledged Experiments
                  </>
                ) : (
                  <>
                    <Brain className="w-3.5 h-3.5 text-indigo-400" />
                    OCEAN Character Analyzer
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-500 font-mono font-bold leading-none hidden lg:block">
              Time Protocol: 2026-05-29
            </span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-355 rounded-full text-xs font-bold border border-slate-850 hover:border-slate-700 transition-all cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              Configure AI Key
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Virtual Lab Online
            </div>
          </div>
        </div>

        {/* 4 Main Navigation Tabs */}
        <div className="bg-slate-900/60 overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max px-4">
            <button
              onClick={() => { setActiveSection("fully_fledged"); setActiveExpId("black_box"); setActiveBlackBox("simulation"); }}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
                activeSection === "fully_fledged"
                  ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Box className="w-4 h-4" />
              Fully Fledged Experiments with Virtual Lab
            </button>
            <button
              onClick={() => { setActiveSection("available"); setActiveExpId("laser_diffraction"); }}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
                activeSection === "available"
                  ? "border-teal-500 text-teal-400 bg-teal-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Activity className="w-4 h-4" />
              Available Experiments
            </button>
            <button
              onClick={() => setActiveSection("ai_guru")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
                activeSection === "ai_guru"
                  ? "border-blue-500 text-blue-400 bg-blue-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              TALK To AI GURU
            </button>
            <button
              onClick={() => setActiveSection("ocean")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
                activeSection === "ocean"
                  ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Subject related Psychological Analysis - OCEAN ANALYTICAL TEST
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Conditional Left Sidebar Navigation Rail */}
        {(activeSection === "fully_fledged" || activeSection === "available") && (
          <aside className="w-64 flex flex-col border-r border-slate-800 bg-slate-900/40 shrink-0">
            <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 list-none">
              <div className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-3 tracking-wider">
                {activeSection === "fully_fledged" ? "Virtual Lab Modules" : "Conceptual Experiments"}
              </div>
              
              {activeSection === "available" && (
                <>
                  {EXPERIMENTS_LIST.filter(e => e.id !== "black_box").map((exp) => {
                    const isActive = activeExpId === exp.id;
                    return (
                      <button
                        key={exp.id}
                        onClick={() => setActiveExpId(exp.id)}
                        className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                          isActive
                            ? "bg-teal-500/10 border-teal-500/30 text-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.06)]"
                            : "border-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isActive ? "bg-teal-400" : "bg-slate-700"}`}></span>
                        <div>
                          <div className="text-xs font-bold font-sans leading-tight mb-0.5">{exp.title}</div>
                          <div className="text-[8.5px] text-slate-500 truncate max-w-[170px] leading-tight">{exp.subtitle}</div>
                        </div>
                      </button>
                    );
                  })}
                  
                  {/* Disabled Under Construction Item */}
                  <button
                    disabled
                    className="w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-transparent opacity-60 cursor-not-allowed mt-4 bg-slate-800/30"
                  >
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-slate-600"></span>
                    <div>
                      <div className="text-xs font-bold font-sans text-slate-500 mb-0.5">Virtual Lab</div>
                      <div className="text-[8.5px] text-amber-500/80 font-bold uppercase tracking-wider">(Under Construction)</div>
                    </div>
                  </button>
                </>
              )}
              
              {activeSection === "fully_fledged" && (
                <>
                  <button
                    onClick={() => { setActiveExpId("black_box"); setActiveBlackBox("simulation"); }}
                    className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                      activeBlackBox === "simulation"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.06)]"
                        : "border-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${activeBlackBox === "simulation" ? "bg-emerald-400" : "bg-slate-700"}`}></span>
                    <div>
                      <div className="text-xs font-bold font-sans leading-tight mb-0.5">Black box Experiments</div>
                      <div className="text-[8.5px] text-slate-500 leading-tight">Impedance Spectroscopy</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveBlackBox("lab")}
                    className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                      activeBlackBox === "lab"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.06)]"
                        : "border-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${activeBlackBox === "lab" ? "bg-emerald-400" : "bg-slate-700"}`}></span>
                    <div>
                      <div className="text-xs font-bold font-sans leading-tight mb-0.5">Blackbox Lab</div>
                      <div className="text-[8.5px] text-slate-500 leading-tight">Component Detection Tools</div>
                    </div>
                  </button>
                </>
              )}
            </nav>
          </aside>
        )}

        {/* Content Body Switch */}
        {activeSection === "ocean" ? (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-950 w-full">
            <div className="max-w-5xl mx-auto">
              <OceanAnalysisCard
                labStats={labStats}
                onResetStats={handleResetTelemetryStats}
              />
            </div>
          </div>
        ) : activeSection === "ai_guru" ? (
          <div className="flex-1 overflow-y-auto bg-slate-950 w-full">
            <TalkToAiGuru />
          </div>
        ) : activeSection === "fully_fledged" && activeBlackBox === "lab" ? (
          <div className="flex-1 overflow-y-auto bg-slate-950 w-full">
            <BlackBoxIdentification />
          </div>
        ) : ("""

content = content.replace(chunk2, repl2)

with open("src/App.tsx", "w") as f:
    f.write(content)

print(chunk1 in content, chunk2 in content)
