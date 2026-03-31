import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  Clock,
  FileText,
  Loader2,
  LogOut,
  Map as MapIcon,
  MapPin,
  Shield,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FIRStatus, SOSStatus } from "../backend.d";
import type { FIR } from "../backend.d";
import CrimeHeatmap from "../components/CrimeHeatmap";
import NotificationBell from "../components/NotificationBell";
import { useLanguage } from "../contexts/LanguageContext";
import { useBrowserNotifications } from "../hooks/useBrowserNotifications";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAllActiveAlerts,
  useAllFIRs,
  useAllIncidents,
  useUpdateFIRStatus,
  useUpdateSOSStatus,
} from "../hooks/useQueries";

type Tab = "alerts" | "incidents" | "heatmap" | "firs" | "profile";

interface Props {
  onLogout: () => void;
}

const MOCK_ALERTS = [
  {
    id: BigInt(1),
    status: SOSStatus.active,
    description: "Emergency near market area",
    user: "abc...xyz",
    location: { latitude: 28.63, longitude: 77.22 },
    timestamp: BigInt(Date.now() * 1_000_000),
  },
  {
    id: BigInt(2),
    status: SOSStatus.responded,
    description: "Suspicious activity near park",
    user: "def...uvw",
    location: { latitude: 28.64, longitude: 77.23 },
    timestamp: BigInt((Date.now() - 3600000) * 1_000_000),
  },
];

const MOCK_INCIDENTS = [
  {
    description: "Harassment reported on bus",
    user: "ghi...rst",
    location: { latitude: 28.62, longitude: 77.21 },
    timestamp: BigInt(Date.now() * 1_000_000),
  },
  {
    description: "Theft at metro station",
    user: "jkl...opq",
    location: { latitude: 28.65, longitude: 77.24 },
    timestamp: BigInt((Date.now() - 7200000) * 1_000_000),
  },
];

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
        Investigating
      </Badge>
    );
  return (
    <Badge className="bg-green-500/20 text-green-400 border-green-500/40">
      Closed
    </Badge>
  );
}

