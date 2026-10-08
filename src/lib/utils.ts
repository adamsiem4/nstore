import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const money = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
});

/** Open a modal dialog without the page shifting under the scroll lock in globals.css. */
export function showModal(dialog: HTMLDialogElement) {
  if (dialog.open) return;
  // The scroll lock hides a classic scrollbar and the page slides into its
  // 15px; measured here, while it is still on screen, so the gutter rule in
  // globals.css only fires where that width is real.
  const root = document.documentElement;
  root.classList.toggle("scrollbar-takes-space", window.innerWidth > root.clientWidth);
  dialog.showModal();
}
