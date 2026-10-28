import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PUBLIC_POSTHOG_ENABLED !== "1") {
    return;
  }
  // Do Not Track and Global Privacy Control switch off server reports too, as the privacy policy says.
  if (request.headers.dnt === "1" || request.headers["sec-gpc"] === "1") {
    return;
  }
  const { captureServerError } = await import("@/lib/serverAnalytics");
  // Headers are left out on purpose: they carry session cookies and bearer tokens.
  await captureServerError(error, {
    path: request.path.split("?")[0],
    method: request.method,
    route_path: context.routePath,
    route_type: context.routeType,
  });
};
