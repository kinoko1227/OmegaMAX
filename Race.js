/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * Race.js
 * ----------------------------------------------------------
 * レースドメインモデル
 * DataSource → Race → FeatureEngine の橋渡し
 * ==========================================================
 */

class Race {

  /**
   * レース正規化
   */
  static build(raw) {
    const race = raw || {};

    const horses = Array.isArray(race.horses)
      ? race.horses
          .map(h => this.normalizeHorse(h))
          .filter(h => h.id)
      : [];

    return {
      id: String(race.id || ""),
      name: String(race.name || ""),
      course: String(race.course || ""),
      distance: Utils.toNumber(race.distance, 0),
      date: race.date || "",
      type: race.type || DataSource.detectRaceType(),
      surface: race.surface || SURFACE.UNKNOWN,
      going: race.going || GOING.UNKNOWN,
      distanceType: this.distanceType(race.distance),
      horses: horses
    };
  }

  /**
   * 馬正規化
   */
  static normalizeHorse(raw) {
    const h = raw || {};

    return {
      raceId: String(h.raceId || ""),
      id: String(h.id || h.horseId || ""),
      name: String(h.name || ""),
      jockey: String(h.jockey || ""),
      trainer: String(h.trainer || ""),
      weight: Utils.toNumber(h.weight, 0),
      odds: Utils.toNumber(h.odds, 0),
      form: Utils.toNumber(h.form, 0),
      gate: Utils.toNumber(h.gate, 0),
      popularity: Utils.toNumber(h.popularity, 0),

      baseSpeed: Utils.toNumber(h.baseSpeed, h.speed || 0),
      stamina: Utils.toNumber(h.stamina, 0),
      finishStrength: Utils.toNumber(h.finishStrength, h.finish || 0),

      last3Avg: Utils.toNumber(h.last3Avg, h.last3 || 0),
      last5Avg: Utils.toNumber(h.last5Avg, h.last5 || 0),
      trend: Utils.toNumber(h.trend, 0)
    };
  }

  /**
   * FeatureEngine入力形式
   */
  static toFeatureInput(race) {
    const r = this.build(race);

    return {
      race: r,
      context: this.extractContext(r),
      horses: Array.isArray(r.horses) ? r.horses : []
    };
  }

  /**
   * レース文脈
   */
  static extractContext(race) {
    const distance = Utils.toNumber(race.distance, 0);

    return {
      raceId: race.id,
      type: race.type || RACE_TYPE.CENTRAL,
      course: race.course || "",
      surface: race.surface || SURFACE.UNKNOWN,
      going: race.going || GOING.UNKNOWN,
      distance: distance,
      distanceType: this.distanceType(distance),
      horseCount: Array.isArray(race.horses) ? race.horses.length : 0,

      isShort: distance > 0 && distance <= 1400,
      isMile: distance > 1400 && distance <= 1800,
      isMiddle: distance > 1800 && distance < 2400,
      isLong: distance >= 2400,

      isCentral: race.type === RACE_TYPE.CENTRAL,
      isLocal: race.type === RACE_TYPE.LOCAL
    };
  }

  /**
   * 距離分類
   */
  static distanceType(distance) {
    const d = Utils.toNumber(distance, 0);

    if (d <= 0) return DISTANCE_TYPE.UNKNOWN;
    if (d <= 1400) return DISTANCE_TYPE.SPRINT;
    if (d <= 1800) return DISTANCE_TYPE.MILE;
    if (d < 2400) return DISTANCE_TYPE.MIDDLE;

    return DISTANCE_TYPE.LONG;
  }

  /**
   * 妥当性チェック
   */
  static isValid(race) {
    if (!race) return false;
    if (!race.id) return false;
    if (!Array.isArray(race.horses)) return false;
    if (race.horses.length === 0) return false;

    return true;
  }

}
