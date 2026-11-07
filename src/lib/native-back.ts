export type BackAction = "close-dialog" | "back" | "exit";

/** Android back: close an open window first, then go back, and exit from the start page. */
export function backButtonAction(s: { dialogOpen: boolean; pathname: string; canGoBack: boolean; routerIndex?: number }): BackAction {
  if (s.dialogOpen) return "close-dialog";
  if (s.pathname === "/app") return "exit";
  if ((s.routerIndex ?? 0) > 0) return "back";
  if (!s.canGoBack) return "exit";
  return "back";
}
