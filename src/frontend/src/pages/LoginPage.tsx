import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronRight,
  Loader2,
  Settings,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type RoleOption = "user" | "police" | "admin";

interface Props {
  onRoleSelect: (role: "user" | "police" | "admin") => void;
}

const ROLES: {
  id: RoleOption;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "user",
    label: "User",
    desc: "Personal safety & SOS alerts",
    icon: <User className="w-5 h-5" />,
  },
  {
    id: "police",
    label: "Police",
    desc: "Monitor & respond to alerts",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: "admin",
    label: "Admin",
    desc: "System management & analytics",
    icon: <Settings className="w-5 h-5" />,
  },
];

export default function LoginPage({ onRoleSelect }: Props) {
  const { login, isLoggingIn } = useInternetIdentity();
  const [selectedRole, setSelectedRole] = useState<RoleOption>("user");
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleLogin = async () => {
    try {
      await login();
      onRoleSelect(selectedRole);
    } catch {
      toast.error("Login failed. Please try again.");
    }
  };

  return (
    <div className="mobile-container bg-background flex flex-col">
      {/* Hero */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.35 0.18 293 / 0.4), transparent)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4 mb-10"
        >
          <div className="w-24 h-24 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shadow-glow">
            <img
              src="/assets/generated/sakhi-logo-transparent.dim_120x120.png"
              alt="Sakhi"
              className="w-16 h-16 object-contain"
            />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
              Sakhi
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Your trusted safety companion
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Tab switcher */}
          <div
            className="flex rounded-xl bg-secondary/50 p-1 mb-6"
            data-ocid="auth.tab"
          >
            {(["login", "register"] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTab(t)}
                data-ocid={`auth.${t}.tab`}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Role selector */}
          <div className="mb-5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">
              Sign in as
            </Label>
            <div className="flex flex-col gap-2">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  data-ocid={`auth.${r.id}.radio`}
                  onClick={() => setSelectedRole(r.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    selectedRole === r.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card/50 text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <span className={selectedRole === r.id ? "text-primary" : ""}>
                    {r.icon}
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{r.label}</div>
                    <div className="text-xs opacity-70">{r.desc}</div>
                  </div>
                  {selectedRole === r.id && (
                    <ChevronRight className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Register fields */}
          {tab === "register" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex flex-col gap-3 mb-5"
            >
              <div>
                <Label
                  htmlFor="reg-name"
                  className="text-sm text-muted-foreground"
                >
                  Full Name
                </Label>
                <Input
                  id="reg-name"
                  data-ocid="auth.name.input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Priya Sharma"
                  className="mt-1 bg-input border-border"
                />
              </div>
              <div>
                <Label
                  htmlFor="reg-phone"
                  className="text-sm text-muted-foreground"
                >
                  Phone Number
                </Label>
                <Input
                  id="reg-phone"
                  data-ocid="auth.phone.input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="mt-1 bg-input border-border"
                />
              </div>
            </motion.div>
          )}

          <Button
            data-ocid="auth.submit_button"
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-glow"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 mr-2" />
                {tab === "login"
                  ? "Sign in with Internet Identity"
                  : "Create Account"}
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Secured by Internet Computer blockchain
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground pb-6 px-4">
        © {new Date().getFullYear()} Sakhi. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
