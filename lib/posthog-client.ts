type PostHogWindow = Window & {
  posthog?: {
    capture?: (
      event: string,
      properties?: Record<string, unknown>
    ) => void
    identify?: (
      distinctId: string,
      properties?: Record<string, unknown>
    ) => void
  }
}

function getPostHog() {
  if (
    typeof window ===
    "undefined"
  ) {
    return null
  }

  const posthog =
    (
      window as
        PostHogWindow
    ).posthog

  if (
    !posthog
  ) {
    return null
  }

  return posthog
}

export function safeAnalyticsPath(path: string): string {
  return path
    .replace(/\/(matches|candidatos|cierre|activar|final|propiedad|tenant\/validacion)\/[^/?#]+/gi, "/$1/[private]")
    .replace(/\/contracts\/[^/?#]+/gi, "/contracts/[private]")
}

function sanitizeAnalyticsValue(value: unknown): unknown {
  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value)) {
      try {
        const url = new URL(value)
        return url.origin + safeAnalyticsPath(url.pathname)
      } catch {
        return "[redacted]"
      }
    }
    if (value.startsWith("/")) {
      return safeAnalyticsPath(value.split("?")[0].split("#")[0])
    }
  }
  return value
}

function getTrackingContext() {
  if (
    typeof window ===
    "undefined"
  ) {
    return {}
  }

  const params =
    new URLSearchParams(
      window.location.search
    )

  const ua =
    window.navigator
      .userAgent
      .toLowerCase()

  const device =
    /iphone|ipad|ipod/.test(
      ua
    )
      ? "ios"
      : /android/.test(
          ua
        )
        ? "android"
        : "desktop"

  return {
    page_path:
      safeAnalyticsPath(window.location.pathname),

    page_url:
      window.location.origin + safeAnalyticsPath(window.location.pathname),

    referrer:
      sanitizeAnalyticsValue(document.referrer) ||
      null,

    device,

    utm_source:
      params.get(
        "utm_source"
      ),

    utm_medium:
      params.get(
        "utm_medium"
      ),

    utm_campaign:
      params.get(
        "utm_campaign"
      ),

    utm_content:
      params.get(
        "utm_content"
      ),

    utm_term:
      params.get(
        "utm_term"
      ),

    fbclid:
      params.get(
        "fbclid"
      ),
  }
}

export function trackPostHog(
  event: string,
  properties?: Record<
    string,
    unknown
  >
) {
  try {
    const posthog =
      getPostHog()

    if (
      !posthog?.capture
    ) {
      return
    }

    posthog.capture(
      event,
      {
        ...getTrackingContext(),
        ...Object.fromEntries(
          Object.entries(properties || {}).filter(([key]) =>
            !/token|secret|password|dni|email|phone|document|signature|address|name|url/i.test(key)
          ).map(([key, value]) => [key, sanitizeAnalyticsValue(value)])
        ),
      }
    )
  } catch (
    error
  ) {
    console.error(
      "PostHog capture error:",
      error
    )
  }
}

export function identifyPostHog(
  distinctId: string,
  properties?: Record<
    string,
    unknown
  >
) {
  try {
    const cleanId =
      distinctId.trim()

    if (
      !cleanId
    ) {
      return
    }

    const posthog =
      getPostHog()

    if (
      !posthog?.identify
    ) {
      return
    }

    posthog.identify(
      cleanId,
      properties
    )
  } catch (
    error
  ) {
    console.error(
      "PostHog identify error:",
      error
    )
  }
}
