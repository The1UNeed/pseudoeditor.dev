"use client";

import { useCallback, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import {
  ClerkProvider as ClerkProviderBase,
  Show as ClerkShow,
  SignInButton as ClerkSignInButton,
  SignUpButton as ClerkSignUpButton,
  UserButton as ClerkUserButton,
  useAuth as useClerkAuth,
  useClerk,
} from "@clerk/nextjs";
import { zhCN } from "@clerk/localizations";
import { localePath } from "@/i18n/config";
import { useDictionary, useLocale } from "@/i18n/context";
import { getClientAppPlatform, platformUsesCloudSaving } from "@/lib/platform";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

type AuthState = ReturnType<typeof useClerkAuth>;

export function isCloudAuthConfigured() {
  return Boolean(clerkPublishableKey);
}

function cloudAuthRequired() {
  if (typeof window === "undefined") {
    return false;
  }

  return platformUsesCloudSaving(getClientAppPlatform());
}

/**
 * Clerk keeps `__client_uat` (and a suffixed copy per instance) readable by scripts: the time of
 * the last sign-in, or 0 when signed out. With no non-zero value nobody is signed in on this
 * browser, so the editor can open the in-memory workspace without waiting for Clerk to load.
 */
export function mayHaveClerkSession(cookie: string = typeof document === "undefined" ? "" : document.cookie) {
  for (const match of cookie.matchAll(/(?:^|;\s*)__client_uat(?:_[^=;]*)?=([^;]*)/g)) {
    const value = match[1].trim();
    if (value !== "" && value !== "0") {
      return true;
    }
  }
  return false;
}

export function ClerkProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const t = useDictionary().auth;
  if (!isCloudAuthConfigured()) {
    return <>{children}</>;
  }

  const base = locale === "zh" ? zhCN : {};
  return (
    <ClerkProviderBase
      publishableKey={clerkPublishableKey}
      signInUrl={localePath(locale, "/login")}
      signUpUrl={localePath(locale, "/login")}
      signInFallbackRedirectUrl={localePath(locale, "/app")}
      signUpFallbackRedirectUrl={localePath(locale, "/app")}
      afterSignOutUrl={localePath(locale, "/")}
      localization={{
        ...base,
        userButton: {
          ...base.userButton,
          action__manageAccount: t.manageAccount,
        },
        userProfile: {
          ...base.userProfile,
          navbar: {
            ...base.userProfile?.navbar,
            title: t.settingsTitle,
            description: t.settingsDescription,
          },
        },
      }}
      appearance={{
        elements: {
          modalBackdrop: {
            alignItems: "center",
            justifyContent: "center",
          },
          modalContent: {
            margin: "auto",
          },
          modalCloseButton: {
            backgroundColor: "transparent",
            border: "0",
            boxShadow: "none",
            outline: "none",
            "&:focus": {
              boxShadow: "none",
              outline: "none",
            },
            "&:focus-visible": {
              boxShadow: "none",
              outline: "none",
            },
          },
          userButtonAvatarBox: {
            boxShadow: "none",
          },
          userButtonTrigger: {
            boxShadow: "none",
            outline: "none",
            "&:focus": {
              boxShadow: "none",
              outline: "none",
            },
            "&:focus-visible": {
              boxShadow: "none",
              outline: "none",
            },
          },
        },
      }}
    >
      {children}
    </ClerkProviderBase>
  );
}

export function Show({ children, when }: ComponentProps<typeof ClerkShow>) {
  if (!cloudAuthRequired() || !isCloudAuthConfigured()) {
    return when === "signed-out" ? <>{children}</> : null;
  }

  return <ClerkShow when={when}>{children}</ClerkShow>;
}

export function SignInButton({
  children,
  ...props
}: ComponentProps<typeof ClerkSignInButton>) {
  const locale = useLocale();
  if (!cloudAuthRequired() || !isCloudAuthConfigured()) {
    return <>{children}</>;
  }

  return (
    <ClerkSignInButton fallbackRedirectUrl={localePath(locale, "/app")} {...props}>
      {children}
    </ClerkSignInButton>
  );
}

export function SignUpButton({
  children,
  ...props
}: ComponentProps<typeof ClerkSignUpButton>) {
  const locale = useLocale();
  if (!cloudAuthRequired() || !isCloudAuthConfigured()) {
    return <>{children}</>;
  }

  return (
    <ClerkSignUpButton fallbackRedirectUrl={localePath(locale, "/app")} {...props}>
      {children}
    </ClerkSignUpButton>
  );
}

function UserButtonBase(props: ComponentProps<typeof ClerkUserButton>) {
  if (!cloudAuthRequired() || !isCloudAuthConfigured()) {
    return null;
  }

  return <ClerkUserButton {...props} />;
}

export const UserButton = Object.assign(UserButtonBase, {
  Action: ClerkUserButton.Action,
  Link: ClerkUserButton.Link,
  MenuItems: ClerkUserButton.MenuItems,
  UserProfileLink: ClerkUserButton.UserProfileLink,
  UserProfilePage: ClerkUserButton.UserProfilePage,
});

export function useAuth() {
  if (!cloudAuthRequired() || !isCloudAuthConfigured()) {
    return {
      actor: null,
      getToken: async () => null,
      has: () => false,
      isLoaded: true,
      isSignedIn: false,
      orgId: null,
      orgRole: null,
      orgSlug: null,
      sessionClaims: null,
      sessionId: null,
      signOut: async () => undefined,
      userId: null,
    } as AuthState;
  }

  // Clerk's hook is only reachable in configured builds, where AppAuthProvider
  // supplies the matching provider for this stable runtime branch.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useClerkAuth();
}

/**
 * True once Clerk has given up loading, usually because a school filter, content blocker or bad connection
 * stopped its script. Clerk then never reports `isLoaded`, so anything waiting for it must stop waiting.
 */
export function useAuthUnavailable(): boolean {
  if (!cloudAuthRequired() || !isCloudAuthConfigured()) {
    return false;
  }

  // Same stable runtime branch as useAuth above.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useClerkStatusIsError();
}

// Relies on Clerk (checked against @clerk/react 6.18) updating `status` before it notifies `on("status")` listeners,
// and on "error" being final for the page. The unit test uses a fake Clerk, so recheck both when upgrading.
function useClerkStatusIsError(): boolean {
  const clerk = useClerk();
  const subscribe = useCallback(
    (onChange: () => void) => {
      clerk.on("status", onChange);
      return () => clerk.off("status", onChange);
    },
    [clerk],
  );
  return useSyncExternalStore(
    subscribe,
    () => clerk.status === "error",
    () => false,
  );
}
