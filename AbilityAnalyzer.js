/**
 * ==========================================================
 * ΩMAX AIOS
 * AbilityAnalyzer.js
 * ----------------------------------------------------------
 * 基礎能力解析
 * ==========================================================
 */

class AbilityAnalyzer {

  /**
   * 基礎能力を解析する
   *
   * @param {Object} horse
   * @param {RaceContext} context
   * @returns {Object}
   */
  static analyze(horse, context) {

    const result = {

      score: 0,

      confidence: 0,

      sample: 0,

      reasons: []

    };

    // TODO:
    // FeatureEngineから能力Feature取得
    // LearningEngine重み取得
    // 能力指数計算

    return result;

  }

}
