// The review reminder's run (#224, #235), every 10 minutes from .github/workflows/remind.yml: a push when
// one of the day's reminder times (remind-slots.mjs) fell since the previous scheduled run started. Runs
// tile the day by their start times, so a late or skipped run is covered by the next one.
// Run logs of a public repo are public, and the times would give away the owner's day: the day is read
// here through the API (never a step's env, which the log prints), and nothing about it or the decision
// is printed. A manual run ("Run workflow") always sends, the kind chosen there.
import { dueIn, parseDay } from "./remind-slots.mjs";

const LATE = 30 * 60_000;           // a reminder more than half an hour late is left out: the next one is near
const EVERY = 10 * 60_000;          // the schedule, when the previous run cannot be found

const env = process.env;

async function api(path, token = env.GH_TOKEN) {
  const r = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/${path}`, {
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json" },
  });
  if (!r.ok) throw new Error(`GitHub API ${path.split("?")[0]}: ${r.status}`);
  return r.json();
}

/** Since when to look: the previous scheduled run that finished its look (succeeded). A manual run never
 *  looks, and a failed one may have failed before it did, so neither counts. */
async function span() {
  const to = Date.now();
  try {
    const run = await api(`actions/runs/${env.GITHUB_RUN_ID}`);
    const start = Date.parse(run.run_started_at);
    const { workflow_runs } = await api(`actions/workflows/${run.workflow_id}/runs?event=schedule&status=success&per_page=5`);
    const prev = workflow_runs.find((r) => r.id !== run.id && Date.parse(r.run_started_at) < start);
    return { from: Math.max(prev ? Date.parse(prev.run_started_at) : 0, start - LATE), to: start };
  } catch (e) {
    console.log(`::warning::${e.message}; looking back one schedule step`);
    return { from: to - EVERY, to };
  }
}

/** The phone's day (the repo variable REMIND_DAY), parsed; null when there is none to read or it is malformed. */
async function day() {
  if (!env.REMIND_TOKEN) { console.log("::warning::No REMIND_TOKEN secret: reminders at the fallback hours."); return null; }
  try {
    const { value } = await api("actions/variables/REMIND_DAY", env.REMIND_TOKEN);
    const parsed = parseDay(value);
    // a notice that says nothing of the value ("none": the phone has not sent a day yet)
    if (!parsed && value !== "none") console.log("::notice::REMIND_DAY is not a day from the phone: reminders at the fallback hours.");
    return parsed;
  } catch (e) {
    console.log(`::warning::${e.message}: reminders at the fallback hours.`);
    return null;
  }
}

/** `kind`: "remind" (the day's progress) or "week" (the week's summary), which the service worker reads. */
async function send(kind) {
  if (!env.SUBSCRIPTION) { console.log("::warning::No PUSH_SUBSCRIPTION secret yet: enable reminders on the phone and store it."); return; }
  const { default: webpush } = await import("web-push");
  let sub;
  try { sub = JSON.parse(env.SUBSCRIPTION); } catch { sub = null; }     // the parse error would quote the secret
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) throw new Error("PUSH_SUBSCRIPTION is not a push subscription");
  webpush.setVapidDetails("https://grigorybaluev.github.io/study-hub/", env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  await webpush.sendNotification(sub, kind, { TTL: 3600 });     // throws on a refused push (410: gone)
}

if (env.EVENT === "workflow_dispatch") await send(env.KIND === "week" ? "week" : "remind");
else {
  const [d, { from, to }] = await Promise.all([day(), span()]);
  const kind = dueIn(d, from, to);
  if (kind) await send(kind);
}
console.log("done");
