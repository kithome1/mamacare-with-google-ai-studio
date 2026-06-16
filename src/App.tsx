import React, { useState, useEffect } from "react";
import { Biodata, ClinicReminder, SymptomLog } from "./types";
import DashboardView from "./components/DashboardView";
import RegistrationView from "./components/RegistrationView";
import ClinicsView from "./components/ClinicsView";
import SymptomView from "./components/SymptomView";
import { getSupabase, setSupabaseConfig } from "./lib/supabase";
import {
  Heart,
  Home,
  User,
  Calendar,
  Activity,
  Sparkles,
  Smile,
  ShieldCheck,
  RefreshCw,
  Clock,
  Database,
  Lock
} from "lucide-react";

const INITIAL_BIODATA: Biodata = {
  fullName: "",
  age: "",
  dueDate: "",
  gestationalWeeks: 12,
  bloodGroup: "O+",
  emergencyContact: "",
  isRegistered: false,
};

const formatToDayMonthYear = (dateStr: string): string => {
  if (!dateStr) return "";
  // Is it already dd/mm/yyyy?
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    if (parts[0].length === 4) { // yyyy-mm-dd
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
  }
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const SEED_CLINICS: ClinicReminder[] = [
  {
    id: "seed-1",
    title: "First Blood Check-up & Ultrasound Baby Scan",
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], 
    time: "",
    location: "Community Health Clinic, Room 302",
    notes: "Remember to bring your maternity card. Try to avoid heavy meals right before your scan.",
    status: "pending",
  },
  {
    id: "seed-2",
    title: "Baby Growth & Development Scan",
    date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], 
    time: "",
    location: "Community Health Clinic, Room B",
    notes: "Drink one or two cups of clean water 45 minutes before your scan to help see your baby clearly.",
    status: "pending",
  },
  {
    id: "seed-3",
    title: "Pregnancy Blood Sugar Test",
    date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], 
    time: "",
    location: "Health Clinic Lab",
    notes: "Do not eat anything for 8 hours before this test. Bring a simple light snack to eat immediately after the test is done.",
    status: "pending",
  },
];

const SEED_SYMPTOMS: SymptomLog[] = [
  {
    id: "seed-sym-1",
    symptom: "Nausea / Morning Sickness",
    additionalNotes: "Feels heavy when waking up at 6am. Relieved slightly by chewing on organic ginger or warm water.",
    loggedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(), 
    weeksAtLog: 11,
    aiAdviceText: "### What's Happening\nMorning sickness typically peaks around week 9 and decreases by week 14-16. It is highly common due to rapid hCG hormone rises.\n\n### Safe Self-Care & Relief Steps\n- Eat dry toast or crackers before getting out of bed.\n- Eat small, frequent meals throughout the day (low-fat, high-protein/carb snack blocks).\n- Stay hydrated with ginger tea, lemon water, or small electrolyte sips.\n- Avoid strong odors and spicy foods.\n\n### ⚠️ Warning Signs & When to Seek Help\nSeek care immediately if you cannot keep any liquids down for 24 hours, experience rapid weight loss, or feel severely dizzy or lightheaded (signs of Hyperemesis Gravidarum).",
    severity: "low",
  }
];

