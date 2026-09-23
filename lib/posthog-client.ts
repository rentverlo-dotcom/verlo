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
      properties
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
