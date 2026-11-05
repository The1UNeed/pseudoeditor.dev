import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";

beforeAll(() => {
  // jsdom has no <dialog> modal support.
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
});

afterEach(cleanup);

function renderDialog(onClose = vi.fn()) {
  render(
    <Dialog labelledBy="title" onClose={onClose}>
      <h2 id="title">Settings</h2>
    </Dialog>,
  );
  const dialog = screen.getByRole("dialog", { hidden: true });
  vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({
    left: 100, top: 100, right: 500, bottom: 500, width: 400, height: 400, x: 100, y: 100, toJSON: () => ({}),
  });
  return { dialog, onClose };
}

describe("Dialog", () => {
  it("stays open when the card's own padding is clicked", () => {
    const { dialog, onClose } = renderDialog();
    fireEvent.pointerDown(dialog, { clientX: 110, clientY: 110 });
    fireEvent.click(dialog, { clientX: 110, clientY: 110 });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on a click on the backdrop outside the card", () => {
    const { dialog, onClose } = renderDialog();
    fireEvent.pointerDown(dialog, { clientX: 20, clientY: 20 });
    fireEvent.click(dialog, { clientX: 20, clientY: 20 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open when a drag starts inside the card and ends on the backdrop", () => {
    const { dialog, onClose } = renderDialog();
    fireEvent.pointerDown(dialog, { clientX: 300, clientY: 300 });
    fireEvent.click(dialog, { clientX: 20, clientY: 20 });
    expect(onClose).not.toHaveBeenCalled();
  });
});
