import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Briefcase, HardHat, ChevronRight, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { readNativeRole, saveNativeRole, loginPathFor, type NativeRole } from "@/lib/native-role";
import { Button } from "@/components/ui/button";

const OPTIONS: { role: NativeRole; title: string; text: string; Icon: typeof Briefcase }[] = [
  { role: "owner", title: "Virksomhedsejer", text: "Planlæg ruter, kunder og aftaler", Icon: Briefcase },
  { role: "employee", title: "Medarbejder", text: "Se din rute og registrér tid", Icon: HardHat },
  { role: "customer", title: "Kunde", text: "Se dine aftaler, bestillinger og beskeder", Icon: UserRound },
];

/** App start page: choose owner or employee, then log in. */
export default function NativeAppEntry() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [role] = useState(readNativeRole);

  useEffect(() => { document.title = "Serviceydere"; }, []);

  if (loading) return <div className="min-h-[100dvh] bg-background" aria-busy="true" />;
  // Signed in: the login page forwards to the right panel.
  if (user) return <Navigate to={loginPathFor(role ?? "owner")} replace />;

  const choose = (r: NativeRole) => { saveNativeRole(r); navigate(loginPathFor(r)); };

  return (
    <main
      className="flex min-h-[100dvh] flex-col bg-background px-5 text-foreground animate-in fade-in duration-500"
      style={{ paddingTop: "max(2rem, env(safe-area-inset-top))", paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <img src="/serviceydere-logo.png" alt="Serviceydere" className="mx-auto mt-2 h-10 w-auto sm:mt-6 sm:h-12" />
        <div className="mt-5 sm:mt-8">
          <h1 className="text-3xl font-bold leading-tight">Hvem er du?</h1>
          <p className="mt-2 text-base text-muted-foreground">Vælg, så viser vi den rigtige del af appen.</p>
        </div>
        <div className="mt-5 space-y-2 sm:mt-8 sm:space-y-3">
          {OPTIONS.map(({ role: r, title, text, Icon }) => (
            <Button variant="outline"
              key={r}
              type="button"
              onClick={() => choose(r)}
              className="flex h-auto min-h-20 w-full items-center justify-start gap-3 whitespace-normal rounded-lg border-border bg-card p-3 text-left sm:gap-4 sm:p-4"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground sm:h-12 sm:w-12">
                <Icon className="h-7 w-7" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold">{title}</span>
                <span className="block text-sm text-muted-foreground">{text}</span>
              </span>
              <ChevronRight className="h-6 w-6 text-muted-foreground" aria-hidden />
            </Button>
          ))}
        </div>
        <div className="mt-auto pt-5 text-center sm:pt-8">
          <p className="text-sm text-muted-foreground">Ny her?</p>
          <div className="mt-1 flex flex-col items-center">
            <Button variant="link"
              type="button"
              onClick={() => { saveNativeRole("owner"); navigate("/opret-virksomhed"); }}
              className="h-auto min-h-11 whitespace-normal px-2 py-2 text-sm font-semibold"
            >
              Opret virksomhed – 30 dage gratis
            </Button>
            <Button variant="link"
              type="button"
              onClick={() => { saveNativeRole("customer"); navigate("/log-ind?mode=customer&signup=1&app=1"); }}
              className="h-auto min-h-11 whitespace-normal px-2 py-2 text-sm font-semibold"
            >
              Opret kundekonto
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
