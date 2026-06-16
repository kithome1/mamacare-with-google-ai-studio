import { Biodata } from "../types";
import { Heart, Sparkles, Calendar, Baby, ArrowRight, Activity, Smile } from "lucide-react";

interface DashboardViewProps {
  biodata: Biodata;
  onNavigate: (tab: string) => void;
}

const BABY_SIZES = [
  { minWeeks: 1, maxWeeks: 4, fruit: "Poppy Seed", size: "1 mm", weight: "< 1g", desc: "The blastocyst is implanting into the uterine wall. Tiny but carrying incredible potential!", highlight: "Cell division and nervous system foundations begin." },
  { minWeeks: 5, maxWeeks: 8, fruit: "Raspberry", size: "1.6 cm", weight: "1 g", desc: "Baby's heart is now beating steadily! Tiny limb buds are sprouting to eventually become hands and feet.", highlight: "Brain cavities form and heartbeat becomes trackable on ultrasound." },
  { minWeeks: 9, maxWeeks: 12, fruit: "Lime", size: "5.4 cm", weight: "14 g", desc: "Baby's reflexes are starting—they can wiggle toes and open fingers! Muscle skeletal networks are joining.", highlight: "Main bodily systems are completely formed; baby begins moving." },
  { minWeeks: 13, maxWeeks: 16, fruit: "Avocado", size: "11.6 cm", weight: "100 g", desc: "A soft, fine hair called lanugo covers baby's shoulders. The skin is translucent and joints start rotating.", highlight: "Eyes can move slowly, and ears are near their final position." },
  { minWeeks: 17, maxWeeks: 20, fruit: "Banana", size: "25.6 cm", weight: "300 g", desc: "The sensory senses are developing rapidly. Your baby can now hear external sounds like your heartbeat and voice!", highlight: "Vernix caseosa is protecting baby's skin. Hand grasp strength rises." },
  { minWeeks: 21, maxWeeks: 24, fruit: "Cantaloupe", size: "30 cm", weight: "600 g", desc: "Your baby's lungs are forming surfactant, helping them prepare for breathing outside the womb. Fingerprints are set.", highlight: "Eyes can open; sleep cycles are becoming regular." },
  { minWeeks: 25, maxWeeks: 28, fruit: "Eggplant", size: "37.6 cm", weight: "1 kg", desc: "Baby's eyes can open and close. Lungs are viable as they start practicing rhythm-like expansion movements.", highlight: "Brain wave activity shows true processing sleep states." },
  { minWeeks: 29, maxWeeks: 32, fruit: "Squash", size: "42.4 cm", weight: "1.7 kg", desc: "Baby's bones are hardened, though skull remains soft and flexible to prepare for delivery route clearances.", highlight: "Accumulating fat layers under the skin to regulate body temperature." },
  { minWeeks: 33, maxWeeks: 36, fruit: "Papaya", size: "47.4 cm", weight: "2.6 kg", desc: "Lungs have neared complete maturation. Baby is turning head-down into a secure cephalic position.", highlight: "Fine hair (lanugo) is shed; baby begins storing critical vitamins." },
  { minWeeks: 37, maxWeeks: 42, fruit: "Pumpkin", size: "51.2 cm", weight: "3.5 kg", desc: "Your baby is fully term and excited to make her grand entry. All critical systems are robust and complete!", highlight: "Congratulations on reaching full term! Your baby is ready to meet you." },
];

const PREGNANCY_TIPS = [
  "Stay properly hydrated! Drinking at least 8-10 glasses of water is crucial for amniotic fluid density.",
  "Sleep primarily on your left side to boost rich blood flows and oxygen delivery to the placenta.",
  "Folic acid and iron are critical building blocks right now. Keep your nutrient intake steady and colorful.",
  "Never self-medicate for back pain or muscle pulls without confirming first with your direct prenatal clinic operator.",
  "Perform daily gentle stretches. Loose ligaments during second trimester are natural adaptations.",
];

