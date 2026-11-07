import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { EmployeeNotifications } from "./EmployeeNotifications";

afterEach(cleanup);
const item = { id: "test", message: "Ruten er opdateret", created_at: new Date().toISOString(), read_at: null, route_id: "route", route_stop_id: null };
describe("employee notification interactions", () => {
  it("closes the mobile notification window without marking or deleting messages", () => {
    const onClose = vi.fn(); const onDeleteAll = vi.fn(); const onMarkAllRead = vi.fn();
    render(<EmployeeNotifications notifications={[]} onOpen={vi.fn()} onMarkAllRead={onMarkAllRead} onDelete={vi.fn()} onDeleteAll={onDeleteAll} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Luk notifikationer" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDeleteAll).not.toHaveBeenCalled();
    expect(onMarkAllRead).not.toHaveBeenCalled();
  });
  it("opens the selected notification through its native button", () => {
    const onOpen = vi.fn();
    render(<EmployeeNotifications notifications={[item]} onOpen={onOpen} onMarkAllRead={vi.fn()} onDelete={vi.fn()} onDeleteAll={vi.fn()} />);
    const row = screen.getByRole("button", { name: /Ruten er opdateret/ });
    fireEvent.click(row);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith(item);
  });
  it("does not open a notification when deleting it using the keyboard", () => {
    const onOpen = vi.fn(); const onDelete = vi.fn();
    render(<EmployeeNotifications notifications={[item]} onOpen={onOpen} onMarkAllRead={vi.fn()} onDelete={onDelete} onDeleteAll={vi.fn()} />);
    const remove = screen.getByRole("button", { name: "Slet notifikation" });
    fireEvent.keyDown(remove, { key: "Enter" });
    fireEvent.click(remove);
    expect(onOpen).not.toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledWith("test");
  });
});