// The "Needs verification" strip on an interactive example (#92, #93): shown until both hand checks
// are recorded in the block's `verified:` list. Shared by sims and solution maps.
const CHECKS = ["interface", "content"] as const;

export default function NeedsVerification({ verified }: { verified?: string[] }) {
  const missing = CHECKS.filter((c) => !verified?.includes(c));
  if (missing.length === 0) return null;
  const text = `${missing.join(" and ")} not checked yet`;
  return <div className="sim-verify" title={`This example has not been verified: ${text}.`}>Needs verification · {text}</div>;
}
