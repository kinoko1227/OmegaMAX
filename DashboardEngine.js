/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * DashboardEngine.js
 * ----------------------------------------------------------
 * ダッシュボード更新
 * ==========================================================
 */

class DashboardEngine {

  static update(data) {

    if (!CONFIG.DASHBOARD.ENABLE) {
      Logger.info("Dashboard skipped: disabled");
      return false;
    }

    const sheet = this._sheet();

    sheet.clearContents();

    this._writeSummary(sheet, data);
    this._writeRaceResults(sheet, data);
    this._writeTickets(sheet, data);

    Logger.info("Dashboard updated");

    return true;
  }

  static _writeSummary(sheet, data) {

    const metrics = data.metrics || {};
    const races = data.races || [];
    const raceResults = data.raceResults || [];

    const buyCount = this._countTickets(raceResults);

    sheet.getRange(1, 1, 1, 2).setValues([
      ["ΩMAX Dashboard", CONFIG.APP.VERSION]
    ]);

    sheet.getRange(3, 1, 8, 2).setValues([
      ["更新日時", this._now()],
      ["レース数", races.length],
      ["最終資金", data.bankroll || CONFIG.BANKROLL.INITIAL],
      ["ROI", metrics.roi || ""],
      ["利益", metrics.profit || ""],
      ["最大DD", metrics.maxDrawdown || ""],
      ["的中率", metrics.hitRate || ""],
      ["買い目数", buyCount]
    ]);
  }

  static _writeRaceResults(sheet, data) {

    const raceResults = data.raceResults || [];

    const startRow = 13;

    sheet.getRange(startRow, 1, 1, 7).setValues([
      [
        "Race ID",
        "Race Name",
        "頭数",
        "最高EV",
        "最高Confidence",
        "Decision",
        "買い目数"
      ]
    ]);

    if (raceResults.length === 0) return;

    const rows = raceResults.map(r => {

      const race = r.race || {};
      const core = r.coreResults || [];
      const ticket = r.ticket || {};
      const tickets = ticket.tickets || [];

      const best = core.length > 0
        ? core.slice().sort((a, b) => b.ev - a.ev)[0]
        : null;

      return [
        race.id || "",
        race.name || "",
        race.horses ? race.horses.length : 0,
        best ? best.ev : "",
        best ? best.confidence : "",
        best ? best.decision : "",
        tickets.length
      ];
    });

    sheet
      .getRange(startRow + 1, 1, rows.length, 7)
      .setValues(rows);
  }

  static _writeTickets(sheet, data) {

    const raceResults = data.raceResults || [];

    const startRow = 13 + raceResults.length + 4;

    sheet.getRange(startRow, 1, 1, 8).setValues([
      [
        "Race ID",
        "券種",
        "馬ID",
        "馬名",
        "EV",
        "Confidence",
        "金額",
        "組み合わせ"
      ]
    ]);

    const rows = [];

    raceResults.forEach(r => {

      const raceId = r.race ? r.race.id : "";
      const ticketResult = r.ticket || {};
      const tickets = ticketResult.tickets || [];

      tickets.forEach(t => {
        rows.push([
          raceId,
          t.type || "",
          t.horseId || "",
          t.horseName || "",
          t.ev || "",
          t.confidence || "",
          t.amount || "",
          t.horses ? t.horses.join("-") : ""
        ]);
      });
    });

    if (rows.length === 0) return;

    sheet
      .getRange(startRow + 1, 1, rows.length, 8)
      .setValues(rows);
  }

  static generate() {
    return {
      logs: OmegaState.getLogs(),
      stats: OmegaState.getStatistics(),
      lastResult: OmegaState.getLastResult()
    };
  }

  static _countTickets(raceResults) {

    return (raceResults || []).reduce((sum, r) => {
      const ticket = r.ticket || {};
      const tickets = ticket.tickets || [];
      return sum + tickets.length;
    }, 0);
  }

  static _sheet() {

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    return ss.getSheetByName(CONFIG.SHEETS.DASHBOARD)
      || ss.insertSheet(CONFIG.SHEETS.DASHBOARD);
  }

  static _now() {

    return Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      DATE_FORMAT.DATETIME
    );
  }
}
