/**
 * ==========================================================
 * ΩMAX Ultimate v9
 * Logger.gs（完全安定・互換対応版）
 * ==========================================================
 */

const Logger = (() => {

  /**
   * INFOログ
   */
  const info = (message, data = null) => {
    write("INFO", message, data);
  };

  /**
   * WARNログ
   */
  const warn = (message, data = null) => {
    write("WARN", message, data);
  };

  /**
   * ERRORログ
   */
  const error = (message, errorObj = null) => {

    let text = message;

    if (errorObj) {
      if (errorObj.stack) {
        text += "\n" + errorObj.stack;
      } else {
        text += "\n" + errorObj.toString();
      }
    }

    write("ERROR", text);
  };

  /**
   * DEBUGログ
   */
  const debug = (message, data = null) => {

    if (typeof CONFIG !== "undefined" &&
        CONFIG.DEBUG &&
        CONFIG.DEBUG.ENABLE_LOG === false) {
      return;
    }

    write("DEBUG", message, data);
  };

  /**
   * ★互換用 log（これが重要）
   * 旧コード対応
   */
  const log = (message, data = null) => {
    write("INFO", message, data);
  };

  /**
   * 共通書き込み処理
   */
  const write = (level, message, data = null) => {

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = (typeof CONFIG !== "undefined" && CONFIG.SHEETS)
      ? CONFIG.SHEETS.LOG
      : "LOG";

    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    let body = message;

    if (data !== null && data !== undefined) {
      try {
        body += "\n" + JSON.stringify(data);
      } catch (e) {
        body += "\n[Unserializable Data]";
      }
    }

    sheet.appendRow([
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "yyyy-MM-dd HH:mm:ss"
      ),
      level,
      body
    ]);

    trim(sheet);
  };

  /**
   * ログ肥大化防止
   */
  const trim = (sheet) => {

    const maxRows = (typeof CONFIG !== "undefined" && CONFIG.LOG)
      ? CONFIG.LOG.MAX_ROWS
      : 500;

    const lastRow = sheet.getLastRow();

    if (lastRow <= maxRows + 1) return;

    sheet.deleteRows(2, lastRow - maxRows - 1);
  };

  /**
   * 公開API
   */
  return {
    log,   // ←これ重要（旧互換）
    info,
    warn,
    error,
    debug
  };

})();
