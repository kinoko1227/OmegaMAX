/**
 * =========================================
 * ΩMAX v9 - Validator Layer
 * =========================================
 * 役割：
 * - 全データの整合性チェック
 * - 不正データの早期排除
 * - 下流エンジン保護（Feature / Core / Ticket）
 * - 想定外入力の吸収
 * =========================================
 */

class Validator {

  /**
   * レースデータ全体の検証
   */
  static validateRace(race) {
    if (!race) return this._fail("Race is null");

    const errors = [];

    if (!race.id) errors.push("missing race.id");
    if (!race.date) errors.push("missing race.date");
    if (!race.horses || !Array.isArray(race.horses)) {
      errors.push("invalid horses array");
    }

    if (race.horses && race.horses.length < 2) {
      errors.push("too few horses");
    }

    return this._result(errors, race);
  }


  /**
   * 馬データ検証
   */
  static validateHorse(horse) {
    if (!horse) return this._fail("Horse is null");

    const errors = [];

    if (!horse.name) errors.push("missing name");
    if (horse.odds == null) errors.push("missing odds");
    if (horse.popularity == null) errors.push("missing popularity");

    if (horse.odds < 1) errors.push("invalid odds");
    if (horse.popularity < 1) errors.push("invalid popularity");

    return this._result(errors, horse);
  }


  /**
   * FeatureEngine入力検証（最重要）
   */
  static validateFeatures(features) {
    if (!features) return this._fail("features null");

    const errors = [];

    // 数値チェック
    Object.keys(features).forEach(key => {
      const val = features[key];

      if (val == null) {
        errors.push(`missing feature: ${key}`);
      } else if (typeof val !== "number" || isNaN(val)) {
        errors.push(`invalid feature (not number): ${key}`);
      }
    });

    return this._result(errors, features);
  }


  /**
   * LearningEngine用データ検証
   */
  static validateLearningData(data) {
    if (!data) return this._fail("learning data null");

    const errors = [];

    if (!data.features) errors.push("missing features");
    if (data.label == null) errors.push("missing label");

    if (typeof data.label !== "number") {
      errors.push("label must be number");
    }

    return this._result(errors, data);
  }


  /**
   * オッズデータ検証（RealOddsLayer用）
   */
  static validateOdds(oddsData) {
    if (!oddsData) return this._fail("odds null");

    const errors = [];

    Object.keys(oddsData).forEach(k => {
      const v = oddsData[k];

      if (v <= 0) {
        errors.push(`invalid odds value: ${k}`);
      }
    });

    return this._result(errors, oddsData);
  }


  /**
   * 汎用レスポンス生成
   */
  static _result(errors, data) {
    return {
      ok: errors.length === 0,
      errors: errors,
      data: data
    };
  }


  static _fail(message) {
    return {
      ok: false,
      errors: [message],
      data: null
    };
  }


  /**
   * 強制バリデーション（例外投げる版）
   */
  static assert(condition, message) {
    if (!condition) {
      throw new Error(`[ΩMAX VALIDATION ERROR] ${message}`);
    }
  }


  /**
   * FeatureEngine用安全フィルタ
   * → 壊れた特徴量を0補正
   */
  static sanitizeFeatures(features) {
    const clean = {};

    Object.keys(features || {}).forEach(key => {
      let v = features[key];

      if (typeof v !== "number" || isNaN(v)) {
        v = 0;
      }

      // 無限値対策
      if (!isFinite(v)) v = 0;

      clean[key] = v;
    });

    return clean;
  }
}
