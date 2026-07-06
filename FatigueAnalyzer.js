/**
 * ==========================================================
 * ΩMAX AIOS
 * FatigueAnalyzer.js
 * ----------------------------------------------------------
 * 疲労解析
 *
 * 「休み明け」ではなく
 * 「能力発揮を妨げる疲労が残っているか」
 * を評価する。
 * ==========================================================
 */

class FatigueAnalyzer {

  static analyze(horse, profile, context) {

    const result = {
      score: 100,
      confidence: 0,
      trend: "→",
      sample: 0,
      reasons: [],
      evidence: {}
    };

    if (!horse) {
      return result;
    }

    this.analyzeCurrent(horse, result);
    this.analyzeTrend(horse, result);
    this.analyzePattern(horse, profile, result);
    this.analyzeHorseFit(horse, profile, result);
    this.analyzeContextFit(horse, context, result);

    result.sample = profile?.sample || 0;

    result.confidence =
      Math.min(100, Math.sqrt(result.sample) * 4);

    result.score =
      Utils.clamp(result.score, 0, 100);

    return result;

  }

  /**
   * 現在の疲労
   */
  static analyzeCurrent(horse, result) {

    if (horse.fatigueIndex != null) {

      result.score -= horse.fatigueIndex;

      result.reasons.push("現在疲労評価");

    }

  }

  /**
   * 疲労推移
   */
  static analyzeTrend(horse, result) {

    const history = horse.fatigueHistory || [];

    if (history.length >= 2) {

      result.reasons.push("疲労推移確認");

      // v2
      // 回復傾向を解析

    }

  }

  /**
   * 馬固有パターン
   */
  static analyzePattern(horse, profile, result) {

    if (profile?.preferredRecoveryPattern) {

      result.reasons.push("回復パターン比較");

    }

  }

  /**
   * 馬との相性
   */
  static analyzeHorseFit(horse, profile, result) {

    if (
      profile?.fatigueTolerance != null &&
      horse.fatigueIndex != null &&
      horse.fatigueIndex <= profile.fatigueTolerance
    ) {

      result.score += 5;

      result.reasons.push("疲労耐性あり");

    }

  }

  /**
   * レースとの相性
   */
  static analyzeContextFit(horse, context, result) {

    result.evidence = {

      fatigueIndex:
        horse.fatigueIndex || 0,

      intervalDays:
        horse.intervalDays || 0,

      raceClass:
        context?.raceState?.className || ""

    };

  }

}
