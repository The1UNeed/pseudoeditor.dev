/** If no frame arrives (a hidden tab, a throttled frame), run anyway after this long. */
const FRAME_FALLBACK_MS = 100;

/**
 * Runs `callback` in a new task after the browser has painted the next frame. Interaction handlers
 * use it for work that need not block that frame, so the tap or key press shows a response first
 * (Interaction to Next Paint ends at that paint). Returns a function that cancels the call.
 */
export function afterNextPaint(callback: () => void): () => void {
  let done = false;
  let frame: number | null = null;
  let task: ReturnType<typeof setTimeout> | null = null;
  const run = () => {
    if (done) return;
    done = true;
    if (frame !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame);
    if (task !== null) clearTimeout(task);
    callback();
  };
  if (typeof requestAnimationFrame === "function" && document.visibilityState !== "hidden") {
    frame = requestAnimationFrame(() => {
      frame = null;
      if (task !== null) clearTimeout(task);
      task = setTimeout(run, 0);
    });
    task = setTimeout(run, FRAME_FALLBACK_MS);
  } else {
    task = setTimeout(run, 0);
  }
  return () => {
    done = true;
    if (frame !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame);
    if (task !== null) clearTimeout(task);
  };
}
