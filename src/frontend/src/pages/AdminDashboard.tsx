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
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  Map as MapIcon,
  MapPin,
  Plus,
  Settings,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { FIRStatus } from "../backend.d";
import type { FIR } from "../backend.d";
import CrimeHeatmap from "../components/CrimeHeatmap";
import NotificationBell from "../components/NotificationBell";
import { useLanguage } from "../contexts/LanguageContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useActiveAlertsCount,
  useAddSafeZone,
  useAllFIRs,
  useAllProfiles,
  useResolvedAlertsCount,
  useSafeZones,
  useUpdateFIRStatus,
  useUserCount,
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
  {
    name: "Community Center",
    address: "Sector 22, Main Road",
    location: { latitude: 28.65, longitude: 77.25 },
  },
];

const MOCK_PROFILES = [
  { name: "Priya Sharma", phone: "+91 98765 43210", contacts: [] },
  { name: "Ananya Singh", phone: "+91 87654 32109", contacts: [] },
  { name: "Meera Patel", phone: "+91 76543 21098", contacts: [] },
  { name: "Kavitha Nair", phone: "+91 65432 10987", contacts: [] },
];

type Tab = "overview" | "users" | "zones" | "heatmap" | "firs" | "settings";

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
        Investigating
      </Badge>
    );
  return (
    <Badge className="bg-green-500/20 text-green-400 border-green-500/40">
      Closed
    </Badge>
  );
}

