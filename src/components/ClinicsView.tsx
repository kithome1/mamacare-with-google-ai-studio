import { useState, FormEvent } from "react";
import { ClinicReminder } from "../types";
import { Calendar, Plus, Clock, MapPin, CheckCircle, Circle, AlertCircle, FileText, Check } from "lucide-react";

interface ClinicsViewProps {
  reminders: ClinicReminder[];
  onAddReminder: (reminder: Omit<ClinicReminder, "id">) => void;
  onToggleStatus: (id: string) => void;
  gestationalWeeks?: number;
  dueDate?: string;
}

interface Milestone {
  id: string;
  title: string;
  startWeek: number;
  endWeek: number;
}

const GESTATIONAL_MILESTONES: Milestone[] = [
  {
    id: "milestone-1",
    title: "First Blood Check-up & Dating Ultrasound Scan",
    startWeek: 10,
    endWeek: 14,
  },
  {
    id: "milestone-2",
    title: "Baby Growth & Development Scan (Anomaly Scan)",
    startWeek: 18,
    endWeek: 22,
  },
  {
    id: "milestone-3",
    title: "Pregnancy Blood Sugar & Diabetes Screening",
    startWeek: 24,
    endWeek: 28,
  },
  {
    id: "milestone-4",
    title: "Late Pregnancy Wellbeing & Presentation Scan",
    startWeek: 32,
    endWeek: 36,
  },
  {
    id: "milestone-5",
    title: "Birth Planning & Final Term Check-up",
    startWeek: 37,
    endWeek: 40,
  }
];

