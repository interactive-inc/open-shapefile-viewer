/**
 * 開発環境専用のロガー
 * 本番環境ではログ出力を抑制
 */

const isDev = import.meta.env.DEV;

type LogLevel = "log" | "warn" | "error" | "info";

function createLogger(prefix: string) {
  const log = (level: LogLevel, ...args: unknown[]) => {
    if (isDev) {
      console[level](`[${prefix}]`, ...args);
    }
  };

  return {
    log: (...args: unknown[]) => log("log", ...args),
    warn: (...args: unknown[]) => log("warn", ...args),
    error: (...args: unknown[]) => log("error", ...args),
    info: (...args: unknown[]) => log("info", ...args),
  };
}

/** レイヤー関連のログ */
export const layerLogger = createLogger("Layers");

/** Shapefile 関連のログ */
export const shapefileLogger = createLogger("Shapefile");

/** プロジェクト関連のログ */
export const projectLogger = createLogger("Project");
