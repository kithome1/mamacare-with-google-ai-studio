import { useState, FormEvent } from "react";
import { SymptomLog, Biodata } from "../types";
import { Activity, ShieldAlert, Sparkles, MessageSquareHeart, CheckCircle, FileText, ChevronDown, Clock, Trash } from "lucide-react";

interface SymptomViewProps {
  biodata: Biodata;
  logs: SymptomLog[];
  onAddLog: (newLog: SymptomLog) => void;
  onClearLogs: () => void;
  authToken?: string;
}

const PRESET_SYMPTOMS = [
  "Nausea / Morning Sickness",
  "Lower Back Pain / Backache",
  "Swollen Feet or Ankles",
  "Mild Spotting / Bleeding",
  "Heartburn or Acid Reflux",
  "Headaches",
  "Pelvic Pressure or Tummy Stretches",
  "Frequent Urination",
  "Feeling Very Tired / Fatigue",
];

export default function SymptomView({ biodata, logs, onAddLog, onClearLogs, authToken }: SymptomViewProps) {
  const [selectedPreset, setSelectedPreset] = useState("");
  const [customSymptom, setCustomSymptom] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeLogId, setActiveLogId] = useState<string | null>(null);

  const handleSymptomSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const finalSymptomName = selectedPreset === "Other" || !selectedPreset 
      ? customSymptom.trim() 
      : selectedPreset;

    if (!finalSymptomName) {
      setErrorMessage("Please select or type a valid symptom.");
      return;
    }

    setErrorMessage("");
    setIsQuerying(true);

    const temporaryLogId = "temp-" + Date.now();
    setActiveLogId(temporaryLogId);

    try {
      const response = await fetch("/api/symptom-advice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken || ""}`
        },
        body: JSON.stringify({
          symptom: finalSymptomName,
          additionalNotes: additionalNotes.trim(),
          gestationalWeeks: biodata.gestationalWeeks || 12,
          motherAge: biodata.age ? Number(biodata.age) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Local feedback mechanism requested fallback.");
      }

      const data = await response.json();

      const newLog: SymptomLog = {
        id: String(Date.now()),
        symptom: finalSymptomName,
        additionalNotes: additionalNotes.trim(),
        loggedAt: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        weeksAtLog: biodata.gestationalWeeks || 12,
        aiAdviceText: data.advice,
        severity: data.severity || "low",
      };

      onAddLog(newLog);
      setActiveLogId(newLog.id);
      
      // Reset inputs
      setSelectedPreset("");
      setCustomSymptom("");
      setAdditionalNotes("");

    } catch (err: any) {
      console.warn("API Error, utilizing responsive offline advice algorithms:", err);
      // Fallback rule directly
      const mockResult = getSafeOfflineResponse(finalSymptomName);
      
      const offlineLog: SymptomLog = {
        id: String(Date.now()),
        symptom: finalSymptomName,
        additionalNotes: additionalNotes.trim(),
        loggedAt: new Date().toLocaleDateString(),
        weeksAtLog: biodata.gestationalWeeks || 12,
        aiAdviceText: mockResult.advice,
        severity: mockResult.severity,
      };

      onAddLog(offlineLog);
      setActiveLogId(offlineLog.id);

      setSelectedPreset("");
      setCustomSymptom("");
      setAdditionalNotes("");
    } finally {
      setIsQuerying(false);
    }
  };

  const getSafeOfflineResponse = (s: string) => {
    const sym = s.toLowerCase();
    let advice = "";
    let severity = "low";

    if (sym.includes("nausea") || sym.includes("morning")) {
      advice = "### Nausea and Vomiting\n\nMorning sickness typically peaks around week 9 and decreases by week 14-16.\n\n**Safe Self-Care Steps:**\n- Eat dry toast before getting up.\n- Keep eating tiny portions throughout the day.\n- Drink small electrolyte sips.\n- Avoid fatty and smelling triggers.";
    } else if (sym.includes("back") || sym.includes("hip")) {
      advice = "### Abdominal Back Pain\n\nCommonly triggered by growing weight shifts physical pulls on back muscles.\n\n**Safe Self-Care Steps:**\n- Sit up on supportive posture cushions.\n- Wear flat supportive items.\n- Rest on your left side with pillows.";
    } else if (sym.includes("bleed") || sym.includes("spot")) {
      advice = "### ⚠️ Bleeding Alert\n\nSpotting can occur, but bleeding requires medical overview from your clinic.\n\n**Safe Self-Care Steps:**\n- Please rest flat immediately and track pad usage.\n- Contact your clinic specialist line without delay.";
      severity = "high";
    } else {
      advice = `### Discomfort Guideline\n\nDiscomfort: "${s}". Mild changes are normal during pregnancy.\n\n**Safe Self-Care Steps:**\n- Drink lots of clean water.\n- rest whenever feeling worn out.\n- Consult your OBGYN before talking pain pills.`;
    }
    return { advice, severity };
  };

  // Modern React Markdown renderer
  const renderFormattedAdvice = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return (
      <div className="space-y-3 font-sans text-slate-600 text-sm leading-relaxed" id="advice-markdown-rendered">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          
          if (trimmed.startsWith("###")) {
            return (
              <h4 key={idx} className="text-sm font-extrabold text-slate-800 mt-5 pt-3 pb-1.5 border-b border-rose-50 tracking-tight flex items-center gap-1.5 uppercase">
                <Sparkles className="h-3.5 w-3.5 text-rose-500 animate-pulse shrink-0" />
                <span>{trimmed.replace(/^###\s*/, "")}</span>
              </h4>
            );
          }
          if (trimmed.startsWith("##")) {
            return (
              <h3 key={idx} className="text-base font-extrabold text-slate-800 mt-6 mb-2 pb-1.5 border-b border-rose-100/50 tracking-tight">
                {trimmed.replace(/^##\s*/, "")}
              </h3>
            );
          }
          if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
            const rawContent = trimmed.replace(/^[-*]\s*/, "");
            return (
              <div key={idx} className="pl-4 flex items-start space-x-2 my-1.5">
                <span className="text-rose-400 select-none mt-1.5 shrink-0 block w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>{parseBoldText(rawContent)}</span>
              </div>
            );
          }
          if (trimmed === "") {
            return <div key={idx} className="h-2" />;
          }
          return <p key={idx}>{parseBoldText(line)}</p>;
        })}
      </div>
    );
  };

  const parseBoldText = (str: string) => {
    const chunks = str.split(/\*\*(.*?)\*\*/g);
    return chunks.map((chunk, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-slate-800 bg-amber-50/50 px-0.5 rounded">{chunk}</strong>;
      }
      return chunk;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" id="symptom-tracker-container">
      
      <div className="text-center md:text-left space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center justify-center md:justify-start gap-2">
          <Activity className="h-7 w-7 text-rose-500" />
          <span>Symptom Tracker & AI Advisor</span>
        </h1>
        <p className="text-slate-500 text-sm">
          Select or log any current physical challenges to trigger expert maternal guides compiled by Google Gemini AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="symptom-screen-layout">
        
        {/* Left Side: Submit Diagnostic Form */}
        <div className="lg:col-span-5 bg-white border border-slate-100 p-6 rounded-2xl shadow-xl space-y-5 h-fit" id="symptom-form-card">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-50">
            <MessageSquareHeart className="h-5 w-5 text-rose-500" />
            <h3 className="font-bold text-slate-800 text-sm">Log Maternal Discomfort</h3>
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-500 font-semibold">{errorMessage}</p>
          )}

          <form onSubmit={handleSymptomSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">SELECT PREGNANCY SYMPTOM</label>
              <div className="relative">
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="w-full px-3.5 py-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-400 text-slate-800 rounded-xl text-xs outline-none appearance-none"
                  id="symptom-dropdown-select"
                >
                  <option value="">-- Choose Common Discomfort --</option>
                  {PRESET_SYMPTOMS.map((p, idx) => (
                    <option key={idx} value={p}>{p}</option>
                  ))}
                  <option value="Other">Other (Type custom below)</option>
                </select>
                <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>

            {(selectedPreset === "Other" || selectedPreset === "") && (
              <div className="space-y-1.5" id="custom-symptom-input-block">
                <label className="text-xs font-semibold text-slate-500">TYPE CUSTOM DISCOMFORT Discomfort *</label>
                <input
                  type="text"
                  placeholder="e.g. Sharp groin pulls when turning over"
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-400 text-slate-800 text-xs rounded-xl outline-none transition"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">ADDITIONAL INFORMATION / INTENSITY</label>
              <textarea
                rows={3}
                placeholder="e.g. Mild pain, typically kicks in during twilight hours, relieved slightly with pillows."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-400 text-slate-800 text-xs rounded-xl outline-none transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isQuerying}
              id="get-ai-advice-btn"
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 disabled:from-emerald-400 disabled:to-green-400 hover:from-emerald-600 hover:to-green-600 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-100/50 tracking-wider uppercase transition flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="h-4 w-4 animate-bounce" />
              <span>{isQuerying ? "Generating Compassionate Advice..." : "Consult AI Advisor"}</span>
            </button>
          </form>

          <div className="p-3 bg-amber-50/50 rounded-lg flex space-x-2 text-[11px] text-amber-800 border border-amber-100/30">
            <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p><strong>Note:</strong> Red flag warnings such as bleeding or acute lower tummy pains mean you should contact your doctor or hospital immediately.</p>
          </div>
        </div>

        {/* Right Side: Active Diagnosis Logs & History */}
        <div className="lg:col-span-7 space-y-4" id="symptom-guidance-dashboard">
          
          {isQuerying && (
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 p-6 rounded-2xl shadow flex flex-col items-center justify-center text-center space-y-3" id="ai-loading-skeleton">
              <div className="w-10 h-10 rounded-full border-4 border-rose-400 border-t-transparent animate-spin" />
              <div className="space-y-1">
                <h4 className="font-bold text-slate-700 text-sm">Consulting MamaCare AI Advisor</h4>
                <p className="text-slate-400 text-xs max-w-sm">Gathering simple, loving self-care tips and helpful suggestions for you...</p>
              </div>
            </div>
          )}

          {logs.length === 0 && !isQuerying ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-16 text-center space-y-2" id="no-logged-symptoms">
              <MessageSquareHeart className="h-10 w-10 text-slate-300 mx-auto animate-pulse" />
              <h3 className="font-bold text-slate-600 text-sm">Your Diagnostic History is Empty</h3>
              <p className="text-slate-400 text-xs max-w-xs mx-auto">Log a current physical state on the left panel to generate custom guidelines and advice lists instantly.</p>
            </div>
          ) : (
            <div className="space-y-4" id="logs-feed-container">
              
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Guidance Records ({logs.length})</span>
                <button
                  onClick={onClearLogs}
                  id="btn-clear-symptoms"
                  className="flex items-center space-x-1 text-slate-400 hover:text-rose-500 text-xs transition font-medium"
                >
                  <Trash className="h-3.5 w-3.5" />
                  <span>Clear All</span>
                </button>
              </div>

              {logs.map((log) => {
                const isActive = activeLogId === log.id;
                const isHighSeverity = log.severity === "high";
                const isMedSeverity = log.severity === "medium";

                return (
                  <div
                    key={log.id}
                    className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 shadow-${isActive ? 'lg border-rose-200' : 'sm border-slate-100 hover:border-slate-200'}`}
                    id={`symptom-card-${log.id}`}
                  >
                    {/* Header bar clicked to toggle detailed advice */}
                    <div
                      onClick={() => setActiveLogId(isActive ? null : log.id)}
                      className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition"
                      id="card-header-toggle"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <h4 className="font-bold text-slate-800 text-sm">{log.symptom}</h4>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isHighSeverity ? 'bg-rose-100 text-rose-600 border border-rose-200 animate-pulse' :
                            isMedSeverity ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                            'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {isHighSeverity ? "⚠️ HIGH SEVERITY" : isMedSeverity ? "⚠️ MEDIUM" : "✓ DISCOMFORT"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Logged week {log.weeksAtLog}  |  {log.loggedAt}</span>
                        </p>
                      </div>

                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isActive ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Detailed Content */}
                    {isActive && (
                      <div className="p-6 border-t border-slate-50 bg-rose-50/5 space-y-4" id="log-content-card">
                        
                        {log.additionalNotes && (
                          <div className="p-3 bg-slate-50/70 border-l border-slate-300 rounded-r-lg space-y-1">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block tracking-wider">Mother's Notes</span>
                            <p className="text-xs text-slate-600">{log.additionalNotes}</p>
                          </div>
                        )}

                        {log.aiAdviceText && (
                          <div className="space-y-3">
                            <div className="flex items-center space-x-1 bg-rose-50/50 p-2 py-1 border border-rose-100/30 rounded-lg text-rose-600 text-xs font-semibold w-fit">
                              <MessageSquareHeart className="h-3.5 w-3.5" />
                              <span>AI Pre-natal Advice:</span>
                            </div>
                            
                            <div className="bg-white/80 border border-rose-200/50 p-4 rounded-xl shadow-inner scroll-smooth">
                              {renderFormattedAdvice(log.aiAdviceText)}
                            </div>
                          </div>
                        )}

                        {isHighSeverity && (
                          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl space-y-2">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                              <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0" />
                              Action Recommendation
                            </h5>
                            <p className="text-xs leading-relaxed">
                              Symptoms related to bleeding, heavy spots, or severe persistent headaches require direct care. Please call your doctor, midwife, or visit your hospital check-room immediately.
                            </p>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                );
              })}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
