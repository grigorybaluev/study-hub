// Which build is running (#215): the release tag from deploy.yml, else `git describe` at build time
// (vite.config.ts), so a phone test can tell an old install from the new one.
export const VERSION = import.meta.env.VITE_APP_VERSION || __BUILD__.version;
export const BUILT = new Date(__BUILD__.built);
export const BUILD_LABEL = `${VERSION} · built ${BUILT.toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`;
