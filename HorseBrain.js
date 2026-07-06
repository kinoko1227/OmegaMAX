/**
 * ==========================================================
 * ΩMAX AIOS
 * HorseBrain.js
 * ----------------------------------------------------------
 * Horse Brain
 *
 * Analyzer結果を統合し、
 * 今日の能力発揮率を決定する。
 * ==========================================================
 */

class HorseBrain {

  /**
   * 馬評価
   *
   * @param {Object} analyzers
   * @returns {Object}
   */
  static evaluate(analyzers = {}) {

    const inference = analyzers.inference || {};

    const performanceRate =
      Utils.clamp(
        inference.performanceRate || 1.0,
        0,
        2
      );

    const risk =
      Utils.clamp(
        inference.risk || 0,
        0,
        1
      );

    const volatility =
      Utils.clamp(
        inference.volatility || 0,
        0,
        1
      );

    return {

      performanceRate,

      risk,

      volatility,

      confidence:
        this.calculateConfidence(analyzers),

      score:
        this.calculateScore(
          analyzers,
          performanceRate
        ),

      reasons:
        inference.reasons || [],

      appliedRules:
        inference.appliedRules || []

    };

  }

  /**
   * 総合評価
   */
  static calculateScore(
    analyzers,
    performanceRate
  ) {

    const values = [];

    Object.keys(analyzers).forEach(key => {

      if (key === "inference") return;

      const analyzer = analyzers[key];

      if (
        analyzer &&
        typeof analyzer.score === "number"
      ) {

        values.push(analyzer.score);

      }

    });

    if (!values.length) {

      return 0;

    }

    const average =
      values.reduce(
        (a, b) => a + b,
        0
      ) / values.length;

    return Utils.clamp(
      average * performanceRate,
      0,
      100
    );

  }

  /**
   * 信頼度
   */
  static calculateConfidence(
    analyzers
  ) {

    const values = [];

    Object.keys(analyzers).forEach(key => {

      if (key === "inference") return;

      const analyzer = analyzers[key];

      if (
        analyzer &&
        typeof analyzer.confidence === "number"
      ) {

        values.push(
          analyzer.confidence
        );

      }

    });

    if (!values.length) {

      return 0;

    }

    return values.reduce(
      (a, b) => a + b,
      0
    ) / values.length;

  }

}
