/**
 * ==========================================================
 * ΩMAX AIOS
 * TrainingAnalyzer.js
 * ----------------------------------------------------------
 * 調教解析
 *
 * 「速い調教」ではなく
 * 「その馬に最適な調整過程だったか」
 * を評価する。
 * ==========================================================
 */

class TrainingAnalyzer {

  /**
   * @param {Object} horse
   * @param {HorseProfile} profile
   * @param {RaceContext} context
   * @returns {Object}
   */
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

    const training = horse.training || {};

    //-------------------------
    // ① 調教種類
    //-------------------------

    this.analyzeType(
      training,
      profile,
      result
    );

    //-------------------------
    // ② 調教時計
    //-------------------------

    this.analyzeTime(
      training,
      profile,
      result
    );

    //-------------------------
    // ③ 調教推移
    //-------------------------

    this.analyzeTrend(
      training,
      result
    );

    //-------------------------
    // ④ 調整パターン
    //-------------------------

    this.analyzePattern(
      training,
      profile,
      result
    );

    //-------------------------
    // ⑤ 馬との相性
    //-------------------------

    this.analyzeHorseFit(
      training,
      profile,
      result
    );

    //-------------------------
    // ⑥ レースとの相性
    //-------------------------

    this.analyzeContextFit(
      training,
      context,
      result
    );

    //-------------------------
    // 信頼度
    //-------------------------

    result.sample = profile?.sample || 0;

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
   * 調教種類
   */
  static analyzeType(
    training,
    profile,
    result
  ) {

    if (
      profile?.bestTrainingType &&
      training.type === profile.bestTrainingType
    ) {

      result.score += 10;

      result.reasons.push(
        "得意調教"
      );

    }

  }

  /**
   * 調教時計
   */
  static analyzeTime(
    training,
    profile,
    result
  ) {

    const range =
      profile?.bestTrainingTimeRange;

    if (
      range &&
      training.time != null &&
      training.time >= range.min &&
      training.time <= range.max
    ) {

      result.score += 15;

      result.reasons.push(
        "ベスト調教時計"
      );

    }

  }

  /**
   * 調教推移
   *
   * 点ではなく流れを見る
   */
  static analyzeTrend(
    training,
    result
  ) {

    const trend =
      training.history || [];

    if (
      trend.length >= 2
    ) {

      result.reasons.push(
        "調教推移確認"
      );

      // v1では記録のみ
      // v2で負荷解析を追加

    }

  }

  /**
   * 調整パターン
   *
   * 強→強→馬なり
   * などを見る
   */
  static analyzePattern(
    training,
    profile,
    result
  ) {

    if (
      training.pattern &&
      profile?.bestTrainingPattern &&
      training.pattern ===
      profile.bestTrainingPattern
    ) {

      result.score += 15;

      result.reasons.push(
        "得意調整パターン"
      );

    }

  }

  /**
   * 馬との相性
   */
  static analyzeHorseFit(
    training,
    profile,
    result
  ) {

    if (
      profile?.preferredTrainingScore
    ) {

      result.score +=
        profile.preferredTrainingScore;

    }

  }

  /**
   * レースとの相性
   *
   * GⅠなどで仕上げが変わる
   */
  static analyzeContextFit(
    training,
    context,
    result
  ) {

    if (
      !context ||
      !context.raceState
    ) {

      return;

    }

    // v1では保持のみ
    result.evidence = {

      raceClass:
        context.raceState.className,

      trainingType:
        training.type || "",

      trainingTime:
        training.time || null,

      trainingPattern:
        training.pattern || "",

      trainingHistory:
        training.history || []

    };

  }

}
