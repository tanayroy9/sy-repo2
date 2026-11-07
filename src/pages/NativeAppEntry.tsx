import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Briefcase, HardHat, ChevronRight, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { readNativeRole, saveNativeRole, loginPathFor, type NativeRole } from "@/lib/native-role";
import { Button } from "@/components/ui/button";
import BlueFlowBackground from "@/components/landing/BlueFlowBackground";

const OPTIONS: { role: NativeRole; title: string; text: string; Icon: typeof Briefcase }[] = [
  { role: "owner", title: "Virksomhedsejer", text: "Planlæg ruter, kunder og aftaler", Icon: Briefcase },
  { role: "employee", title: "Medarbejder", text: "Se din rute og registrér tid", Icon: HardHat },
  { role: "customer", title: "Kunde", text: "Se dine aftaler, bestillinger og beskeder", Icon: UserRound },
];

/** App start page: choose owner, employee or customer, then log in. */
export default function NativeAppEntry() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [role] = useState(readNativeRole);

  useEffect(() => { document.title = "Serviceydere"; }, []);

  if (loading) return <div className="min-h-[100dvh] bg-background" aria-busy="true" />;
  if (user) return <Navigate to={loginPathFor(role ?? "owner")} replace />;

  const choose = (r: NativeRole) => { saveNativeRole(r); navigate(loginPathFor(r)); };

  return (
    <main className="flex min-h-[100dvh] flex-col bg-muted/40 text-foreground animate-in fade-in duration-500">
      {/* Blå top med det hvide logo – samme baggrund som forsiden. */}
      <header
        className="panel-page-hero !rounded-none !border-0 !rounded-b-[2rem] !px-6"
        style={{ paddingTop: "max(2.5rem, calc(env(safe-area-inset-top) + 1.5rem))", paddingBottom: "4.5rem" }}
      >
        <BlueFlowBackground variant="hero" />
        <div className="relative mx-auto w-full max-w-md">
          <img src="/serviceydere-logo.png" alt="Serviceydere" className="h-11 w-auto sm:h-12" />
          <h1 className="mt-8 text-3xl font-bold leading-tight sm:text-4xl">Hvem er du?</h1>
          <p className="mt-2 text-base text-muted-foreground">Vælg, så viser vi den rigtige del af appen.</p>
        </div>
      </header>

      <div
        className="mx-auto -mt-8 flex w-full max-w-md flex-1 flex-col px-5"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="relative space-y-3">
          {OPTIONS.map(({ role: r, title, text, Icon }) => (
            <Button
              variant="outline"
              key={r}
              type="button"
              onClick={() => choose(r)}
              className="group flex h-auto min-h-[5.5rem] w-full items-center justify-start gap-4 whitespace-normal rounded-2xl border-border bg-card p-4 text-left shadow-md transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card hover:shadow-lg active:scale-[0.99]"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent to-primary text-primary-foreground shadow-sm">
                <Icon className="!h-7 !w-7" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold text-foreground">{title}</span>
                <span className="mt-0.5 block text-sm font-normal leading-snug text-muted-foreground">{text}</span>
              </span>
              <ChevronRight className="h-6 w-6 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Button>
          ))}
        </div>

        <div className="mt-auto pt-8">
          <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Ny her?</p>
            <div className="mt-3 grid gap-2">
              <Button
                type="button"
                onClick={() => { saveNativeRole("owner"); navigate("/opret-virksomhed"); }}
                className="h-auto min-h-12 w-full whitespace-normal rounded-xl text-base font-semibold"
              >
                Opret virksomhed – 30 dage gratis
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => { saveNativeRole("customer"); navigate("/log-ind?mode=customer&signup=1&app=1"); }}
                className="h-auto min-h-12 w-full whitespace-normal rounded-xl text-base font-semibold"
              >
                Opret kundekonto
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
