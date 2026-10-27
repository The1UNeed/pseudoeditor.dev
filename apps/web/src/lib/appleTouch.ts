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

/** Below this width every window gets the phone layout; at or above it, coarse pointers get the tablet layout. */
export const TOUCH_TABLET_BREAKPOINT = 744;

export type TouchLayout = "tablet" | "phone" | null;

/**
 * Narrow windows use the phone layout whatever the input device, since the desktop panes do not fit.
 * Wider windows use the tablet layout for any coarse pointer (iPad, Android tablets), not only Apple devices.
 */
export function getTouchLayout(width: number, coarsePointer: boolean): TouchLayout {
  if (width < TOUCH_TABLET_BREAKPOINT) return "phone";
  return coarsePointer ? "tablet" : null;
}
