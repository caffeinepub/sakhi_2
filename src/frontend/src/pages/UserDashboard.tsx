import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ClipboardCopy,
  Clock,
  FileText,
  Home,
  Loader2,
  LogOut,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { EmergencyContact } from "../backend.d";
import { FIRStatus, SOSStatus } from "../backend.d";
import AIChatbot from "../components/AIChatbot";
import NotificationBell from "../components/NotificationBell";
import { useLanguage } from "../contexts/LanguageContext";
import { useBrowserNotifications } from "../hooks/useBrowserNotifications";
import { useGeolocation } from "../hooks/useGeolocation";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerProfile,
  useCreateSOSAlert,
  useFileFIR,
  useOwnFIRs,
  useOwnSOSAlerts,
  useSafeZones,
  useSubmitIncident,
  useUpsertProfile,
} from "../hooks/useQueries";

const MOCK_SAFE_ZONES = [
  {
    name: "City Police Station",
    address: "MG Road, Sector 14",
    location: { latitude: 28.63, longitude: 77.22 },
  },
  {
    name: "District Hospital",
    address: "Civil Lines, Near Bus Stand",
    location: { latitude: 28.64, longitude: 77.23 },
  },
  {
    name: "Women's Shelter NGO",
    address: "Gandhi Nagar, Block B",
    location: { latitude: 28.62, longitude: 77.21 },
  },
];

type Tab = "home" | "report" | "zones" | "firs" | "profile";

interface Props {
  onLogout: () => void;
}

function firStatusBadge(s: FIRStatus) {
  if (s === FIRStatus.filed)
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40">
        Filed
      </Badge>
    );
  if (s === FIRStatus.under_investigation)
    return (
      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40">
        Under Investigation
      </Badge>
    );
  return (
    <Badge className="bg-green-500/20 text-green-400 border-green-500/40">
      Closed
    </Badge>
  );
}

interface SOSContactModalProps {
  open: boolean;
  onClose: () => void;
  contacts: EmergencyContact[];
  userName: string;
  lat: number;
  lng: number;
}