export default function App() {
  const [biodata, setBiodata] = useState<Biodata>(() => {
    const saved = localStorage.getItem("mamacare_biodata");
    return saved ? JSON.parse(saved) : INITIAL_BIODATA;
  });

  const [clinics, setClinics] = useState<ClinicReminder[]>(() => {
    const saved = localStorage.getItem("mamacare_clinics");
    return saved ? JSON.parse(saved) : SEED_CLINICS;
  });

  const [symptoms, setSymptoms] = useState<SymptomLog[]>(() => {
    const saved = localStorage.getItem("mamacare_symptoms");
    return saved ? JSON.parse(saved) : SEED_SYMPTOMS;
  });

  const [activeTab, setActiveTab] = useState<string>("home");
  
  // Security Lab & Auth states
  const [tokenMode, setTokenMode] = useState<"simulated" | "none" | "invalid" | "real_supabase" >("simulated");
  const [supabaseToken, setSupabaseToken] = useState<string>(() => {
    return localStorage.getItem("mamacare_supabase_token") || "";
  });
  const [supabaseEmail, setSupabaseEmail] = useState<string>("");
  const [supabasePassword, setSupabasePassword] = useState<string>("");
  const [supabaseSuccessMsg, setSupabaseSuccessMsg] = useState<string>("");
  const [supabaseErrorMsg, setSupabaseErrorMsg] = useState<string>("");
  const [isSupabaseAuthenticating, setIsSupabaseAuthenticating] = useState<boolean>(false);
  const [onboardingError, setOnboardingError] = useState<string>("");
  const [isOnboardingAuthenticating, setIsOnboardingAuthenticating] = useState<boolean>(false);
  const [backendSecurityReport, setBackendSecurityReport] = useState<any>(null);
  const [securityReportRefresh, setSecurityReportRefresh] = useState<number>(0);

  // Dynamic config loading from server at startup
  useEffect(() => {
    const loadSupabaseKeys = async () => {
      try {
        const res = await fetch("/api/supabase-config");
        if (res.ok) {
          const config = await res.json();
          if (config.supabaseUrl && config.supabaseAnonKey) {
            setSupabaseConfig(config.supabaseUrl, config.supabaseAnonKey);
            // set token mode to check real_supabase if a token exists
            if (localStorage.getItem("mamacare_supabase_token")) {
              setTokenMode("real_supabase");
            }
          }
        }
      } catch (err) {
        console.warn("Retrying/falling back during Supabase dynamic key fetch:", err);
      }
    };
    loadSupabaseKeys();
  }, []);

  // First-time onboarding email login states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginWeeks, setLoginWeeks] = useState(12);
  const [loginDueDate, setLoginDueDate] = useState(() => {
    // default for 12 weeks
    const weeksRemaining = 40 - 12;
    const daysRemaining = Math.round(weeksRemaining * 7);
    const dueDateObj = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);
    return dueDateObj.toISOString().split("T")[0];
  });

  const calculateDueDateFromWeeks = (weeks: number): string => {
    const weeksRemaining = 40 - weeks;
    const daysRemaining = Math.round(weeksRemaining * 7);
    const dueDateObj = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);
    return dueDateObj.toISOString().split("T")[0]; // yyyy-mm-dd
  };

  const calculateWeeksFromDueDate = (dueDateStr: string): number => {
    const dueDate = new Date(dueDateStr);
    if (Number.isNaN(dueDate.getTime())) return 12;
    const today = new Date();
    const daysRemaining = (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    const weeksRemaining = daysRemaining / 7;
    const weeksPregnant = Math.round(40 - weeksRemaining);
    return Math.max(1, Math.min(45, weeksPregnant));
  };

  const handleOnboardingWeeksChange = (weeksVal: number) => {
    setLoginWeeks(weeksVal);
    if (!weeksVal) return;
    const computedDueDate = calculateDueDateFromWeeks(weeksVal);
    setLoginDueDate(computedDueDate);
  };

  const handleOnboardingDueDateChange = (dateVal: string) => {
    setLoginDueDate(dateVal);
    if (!dateVal) return;
    const computedWeeks = calculateWeeksFromDueDate(dateVal);
    setLoginWeeks(computedWeeks);
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingError("");
    setIsOnboardingAuthenticating(true);

    if (!loginEmail.trim() || !loginName.trim()) {
      setOnboardingError("Please enter your name and email.");
      setIsOnboardingAuthenticating(false);
      return;
    }

    const finalWeeks = Number(loginWeeks) || 12;
    // ensure synchronized state when user submits
    const finalDueDate = loginDueDate || calculateDueDateFromWeeks(finalWeeks);

    const client = getSupabase();
    if (client) {
      try {
        // Attempt sign up. This creates the user record so the administrator see them in Supabase
        const { data, error: signUpError } = await client.auth.signUp({
          email: loginEmail.trim(),
          password: loginPassword || "MamaCarePass123!",
          options: {
            data: {
              full_name: loginName.trim(),
              gestational_weeks: finalWeeks,
              due_date: finalDueDate,
            }
          }
        });

        if (signUpError) {
          // If already signed up or exists, let's auto sign-in with password!
          if (
            signUpError.message.toLowerCase().includes("already registered") || 
            signUpError.message.toLowerCase().includes("already exists") || 
            signUpError.message.toLowerCase().includes("taken")
          ) {
            const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
              email: loginEmail.trim(),
              password: loginPassword || "MamaCarePass123!",
            });

            if (signInError) {
              throw signInError;
            }

            if (signInData?.session) {
              setSupabaseToken(signInData.session.access_token);
              setTokenMode("real_supabase");
            }
          } else {
            throw signUpError;
          }
        } else {
          if (data?.session) {
            setSupabaseToken(data.session.access_token);
            setTokenMode("real_supabase");
          } else {
            // Under Supabase, sometimes confirmation is required before sign in,
            // but we can try to log in immediately as well in case sign-up didn't return session
            try {
              const { data: loginData } = await client.auth.signInWithPassword({
                email: loginEmail.trim(),
                password: loginPassword || "MamaCarePass123!",
              });
              if (loginData?.session) {
                setSupabaseToken(loginData.session.access_token);
                setTokenMode("real_supabase");
              }
            } catch (ignore) {}
          }
        }
      } catch (authErr: any) {
        console.error("Supabase Authenticator error:", authErr);
        setOnboardingError(authErr.message || "Failed to establish a secure database sync session.");
        setIsOnboardingAuthenticating(false);
        return;
      }
    } else {
      console.warn("Supabase is not configured yet. Proceeding in offline mock mode.");
    }

    const newProfile: Biodata = {
      fullName: loginName.trim(),
      age: "28",
      dueDate: finalDueDate,
      gestationalWeeks: finalWeeks,
      bloodGroup: "O+",
      emergencyContact: "",
      isRegistered: true,
      registeredAt: new Date().toLocaleDateString(),
    };

    setBiodata(newProfile);
    setIsOnboardingAuthenticating(false);
    setActiveTab("home");
  };

  // Sync token
  useEffect(() => {
    localStorage.setItem("mamacare_supabase_token", supabaseToken);
  }, [supabaseToken]);

  const getAuthTokenValue = (): string => {
    switch (tokenMode) {
      case "simulated":
        return "demo_mama_secure_token_12345";
      case "none":
        return "";
      case "invalid":
        return "broken_tampered_jwt_signature_xyz_998877";
      case "real_supabase":
        return supabaseToken || "no_real_supabase_session_active";
      default:
        return "demo_mama_secure_token_12345";
    }
  };

  // Poll or refresh backend security status when parameters shift
  useEffect(() => {
    let active = true;
    const fetchSecurityStatus = async () => {
      try {
        const token = getAuthTokenValue();
        const response = await fetch("/api/auth-status", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok && active) {
          const stats = await response.json();
          setBackendSecurityReport(stats);
        }
      } catch (err) {
        console.warn("Error querying security report endpoint:", err);
      }
    };

    fetchSecurityStatus();
    return () => {
      active = false;
    };
  }, [tokenMode, supabaseToken, securityReportRefresh]);

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseErrorMsg("");
    setSupabaseSuccessMsg("");
    setIsSupabaseAuthenticating(true);

    try {
      const client = getSupabase();
      if (!client) {
        throw new Error("Supabase is not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.");
      }

      const { data, error } = await client.auth.signInWithPassword({
        email: supabaseEmail.trim(),
        password: supabasePassword,
      });

      if (error) throw error;

      if (data?.session) {
        setSupabaseToken(data.session.access_token);
        setSupabaseSuccessMsg(`Log in succeeded! JWT loaded for ${data.user?.email}`);
        setTokenMode("real_supabase");
      } else {
        throw new Error("No active session returned.");
      }
    } catch (err: any) {
      console.error(err);
      setSupabaseErrorMsg(err.message || "Failed to log in.");
    } finally {
      setIsSupabaseAuthenticating(false);
    }
  };

  const handleSupabaseSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseErrorMsg("");
    setSupabaseSuccessMsg("");
    setIsSupabaseAuthenticating(true);

    try {
      const client = getSupabase();
      if (!client) {
        throw new Error("Supabase is not configured yet.");
      }

      const { data, error } = await client.auth.signUp({
        email: supabaseEmail.trim(),
        password: supabasePassword,
      });

      if (error) throw error;

      setSupabaseSuccessMsg(`Sign up succeeded! Check your inbox or try logging in.`);
    } catch (err: any) {
      console.error(err);
      setSupabaseErrorMsg(err.message || "Failed to sign up.");
    } finally {
      setIsSupabaseAuthenticating(false);
    }
  };

  // Synchronize storage
  useEffect(() => {
    localStorage.setItem("mamacare_biodata", JSON.stringify(biodata));
  }, [biodata]);

  useEffect(() => {
    localStorage.setItem("mamacare_clinics", JSON.stringify(clinics));
  }, [clinics]);

  useEffect(() => {
    localStorage.setItem("mamacare_symptoms", JSON.stringify(symptoms));
  }, [symptoms]);

  const handleRegister = (data: Biodata) => {
    setBiodata(data);
  };

  const handleResetBiodata = () => {
    setBiodata(INITIAL_BIODATA);
  };

  const handleAddClinic = (newClinic: Omit<ClinicReminder, "id">) => {
    const reminderWithId: ClinicReminder = {
      ...newClinic,
      id: String(Date.now()),
    };
    setClinics((prev) => [reminderWithId, ...prev]);
  };

  const handleToggleClinicStatus = (id: string) => {
    setClinics((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: c.status === "pending" ? "completed" : "pending" } : c))
    );
  };

  const handleAddSymptomLog = (log: SymptomLog) => {
    setSymptoms((prev) => [log, ...prev]);
  };

  const handleClearSymptomLogs = () => {
    if (confirm("Are you sure you would like to clear your symptom log history?")) {
      setSymptoms([]);
    }
  };

  // Seed demo profile with 1-click for simple testing
  const handleQuickSeedDemo = () => {
    const demoProfile: Biodata = {
      fullName: "Amina Ali",
      age: "29",
      dueDate: new Date(Date.now() + 196 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], 
      gestationalWeeks: 12,
      bloodGroup: "O+",
      emergencyContact: "+254 712 345678",
      isRegistered: true,
      registeredAt: new Date().toLocaleDateString(),
    };
    setBiodata(demoProfile);
    setClinics(SEED_CLINICS);
    setSymptoms(SEED_SYMPTOMS);
    setActiveTab("home");
  };

  const currentWeeks = biodata.isRegistered ? biodata.gestationalWeeks : 12;

  // Render content of the active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        if (!biodata.isRegistered) {
          return (
            <div className="max-w-md mx-auto bg-white border border-emerald-150 shadow-xl rounded-3xl p-6 md:p-8 space-y-6" id="first-time-onboarding-login">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center shadow-md shadow-emerald-100 mx-auto animate-pulse" id="login-heart-badge">
                  <Heart className="h-6 w-6 text-white fill-white/10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">MamaCare Companion</h2>
                <p className="text-slate-500 text-xs">Let's set up your profile. Enter your name and email to begin your pregnancy companion session.</p>
              </div>

              <form onSubmit={handleOnboardingSubmit} className="space-y-4">
                {onboardingError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-600 text-[11px] p-3 rounded-xl font-medium animate-fade-in" id="onboarding-error-box">
                     ⚠️ {onboardingError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">First Name or Loving Name *</label>
                  <input
                    type="text"
                    required
                    disabled={isOnboardingAuthenticating}
                    placeholder="e.g. Amina"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:bg-white text-slate-800 rounded-xl text-sm outline-none disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Email Address *</label>
                  <input
                    type="email"
                    required
                    disabled={isOnboardingAuthenticating}
                    placeholder="mother@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:bg-white text-slate-800 rounded-xl text-sm outline-none disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Password *</label>
                  <input
                    type="password"
                    required
                    disabled={isOnboardingAuthenticating}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:bg-white text-slate-800 rounded-xl text-sm outline-none disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">How many weeks pregnant are you? *</label>
                  <input
                    type="number"
                    required
                    disabled={isOnboardingAuthenticating}
                    min={1}
                    max={45}
                    placeholder="e.g. 12"
                    value={loginWeeks || ""}
                    onChange={(e) => handleOnboardingWeeksChange(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:bg-white text-slate-800 rounded-xl text-sm outline-none disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Expected Due Date (EDD) *</label>
                  <input
                    type="date"
                    required
                    disabled={isOnboardingAuthenticating}
                    value={loginDueDate}
                    onChange={(e) => handleOnboardingDueDateChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:bg-white text-slate-800 rounded-xl text-sm outline-none disabled:opacity-60"
                  />
                  {loginDueDate && (
                    <p className="text-xs font-semibold text-emerald-600 mt-1">
                      Target Due Date: {formatToDayMonthYear(loginDueDate)} 
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 italic mt-0.5">Changing weeks automatically calculates EDD, and vice versa. You can adjust either directly!</p>
                </div>

                <button
                  type="submit"
                  disabled={isOnboardingAuthenticating}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition text-xs tracking-wider uppercase mt-4 disabled:opacity-75 flex items-center justify-center space-x-2"
                >
                  {isOnboardingAuthenticating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                      <span>Securing session on Supabase...</span>
                    </>
                  ) : (
                    <span>Open Prenatal Companion</span>
                  )}
                </button>
              </form>

              <div className="flex justify-center border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={handleQuickSeedDemo}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                >
                  Quick-Start Journey (Pre-filled Demo)
                </button>
              </div>
            </div>
          );
        }
        return <DashboardView biodata={biodata} onNavigate={setActiveTab} />;
      case "registration":
        return <RegistrationView biodata={biodata} onRegister={handleRegister} onReset={handleResetBiodata} />;
      case "clinics":
        return (
          <ClinicsView
            reminders={clinics}
            onAddReminder={handleAddClinic}
            onToggleStatus={handleToggleClinicStatus}
            gestationalWeeks={currentWeeks}
            dueDate={biodata.dueDate}
          />
        );
      case "symptoms":
        return <SymptomView biodata={biodata} logs={symptoms} onAddLog={handleAddSymptomLog} onClearLogs={handleClearSymptomLogs} authToken={getAuthTokenValue()} />;
      default:
        return <DashboardView biodata={biodata} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-50/75 via-slate-50 to-pink-50/45 pb-32 font-sans text-slate-700 antialiased" id="main-frame-wrapper">
      
      {/* Beautiful, Friendly Maternal Header */}
      <header className="border-b border-rose-100/30 bg-white/80 backdrop-blur-md sticky top-0 z-40 transition-all shadow-xs" id="desktop-brand-header">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-400 to-pink-500 flex items-center justify-center shadow-md shadow-rose-100" id="brand-logo-img">
              <Heart className="h-5.5 w-5.5 text-white fill-white/10" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-slate-850 tracking-tight">MamaCare</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-500 rounded-full lowercase tracking-wider">companion</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Your loving digital prenatal pregnancy advisor</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {tokenMode === "real_supabase" && (
              <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 border border-emerald-100/70 text-emerald-700 text-[10px] font-bold rounded-2xl shadow-xs animate-pulse">
                <Database className="h-3.5 w-3.5 text-emerald-500" />
                <span>Supabase Active Sync</span>
              </span>
            )}
            <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-50/60 border border-rose-100/50 text-rose-600 text-[11px] font-semibold rounded-2xl">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-rose-500" />
              <span>Week {currentWeeks}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Primary Workspace */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6" id="workspace-container">
        
        {/* Dynamic Context Header Block - Simplified and Loving */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-100/80 shadow-xs p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6" id="maternal-context-banner">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">Maternal Profile</span>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {biodata.isRegistered ? `Welcome, ${biodata.fullName}` : "Welcome, loving mother"}
            </h2>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-slate-500 font-medium text-xs">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-rose-400" />
                <span>Weeks pregnant: <strong className="text-slate-800 font-bold">{currentWeeks}</strong></span>
              </span>
              {biodata.isRegistered && (
                <>
                  <span className="text-slate-200">|</span>
                  <span>Estimated Delivery: <strong className="text-slate-800">{formatToDayMonthYear(biodata.dueDate)}</strong></span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickSeedDemo}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100/80 text-rose-600 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5"
              title="Pre-fill profile data for simple testing"
            >
              <Smile className="h-4 w-4 shrink-0" />
              <span>Pre-fill Journey</span>
            </button>
            <button
              onClick={handleResetBiodata}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-xs font-medium text-slate-500 rounded-xl transition cursor-pointer"
            >
              Reset Info
            </button>
          </div>
        </div>

        {/* Dynamic content rendering frame without simulated device limitations */}
        <div className="bg-transparent pb-16" id="primary-screen-content-box">
          <div className="transition-all animate-fade-in">
            {renderTabContent()}
          </div>
        </div>

      </div>

      {/* Modern Floating Bottom Navigation Bar with gorgeous smooth icons for the mother */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto bg-white/90 backdrop-blur-xl border border-emerald-100 shadow-[0_8px_32px_rgba(16,185,129,0.08)] rounded-3xl" id="bottom-navigation-pill">
        <div className="px-5 py-2.5 flex items-center justify-between">
          
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center justify-center space-y-1 py-1 px-4 rounded-2xl transition-all cursor-pointer ${
              activeTab === "home"
                ? "text-emerald-600 scale-105 font-bold"
                : "text-slate-400 hover:text-slate-600"
            }`}
            id="nav-btn-home"
          >
            <Home className={`h-5 w-5 transition-transform ${activeTab === "home" ? "stroke-[2.5px] text-emerald-600" : "stroke-2 text-slate-400"}`} />
            <span className={`text-[10px] tracking-tight font-medium ${activeTab === "home" ? "text-emerald-700" : "text-slate-500"}`}>Home</span>
          </button>

          <button
            onClick={() => setActiveTab("registration")}
            className={`flex flex-col items-center justify-center space-y-1 py-1 px-4 rounded-2xl transition-all cursor-pointer ${
              activeTab === "registration"
                ? "text-emerald-600 scale-105 font-bold"
                : "text-slate-400 hover:text-slate-600"
            }`}
            id="nav-btn-registration"
          >
            <User className={`h-5 w-5 transition-transform ${activeTab === "registration" ? "stroke-[2.5px] text-emerald-600" : "stroke-2 text-slate-400"}`} />
            <span className={`text-[10px] tracking-tight font-medium ${activeTab === "registration" ? "text-emerald-700" : "text-slate-500"}`}>Biodata</span>
          </button>

          <button
            onClick={() => setActiveTab("clinics")}
            className={`flex flex-col items-center justify-center space-y-1 py-1 px-4 rounded-2xl transition-all cursor-pointer ${
              activeTab === "clinics"
                ? "text-emerald-600 scale-105 font-bold"
                : "text-slate-400 hover:text-slate-600"
            }`}
            id="nav-btn-clinics"
          >
            <Calendar className={`h-5 w-5 transition-transform ${activeTab === "clinics" ? "stroke-[2.5px] text-emerald-600" : "stroke-2 text-slate-400"}`} />
            <span className={`text-[10px] tracking-tight font-medium ${activeTab === "clinics" ? "text-emerald-700" : "text-slate-500"}`}>Reminders</span>
          </button>

          <button
            onClick={() => setActiveTab("symptoms")}
            className={`flex flex-col items-center justify-center space-y-1 py-1 px-4 rounded-2xl transition-all cursor-pointer ${
              activeTab === "symptoms"
                ? "text-emerald-600 scale-105 font-bold"
                : "text-slate-400 hover:text-slate-600"
            }`}
            id="nav-btn-symptoms"
          >
            <Activity className={`h-5 w-5 transition-transform ${activeTab === "symptoms" ? "stroke-[2.5px] text-emerald-600" : "stroke-2 text-slate-400"}`} />
            <span className={`text-[10px] tracking-tight font-medium ${activeTab === "symptoms" ? "text-emerald-700" : "text-slate-500"}`}>AI Advisor</span>
          </button>
          
        </div>
      </nav>

    </div>
  );
}