export default function AdminDashboard({ onLogout }: Props) {
  const { clear } = useInternetIdentity();
  const { t, lang, toggleLang } = useLanguage();
  const [tab, setTab] = useState<Tab>("overview");
  const [zoneOpen, setZoneOpen] = useState(false);
  const [zoneName, setZoneName] = useState("");
  const [zoneAddress, setZoneAddress] = useState("");
  const [zoneLat, setZoneLat] = useState("");
  const [zoneLng, setZoneLng] = useState("");
  const [selectedFIR, setSelectedFIR] = useState<FIR | null>(null);
  const [firDialogOpen, setFirDialogOpen] = useState(false);
  const [firStatus, setFirStatus] = useState<FIRStatus>(FIRStatus.filed);
  const [officerNotes, setOfficerNotes] = useState("");

  const { data: userCount, isLoading: ucLoading } = useUserCount();
  const { data: activeCount, isLoading: acLoading } = useActiveAlertsCount();
  const { data: resolvedCount, isLoading: rcLoading } =
    useResolvedAlertsCount();
  const { data: rawProfiles } = useAllProfiles();
  const { data: rawZones } = useSafeZones();
  const { data: allFIRs, isLoading: firsLoading } = useAllFIRs();
  const addZone = useAddSafeZone();
  const updateFIR = useUpdateFIRStatus();

  const profiles =
    rawProfiles && rawProfiles.length > 0 ? rawProfiles : MOCK_PROFILES;
  const zones = rawZones && rawZones.length > 0 ? rawZones : MOCK_SAFE_ZONES;

  const handleAddZone = async () => {
    if (!zoneName || !zoneAddress) {
      toast.error("Name and address are required.");
      return;
    }
    try {
      await addZone.mutateAsync({
        name: zoneName,
        address: zoneAddress,
        location: {
          latitude: Number.parseFloat(zoneLat) || 0,
          longitude: Number.parseFloat(zoneLng) || 0,
        },
      });
      toast.success("Safe zone added!");
      setZoneName("");
      setZoneAddress("");
      setZoneLat("");
      setZoneLng("");
      setZoneOpen(false);
    } catch {
      toast.error("Failed to add zone.");
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

  const StatCard = ({
    label,
    value,
    icon,
    color,
    loading,
  }: {
    label: string;
    value: bigint | undefined;
    icon: React.ReactNode;
    color: string;
    loading: boolean;
  }) => (
    <div className="glass-card rounded-2xl p-4 flex flex-col gap-2">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
      {loading ? (
        <Skeleton className="h-7 w-16 bg-muted" />
      ) : (
        <p className="text-2xl font-display font-bold text-foreground">
          {String(value ?? 0)}
        </p>
      )}
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );

  return (
    <div className="mobile-container bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground leading-none">
              Admin Panel
            </h1>
            <p className="text-xs text-muted-foreground">Sakhi Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-ocid="admin.lang.toggle"
            onClick={toggleLang}
            className="px-2 py-1 rounded-full bg-secondary border border-border text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            {lang === "en" ? "हि" : "EN"}
          </button>
          <NotificationBell />
          <span className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-full border border-primary/30 font-semibold">
            ADMIN
          </span>
        </div>
      </header>

      <main className="flex-1 px-4">
        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-5"
            >
              <h2 className="font-display font-bold text-base text-foreground">
                {t.overview}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label={t.totalUsers}
                  value={userCount}
                  icon={<Users className="w-5 h-5 text-primary" />}
                  color="bg-primary/20"
                  loading={ucLoading}
                />
                <StatCard
                  label={t.activeAlerts}
                  value={activeCount}
                  icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
                  color="bg-red-500/20"
                  loading={acLoading}
                />
                <StatCard
                  label="Resolved"
                  value={resolvedCount}
                  icon={<CheckCircle2 className="w-5 h-5 text-green-400" />}
                  color="bg-green-500/20"
                  loading={rcLoading}
                />
                <StatCard
                  label="Safe Zones"
                  value={BigInt(zones.length)}
                  icon={<MapPin className="w-5 h-5 text-yellow-400" />}
                  color="bg-yellow-500/20"
                  loading={false}
                />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground mb-3">
                  Recent Activity
                </h3>
                <div className="glass-card rounded-2xl p-4 flex flex-col gap-3">
                  {[
                    {
                      text: "New SOS alert from Priya S.",
                      time: "2 min ago",
                      color: "bg-red-400",
                    },
                    {
                      text: "Incident resolved in Sector 14",
                      time: "15 min ago",
                      color: "bg-green-400",
                    },
                    {
                      text: "New user registered",
                      time: "1 hr ago",
                      color: "bg-primary",
                    },
                    {
                      text: "Safe zone added: City Hospital",
                      time: "3 hrs ago",
                      color: "bg-yellow-400",
                    },
                  ].map((a) => (
                    <div key={a.text} className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${a.color}`}
                      />
                      <p className="text-sm text-foreground flex-1">{a.text}</p>
                      <span className="text-xs text-muted-foreground">
                        {a.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {tab === "users" && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              <h2 className="font-display font-bold text-base text-foreground">
                {t.users}
              </h2>
              {profiles.length === 0 ? (
                <div
                  data-ocid="admin.users.empty_state"
                  className="glass-card rounded-2xl p-6 text-center"
                >
                  <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No users yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {profiles.map((p, i) => (
                    <div
                      key={p.name || `profile-${i}`}
                      data-ocid={`admin.users.item.${i + 1}`}
                      className="glass-card rounded-xl p-4 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground">
                          {p.name || "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.phone || "No phone"}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {p.contacts?.length || 0} contacts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === "zones" && (
            <motion.div
              key="zones"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-base text-foreground">
                  {t.safeZones}
                </h2>
                <Dialog open={zoneOpen} onOpenChange={setZoneOpen}>
                  <DialogTrigger asChild>
                    <Button
                      data-ocid="admin.zones.open_modal_button"
                      size="sm"
                      className="bg-primary h-8 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Zone
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    data-ocid="admin.zones.dialog"
                    className="bg-card border-border mx-4 rounded-2xl"
                  >
                    <DialogHeader>
                      <DialogTitle className="font-display">
                        Add Safe Zone
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 mt-2">
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Zone Name *
                        </Label>
                        <Input
                          data-ocid="admin.zones.name.input"
                          value={zoneName}
                          onChange={(e) => setZoneName(e.target.value)}
                          placeholder="City Hospital"
                          className="mt-1 bg-input border-border"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Address *
                        </Label>
                        <Input
                          data-ocid="admin.zones.address.input"
                          value={zoneAddress}
                          onChange={(e) => setZoneAddress(e.target.value)}
                          placeholder="123 Main St"
                          className="mt-1 bg-input border-border"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Latitude
                          </Label>
                          <Input
                            data-ocid="admin.zones.lat.input"
                            value={zoneLat}
                            onChange={(e) => setZoneLat(e.target.value)}
                            placeholder="28.63"
                            className="mt-1 bg-input border-border"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Longitude
                          </Label>
                          <Input
                            data-ocid="admin.zones.lng.input"
                            value={zoneLng}
                            onChange={(e) => setZoneLng(e.target.value)}
                            placeholder="77.22"
                            className="mt-1 bg-input border-border"
                          />
                        </div>
                      </div>
                      <Button
                        data-ocid="admin.zones.submit_button"
                        onClick={handleAddZone}
                        disabled={addZone.isPending}
                        className="w-full bg-primary mt-1"
                      >
                        {addZone.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        Add Zone
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex flex-col gap-2">
                {zones.map((z, i) => (
                  <div
                    key={z.name}
                    data-ocid={`admin.zones.item.${i + 1}`}
                    className="glass-card rounded-xl p-4 flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        {z.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {z.address}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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
                All FIRs
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
                        placeholder="Add notes..."
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

          {tab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <h2 className="font-display font-bold text-xl text-foreground">
                {t.settings}
              </h2>
              <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      Sakhi v3.0 — Phase 3
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Women's Safety Platform
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>❖ SOS Alerts & Emergency Response</p>
                  <p>❖ FIR Management System</p>
                  <p>❖ Crime Heatmap</p>
                  <p>❖ AI Safety Assistant</p>
                  <p>❖ Real-time Notifications</p>
                  <p>❖ Safe Zone Management</p>
                  <p>❖ Role-Based Access Control</p>
                  <p>❖ GPS Location Tracking</p>
                  <p>❖ Multi-language Support (EN / हि)</p>
                  <p>❖ Browser Push Notifications</p>
                </div>
              </div>
              <Button
                data-ocid="admin.logout.button"
                variant="outline"
                onClick={handleLogout}
                className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t.signOut}
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-2">
                © {new Date().getFullYear()} Sakhi. Built with love using{" "}
                <a
                  href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  caffeine.ai
                </a>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/90 backdrop-blur-xl border-t border-border flex items-center justify-around px-1 py-3 z-50">
        {[
          {
            id: "overview" as Tab,
            icon: <LayoutDashboard className="w-5 h-5" />,
            label: t.overview,
          },
          {
            id: "users" as Tab,
            icon: <Users className="w-5 h-5" />,
            label: t.users,
          },
          {
            id: "zones" as Tab,
            icon: <MapPin className="w-5 h-5" />,
            label: t.zones,
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
            id: "settings" as Tab,
            icon: <Settings className="w-5 h-5" />,
            label: t.settings,
          },
        ].map((item) => (
          <button
            type="button"
            key={item.id}
            data-ocid={`admin.nav.${item.id}.link`}
            onClick={() => setTab(item.id)}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all ${
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
