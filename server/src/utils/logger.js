/**
 * Clean Human-Readable Logger
 * Avoids JSON noise and provides clear status updates.
 */
export const logger = {
  info: (msg) => {
    console.log(`[INFO] ${msg}`);
  },
  warn: (msg) => {
    console.warn(`[WARN] ${msg}`);
  },
  error: (msg, meta = {}) => {
    console.error(`[ERROR] ${msg}`, meta.error || '');
  }
};
