class DataResilienceLayer {

  /**
   * レース取得（完全耐障害）
   */
  static getRacesSafe() {

    try {

      const races = DataSource.getTodayRaces();

      if (!races || races.length === 0) {
        return this._fallbackRaces();
      }

      return races.map(r => DataSanitizer.sanitizeRace(r));

    } catch (e) {

      Logger.log("RACE FETCH FAIL: " + e);

      return this._fallbackRaces();
    }
  }


  /**
   * 馬データ取得（耐障害）
   */
  static getHorsesSafe(raceId) {

    try {

      const horses = DataSource.getHorses(raceId);

      if (!horses || horses.length === 0) {
        return this._fallbackHorses();
      }

      return horses.map(h =>
        DataSanitizer.sanitizeHorse(h)
      );

    } catch (e) {

      Logger.log("HORSE FETCH FAIL: " + e);

      return this._fallbackHorses();
    }
  }


  /**
   * オッズ取得（遅延・欠損対応）
   */
  static getOddsSafe(raceId) {

    try {

      const odds = DataSource.getOdds(raceId);

      if (!odds) return {};

      return odds;

    } catch (e) {

      return {};
    }
  }


  //////////////////////////////
  // フォールバック（超重要）
  //////////////////////////////
  static _fallbackRaces() {

    return [{
      id: "fallback_race",
      name: "fallback",
      course: "unknown",
      distance: 1600,
      horses: this._fallbackHorses()
    }];
  }


  static _fallbackHorses() {

    // 最低限動かすダミー構造
    return [
      this._dummyHorse("A"),
      this._dummyHorse("B"),
      this._dummyHorse("C")
    ];
  }


  static _dummyHorse(id) {

    return {
      id: id,
      name: "dummy_" + id,
      jockey: "unknown",
      trainer: "unknown",

      weight: 0,
      odds: 0,

      baseSpeed: 0.5,
      stamina: 0.5,
      finishStrength: 0.5,

      last3Avg: 0.5,
      last5Avg: 0.5,
      trend: 0.5
    };
  }
}