export default function ClinicsView({ reminders, onAddReminder, onToggleStatus, gestationalWeeks = 12, dueDate }: ClinicsViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    notes: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("Please key in appointment title.");
      return;
    }
    if (!formData.date) {
      setError("Please pick a valid check date.");
      return;
    }

    setError("");
    onAddReminder({
      title: formData.title.trim(),
      date: formData.date,
      time: formData.time || "09:00",
      location: "",
      notes: formData.notes.trim(),
      status: "pending",
    });

    // Reset form
    setFormData({
      title: "",
      date: "",
      time: "",
      notes: "",
    });
    setShowAddForm(false);
  };

  const pendingReminders = reminders.filter((r) => r.status === "pending");
  const completedReminders = reminders.filter((r) => r.status === "completed");

  const getMilestoneTimelineLabel = (milestone: Milestone) => {
    if (!dueDate) {
      if (gestationalWeeks >= milestone.startWeek && gestationalWeeks <= milestone.endWeek) {
        return "Next week";
      }
      return `Week ${milestone.startWeek} - ${milestone.endWeek}`;
    }
    
    const dDate = new Date(dueDate);
    if (isNaN(dDate.getTime())) return `Week ${milestone.startWeek} - ${milestone.endWeek}`;

    const msPerDay = 24 * 60 * 60 * 1000;
    const msPerWeek = 7 * msPerDay;
    
    // Calculate targeted weeks based on Week 40 due date
    const week40Ms = dDate.getTime();
    const startDate = new Date(week40Ms - (40 - milestone.startWeek) * msPerWeek);
    const endDate = new Date(week40Ms - (40 - milestone.endWeek) * msPerWeek);
    
    // Sort dates appropriately
    const firstDate = startDate < endDate ? startDate : endDate;
    const secondDate = startDate > endDate ? startDate : endDate;

    const formatOpt = { day: "numeric", month: "short" } as const;
    const startStr = firstDate.toLocaleDateString("en-KE", formatOpt);
    const endStr = secondDate.toLocaleDateString("en-KE", formatOpt);

    if (gestationalWeeks >= milestone.startWeek && gestationalWeeks <= milestone.endWeek) {
      return `${startStr} - ${endStr} (Current stage!)`;
    }
    if (gestationalWeeks < milestone.startWeek && gestationalWeeks >= milestone.startWeek - 2) {
      return `${startStr} - ${endStr} (Next week)`;
    }
    return `${startStr} - ${endStr}`;
  };

  // Filter out milestones that are already strictly in the past
  const activeMilestones = GESTATIONAL_MILESTONES.filter(
    (milestone) => gestationalWeeks <= milestone.endWeek
  );

  const handleQuickAddMilestone = (milestone: Milestone) => {
    let targetDateStr = new Date().toISOString().split("T")[0];
    if (dueDate) {
      const dDate = new Date(dueDate);
      if (!isNaN(dDate.getTime())) {
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        const targetWeek = Math.max(gestationalWeeks, Math.floor((milestone.startWeek + milestone.endWeek) / 2));
        const estimatedTime = dDate.getTime() - (40 - targetWeek) * msPerWeek;
        targetDateStr = new Date(estimatedTime).toISOString().split("T")[0];
      }
    }

    onAddReminder({
      title: milestone.title,
      date: targetDateStr,
      time: "09:00",
      location: "",
      notes: "Remember your pregnancy handbook and health card.",
      status: "pending",
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" id="clinics-view-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Pregnancy Clinic Calendars</h1>
          <p className="text-slate-500 text-sm">Track your pre-natal screens, blood panels, and ultrasound scanning sessions.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          id="btn-add-clinic"
          className="flex items-center space-x-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl self-start sm:self-auto transition shadow-md shadow-emerald-200 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>{showAddForm ? "Close Form" : "Schedule Visit"}</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xl space-y-4" id="add-clinic-form">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2">Schedule Prenatal Schedule</h3>
          {error && (
            <p className="text-xs text-rose-500 font-semibold" id="clinic-form-error">{error}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">APPOINTMENT / VISIT TITLE *</label>
              <input
                type="text"
                placeholder="e.g. 20-Week Baby Growth & Body Scan"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-emerald-400 outline-none transition"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">VISIT DATE *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-emerald-400 outline-none transition"
                required
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-500">MEMO NOTES</label>
              <textarea
                rows={2}
                placeholder="e.g. Bring maternity booklet, stay hydrated."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-emerald-400 outline-none transition resize-none"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Add Schedule
            </button>
          </div>
        </form>
      )}

      {/* Reminders & Recommendations Section */}
      <div className="space-y-6" id="reminders-list-container">
        
        {/* Tailored Gestational Scans & Check-ups */}
        <div className="space-y-3" id="tailored-milestones-block">
          <h2 className="text-sm font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-2">
            <Clock className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Recommended Screenings (Tailored to Week {gestationalWeeks})</span>
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {activeMilestones.map((milestone) => {
              const isAdded = reminders.some(
                (r) => r.title.toLowerCase().includes(milestone.title.toLowerCase())
              );
              
              const isCurrent = gestationalWeeks >= milestone.startWeek && gestationalWeeks <= milestone.endWeek;

              return (
                <div
                  key={milestone.id}
                  className={`bg-white p-5 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    isCurrent ? "border-emerald-500 shadow-md ring-1 ring-emerald-50-percentage" : "border-slate-100"
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCurrent ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                      }`}>
                        {isCurrent ? "Current Check" : "Upcoming"}
                      </span>
                      <span className="text-slate-400 text-xs font-semibold">Weeks {milestone.startWeek} - {milestone.endWeek}</span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-sm">{milestone.title}</h3>
                    
                    <div className="p-3 bg-slate-50/60 border-l-2 border-emerald-500/60 text-slate-600 text-xs rounded-r-lg flex items-center space-x-1.5">
                      <FileText className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="font-medium text-slate-500">Remember your pregnancy handbook and health card.</span>
                    </div>
                  </div>

                  {/* Green date range aligned right at the end */}
                  <div className="flex flex-col sm:items-end justify-between self-start sm:self-auto space-y-2 shrink-0">
                    <span className="text-emerald-600 font-bold text-sm bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-right block">
                      {getMilestoneTimelineLabel(milestone)}
                    </span>
                    
                    {!isAdded && (
                      <button
                        type="button"
                        onClick={() => handleQuickAddMilestone(milestone)}
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center space-x-1 py-1 cursor-pointer hover:underline self-start sm:self-auto"
                      >
                        <span>+ Schedule check</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Scheduled Visits Section (Custom reminders) */}
        <div className="space-y-3 pt-4" id="pending-schedules-block">
          <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>My Scheduled Visits ({pendingReminders.length})</span>
          </h3>

          {pendingReminders.length === 0 ? (
            <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-xl p-8 text-center" id="no-pending-clinics">
              <p className="text-slate-400 text-xs">No upcoming custom visits scheduled. Click "Schedule Visit" to add one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  id={`reminder-${reminder.id}`}
                  className="bg-white p-5 border border-slate-100 hover:shadow-md rounded-2xl flex items-start space-x-4 transition group"
                >
                  <button
                    onClick={() => onToggleStatus(reminder.id)}
                    id={`toggle-reminder-${reminder.id}`}
                    className="p-1 rounded-full hover:bg-emerald-50 shrink-0 transition"
                    title="Mark complete"
                  >
                    <Circle className="h-5 w-5 text-slate-300 hover:text-emerald-500 transition" />
                  </button>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-emerald-600 transition">{reminder.title}</h4>
                      <div className="flex items-center space-x-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full self-start w-auto">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(reminder.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    {reminder.notes && (
                      <div className="p-3 bg-slate-50/60 border-l-2 border-slate-300 text-slate-500 text-xs rounded-r-lg flex items-start space-x-1.5">
                        <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{reminder.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Section */}
        {completedReminders.length > 0 && (
          <div className="space-y-3 pt-4" id="completed-schedules-block">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Completed Logged Visits ({completedReminders.length})</span>
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {completedReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="bg-slate-50/50 p-4 border border-slate-100 opacity-70 rounded-xl flex items-start space-x-4 transition"
                  id={`reminder-${reminder.id}`}
                >
                  <button
                    onClick={() => onToggleStatus(reminder.id)}
                    className="p-1 rounded-full shrink-0 transition text-emerald-500"
                    title="Mark active again"
                  >
                    <CheckCircle className="h-5 w-5 fill-emerald-50" />
                  </button>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-600 text-xs line-through">{reminder.title}</h4>
                      <span className="text-[10px] text-slate-400">
                        Completed on {new Date(reminder.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
