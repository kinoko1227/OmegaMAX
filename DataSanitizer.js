class DataSanitizer {

  /**
   * レース全体の安定化
   */
  static sanitizeRace(race) {

    return {
      id: this._safe(race.id),
      name: this._safe(race.name),
      course: this._safe(race.course),
      distance: this._num(race.distance),
      date: this._safe(race.date),
      horses: (race.horses || [])
        .map(h => this.sanitizeHorse(h))
        .filter(h => h.id !== "unknown")
    };
  }


  /**
   * 馬データ安定化
   */
  static sanitizeHorse(horse) {

    return {
      id: this._normalizeId(horse.id),
      name: this._safe(horse.name),

      jockey: this._safe(horse.jockey),
      trainer: this._safe(horse.trainer),

      weight: this._num(horse.weight),

      odds: this._cleanOdds(horse.odds),

      form: this._num(horse.form),

      baseSpeed: this._num(horse.baseSpeed),
      stamina: this._num(horse.stamina),
      finishStrength: this._num(horse.finishStrength),

      // 欠損防止補正
      last3Avg: this._num(horse.last3Avg),
      last5Avg: this._num(horse.last5Avg),

      trend: this._num(horse.trend)
    };
  }


  //////////////////////////////
  // ID統一（超重要）
  //////////////////////////////
  static _normalizeId(id) {

    if (!id) return "unknown";

    return String(id)
      .replace(/\s+/g, "")
      .replace(/[^0-9a-zA-Z]/g, "")
      .toLowerCase();
  }


  //////////////////////////////
  // オッズクリーニング
  //////////////////////////////
  static _cleanOdds(v) {

    const n = this._num(v);

    if (n <= 1 || n > 500) return 0;

    return n;
  }


  //////////////////////////////
  // 数値安全化
  //////////////////////////////
  static _num(v) {

    const n = Number(v);

    return isNaN(n) ? 0 : n;
  }


  //////////////////////////////
  // 文字安全化
  //////////////////////////////
  static _safe(v) {

    if (!v) return "unknown";

    return String(v).trim();
  }
}
