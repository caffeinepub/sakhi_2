import { createContext, useCallback, useContext, useState } from "react";

export type Lang = "en" | "hi";

const translations = {
  en: {
    sos: "SOS",
    sosHint: "Press & hold in case of emergency",
    iamSafe: "I'm Safe",
    markSafe: "Mark as Safe",
    reportIncident: "Report Incident",
    safeZones: "Safe Zones",
    myAlerts: "My Alerts",
    noAlerts: "No alerts sent. Stay safe!",
    profile: "Profile",
    home: "Home",
    report: "Report",
    firs: "FIRs",
    zones: "Zones",
    signOut: "Sign Out",
    hello: "Hello",
    activeAlerts: "Active Alerts",
    incidentReports: "Incident Reports",
    totalUsers: "Total Users",
    overview: "Overview",
    users: "Users",
    settings: "Settings",
    heatmap: "Heatmap",
    alerts: "Alerts",
    incidents: "Incidents",
  },
  hi: {
    sos: "आपातकाल",
    sosHint: "आपातकाल में दबाएं",
    iamSafe: "मैं सुरक्षित हूँ",
    markSafe: "सुरक्षित चिह्नित करें",
    reportIncident: "घटना रिपोर्ट करें",
    safeZones: "सुरक्षित क्षेत्र",
    myAlerts: "मेरी अलर्ट",
    noAlerts: "कोई अलर्ट नहीं। सुरक्षित रहें!",
    profile: "प्रोफाइल",
    home: "होम",
    report: "रिपोर्ट",
    firs: "एफआईआर",
    zones: "क्षेत्र",
    signOut: "साइन आउट",
    hello: "नमस्ते",
    activeAlerts: "सक्रिय अलर्ट",
    incidentReports: "घटना रिपोर्ट",
    totalUsers: "कुल उपयोगकर्ता",
    overview: "अवलोकन",
    users: "उपयोगकर्ता",
    settings: "सेटिंग",
    heatmap: "हीटमैप",
    alerts: "अलर्ट",
    incidents: "घटनाएं",
  },
};

export type Translations = (typeof translations)["en"];

interface LanguageContextValue {
  lang: Lang;
  t: Translations;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  t: translations.en,
  toggleLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const stored = (localStorage.getItem("sakhi-lang") as Lang) || "en";
  const [lang, setLang] = useState<Lang>(stored);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === "en" ? "hi" : "en";
      localStorage.setItem("sakhi-lang", next);
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider
      value={{ lang, t: translations[lang], toggleLang }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
