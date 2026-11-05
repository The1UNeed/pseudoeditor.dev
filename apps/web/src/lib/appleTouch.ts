interface NavigatorLike {
  maxTouchPoints?: number;
  platform?: string;
  userAgent?: string;
}

interface MediaQueryListLike {
  matches: boolean;
}

type MatchMediaLike = (query: string) => MediaQueryListLike;

export function isAppleTouchDevice(navigatorLike?: NavigatorLike | null): boolean {
  if (!navigatorLike) {
    return false;
  }

  const userAgent = navigatorLike.userAgent ?? "";
  const platform = navigatorLike.platform ?? "";
  const maxTouchPoints = navigatorLike.maxTouchPoints ?? 0;

  return /iPad|iPhone|iPod/.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1);
}

export function supportsDesktopNativeDragAndDrop(
  matchMedia?: MatchMediaLike,
  navigatorLike?: NavigatorLike | null,
): boolean {
  if (isAppleTouchDevice(navigatorLike)) {
    return false;
  }

  if (typeof matchMedia !== "function") {
    return true;
  }

  return !matchMedia("(pointer: coarse)").matches;
}

/** Below this width touch screens get the phone layout; at or above it, coarse pointers get the tablet layout. */
export const TOUCH_TABLET_BREAKPOINT = 744;
/** Mouse-driven windows keep the desktop workbench down to this width (a laptop window snapped to half the screen). */
export const DESKTOP_MIN_WIDTH = 560;
/** Touch screens whose shorter side is below this are phones, in either orientation. */
export const PHONE_MAX_SHORT_SIDE = 600;

export type TouchLayout = "tablet" | "phone" | null;

/**
 * Touch screens narrower than the tablet breakpoint use the phone layout; wider ones use the tablet layout (iPad,
 * Android tablets). With a mouse the desktop workbench stays until the window is too narrow for its panes.
 */
export function getTouchLayout(width: number, coarsePointer: boolean, height = Number.POSITIVE_INFINITY): TouchLayout {
  // A phone turned sideways is wide but short: the tablet panes would leave a five-line editor.
  if (coarsePointer) return width < TOUCH_TABLET_BREAKPOINT || Math.min(width, height) < PHONE_MAX_SHORT_SIDE ? "phone" : "tablet";
  return width < DESKTOP_MIN_WIDTH ? "phone" : null;
}
