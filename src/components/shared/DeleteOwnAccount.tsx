// Sletning af egen konto direkte i appen (krav fra App Store 5.1.1(v) og Google Play).
import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { askConfirm } from "@/components/ConfirmDialogHost";
import { useAuth } from "@/contexts/AuthContext";

export function DeleteOwnAccount({ className = "" }: { className?: string }) {
  const { signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    const ok = await askConfirm({
      title: "Slet din konto?",
      description: "Din konto, dit login og dine profiloplysninger slettes permanent. Det kan ikke fortrydes. Oplysninger som en virksomhed skal gemme efter loven (fx fakturaer), gemmes af virksomheden.",
      confirmLabel: "Slet konto",
      cancelLabel: "Behold konto",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-own-account", { body: {} });
      if (error || !data?.ok) {
        const msg = (data as { error?: string } | null)?.error;
        toast.error("Kontoen blev ikke slettet", { description: msg || "Prøv igen, eller skriv til kontakt@serviceydere.dk." });
        return;
      }
      toast.success("Din konto er slettet");
      await signOut();
    } finally { setBusy(false); }
  };

  return (
    <div className={`rounded-lg border border-destructive/30 bg-destructive/5 p-3 ${className}`}>
      <p className="text-sm font-semibold text-foreground">Slet konto</p>
      <p className="mt-1 text-xs text-muted-foreground">Slet dit login og dine profiloplysninger permanent.</p>
      <Button type="button" variant="outline" onClick={run} disabled={busy}
        className="mt-2 min-h-11 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Slet min konto
      </Button>
    </div>
  );
}
