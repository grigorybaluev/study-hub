// The review reminder's run (#224, #235), every 10 minutes from .github/workflows/remind.yml: a push when
// one of the day's reminder times (remind-slots.mjs) fell since the previous run started. Runs tile the
// day by their start times, so a late or skipped run is covered by the next one, never sent twice.
// It prints nothing about the decision and every run does the same steps: run logs of a public repo are
// public, and the times would give away the owner's day. A manual run ("Run workflow") always sends.
import { due } from "./remind-slots.mjs";

const LATE = 60 * 60_000;           // a reminder more than an hour late is left out: the next one is near

const env = process.env;

async function api(path) {
  const r = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/${path}`, {
    headers: { authorization: `Bearer ${env.GH_TOKEN}`, accept: "application/vnd.github+json" },
  });
  if (!r.ok) throw new Error(`GitHub API ${path}: ${r.status}`);
  return r.json();
}

/** This run's start and the previous run's, from the Actions API. */
async function span() {
  const run = await api(`actions/runs/${env.GITHUB_RUN_ID}`);
  const to = Date.parse(run.run_started_at);
  const { workflow_runs } = await api(`actions/workflows/remind.yml/runs?per_page=10`);
  // a run cancelled while it waited never looked; a failed one did (and mailed the owner)
  const prev = workflow_runs.find((r) => r.id !== run.id && r.conclusion !== "cancelled" && Date.parse(r.run_started_at) < to);
  return { from: Math.max(prev ? Date.parse(prev.run_started_at) : 0, to - LATE), to };
}

async function send() {
  if (!env.SUBSCRIPTION) { console.log("::warning::No PUSH_SUBSCRIPTION secret yet: enable reminders on the phone and store it."); return; }
  const { default: webpush } = await import("web-push");
  const sub = JSON.parse(env.SUBSCRIPTION);
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) throw new Error("PUSH_SUBSCRIPTION is not a push subscription");
  webpush.setVapidDetails("https://grigorybaluev.github.io/study-hub/", env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  await webpush.sendNotification(sub, "remind", { TTL: 3600 });     // throws on a refused push (410: gone)
}

if (env.EVENT === "workflow_dispatch") await send();
else {
  const { from, to } = await span();
  if (due(env.DAY, from, to)) await send();
}
console.log("done");
