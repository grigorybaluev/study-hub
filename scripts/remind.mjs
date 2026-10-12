// The review reminder's run (#224, #235, #243). MODE=check (remind-check.yml, every 10 minutes from an
// external timer, #247, and GitHub's schedule as a backup): a push when one of the day's reminder times or
// Sunday's week summary (remind-slots.mjs) fell since the previous check started. Checks tile the day by
// their start times, so a late or skipped one is covered by the next. MODE=send (remind-send.yml, by
// hand): the kind chosen there, now.
// Run logs of a public repo are public, and the times would give away the owner's day: the day is read
// here through the API (never a step's env, which the log prints), and nothing about it or the decision
// is printed.
import { dueIn, parseDay, previousCheck } from "./remind-slots.mjs";

const LATE = 30 * 60_000;           // a reminder more than half an hour late is left out: the next one is near
const WEEK_LATE = 6 * 3_600_000;    // the week's summary comes once, so it may come later
const EVERY = 15 * 60_000;          // the backup schedule, when the previous check cannot be found

const env = process.env;

async function api(path, token = env.GH_TOKEN) {
  const r = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/${path}`, {
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json" },
  });
  if (!r.ok) throw new Error(`GitHub API ${path.split("?")[0]}: ${r.status}`);
  return r.json();
}

/** Since when to look: the start of the previous check (remind-check.yml) that looked. */
async function span() {
  const to = Date.now();
  try {
    const [run, { workflow_runs }] = await Promise.all([
      api(`actions/runs/${env.GITHUB_RUN_ID}`), api("actions/workflows/remind-check.yml/runs?per_page=10"),
    ]);
    const start = Date.parse(run.run_started_at), prev = previousCheck(workflow_runs, run.id, start);
    const since = prev ? Date.parse(prev.run_started_at) : 0;
    return { from: Math.max(since, start - LATE), weekFrom: Math.max(since, start - WEEK_LATE), to: start };
  } catch (e) {
    console.log(`::warning::${e.message}; looking back one schedule step`);
    return { from: to - EVERY, weekFrom: to - EVERY, to };
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

/** `kind`: "remind" (the day's progress), "test" (the same, sent by hand) or "week" (the week's summary),
 *  which the service worker reads. */
async function send(kind) {
  if (!env.SUBSCRIPTION) { console.log("::warning::No PUSH_SUBSCRIPTION secret yet: enable reminders on the phone and store it."); return; }
  const { default: webpush } = await import("web-push");
  let sub;
  try { sub = JSON.parse(env.SUBSCRIPTION); } catch { sub = null; }     // the parse error would quote the secret
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) throw new Error("PUSH_SUBSCRIPTION is not a push subscription");
  webpush.setVapidDetails("https://grigorybaluev.github.io/study-hub/", env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  await webpush.sendNotification(sub, kind, { TTL: 3600 });     // throws on a refused push (410: gone)
}

if (env.MODE === "send") await send(env.KIND === "week" ? "week" : "test");
else if (env.MODE === "check") {
  const [d, { from, weekFrom, to }] = await Promise.all([day(), span()]);
  const kind = dueIn(d, from, to, weekFrom);
  if (kind) await send(kind);
} else throw new Error(`MODE is "${env.MODE}", not check or send`);
console.log("done");
