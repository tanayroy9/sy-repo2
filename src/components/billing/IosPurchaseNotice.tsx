// Apple-regel 3.1.1: digitale abonnementer/kreditter må ikke købes i iPhone-appen
// uden In-App Purchase. Vi viser derfor kun en neutral besked uden købslink.
export function IosPurchaseNotice() {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm text-foreground">
      Køb og ændring af abonnement kan ikke foretages i iPhone-appen. Alt andet i appen virker som normalt.
    </div>
  );
}