export default function PoliceDashboard({ onLogout }: Props) {
  const { clear } = useInternetIdentity();
  const { t, lang, toggleLang } = useLanguage();
  const { permission, notify } = useBrowserNotifications();
  const [tab, setTab] = useState<Tab>("alerts");
  const [selectedFIR, setSelectedFIR] = useState<FIR | null>(null);
  const [firDialogOpen, setFirDialogOpen] = useState(false);
  const [firStatus, setFirStatus] = useState<FIRStatus>(FIRStatus.filed);
  const [officerNotes, setOfficerNotes] = useState("");
  const prevAlertCount = useRef<number | null>(null);

  const { data: rawAlerts, isLoading: alertsLoading } = useAllActiveAlerts();
  const { data: rawIncidents, isLoading: incidentsLoading } = useAllIncidents();
  const { data: allFIRs, isLoading: firsLoading } = useAllFIRs();
  const updateStatus = useUpdateSOSStatus();
  const updateFIR = useUpdateFIRStatus();

  const alerts = rawAlerts && rawAlerts.length > 0 ? rawAlerts : MOCK_ALERTS;
  const incidents =
    rawIncidents && rawIncidents.length > 0 ? rawIncidents : MOCK_INCIDENTS;

  // Detect new alerts from polling
  useEffect(() => {
    if (!rawAlerts) return;
    const count = rawAlerts.length;
    if (prevAlertCount.current !== null && count > prevAlertCount.current) {
      notify("🚨 New SOS Alert", "A new emergency SOS has been triggered.");
    }
    prevAlertCount.current = count;
  }, [rawAlerts, notify]);

  const handleStatusUpdate = async (id: bigint, status: SOSStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success("Alert status updated.");
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const openFIRDialog = (fir: FIR) => {
    setSelectedFIR(fir);
    setFirStatus(fir.status);
    setOfficerNotes(fir.officerNotes ?? "");
    setFirDialogOpen(true);
  };

  const handleFIRUpdate = async () => {
    if (!selectedFIR) return;
    try {
      await updateFIR.mutateAsync({
        id: selectedFIR.id,
        status: firStatus,
        officerNotes: officerNotes || null,
      });
      toast.success("FIR updated.");
      setFirDialogOpen(false);
    } catch {
      toast.error("Failed to update FIR.");
    }
  };

  const handleLogout = () => {
    clear();
    onLogout();
  };

  const alertBadge = (s: SOSStatus) => {
    if (s === SOSStatus.active)
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          Active
        </Badge>
      );
    if (s === SOSStatus.responded)
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          Responded
        </Badge>
      );
    return (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
        Resolved
      </Badge>
    );
  };

  return (
    <div className="mobile-container bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground leading-none">
              Police Dashboard
            </h1>
            <p className="text-xs text-muted-foreground">
              Sakhi Safety Network
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            Live
          </span>
          <button
            type="button"
            data-ocid="police.lang.toggle"
            onClick={toggleLang}
            className="px-2 py-1 rounded-full bg-secondary border border-border text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            {lang === "en" ? "हि" : "EN"}
          </button>
          <NotificationBell />
        </div>
      </header>

      <main className="flex-1 px-4">
        <AnimatePresence mode="wait">
          {tab === "alerts" && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
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
                    data-ocid="police.notifications.toggle"
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

              <h2 className="font-display font-bold text-base text-foreground">
                {t.activeAlerts}
              </h2>
              {alertsLoading ? (
                <div
                  data-ocid="police.alerts.loading_state"
                  className="flex flex-col gap-2"
                >
                  {[1, 2, 3].map((n) => (
                    <Skeleton key={n} className="h-24 rounded-2xl bg-muted" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {alerts.map((alert, i) => (
                    <div
                      key={String(alert.timestamp)}
                      data-ocid={`police.alerts.item.${i + 1}`}
                      className="glass-card rounded-2xl p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-foreground">
                            {alert.description || "SOS Alert"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(
                                Number(alert.timestamp) / 1_000_000,
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {alert.location.latitude.toFixed(3)},{" "}
                              {alert.location.longitude.toFixed(3)}
                            </span>
                          </div>
                        </div>
                        {alertBadge(alert.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          defaultValue={alert.status}
                          onValueChange={(v) =>
                            handleStatusUpdate(
                              (alert as any).id ?? BigInt(i),
                              v as SOSStatus,
                            )
                          }
                        >
                          <SelectTrigger
                            data-ocid={`police.alerts.select.${i + 1}`}
                            className="h-8 text-xs bg-secondary border-border flex-1"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value={SOSStatus.active}>
                              Active
                            </SelectItem>
                            <SelectItem value={SOSStatus.responded}>
                              Responded
                            </SelectItem>
                            <SelectItem value={SOSStatus.resolved}>
                              Resolved
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          data-ocid={`police.alerts.save_button.${i + 1}`}
                          size="sm"
                          className="h-8 text-xs bg-primary"
                          disabled={updateStatus.isPending}
                          onClick={() =>
                            handleStatusUpdate(
                              (alert as any).id ?? BigInt(i),
                              SOSStatus.responded,
                            )
                          }
                        >
                          {updateStatus.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Respond"
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === "incidents" && (
            <motion.div
              key="incidents"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              <h2 className="font-display font-bold text-base text-foreground">
                {t.incidentReports}
              </h2>
              {incidentsLoading ? (
                <div
                  data-ocid="police.incidents.loading_state"
                  className="flex flex-col gap-2"
                >
                  {[1, 2].map((n) => (
                    <Skeleton key={n} className="h-20 rounded-2xl bg-muted" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {incidents.map((inc, i) => (
                    <div
                      key={inc.description}
                      data-ocid={`police.incidents.item.${i + 1}`}
                      className="glass-card rounded-2xl p-4"
                    >
                      <p className="font-semibold text-sm text-foreground">
                        {inc.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(
                            Number(inc.timestamp) / 1_000_000,
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {inc.location.latitude.toFixed(3)},{" "}
                          {inc.location.longitude.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === "heatmap" && (
            <motion.div
              key="heatmap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <CrimeHeatmap />
            </motion.div>
          )}

          {tab === "firs" && (
            <motion.div
              key="firs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              <h2 className="font-display font-bold text-base text-foreground">
                FIR Management
              </h2>
              {firsLoading ? (
                <div className="flex flex-col gap-2">
                  {[1, 2].map((n) => (
                    <Skeleton key={n} className="h-24 rounded-2xl bg-muted" />
                  ))}
                </div>
              ) : !allFIRs || allFIRs.length === 0 ? (
                <div className="glass-card rounded-2xl p-6 text-center">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    No FIRs filed yet.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {allFIRs.map((fir) => (
                    <div
                      key={String(fir.id)}
                      className="glass-card rounded-2xl p-4 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-foreground">
                            #{Number(fir.id)} {fir.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {fir.description}
                          </p>
                        </div>
                        {firStatusBadge(fir.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              Number(fir.timestamp) / 1_000_000,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => openFIRDialog(fir)}
                        >
                          Update
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* FIR Update Dialog */}
              <Dialog open={firDialogOpen} onOpenChange={setFirDialogOpen}>
                <DialogContent className="bg-card border-border mx-4 rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-display">
                      Update FIR #{selectedFIR ? Number(selectedFIR.id) : ""}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 mt-2">
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Status
                      </Label>
                      <Select
                        value={firStatus}
                        onValueChange={(v) => setFirStatus(v as FIRStatus)}
                      >
                        <SelectTrigger className="mt-1 bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value={FIRStatus.filed}>Filed</SelectItem>
                          <SelectItem value={FIRStatus.under_investigation}>
                            Under Investigation
                          </SelectItem>
                          <SelectItem value={FIRStatus.closed}>
                            Closed
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Officer Notes
                      </Label>
                      <Textarea
                        value={officerNotes}
                        onChange={(e) => setOfficerNotes(e.target.value)}
                        placeholder="Add investigation notes..."
                        className="mt-1 bg-input border-border resize-none"
                        rows={3}
                      />
                    </div>
                    <Button
                      onClick={handleFIRUpdate}
                      disabled={updateFIR.isPending}
                      className="w-full bg-primary"
                    >
                      {updateFIR.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Save Update
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>
          )}

          {tab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="font-display font-bold text-xl mb-4 text-foreground">
                Officer Profile
              </h2>
              <div className="glass-card rounded-2xl p-5 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Shield className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Police Officer</p>
                    <p className="text-xs text-muted-foreground">
                      Role: Law Enforcement
                    </p>
                    <p className="text-xs text-primary mt-0.5">
                      Sakhi Police Network
                    </p>
                  </div>
                </div>
              </div>
              <Button
                data-ocid="police.logout.button"
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

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/90 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 py-3 z-50">
        {[
          {
            id: "alerts" as Tab,
            icon: <Bell className="w-5 h-5" />,
            label: t.alerts,
          },
          {
            id: "incidents" as Tab,
            icon: <FileText className="w-5 h-5" />,
            label: t.incidents,
          },
          {
            id: "heatmap" as Tab,
            icon: <MapIcon className="w-5 h-5" />,
            label: t.heatmap,
          },
          {
            id: "firs" as Tab,
            icon: <Shield className="w-5 h-5" />,
            label: t.firs,
          },
          {
            id: "profile" as Tab,
            icon: <User className="w-5 h-5" />,
            label: t.profile,
          },
        ].map((item) => (
          <button
            type="button"
            key={item.id}
            data-ocid={`police.nav.${item.id}.link`}
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
  );
}
