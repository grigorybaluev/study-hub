const REPO = "https://github.com/grigorybaluev/study-hub";
// Set by deploy.yml from the release tag; unset in local builds.
const VERSION = import.meta.env.VITE_APP_VERSION || "dev";

export default function Footer() {
  return (
    <footer className="footer">
      <span>
        Study Hub by <a href="https://github.com/grigorybaluev">Grigory Baluev</a>
      </span>
      <span>
        Content <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>, code{" "}
        <a href={`${REPO}/blob/main/LICENSE`}>MIT</a>
      </span>
      <span>
        <a href={REPO}>Source on GitHub</a>
      </span>
      <span className="version">
        {VERSION.startsWith("v") ? <a href={`${REPO}/releases/tag/${VERSION}`}>{VERSION}</a> : VERSION}
      </span>
    </footer>
  );
}
