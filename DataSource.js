class DataSource {

  static ss() {
    return SpreadsheetApp.getActiveSpreadsheet();
  }

  static sheet(name) {
    return this.ss().getSheetByName(name);
  }

  static values(sheetName) {
    const sheet = this.sheet(sheetName);
    if (!sheet) return [];
    const values = sheet.getDataRange().getValues();
    return values || [];
  }

  static getTodayRaces() {
    const rows = this.values(CONFIG.SHEETS.RACES);
    if (rows.length <= 1) return [];

    return rows.slice(1)
      .filter(r => r[0])
      .map(r => {
        const race = {
          id: String(r[0]),
          name: r[1] || "",
          course: r[2] || "",
          distance: Number(r[3]) || 0,
          date: r[4] || "",
          type: r[5] || this.detectRaceType()
        };

        const horses = this.getHorses(race.id);
        const odds = this.getOdds(race.id);

        race.horses = horses.map(h => ({
          ...h,
          odds: odds[h.id] || h.odds || 0
        }));

        return race;
      });
  }

  static getHorses(raceId) {
    const rows = this.values(CONFIG.SHEETS.HORSES);
    if (rows.length <= 1) return [];

    return rows.slice(1)
      .filter(r => String(r[0]) === String(raceId))
      .map(r => ({
        raceId: String(r[0]),
        id: String(r[1]),
        name: r[2] || "",
        jockey: r[3] || "",
        trainer: r[4] || "",
        weight: Number(r[5]) || 0,
        odds: Number(r[6]) || 0,
        form: Number(r[7]) || 0,
        gate: Number(r[8]) || 0,
        popularity: Number(r[9]) || 0
      }));
  }

  static getOdds(raceId) {
    const rows = this.values(CONFIG.SHEETS.ODDS);
    const map = {};

    rows.slice(1).forEach(r => {
      if (String(r[0]) === String(raceId)) {
        map[String(r[1])] = Number(r[2]) || 0;
      }
    });

    return map;
  }

  static getResults() {
    const rows = this.values(CONFIG.SHEETS.RESULTS);
    const map = {};

    rows.slice(1).forEach(r => {
      if (!r[0]) return;

      map[String(r[0])] = {
        raceId: String(r[0]),
        winner: r[1] ? String(r[1]) : "",
        place: r[2] ? String(r[2]).split(",").map(x => x.trim()) : [],
        payout: Number(r[3]) || 0
      };
    });

    return map;
  }

  static detectRaceType(date = new Date()) {
    const day = date.getDay();

    if (CONFIG.RACING.CENTRAL_DAYS.indexOf(day) >= 0) {
      return "CENTRAL";
    }

    return "LOCAL";
  }
}
