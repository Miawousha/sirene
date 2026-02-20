/**
 * Platform detection helpers for cross-platform compatibility.
 *
 * Detects whether the app is running on macOS and provides:
 * - isMac: boolean flag for platform-specific behavior
 * - modKey: "Cmd" on macOS, "Ctrl" on Windows/Linux (for shortcut labels)
 * - pathSep: "/" on macOS/Linux, "\\" on Windows (for file path joining)
 * - joinPath: joins path segments using the correct separator
 */

const UA = typeof navigator !== "undefined" ? navigator.userAgent : "";
const PLATFORM = typeof navigator !== "undefined" ? navigator.platform : "";

/** True when running on macOS */
export const isMac: boolean =
  PLATFORM.startsWith("Mac") || UA.includes("Macintosh");

/** Modifier key label: "Cmd" on macOS, "Ctrl" elsewhere */
export const modKey: string = isMac ? "Cmd" : "Ctrl";

/** Path separator: "/" on macOS/Linux, "\\" on Windows */
export const pathSep: string = isMac ? "/" : "\\";

/**
 * Detect the separator used in an existing path.
 * Falls back to the platform default if the path contains neither.
 */
export function detectSep(path: string): string {
  if (path.includes("/")) return "/";
  if (path.includes("\\")) return "\\";
  return pathSep;
}

/**
 * Join a directory path and a child name using the correct separator.
 * Strips any trailing separator from the directory before joining.
 */
export function joinPath(dir: string, child: string): string {
  const sep = detectSep(dir);
  return dir.replace(/[\\/]$/, "") + sep + child;
}
