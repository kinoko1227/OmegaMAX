class DataImporter {

  static sheet(name) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    return ss.getSheetByName(name) || ss.insertSheet(name);
  }

  static clearAndWrite(sheetName, header, rows) {
    const sheet = this.sheet(sheetName);

    sheet.clearContents();
    sheet.getRange(1, 1, 1, header.length).setValues([header]);

    if (!rows || rows.length === 0) return;

    sheet
      .getRange(2, 1, rows.length, header.length)
      .setValues(rows);
  }

  static importRaces(csvRows) {
    const rows = this._removeHeader(csvRows).map(r => [
      r[0] || "",
      r[1] || "",
      r[2] || "",
      Number(r[3]) || 0,
      r[4] || "",
      r[5] || DataSource.detectRaceType()
    ]);

    this.clearAndWrite(
      CONFIG.SHEETS.RACES,
      ["id", "name", "course", "distance", "date", "type"],
      rows
    );
  }

  static importHorses(csvRows) {
    const rows = this._removeHeader(csvRows).map(r => [
      r[0] || "",
      r[1] || "",
      r[2] || "",
      r[3] || "",
      r[4] || "",
      Number(r[5]) || 0,
      Number(r[6]) || 0,
      Number(r[7]) || 0,
      Number(r[8]) || 0,
      Number(r[9]) || 0
    ]);

    this.clearAndWrite(
      CONFIG.SHEETS.HORSES,
      [
        "raceId",
        "horseId",
        "name",
        "jockey",
        "trainer",
        "weight",
        "odds",
        "form",
        "gate",
        "popularity"
      ],
      rows
    );
  }

  static importOdds(csvRows) {
    const rows = this._removeHeader(csvRows).map(r => [
      r[0] || "",
      r[1] || "",
      Number(r[2]) || 0
    ]);

    this.clearAndWrite(
      CONFIG.SHEETS.ODDS,
      ["raceId", "horseId", "odds"],
      rows
    );
  }

  static importResults(csvRows) {
    const rows = this._removeHeader(csvRows).map(r => [
      r[0] || "",
      r[1] || "",
      r[2] || "",
      Number(r[3]) || 0
    ]);

    this.clearAndWrite(
      CONFIG.SHEETS.RESULTS,
      ["raceId", "winner", "place", "payout"],
      rows
    );
  }

  static importTodayFromCsv() {
    if (CONFIG.CSV.RACES_URL) {
      this.importRaces(CsvFetcher.fetch(CONFIG.CSV.RACES_URL));
    }

    if (CONFIG.CSV.HORSES_URL) {
      this.importHorses(CsvFetcher.fetch(CONFIG.CSV.HORSES_URL));
    }

    if (CONFIG.CSV.ODDS_URL) {
      this.importOdds(CsvFetcher.fetch(CONFIG.CSV.ODDS_URL));
    }
  }

  static _removeHeader(rows) {
    if (!rows || rows.length === 0) return [];

    const first = String(rows[0][0] || "").toLowerCase();

    if (
      first === "id" ||
      first === "raceid" ||
      first === "race_id"
    ) {
      return rows.slice(1);
    }

    return rows;
  }
}
