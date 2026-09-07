/* Anonymous, aggregate-only usage counting.
   No cookies, no session id, nothing that ties two events back to the
   same visitor — this can answer "how many views did Grade 4 fraction
   worksheets get this month," never "what did this person do."

   Mechanism: each call fires a fetch to a path that doesn't exist as a
   real object. CloudFront logs the request (as a 403/404, which is
   fine — only the path itself matters) via standard logging (v2), which
   records four fields only: date, time, the path, and the response
   status. See mathly-infra/logging.tf. Best-effort throughout — a
   blocked or failed beacon never affects the app itself. */

function track(segments) {
  const path = "/e/" + segments.map((s) => encodeURIComponent(String(s))).join("/");
  try {
    fetch(path, { mode: "no-cors", keepalive: true }).catch(() => {});
  } catch {
    // ignore — this is a nice-to-have, never part of the feature it rides along with
  }
}

export function trackLanding() {
  track(["landing"]);
}

export function trackOpenBuilder(grade) {
  track(grade == null ? ["builder"] : ["builder", grade]);
}

export function trackViewWorksheet({ grade, skillIds, difficulty }) {
  if (!skillIds.length) return;
  track(["view", grade, skillIds.join("."), difficulty]);
}

export function trackDownload({ grade, skillIds, difficulty, showAnswers }) {
  track(["download", grade, skillIds.join("."), difficulty, showAnswers ? "answer-key" : "worksheet"]);
}
