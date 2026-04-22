// Analytics stub. Swap for PostHog / Vercel Analytics when keys are available.
type EventName =
  | "quiz_started"
  | "quiz_question_answered"
  | "quiz_completed"
  | "result_viewed"
  | "cta_clicked"
  | "checkout_started"
  | "external_link_clicked";

export function track(event: EventName, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line no-console
  console.debug("[track]", event, props ?? {});
}
