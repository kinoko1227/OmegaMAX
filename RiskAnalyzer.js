/**
 * ==========================================================
 * ΩMAX AIOS
 * RiskAnalyzer.js
 * ----------------------------------------------------------
 * リスク解析
 *
 * 「弱点探し」ではなく、
 * 今日その馬が能力を発揮できない可能性を評価する。
 * ==========================================================
 */

class RiskAnalyzer {

  static analyze(horse, profile, context) {

    const result = {
      score: 50,
      confidence: 0,
      trend: "→",
      sample: 0,
      reasons: [],
      evidence: {}
    };

    if (!horse) {
      return result;
    }

    this.analyzeCurrent(horse, profile, context, result);
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
   * 現在リスク
   */
  static analyzeCurrent(horse, profile, context, result) {

    const risk = horse.risk || {};

    if (risk.lamenessConcern) {
      result.score -= 20;
      result.reasons.push("脚元不安");
    }

    if (risk.longLayoff) {
      result.score -= 10;
      result.reasons.push("長期休養明け");
    }

    if (risk.overRaced) {
      result.score -= 10;
      result.reasons.push("使い詰め");
    }

    if (risk.jockeyChange) {
      result.score -= 5;
      result.reasons.push("騎手変更");
    }

    if (risk.firstCondition) {
      result.score -= 5;
      result.reasons.push("初条件");
    }

  }

  /**
   * リスク推移
   */
  static analyzeTrend(horse, result) {

    const history = horse.riskHistory || [];

    if (history.length >= 2) {
      result.reasons.push("リスク推移確認");
    }

  }

  /**
   * リスクパターン
   */
  static analyzePattern(horse, profile, result) {

    const risk = horse.risk || {};

    if (
      profile?.weakConditions &&
      Array.isArray(profile.weakConditions)
    ) {
      profile.weakConditions.forEach(condition => {
        if (risk[condition]) {
          result.score -= 8;
          result.reasons.push("苦手条件: " + condition);
        }
      });
    }

  }

  /**
   * 馬固有リスク耐性
   */
  static analyzeHorseFit(horse, profile, result) {

    if (profile?.riskTolerance != null) {
      result.score += profile.riskTolerance;
    }

  }

  /**
   * レース条件とのリスク適合
   */
  static analyzeContextFit(horse, context, result) {

    const risk = horse.risk || {};

    result.evidence = {
      lamenessConcern: risk.lamenessConcern || false,
      longLayoff: risk.longLayoff || false,
      overRaced: risk.overRaced || false,
      jockeyChange: risk.jockeyChange || false,
      firstCondition: risk.firstCondition || false,
      raceClass: context?.raceState?.className || "",
      fieldSize: context?.raceState?.fieldSize || 0
    };

  }

}