export default function DashboardView({ biodata, onNavigate }: DashboardViewProps) {
  // Safe math calculation
  const getBabyGrowthInfo = (weeks: number) => {
    return BABY_SIZES.find(b => weeks >= b.minWeeks && weeks <= b.maxWeeks) || BABY_SIZES[9];
  };

  const getDaysRemainingCount = (dueDateStr: string): number | null => {
    if (!dueDateStr) return null;
    const dueTime = new Date(dueDateStr).getTime();
    const nowTime = new Date().getTime();
    const diffTime = dueTime - nowTime;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const currentWeeks = biodata.isRegistered ? biodata.gestationalWeeks : 12;
  const growthInfo = getBabyGrowthInfo(currentWeeks);
  const daysRemaining = biodata.isRegistered ? getDaysRemainingCount(biodata.dueDate) : 196;
  const progressPercent = Math.min(100, Math.round((currentWeeks / 40) * 100));

  return (
    <div className="space-y-6" id="dashboard-view-wrapper">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100/50 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center md:justify-between gap-6" id="welcome-banner">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-rose-100/60 rounded-full text-xs text-rose-600 font-semibold" id="header-accent-badge">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>MamaCare Pregnancy Compass</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Hi, {biodata.isRegistered ? biodata.fullName.split(" ")[0] : "loving Mother"}!
          </h1>
          <p className="text-slate-600 text-sm max-w-lg leading-relaxed">
            Welcome to your personal digital prenatal dashboard. We are here to keep your journey safe, informed, and beautifully supported.
          </p>
          {daysRemaining !== null && (
            <div className="pt-2 flex items-center justify-center md:justify-start space-x-2 text-emerald-600 font-semibold text-sm" id="delivery-countdown-badge">
              <Calendar className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{daysRemaining} days remaining till your estimated delivery!</span>
            </div>
          )}
        </div>

        {/* Big Gestational Week Metric */}
        <div className="bg-white border border-rose-100 shadow-lg rounded-2xl p-5 px-8 text-center shrink-0 min-w-[160px]" id="week-counter-circle">
          <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">PREGNANCY</span>
          <span className="text-5xl font-extrabold text-rose-500 my-1 block">{currentWeeks}</span>
          <span className="text-xs text-slate-500 font-medium block">Weeks Gestation</span>
        </div>
      </div>

      {/* Pregnancy progress timeline */}
      <div className="bg-white p-6 border border-slate-100 shadow-md rounded-2xl space-y-3" id="progress-card">
        <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
          <span>WEEK 1 (CONCEPTION)</span>
          <span className="text-rose-500">WEEK {currentWeeks} ({progressPercent}% DELIVERED)</span>
          <span>WEEK 40 (FULL TERM)</span>
        </div>
        <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden" id="progress-bar-track">
          <div 
            className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
            id="progress-bar-fill"
          />
        </div>
        <p className="text-xs text-slate-500 text-center">
          {currentWeeks <= 13 ? "You are currently in your 1st Trimester. Focus on healthy resting and folate rich foods." :
           currentWeeks <= 26 ? "You are currently in your 2nd Trimester. Energy typically rises; enjoy safe light walks!" :
           "You are in your 3rd Trimester. Baby is maturing quickly; finalize nursery plans and track kick rates."
          }
        </p>
      </div>

      {/* Two-Column Bento Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="bento-grid-dashboard">
        
        {/* Left Fetus Development Column */}
        <div className="md:col-span-7 bg-white p-6 border border-slate-100 shadow-md rounded-2xl space-y-4" id="baby-size-card">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-50">
            <Baby className="h-5 w-5 text-rose-500" />
            <h3 className="text-lg font-bold text-slate-800">Your Fetus Development</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-rose-50/30 border border-rose-100/50 rounded-2xl">
            {/* Visual fruit tag */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-rose-100/80 to-pink-100/80 hover:scale-105 transition flex flex-col items-center justify-center border border-rose-200 shrink-0 shadow-inner">
              <span className="text-2xl block">🍒</span>
              <span className="text-xs font-bold text-rose-600 mt-1 block">Size of a</span>
              <span className="text-xs font-extrabold text-rose-700 block uppercase text-center truncate w-full px-1">{growthInfo.fruit}</span>
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-extrabold text-slate-800 text-base">Development Highlights</h4>
              <p className="text-slate-500 text-xs italic">Estimated Height: {growthInfo.size}  |  Weight: {growthInfo.weight}</p>
              <p className="text-slate-600 text-sm pt-2 leading-relaxed">{growthInfo.desc}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <div className="flex items-center space-x-1 text-xs text-rose-500 font-bold uppercase tracking-wide">
              <Activity className="h-3.5 w-3.5" />
              <span>Gestation Milestone</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">{growthInfo.highlight}</p>
          </div>
        </div>

        {/* Right Quick Actions / Tips Column */}
        <div className="md:col-span-5 flex flex-col gap-6" id="dashboard-right-column">
          
          {/* Quick interactive links */}
          <div className="bg-white p-6 border border-slate-100 shadow-md rounded-2xl space-y-3 flex-1" id="quick-link-cards">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Maternal Toolkit</h3>
            
            <div className="space-y-2">
              <button 
                onClick={() => onNavigate("registration")}
                id="dashboard-goto-biodata"
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-xl flex items-center justify-between text-left transition group"
              >
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">Update Pregnancy Biodata</h4>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {biodata.isRegistered ? "Edit your prenatal parameters" : "Complete bio information to generate profiles"}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-rose-500 group-hover:translate-x-1 transition" />
              </button>

              <button 
                onClick={() => onNavigate("clinics")}
                id="dashboard-goto-clinics"
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-xl flex items-center justify-between text-left transition group"
              >
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">Pregnancy Clinic Reminders</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Schedule the next ultrasound or maternal screen</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-rose-500 group-hover:translate-x-1 transition" />
              </button>

              <button 
                onClick={() => onNavigate("symptoms")}
                id="dashboard-goto-symptoms"
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-xl flex items-center justify-between text-left transition group"
              >
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">Symptom Tracker & Advice</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Track bodily discomfort and generate advisory metrics</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-rose-500 group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>

          {/* Random tip card */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 relative overflow-hidden shrink-0 shadow-lg" id="tips-banner">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-6 translate-x-6" />
            <div className="space-y-2 relative z-10">
              <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-white/15 rounded-full text-[10px] uppercase font-bold tracking-wider inline-block text-indigo-200">
                <Smile className="h-3 w-3" />
                <span>Today's Comfort Tip</span>
              </div>
              <p className="text-sm font-medium leading-relaxed italic text-indigo-100 pt-1">
                "{PREGNANCY_TIPS[currentWeeks % PREGNANCY_TIPS.length]}"
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
