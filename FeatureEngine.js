class FeatureEngine {

  static build(race, horse) {
    const r = Race.build(race);
    const h = Race.normalizeHorse(horse);

    const features = {};

    FeatureRegistry.all().forEach(def => {
      features[def.key] = this._calc(def, r, h);
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

    return r.horses.map(h => this.build(r, h));
  }

  static _calc(def, race, horse) {
    try {
      const raw = def.calculator(race, horse);
      const value = Utils.toNumber(raw, CONFIG.FEATURE.DEFAULT_SCORE);
      return this._normalize(value);
    } catch (e) {
      Logger.warn("Feature calc failed: " + def.key, e);
      return CONFIG.FEATURE.DEFAULT_SCORE;
    }
  }

  static _normalize(value) {
    const n = Utils.toNumber(value, CONFIG.FEATURE.DEFAULT_SCORE);

    if (n < 0) return 0;
    if (n > 1 && n <= 100) return n / 100;
    if (n > 100) return 1;

    return n;
  }

  static keys() {
    return FeatureRegistry.all().map(f => f.key);
  }

  static learningKeys() {
    return FeatureRegistry
      .all()
      .filter(f => f.learning)
      .map(f => f.key);
  }

  static calibrationKeys() {
    return FeatureRegistry
      .all()
      .filter(f => f.calibration)
      .map(f => f.key);
  }

  static defaultWeights() {
    const weights = {};

    FeatureRegistry.all().forEach(f => {
      weights[f.key] = f.defaultWeight;
    });

    return weights;
  }
}
