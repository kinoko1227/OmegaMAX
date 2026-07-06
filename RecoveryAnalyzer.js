/**
 * ==========================================================
 * ΩMAX AIOS
 * RecoveryAnalyzer.js
 * ----------------------------------------------------------
 * 回復解析
 *
 * 「休養日数が長いか」ではなく
 * 「その馬が能力を発揮できるだけ回復しているか」
 * を評価する。
 * ==========================================================
 */

class RecoveryAnalyzer {

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

    this.analyzeCurrent(horse, profile, result);
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
   * 現在の回復状態
   */
  static analyzeCurrent(horse, profile, result) {

    const days =
      horse.intervalDays || horse.daysSinceLastRace || 0;

    const best =
      profile?.bestIntervalDays;

    if (best && days > 0) {

      const diff = Math.abs(days - best);

      if (diff <= 7) {
        result.score += 20;
        result.reasons.push("得意ローテーション");
      } else if (diff <= 21) {
        result.score += 8;
        result.reasons.push("許容ローテーション");
      } else {
        result.score -= 8;
        result.reasons.push("ローテーション差あり");
      }

    }

  }

  /**
   * 回復推移
   */
  static analyzeTrend(horse, result) {

    const history = horse.recoveryHistory || [];

    if (history.length >= 2) {
      result.reasons.push("回復推移確認");
    }

  }

  /**
   * 回復パターン
   */
  static analyzePattern(horse, profile, result) {

    if (
      profile?.preferredRecoveryPattern &&
      horse.recoveryPattern === profile.preferredRecoveryPattern
    ) {
      result.score += 10;
      result.reasons.push("得意回復パターン");
    }

  }

  /**
   * 馬との相性
   */
  static analyzeHorseFit(horse, profile, result) {

    if (profile?.preferredRecoveryScore) {
      result.score += profile.preferredRecoveryScore;
    }

  }

  /**
   * レースとの相性
   */
  static analyzeContextFit(horse, context, result) {

    result.evidence = {
      intervalDays: horse.intervalDays || horse.daysSinceLastRace || 0,
      recoveryPattern: horse.recoveryPattern || "",
      raceClass: context?.raceState?.className || "",
      raceDate: context?.race?.date || null
    };

  }

}
