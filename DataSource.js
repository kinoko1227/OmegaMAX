class DataSource {

  static ss() {
    return SpreadsheetApp.getActiveSpreadsheet();
  }

  static sheet(name) {
    return this.ss().getSheetByName(name);
  }


  //////////////////////////////
  // ① レース取得
  //////////////////////////////
  static getTodayRaces() {

    const v = this.sheet("RACES").getDataRange().getValues();

    return v.slice(1).map(r => ({
      id: r[0],
      name: r[1],
      course: r[2],
      distance: r[3],
      date: r[4]
    }));
  }


  //////////////////////////////
  // ② 馬データ
  //////////////////////////////
  static getHorses(raceId) {

    const v = this.sheet("HORSES").getDataRange().getValues();

    return v
      .filter(r => r[0] === raceId)
      .map(r => ({
        id: r[1],
        name: r[2],
        jockey: r[3],
        trainer: r[4],
        weight: r[5],
        odds: r[6] || null,
        form: r[7] || 0
      }));
  }


  //////////////////////////////
  // ③ オッズ
  //////////////////////////////
  static getOdds(raceId) {

    const v = this.sheet("ODDS").getDataRange().getValues();

    const map = {};

    v.forEach(r => {
      if (r[0] === raceId) {
        map[r[1]] = Number(r[2]);
      }
    });

    return map;
  }


  //////////////////////////////
  // ④ レース結果
  //////////////////////////////
  static getResults() {

    const v = this.sheet("RESULTS").getDataRange().getValues();

    const map = {};

    v.slice(1).forEach(r => {
      map[r[0]] = {
        winner: r[1],
        place: r[2] ? String(r[2]).split(",") : []
      };
    });

    return map;
  }
}
