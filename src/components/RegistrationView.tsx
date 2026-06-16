import { useState, useEffect, useMemo, FormEvent, ChangeEvent } from "react";
import { Biodata } from "../types";
import { User, Calendar, Heart, Shield, CheckCircle, Smartphone } from "lucide-react";

interface RegistrationViewProps {
  biodata: Biodata;
  onRegister: (data: Biodata) => void;
  onReset: () => void;
}

// Helper utilities exactly corresponding to your design
function parseDateString(value: string): Date | null {
  if (!value) return null;

  const trimmed = value.trim();
  const ddmmyyyy = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const date = new Date(`${year}-${month}-${day}`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const yyyymmdd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd;
    const date = new Date(`${year}-${month}-${day}`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function calculateWeeksPregnant(dueDateString: string | Date): number | null {
  const dueDate = typeof dueDateString === "string" ? parseDateString(dueDateString) : dueDateString;
  if (!dueDate) return null;
  if (Number.isNaN(dueDate.getTime())) return null;
  const today = new Date();
  const daysRemaining = (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  const weeksRemaining = daysRemaining / 7;
  const weeksPregnant = Math.round(40 - weeksRemaining);
  return Math.max(0, Math.min(40, weeksPregnant));
}

function formatDateForDisplay(value: string): string {
  const date = parseDateString(value);
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function RegistrationView({ biodata, onRegister, onReset }: RegistrationViewProps) {
  const initialFormState = useMemo(() => ({
    fullName: "",
    dueDate: "",
    weeksPregnant: "",
    // Retaining hidden fallback or optional items that make the rest of the application run nicely
    age: "28",
    bloodGroup: "O+",
    emergencyContact: "+254 712 345678"
  }), []);

  const [formData, setFormData] = useState(initialFormState);
  const [registered, setRegistered] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [messages, setMessages] = useState([
    { type: "bot", text: "Great! Let's get you registered." },
    { type: "bot", text: "Complete the form below to save your details." },
  ]);

  // Synchronize with external metadata when supplied
  useEffect(() => {
    if (biodata && biodata.isRegistered) {
      setFormData({
        fullName: biodata.fullName || "",
        dueDate: formatDateForDisplay(biodata.dueDate),
        weeksPregnant: biodata.dueDate
          ? String(calculateWeeksPregnant(biodata.dueDate) || "")
          : String(biodata.gestationalWeeks) || "",
        age: biodata.age || "28",
        bloodGroup: biodata.bloodGroup || "O+",
        emergencyContact: biodata.emergencyContact || "+254 712 345678"
      });
      setMessages([
        { type: "bot", text: "Welcome back! Your saved registration details are loaded." },
        { type: "bot", text: "Review or update your details below, then click Submit registration if you need to save changes." },
      ]);
      setRegistered(true);
      setErrorMessage("");
    } else {
      setFormData(initialFormState);
      setMessages([
        { type: "bot", text: "Great! Let's get you registered." },
        { type: "bot", text: "Complete the form below to save your details." },
      ]);
      setRegistered(false);
      setErrorMessage("");
    }
  }, [biodata, initialFormState]);

  const handleDateInput = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    let formatted = input.replace(/\D/g, "");

    if (formatted.length > 8) {
      formatted = formatted.slice(0, 8);
    }

    let display = "";
    if (formatted.length > 0) {
      display = formatted.slice(0, 2);
    }
    if (formatted.length > 2) {
      display += "/" + formatted.slice(2, 4);
    }
    if (formatted.length > 4) {
      display += "/" + formatted.slice(4, 8);
    }

    setFormData((prev) => {
      const nextState = { ...prev, dueDate: display };
      if (formatted.length === 8) {
        const calculatedWeeks = calculateWeeksPregnant(display);
        if (calculatedWeeks !== null) {
          nextState.weeksPregnant = String(calculatedWeeks);
        }
      }
      return nextState;
    });
    // Reset registration message state when user changes data
    setRegistered(false);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    
    setFormData((prev) => {
      const nextState = { ...prev, [name]: value };
      
      if (name === "weeksPregnant") {
        const weeks = Number(value);
        if (weeks > 0 && weeks <= 45) {
          // Calculate due date based on weeks from today (gestational weeks out of 40)
          const weeksRemaining = 40 - weeks;
          const daysRemaining = Math.round(weeksRemaining * 7);
          const dueDateObj = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);
          
          const year = dueDateObj.getFullYear();
          const month = String(dueDateObj.getMonth() + 1).padStart(2, "0");
          const day = String(dueDateObj.getDate()).padStart(2, "0");
          nextState.dueDate = `${day}/${month}/${year}`;
        }
      }
      
      return nextState;
    });

    // Reset registration status if they touch credentials
    setRegistered(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const dueDateObj = parseDateString(formData.dueDate);
    if (!dueDateObj) {
      setErrorMessage("Please enter a valid due date in dd/mm/yyyy format.");
      return;
    }

    const formattedDueDate = `${dueDateObj.getFullYear()}-${String(dueDateObj.getMonth() + 1).padStart(2, "0")}-${String(dueDateObj.getDate()).padStart(2, "0")}`;
    const calculatedWeeks = calculateWeeksPregnant(dueDateObj);
    const weeksPregnantValue = formData.weeksPregnant.toString().trim() 
      ? formData.weeksPregnant.toString().trim() 
      : calculatedWeeks !== null ? String(calculatedWeeks) : "";

    const formIsComplete =
      formData.fullName.trim() &&
      formData.dueDate.trim() &&
      weeksPregnantValue;

    if (!formIsComplete) {
      setErrorMessage("Please fill out all required maternal details before submitting.");
      return;
    }

    const registration: Biodata = {
      fullName: formData.fullName,
      dueDate: formattedDueDate,
      gestationalWeeks: Number(weeksPregnantValue) || 12,
      age: formData.age,
      bloodGroup: formData.bloodGroup,
      emergencyContact: formData.emergencyContact,
      isRegistered: true,
      registeredAt: new Date().toLocaleDateString(),
    };

    if (onRegister) {
      onRegister(registration);
    }

    setFormData((prev) => ({
      ...prev,
      weeksPregnant: weeksPregnantValue,
      dueDate: formatDateForDisplay(formattedDueDate),
    }));
    setErrorMessage("");
    setRegistered(true);
    setMessages([
      { type: "bot", text: "Success! Registration Completed" },
      { type: "bot", text: "Your profile is now ready. You can continue to the next screen." },
    ]);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6" id="registration-layout">
      
      {/* Visual Simulation of the Loving Interactive Bot Frame */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-thin border-rose-100 rounded-2xl p-4 space-y-3" id="registration-chat-bubble">
        <div className="flex items-center space-x-2 text-rose-500 font-bold text-xs uppercase tracking-wide">
          <Smartphone className="h-4 w-4" />
          <span>Maternal Assist Bot</span>
        </div>
        
        <div className="space-y-2">
          {messages.map((m, idx) => (
            <div key={idx} className="bg-white px-3.5 py-2.5 rounded-2xl border border-slate-100 shadow-sm max-w-[90%] text-xs text-slate-600 animate-fade-in">
              {m.text}
            </div>
          ))}
        </div>
      </div>

      {/* Main Registration Form container */}
      <div className="bg-white border border-slate-100 shadow-xl rounded-2xl overflow-hidden p-6 md:p-8" id="registration-form-card">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-5 pb-3 border-b border-rose-50 flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500" />
          <span>Register your details</span>
        </h2>

        {!registered ? (
          <form className="space-y-5" onSubmit={handleSubmit} id="maternal-form">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 tracking-wide flex items-center gap-1 uppercase">
                <User className="h-3.5 w-3.5 text-slate-400" />
                Full name <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                placeholder="e.g. Amina Ali"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white text-slate-800 rounded-xl text-sm transition outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 tracking-wide flex items-center gap-1 uppercase">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Expected due date <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                name="dueDate"
                placeholder="dd/mm/yyyy"
                maxLength={10}
                value={formData.dueDate}
                onChange={handleDateInput}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white text-slate-800 rounded-xl text-sm transition outline-none"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Enter your due date in <strong>dd/mm/yyyy</strong> and we will calculate your weeks pregnant automatically.
              </p>
              {formData.dueDate && calculateWeeksPregnant(formData.dueDate) !== null && (
                <p className="text-xs text-rose-500 font-medium bg-rose-50/50 p-2 rounded-lg border border-rose-100/50 mt-2">
                  Calculated weeks pregnant: <strong>{calculateWeeksPregnant(formData.dueDate)} week(s)</strong>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 tracking-wide flex items-center gap-1 uppercase">
                <Heart className="h-3.5 w-3.5 text-slate-400" />
                Weeks pregnant <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="number"
                name="weeksPregnant"
                min="1"
                max="45"
                placeholder="e.g. 24"
                value={formData.weeksPregnant}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white text-slate-800 rounded-xl text-sm transition outline-none"
                required
              />
            </div>

            {/* Additional fields made optional so your app remains robust without setup crashes */}
            <div className="pt-2 border-t border-dashed border-slate-100 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">Support Settings (Optional)</span>
              <div>
                <div className="space-y-1 max-w-[120px]">
                  <label className="text-[10px] font-bold text-slate-500">MATERNAL AGE</label>
                  <input
                    type="number"
                    name="age"
                    min="13"
                    max="55"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg outline-none"
                  />
                </div>
              </div>
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-500 font-semibold bg-rose-50/70 p-2 border border-rose-200/50 rounded-xl" id="error-message">
                {errorMessage}
              </p>
            )}

            <div className="pt-4 border-t border-slate-100 flex flex-col items-center justify-center">
              <button
                type="submit"
                id="submit-registration-btn"
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-md transform active:scale-[0.98] transition text-sm tracking-wide uppercase cursor-pointer"
              >
                Submit registration
              </button>
            </div>

          </form>
        ) : (
          <div 
            className="w-full p-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center font-bold text-sm tracking-wide flex flex-col items-center justify-center gap-3 animate-bounce-short"
            id="registration-success-badge"
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <CheckCircle className="h-10 w-10 text-emerald-600 shrink-0" />
              <span className="text-base font-extrabold">Success! Registration Completed</span>
            </div>
            <p className="text-sm font-normal text-slate-600 max-w-sm mx-auto leading-relaxed">
              Your registration details have been successfully saved in your browser session.
            </p>
            <p className="text-xs font-normal text-slate-400">
              Use the navigation controls below to continue to other features.
            </p>
            
            <button 
              type="button"
              onClick={onReset}
              className="mt-2 text-xs font-semibold px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-emerald-200 text-rose-500 hover:text-rose-600 shadow-sm transition cursor-pointer"
            >
              Reset Active Profile / Edit Details
            </button>
          </div>
        )}
      </div>

      <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100/30 flex space-x-3 items-start" id="disclaimer-tip">
        <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
          <Heart className="h-4 w-4 text-rose-500" />
        </div>
        <div className="space-y-0.5 text-[11px] text-slate-500 leading-relaxed">
          <p className="font-semibold text-slate-700">Medical Informative Reminder</p>
          <p>Sensitive medical parameters reside entirely locally in your current search session. Always schedule direct appointments with clinics for real pre-natal guidelines.</p>
        </div>
      </div>

    </div>
  );
}
