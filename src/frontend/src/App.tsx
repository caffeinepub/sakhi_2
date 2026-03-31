import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { UserRole } from "./backend.d";
import { LanguageProvider } from "./contexts/LanguageContext";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";
import PoliceDashboard from "./pages/PoliceDashboard";
import UserDashboard from "./pages/UserDashboard";

type AppRole = "user" | "police" | "admin" | null;

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const [appRole, setAppRole] = useState<AppRole>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [manualRole, setManualRole] = useState<AppRole>(null);

  useEffect(() => {
    if (!identity || !actor || isFetching) return;
    if (manualRole) return;
    setRoleLoading(true);
    actor
      .getCallerUserRole()
      .then((role) => {
        if (role === UserRole.admin) setAppRole("admin");
        else if (role === UserRole.guest) setAppRole("police");
        else setAppRole("user");
      })
      .catch(() => setAppRole("user"))
      .finally(() => setRoleLoading(false));
  }, [identity, actor, isFetching, manualRole]);

  useEffect(() => {
    if (manualRole) setAppRole(manualRole);
  }, [manualRole]);

  if (isInitializing || roleLoading) {
    return (
      <div className="mobile-container flex flex-col items-center justify-center gap-6 bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Sakhi
          </h1>
          <div className="flex flex-col gap-2 w-48">
            <Skeleton className="h-3 w-full bg-muted" />
            <Skeleton className="h-3 w-3/4 mx-auto bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <LanguageProvider>
        <LoginPage onRoleSelect={setManualRole} />
        <Toaster />
      </LanguageProvider>
    );
  }

  const role = appRole || "user";

  return (
    <LanguageProvider>
      {role === "admin" && (
        <AdminDashboard
          onLogout={() => {
            setAppRole(null);
            setManualRole(null);
          }}
        />
      )}
      {role === "police" && (
        <PoliceDashboard
          onLogout={() => {
            setAppRole(null);
            setManualRole(null);
          }}
        />
      )}
      {role === "user" && (
        <UserDashboard
          onLogout={() => {
            setAppRole(null);
            setManualRole(null);
          }}
        />
      )}
      <Toaster />
    </LanguageProvider>
  );
}