function SOSContactModal({
  open,
  onClose,
  contacts,
  userName,
  lat,
  lng,
}: SOSContactModalProps) {
  const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
  const buildMessage = (contactName: string) =>
    `🚨 EMERGENCY ALERT from ${userName || contactName}! I need help. My location: ${mapsUrl} - Please contact me or call police immediately.`;

  const handleCopy = (contactName: string) => {
    navigator.clipboard.writeText(buildMessage(contactName));
    toast.success("Message copied to clipboard!");
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            data-ocid="sos.contacts.modal"
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] lg:max-w-[520px] z-[70] rounded-t-3xl bg-card border-t border-border overflow-hidden"
            style={{
              boxShadow:
                "0 -8px 40px oklch(0.12 0.045 293 / 0.8), 0 -1px 0 oklch(var(--border) / 0.5)",
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="px-5 pb-3 pt-2 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <h2 className="font-display font-bold text-lg text-foreground">
                    Alert Contacts
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  SOS sent! Notify your emergency contacts now.
                </p>
              </div>
              <button
                type="button"
                data-ocid="sos.contacts.close_button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors mt-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* GPS chip */}
            <div className="px-5 pb-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
                <MapPin className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                <p className="text-xs text-green-300 font-mono">
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </p>
              </div>
            </div>

            {/* Contacts */}
            <div className="px-5 pb-6 flex flex-col gap-3 max-h-[55vh] overflow-y-auto">
              {contacts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No emergency contacts saved.
                </div>
              ) : (
                contacts.map((contact, i) => (
                  <div
                    key={contact.name + contact.phone}
                    data-ocid={`sos.contacts.item.${i + 1}`}
                    className="glass-card-rich rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {contact.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {contact.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`sms:${contact.phone}?body=${encodeURIComponent(buildMessage(contact.name))}`}
                        data-ocid={`sos.contacts.send_button.${i + 1}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sos text-white text-sm font-bold transition-opacity hover:opacity-90 active:scale-95"
                        style={{ background: "oklch(var(--sos))" }}
                      >
                        <MessageSquare className="w-4 h-4" />
                        Send SMS
                      </a>
                      <button
                        type="button"
                        data-ocid={`sos.contacts.copy_button.${i + 1}`}
                        onClick={() => handleCopy(contact.name)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ClipboardCopy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                  </div>
                ))
              )}
              <Button
                data-ocid="sos.contacts.done_button"
                variant="outline"
                onClick={onClose}
                className="w-full mt-1 border-border text-muted-foreground hover:text-foreground"
              >
                Done
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function UserDashboard({ onLogout }: Props) {
  const { identity, clear } = useInternetIdentity();
  const { t, lang, toggleLang } = useLanguage();
  const { coords, getLocation } = useGeolocation();
  const { permission, notify } = useBrowserNotifications();
  const [tab, setTab] = useState<Tab>("home");
  const [isSafe, setIsSafe] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [incidentDesc, setIncidentDesc] = useState("");
  const [incidentLocation, setIncidentLocation] = useState("");
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [firOpen, setFirOpen] = useState(false);
  const [firTitle, setFirTitle] = useState("");
  const [firDesc, setFirDesc] = useState("");
  // SOS contact sharing
  const [sosContactsOpen, setSosContactsOpen] = useState(false);
  const [sosCoords, setSosCoords] = useState({ lat: 0, lng: 0 });
  // Profile contact management
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  const { data: alerts, isLoading: alertsLoading } = useOwnSOSAlerts();
  const { data: safeZones, isLoading: zonesLoading } = useSafeZones();
  const { data: profile } = useCallerProfile();
  const { data: firs, isLoading: firsLoading } = useOwnFIRs();
  const createSOS = useCreateSOSAlert();
  const submitIncident = useSubmitIncident();
  const fileFIR = useFileFIR();
  const upsertProfile = useUpsertProfile();

  const zones = safeZones && safeZones.length > 0 ? safeZones : MOCK_SAFE_ZONES;
  const contacts = profile?.contacts ?? [];

  const handleSOS = async () => {
    if (sosActive) return;
    setSosActive(true);
    try {
      const loc = await getLocation();
      await createSOS.mutateAsync({
        lat: loc.latitude,
        lng: loc.longitude,
        desc: "Emergency SOS triggered",
      });
      setSosCoords({ lat: loc.latitude, lng: loc.longitude });
      toast.error("🚨 SOS Alert Sent! Help is on the way.", { duration: 6000 });
      notify(
        "🚨 SOS Sent",
        "Your emergency alert has been dispatched. Help is on the way.",
      );
      // Open contact sharing if contacts exist
      if (contacts.length > 0) {
        setSosContactsOpen(true);
      }
    } catch {
      toast.error("Could not send SOS. Please call 112.");
    } finally {
      setTimeout(() => setSosActive(false), 5000);
    }
  };

  const handleIncidentSubmit = async () => {
    if (!incidentDesc) {
      toast.error("Please describe the incident.");
      return;
    }
    try {
      const loc = await getLocation();
      await submitIncident.mutateAsync({
        lat: loc.latitude,
        lng: loc.longitude,
        desc: incidentDesc,
      });
      toast.success("Incident reported successfully.");
      setIncidentDesc("");
      setIncidentLocation("");
      setIncidentOpen(false);
    } catch {
      toast.error("Failed to submit incident.");
    }
  };

  const handleFIRSubmit = async () => {
    if (!firTitle || !firDesc) {
      toast.error("Please fill in all FIR fields.");
      return;
    }
    try {
      await fileFIR.mutateAsync({
        title: firTitle,
        description: firDesc,
        location: { latitude: 28.6139, longitude: 77.209 },
        linkedSOSId: null,
      });
      toast.success("FIR filed successfully.");
      setFirTitle("");
      setFirDesc("");
      setFirOpen(false);
    } catch {
      toast.error("Failed to file FIR.");
    }
  };

  const handleAddContact = async () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      toast.error("Please enter both name and phone.");
      return;
    }
    const updated: EmergencyContact[] = [
      ...contacts,
      { name: newContactName.trim(), phone: newContactPhone.trim() },
    ];
    try {
      await upsertProfile.mutateAsync({
        name: profile?.name ?? profileName,
        phone: profile?.phone ?? profilePhone,
        contacts: updated,
      });
      toast.success("Contact added!");
      setNewContactName("");
      setNewContactPhone("");
    } catch {
      toast.error("Failed to save contact.");
    }
  };

  const handleRemoveContact = async (idx: number) => {
    const updated = contacts.filter((_, i) => i !== idx);
    try {
      await upsertProfile.mutateAsync({
        name: profile?.name ?? profileName,
        phone: profile?.phone ?? profilePhone,
        contacts: updated,
      });
      toast.success("Contact removed.");
    } catch {
      toast.error("Failed to remove contact.");
    }
  };

  const handleSaveProfile = async () => {
    try {
      await upsertProfile.mutateAsync({
        name: profileName || profile?.name || "",
        phone: profilePhone || profile?.phone || "",
        contacts: contacts,
      });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile.");
    }
  };

  const handleLogout = () => {
    clear();
    onLogout();
  };

  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal ? `${principal.slice(0, 8)}...` : "Unknown";

  const statusBadge = (s: SOSStatus) => {
    if (s === SOSStatus.active)
      return (
        <Badge className="bg-destructive/20 text-red-400 border-destructive/40">
          Active
        </Badge>
      );
    if (s === SOSStatus.responded)
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40">
          Responded
        </Badge>
      );
    return (
      <Badge className="bg-safe/20 text-green-400 border-safe/40">
        Resolved
      </Badge>
    );
  };

  const navItems = [
    { id: "home" as Tab, icon: <Home className="w-5 h-5" />, label: t.home },
    {
      id: "report" as Tab,
      icon: <FileText className="w-5 h-5" />,
      label: t.report,
    },
    {
      id: "firs" as Tab,
      icon: <ShieldCheck className="w-5 h-5" />,
      label: t.firs,
    },
    {
      id: "zones" as Tab,
      icon: <MapPin className="w-5 h-5" />,
      label: t.zones,
    },
    {
      id: "profile" as Tab,
      icon: <User className="w-5 h-5" />,
      label: t.profile,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-64 fixed left-0 top-0 bottom-0 z-40 border-r border-border p-4"
        style={{
          background: "oklch(var(--sidebar))",
          boxShadow: "4px 0 24px oklch(0.1 0.04 293 / 0.5)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-2 pt-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <img
              src="/assets/generated/sakhi-logo-transparent.dim_120x120.png"
              alt="Sakhi"
              className="w-7 h-7 object-contain"
            />
          </div>
          <div>
            <h1 className="font-display font-black text-xl text-foreground leading-none tracking-tight">
              Sakhi
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Safety Companion
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              data-ocid={`user.sidebar.${item.id}.link`}
              onClick={() => setTab(item.id)}
              className={`sidebar-nav-item ${tab === item.id ? "active" : ""}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="flex flex-col gap-2 pb-4">
          <div className="flex items-center gap-2 px-3 mb-1">
            <button
              type="button"
              data-ocid="user.sidebar.lang.toggle"
              onClick={toggleLang}
              className="px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              {lang === "en" ? "हि" : "EN"}
            </button>
            <NotificationBell />
          </div>
          <button
            type="button"
            data-ocid="user.sidebar.logout.button"
            onClick={handleLogout}
            className="sidebar-nav-item text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
            {t.signOut}
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────── */}
      <div className="flex-1 lg:ml-64 mobile-container bg-background flex flex-col pb-20 lg:pb-10">
        {/* Header (mobile) */}
        <header className="flex items-center justify-between px-5 pt-12 pb-4 lg:pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center lg:hidden">
              <img
                src="/assets/generated/sakhi-logo-transparent.dim_120x120.png"
                alt="Sakhi"
                className="w-7 h-7 object-contain"
              />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-foreground leading-none">
                <span className="lg:hidden">Sakhi</span>
                <span className="hidden lg:inline">
                  {tab === "home" && "Dashboard"}
                  {tab === "report" && "Report Incident"}
                  {tab === "firs" && "FIR Management"}
                  {tab === "zones" && "Safe Zones"}
                  {tab === "profile" && "My Profile"}
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">
                {profile?.name
                  ? `${t.hello}, ${profile.name}`
                  : `${t.hello}, ${shortPrincipal}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              data-ocid="user.lang.toggle"
              onClick={toggleLang}
              className="px-2 py-1 rounded-full bg-secondary border border-border text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              {lang === "en" ? "हि" : "EN"}
            </button>
            <NotificationBell />
            <button
              type="button"
              data-ocid="user.profile.button"
              onClick={() => setTab("profile")}
              className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
          {/* Desktop header right */}
          <div className="hidden lg:flex items-center gap-3">
            <NotificationBell />
            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 lg:px-8">
          <AnimatePresence mode="wait">
            {tab === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-5"
              >
                {/* Notification permission banner */}
                {permission === "default" && (
                  <div className="flex items-center justify-between gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      <p className="text-xs text-yellow-300">
                        Enable alerts to get status updates
                      </p>
                    </div>
                    <button
                      type="button"
                      data-ocid="user.notifications.toggle"
                      onClick={() =>
                        Notification.requestPermission().then((p) => {
                          if (p === "granted")
                            toast.success("Notifications enabled!");
                        })
                      }
                      className="text-xs font-semibold text-yellow-400 hover:text-yellow-300 transition-colors whitespace-nowrap"
                    >
                      Enable
                    </button>
                  </div>
                )}

                {/* SOS Section */}
                <div
                  className="flex flex-col items-center py-8 gap-6 lg:py-14 rounded-3xl relative overflow-hidden"
                  style={{
                    background:
                      "radial-gradient(ellipse 80% 80% at 50% 110%, oklch(var(--sos) / 0.12), transparent), oklch(var(--card) / 0.4)",
                    border: "1px solid oklch(var(--border) / 0.4)",
                  }}
                >
                  {/* Subtle top glow */}
                  <div
                    className="absolute inset-x-0 -top-px h-px"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, oklch(var(--primary) / 0.5), transparent)",
                    }}
                  />
                  <p className="text-muted-foreground text-sm">{t.sosHint}</p>
                  <button
                    type="button"
                    data-ocid="user.sos.primary_button"
                    onClick={handleSOS}
                    disabled={createSOS.isPending}
                    className={`w-44 h-44 lg:w-52 lg:h-52 rounded-full flex flex-col items-center justify-center gap-2 font-display font-black text-2xl text-white transition-transform active:scale-95 ${
                      sosActive ? "bg-red-700" : "bg-sos"
                    } shadow-glow-sos sos-pulse`}
                    style={{ background: "oklch(var(--sos))" }}
                  >
                    {createSOS.isPending ? (
                      <Loader2 className="w-12 h-12 animate-spin" />
                    ) : (
                      <>
                        <AlertTriangle className="w-12 h-12" />
                        <span className="text-xl tracking-widest">{t.sos}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    data-ocid="user.safe.toggle"
                    onClick={() => setIsSafe(!isSafe)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all font-semibold text-sm ${
                      isSafe
                        ? "bg-safe/20 border-safe/40 text-green-400"
                        : "bg-secondary border-border text-muted-foreground"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isSafe ? t.iamSafe : t.markSafe}
                  </button>

                  {/* GPS status chip */}
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      coords
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    {coords ? "GPS Active" : "Location unavailable"}
                  </div>

                  {/* Contact sharing hint */}
                  {contacts.length > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <p className="text-xs text-primary/80">
                        {contacts.length} emergency contact
                        {contacts.length > 1 ? "s" : ""} will be notified
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Dialog open={incidentOpen} onOpenChange={setIncidentOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        data-ocid="user.report.open_modal_button"
                        className="glass-card-rich rounded-2xl p-4 flex flex-col items-start gap-2 text-left hover:border-primary/50 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-semibold text-sm text-foreground">
                          {t.reportIncident}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          File a safety report
                        </span>
                      </button>
                    </DialogTrigger>
                    <DialogContent
                      data-ocid="user.report.dialog"
                      className="bg-card border-border mx-4 rounded-2xl"
                    >
                      <DialogHeader>
                        <DialogTitle className="font-display">
                          Report an Incident
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 mt-2">
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Description *
                          </Label>
                          <Textarea
                            data-ocid="user.report.textarea"
                            value={incidentDesc}
                            onChange={(e) => setIncidentDesc(e.target.value)}
                            placeholder="Describe what happened..."
                            className="mt-1 bg-input border-border resize-none"
                            rows={4}
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Location
                          </Label>
                          <Input
                            data-ocid="user.report.location.input"
                            value={incidentLocation}
                            onChange={(e) =>
                              setIncidentLocation(e.target.value)
                            }
                            placeholder="e.g. MG Road, Near Bus Stop"
                            className="mt-1 bg-input border-border"
                          />
                        </div>
                        <Button
                          data-ocid="user.report.submit_button"
                          onClick={handleIncidentSubmit}
                          disabled={submitIncident.isPending}
                          className="w-full bg-primary"
                        >
                          {submitIncident.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          Submit Report
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <button
                    type="button"
                    data-ocid="user.zones.secondary_button"
                    onClick={() => setTab("zones")}
                    className="glass-card-rich rounded-2xl p-4 flex flex-col items-start gap-2 text-left hover:border-primary/50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-sm text-foreground">
                      {t.safeZones}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Nearby safe places
                    </span>
                  </button>
                </div>

                {/* Alert history */}
                <div>
                  <h2 className="font-display font-bold text-base mb-3 text-foreground">
                    {t.myAlerts}
                  </h2>
                  {alertsLoading ? (
                    <div
                      data-ocid="user.alerts.loading_state"
                      className="flex flex-col gap-2"
                    >
                      {[1, 2].map((n) => (
                        <Skeleton
                          key={n}
                          className="h-16 rounded-xl bg-muted"
                        />
                      ))}
                    </div>
                  ) : !alerts || alerts.length === 0 ? (
                    <div
                      data-ocid="user.alerts.empty_state"
                      className="glass-card rounded-2xl p-5 text-center"
                    >
                      <ShieldCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">
                        {t.noAlerts}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {alerts.map((alert, i) => (
                        <div
                          key={String(alert.timestamp)}
                          data-ocid={`user.alerts.item.${i + 1}`}
                          className="glass-card rounded-xl p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {alert.description || "SOS Alert"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(
                                  Number(alert.timestamp) / 1_000_000,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {statusBadge(alert.status)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {tab === "zones" && (
              <motion.div
                key="zones"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="font-display font-bold text-xl mb-4 text-foreground">
                  {t.safeZones}
                </h2>
                {zonesLoading ? (
                  <div
                    data-ocid="user.zones.loading_state"
                    className="flex flex-col gap-3"
                  >
                    {[1, 2, 3].map((n) => (
                      <Skeleton key={n} className="h-20 rounded-2xl bg-muted" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
                    {zones.map((zone, i) => (
                      <div
                        key={zone.name}
                        data-ocid={`user.zones.item.${i + 1}`}
                        className="glass-card-rich rounded-2xl p-4 flex items-start gap-4"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">
                            {zone.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {zone.address}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {zone.location.latitude.toFixed(4)},{" "}
                            {zone.location.longitude.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {tab === "report" && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="font-display font-bold text-xl mb-4 text-foreground">
                  {t.reportIncident}
                </h2>
                <div className="glass-card-rich rounded-2xl p-5 flex flex-col gap-4 lg:max-w-xl">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Incident Description *
                    </Label>
                    <Textarea
                      data-ocid="user.report2.textarea"
                      value={incidentDesc}
                      onChange={(e) => setIncidentDesc(e.target.value)}
                      placeholder="Describe what happened in detail..."
                      className="mt-2 bg-input border-border resize-none"
                      rows={5}
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Location
                    </Label>
                    <Input
                      data-ocid="user.report2.location.input"
                      value={incidentLocation}
                      onChange={(e) => setIncidentLocation(e.target.value)}
                      placeholder="Where did this happen?"
                      className="mt-2 bg-input border-border"
                    />
                  </div>
                  <Button
                    data-ocid="user.report2.submit_button"
                    onClick={handleIncidentSubmit}
                    disabled={submitIncident.isPending}
                    className="w-full bg-primary h-12 text-base"
                  >
                    {submitIncident.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Submit Report
                  </Button>
                </div>
              </motion.div>
            )}

            {tab === "firs" && (
              <motion.div
                key="firs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-xl text-foreground">
                    {t.firs}
                  </h2>
                  <Dialog open={firOpen} onOpenChange={setFirOpen}>
                    <DialogTrigger asChild>
                      <Button
                        data-ocid="user.fir.open_modal_button"
                        size="sm"
                        className="bg-primary"
                      >
                        File New FIR
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border mx-4 rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="font-display">
                          File a New FIR
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 mt-2">
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Title *
                          </Label>
                          <Input
                            data-ocid="user.fir.title.input"
                            value={firTitle}
                            onChange={(e) => setFirTitle(e.target.value)}
                            placeholder="Brief title of the incident"
                            className="mt-1 bg-input border-border"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Description *
                          </Label>
                          <Textarea
                            data-ocid="user.fir.desc.textarea"
                            value={firDesc}
                            onChange={(e) => setFirDesc(e.target.value)}
                            placeholder="Detailed description of the incident..."
                            className="mt-1 bg-input border-border resize-none"
                            rows={4}
                          />
                        </div>
                        <Button
                          data-ocid="user.fir.submit_button"
                          onClick={handleFIRSubmit}
                          disabled={fileFIR.isPending}
                          className="w-full bg-primary"
                        >
                          {fileFIR.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          Submit FIR
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {firsLoading ? (
                  <div className="flex flex-col gap-2">
                    {[1, 2].map((n) => (
                      <Skeleton key={n} className="h-24 rounded-2xl bg-muted" />
                    ))}
                  </div>
                ) : !firs || firs.length === 0 ? (
                  <div className="glass-card rounded-2xl p-6 text-center">
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">
                      No FIRs filed yet.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
                    {firs.map((fir) => (
                      <div
                        key={String(fir.id)}
                        className="glass-card-rich rounded-2xl p-4 flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              {fir.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {fir.description}
                            </p>
                          </div>
                          {firStatusBadge(fir.status)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              Number(fir.timestamp) / 1_000_000,
                            ).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            · FIR #{Number(fir.id)}
                          </span>
                        </div>
                        {fir.officerNotes && (
                          <p className="text-xs text-primary mt-1">
                            Officer Notes: {fir.officerNotes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {tab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-5 lg:max-w-xl"
              >
                <h2 className="font-display font-bold text-xl text-foreground">
                  {t.profile}
                </h2>

                {/* Profile Info */}
                <div className="glass-card-rich rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <User className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        {profile?.name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {shortPrincipal}
                      </p>
                      {profile?.phone && (
                        <p className="text-xs text-muted-foreground">
                          {profile.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Display Name
                      </Label>
                      <Input
                        data-ocid="user.profile.name.input"
                        defaultValue={profile?.name ?? ""}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Your name"
                        className="mt-1 bg-input border-border"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Phone Number
                      </Label>
                      <Input
                        data-ocid="user.profile.phone.input"
                        defaultValue={profile?.phone ?? ""}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        className="mt-1 bg-input border-border"
                      />
                    </div>
                    <Button
                      data-ocid="user.profile.save_button"
                      onClick={handleSaveProfile}
                      disabled={upsertProfile.isPending}
                      className="bg-primary"
                    >
                      {upsertProfile.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Save Profile
                    </Button>
                  </div>
                </div>

                {/* Emergency Contacts */}
                <div className="glass-card-rich rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-bold text-base text-foreground">
                      Emergency Contacts
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground -mt-2">
                    These contacts will be alerted with your GPS location when
                    you trigger SOS.
                  </p>

                  {/* Existing contacts */}
                  {contacts.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {contacts.map((c, i) => (
                        <div
                          key={c.name + c.phone}
                          data-ocid={`user.contacts.item.${i + 1}`}
                          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-secondary/50 border border-border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {c.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {c.phone}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            data-ocid={`user.contacts.delete_button.${i + 1}`}
                            onClick={() => handleRemoveContact(i)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      data-ocid="user.contacts.empty_state"
                      className="text-center py-4 text-muted-foreground text-sm"
                    >
                      No emergency contacts added yet.
                    </div>
                  )}

                  {/* Add new contact form */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Add Contact
                    </p>
                    <div className="flex flex-col gap-2">
                      <Input
                        data-ocid="user.contacts.name.input"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        placeholder="Contact name"
                        className="bg-input border-border"
                      />
                      <Input
                        data-ocid="user.contacts.phone.input"
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        placeholder="Phone number (e.g. +91 98765 43210)"
                        className="bg-input border-border"
                        type="tel"
                      />
                    </div>
                    <Button
                      data-ocid="user.contacts.add_button"
                      onClick={handleAddContact}
                      disabled={upsertProfile.isPending}
                      variant="outline"
                      className="w-full border-primary/40 text-primary hover:bg-primary/10"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Emergency Contact
                    </Button>
                  </div>
                </div>

                <Button
                  data-ocid="user.logout.button"
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t.signOut}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* AI Chatbot */}
        <AIChatbot />

        {/* Bottom Nav — mobile only */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/90 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 py-3 z-50 lg:hidden">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              data-ocid={`user.nav.${item.id}.link`}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
                tab === item.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* SOS Contact Sharing Modal */}
      <SOSContactModal
        open={sosContactsOpen}
        onClose={() => setSosContactsOpen(false)}
        contacts={contacts}
        userName={profile?.name ?? ""}
        lat={sosCoords.lat}
        lng={sosCoords.lng}
      />
    </div>
  );
}
