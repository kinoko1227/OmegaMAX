class FeatureEngine {

  static build(race, horse) {

    const base = this._base(horse);
    const fit = this._fit(horse, race);
    const form = this._form(horse);
    const flow = this._flow(race, horse);
    const market = this._market(horse);
    const ai = this._ai(horse);

    const features = this._flatten({
      base,
      fit,
      form,
      flow,
      market,
      ai
    });

    return {
      horseId: horse.id,
      features
    };
  }


  /**
   * flatten（安全版）
   */
  static _flatten(obj) {

    const out = {};

    Object.values(obj).forEach(group => {

      if (!group) return;

      Object.keys(group).forEach(k => {
        out[k] = this._safe(group[k]);
      });
    });

    return out;
  }


  /**
   * 安全化（超重要）
   */
  static _safe(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }


  //////////////////////////////
  // 以下は必須（最低限実装）
  //////////////////////////////

  static _base(h) {
    return {
      speed: h.baseSpeed || 0,
      stamina: h.stamina || 0,
      finish: h.finishStrength || 0
    };
  }

  static _fit(h, r) {
    return {
      distance: 1, // 仮（後で実装）
      course: 1
    };
  }

  static _form(h) {
    return {
      last3: h.last3Avg || 0,
      last5: h.last5Avg || 0,
      trend: h.trend || 0
    };
  }

  static _flow(r, h) {
    return {
      pace: 1,
      advantage: 1
    };
  }

  static _market(h) {
    return {
      odds: h.odds || 0,
      bias: 1
    };
  }

  static _ai(h) {
    return {
      confidence: 1
    };
  }
}
