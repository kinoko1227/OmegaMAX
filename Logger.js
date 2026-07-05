/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * Logger.js
 * ----------------------------------------------------------
 * 共通ログ管理
 * GAS標準LoggerではなくΩMAX専用Logger
 * ==========================================================
 */

const Logger = (() => {

  const log = (message, data = null) => {
    write(LOG_LEVEL.INFO, message, data);
  };

  const info = (message, data = null) => {
    write(LOG_LEVEL.INFO, message, data);
  };

  const warn = (message, data = null) => {
    write(LOG_LEVEL.WARN, message, data);
  };

  const error = (message, errorObj = null) => {
    let body = String(message);

    if (errorObj) {
      if (errorObj.stack) {
        body += "\n" + errorObj.stack;
      } else {
        body += "\n" + String(errorObj);
      }
    }

    write(LOG_LEVEL.ERROR, body);
  };

  const debug = (message, data = null) => {
    if (!CONFIG.DEBUG.ENABLE) return;
    write(LOG_LEVEL.DEBUG, message, data);
  };

  const time = (label, fn) => {
    const start = new Date().getTime();

    try {
      const result = fn();
      const elapsed = new Date().getTime() - start;

      info(label + " DONE", { elapsedMs: elapsed });

      return result;

    } catch (e) {
      const elapsed = new Date().getTime() - start;

      error(label + " ERROR", {
        elapsedMs: elapsed,
        error: e.toString(),
        stack: e.stack || ""
      });

      throw e;
    }
  };

  const write = (level, message, data = null) => {
    if (!CONFIG.LOG.ENABLE) return;

    const sheet = getLogSheet();
    ensureHeader(sheet);

    let body = String(message);

    if (data !== null && data !== undefined) {
      try {
        body += "\n" + JSON.stringify(data);
      } catch (e) {
        body += "\n[Unserializable data]";
      }
    }

    sheet.appendRow([
      Utils.now(),
      level,
      body
    ]);

    try {
      OmegaState.addLog(level, body);
    } catch (e) {
      // State保存失敗で本処理を止めない
    }

    trim(sheet);
  };

  const getLogSheet = () => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    return ss.getSheetByName(CONFIG.SHEETS.LOG)
      || ss.insertSheet(CONFIG.SHEETS.LOG);
  };

  const ensureHeader = (sheet) => {
    if (sheet.getLastRow() > 0) return;

    sheet
      .getRange(1, 1, 1, SHEET_HEADERS.LOG.length)
      .setValues([SHEET_HEADERS.LOG]);
  };

  const trim = (sheet) => {
    const max = CONFIG.LOG.MAX_ROWS || 5000;
    const lastRow = sheet.getLastRow();

    if (lastRow <= max + 1) return;

    sheet.deleteRows(2, lastRow - max - 1);
  };

  return {
    log,
    info,
    warn,
    error,
    debug,
    time
  };

})();
