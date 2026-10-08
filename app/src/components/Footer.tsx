import { BUILD_LABEL, VERSION } from "../build";

const REPO = "https://github.com/grigorybaluev/study-hub";

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
      <span className="version" title={BUILD_LABEL}>
        {VERSION.startsWith("v") ? <a href={`${REPO}/releases/tag/${VERSION}`}>{VERSION}</a> : VERSION}
      </span>
    </footer>
  );
}
