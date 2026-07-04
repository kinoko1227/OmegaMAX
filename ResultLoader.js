class ResultLoader {

  /**
   * 実レース結果取得（Sheets想定）
   */
  static getResults() {

    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName("RESULTS");

    const values = sheet.getDataRange().getValues();

    const map = {};

    values.slice(1).forEach(r => {

      const raceId = r[0];

      map[raceId] = {
        raceId: raceId,
        winner: r[1],
        place: r[2] ? String(r[2]).split(",") : []
      };
    });

    return map;
  }
}
