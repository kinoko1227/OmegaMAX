/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * FeatureEngine.js
 * ----------------------------------------------------------
 * 特徴量生成
 * Race / Horse → FeatureSet
 * ==========================================================
 */

class FeatureEngine {

  static build(race, horse) {
    const r = Race.build(race);
    const h = Race.normalizeHorse(horse);

    const features = {};

    FeatureRegistry.all().forEach(def => {
      features[def.key] = this._value(h[def.key]);
    });

    return {
      raceId: r.id,
      horseId: h.id,
      horseName: h.name,
      odds: h.odds,
      features
    };
  }

  static buildRace(race) {
    const r = Race.build(race);

    return r.horses.map(horse =>
      this.build(r, horse)
    );
  }

  static _value(value) {
    const n = Utils.toNumber(
      value,
      CONFIG.FEATURE.DEFAULT_SCORE
    );

    return this._normalize(n);
  }

  static _normalize(value) {
    if (value < 0) return 0;

    if (value > 1 && value <= 100) {
      return Utils.round(value / 100, 4);
    }

    if (value > 100) return 1;

    return Utils.round(value, 4);
  }

  static keys() {
    return FeatureRegistry.keys();
  }

  static learningKeys() {
    return FeatureRegistry.learningKeys();
  }

  static calibrationKeys() {
    return FeatureRegistry.calibrationKeys();
  }

  static defaultWeights() {
    return FeatureRegistry.defaultWeights();
  }
}
