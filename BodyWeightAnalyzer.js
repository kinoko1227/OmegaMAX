/**
 * ==========================================================
 * ΩMAX AIOS
 * BodyWeightAnalyzer.js
 * ----------------------------------------------------------
 * 馬体重解析
 *
 * 「増えた・減った」ではなく
 * 「その馬にとって意味のある変化か」
 * を評価する。
 * ==========================================================
 */

class BodyWeightAnalyzer {

  static analyze(horse, profile, context) {

    const result = {
      score: 50,
      confidence: 0,
      sample: 0,
      reasons: [],
      evidence: {}
    };

    if (!horse) {
      return result;
    }

    const body = horse.bodyWeight || {};

    this.analyzeCurrent(body, profile, result);
    this.analyzeTrend(body, result);
    this.analyzePattern(body, profile, result);
    this.analyzeHorseFit(body, profile, result);
    this.analyzeContextFit(body, context, result);

    result.sample = profile?.sample || 0;

    result.confidence =
      Math.min(100, Math.sqrt(result.sample) * 4);

    result.score =
      Utils.clamp(result.score, 0, 100);

    return result;
  }

  /**
   * 現在体重
   */
  static analyzeCurrent(body, profile, result) {

    const range = profile?.bestWeightRange;

    if (
      range &&
      body.current != null &&
      body.current >= range.min &&
      body.current <= range.max
    ) {

      result.score += 15;
      result.reasons.push("ベスト体重帯");

    }

  }

  /**
   * 推移
   */
  static analyzeTrend(body, result) {

    if ((body.history || []).length >= 2) {

      result.reasons.push("体重推移確認");

      // v2
      // 増減傾向を解析

    }

  }

  /**
   * パターン
   */
  static analyzePattern(body, profile, result) {

    if (
      profile?.bestWeightPattern &&
      body.pattern === profile.bestWeightPattern
    ) {

      result.score += 10;

      result.reasons.push("得意体重パターン");

    }

  }

  /**
   * 馬との相性
   */
  static analyzeHorseFit(body, profile, result) {

    if (profile?.preferredWeightScore) {

      result.score +=
        profile.preferredWeightScore;

    }

  }

  /**
   * レースとの相性
   */
  static analyzeContextFit(body, context, result) {

    result.evidence = {

      currentWeight:
        body.current || null,

      previousWeight:
        body.previous || null,

      change:
        body.change || null,

      history:
        body.history || [],

      raceClass:
        context?.raceState?.className || ""

    };

  }

}
