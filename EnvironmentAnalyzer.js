/**
 * ==========================================================
 * ΩMAX AIOS
 * EnvironmentAnalyzer.js
 * ----------------------------------------------------------
 * Environment Analyzer
 *
 * 環境適応解析
 *
 * 「輸送を見る」のではなく
 * 「環境変化に適応できる馬か」
 * を解析する。
 *
 * HorseProfile.adaptability を学習・利用する。
 * ==========================================================
 */

class EnvironmentAnalyzer {

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

    this.analyzeCurrent(
      horse,
      profile,
      context,
      result
    );

    this.analyzeTrend(
      horse,
      result
    );

    this.analyzePattern(
      horse,
      profile,
      result
    );

    this.analyzeHorseFit(
      horse,
      profile,
      result
    );

    this.analyzeContextFit(
      horse,
      context,
      result
    );

    result.sample =
      profile?.adaptabilitySample ||
      profile?.sample ||
      0;

    result.confidence =
      Math.min(
        100,
        Math.sqrt(result.sample) * 4
      );

    result.score =
      Utils.clamp(
        result.score,
        0,
        100
      );

    return result;

  }

  /**
   * 現在の環境
   */
  static analyzeCurrent(
    horse,
    profile,
    context,
    result
  ) {

    const env =
      horse.environment || {};

    // ---------------------
    // Adaptability
    // ---------------------

    if (
      profile &&
      typeof profile.adaptability === "number"
    ) {

      result.score +=
        (profile.adaptability - 50) * 0.30;

      result.reasons.push(
        "環境適応力反映"
      );

    }

    // ---------------------
    // 初コース
    // ---------------------

    if (env.firstCourse) {

      result.reasons.push(
        "初コース"
      );

    }

    // ---------------------
    // 初ナイター
    // ---------------------

    if (env.firstNightRace) {

      result.reasons.push(
        "初ナイター"
      );

    }

    // ---------------------
    // 長距離輸送
    // ---------------------

    if (
      env.transportDistance &&
      env.transportDistance > 500
    ) {

      result.reasons.push(
        "長距離輸送"
      );

    }

  }

  /**
   * 環境変化推移
   */
  static analyzeTrend(
    horse,
    result
  ) {

    const history =
      horse.environmentHistory || [];

    if (
      history.length >= 2
    ) {

      result.reasons.push(
        "環境変化履歴"
      );

    }

  }

  /**
   * 得意環境
   */
  static analyzePattern(
    horse,
    profile,
    result
  ) {

    const env =
      horse.environment || {};

    if (
      profile?.preferredEnvironment &&
      env.type ===
      profile.preferredEnvironment
    ) {

      result.score += 10;

      result.reasons.push(
        "得意環境"
      );

    }

    if (
      profile?.preferredEnvironmentChanges
        ?.includes(env.changeType)
    ) {

      result.score += 8;

      result.reasons.push(
        "得意環境変化"
      );

    }

    if (
      profile?.weakEnvironmentChanges
        ?.includes(env.changeType)
    ) {

      result.score -= 10;

      result.reasons.push(
        "苦手環境変化"
      );

    }

  }

  /**
   * 馬固有適応力
   */
  static analyzeHorseFit(
    horse,
    profile,
    result
  ) {

    if (
      profile?.environmentTolerance
    ) {

      result.score +=
        profile.environmentTolerance;

    }

  }

  /**
   * レースとの適合
   */
  static analyzeContextFit(
    horse,
    context,
    result
  ) {

    const env =
      horse.environment || {};

    result.evidence = {

      adaptability:
        horse.profile?.adaptability ??
        null,

      transportDistance:
        env.transportDistance || 0,

      firstCourse:
        env.firstCourse || false,

      firstNightRace:
        env.firstNightRace || false,

      environmentType:
        env.type || "",

      environmentChange:
        env.changeType || "",

      course:
        context?.race?.track || "",

      weather:
        context?.weather || "",

      raceClass:
        context?.raceState?.className || ""

    };

  }

}
