// A bottom sheet's behaviour while open (#190, #193, #197): Escape closes it and the page behind does
// not scroll. The latest onClose is kept in a ref, so a new function on every render re-subscribes nothing.
import { useEffect, useRef } from "react";

export function useSheet(open: boolean, onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") close.current(); };
    document.addEventListener("keydown", esc);
    document.documentElement.classList.add("sheet-open");
    return () => { document.removeEventListener("keydown", esc); document.documentElement.classList.remove("sheet-open"); };
  }, [open]);
}
