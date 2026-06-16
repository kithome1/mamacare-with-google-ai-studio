export interface Biodata {
  fullName: string;
  age: string;
  dueDate: string;
  gestationalWeeks: number;
  bloodGroup: string;
  emergencyContact: string;
  isRegistered: boolean;
  registeredAt?: string;
}

export interface ClinicReminder {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  notes: string;
  status: "pending" | "completed";
}

export interface SymptomLog {
  id: string;
  symptom: string;
  additionalNotes: string;
  loggedAt: string;
  weeksAtLog: number;
  aiAdviceText?: string;
  severity?: string;
  loadingAdvice?: boolean;
}
