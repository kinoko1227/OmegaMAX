/**
 * ==========================================================
 * ΩMAX AIOS
 * StateModel.js
 * ----------------------------------------------------------
 * 全State共通基底クラス
 * ----------------------------------------------------------
 * HorseState
 * RaceState
 * MarketState
 * TimeState
 *
 * 全てこのクラスを継承する。
 * ==========================================================
 */

class StateModel {

  /**
   * @param {string} name
   */
  constructor(name = "") {

    this.name = name;

    // 状態スコア（0〜100）
    this.score = 0;

    // 信頼度（0〜100）
    this.confidence = 0;

    // サンプル数
    this.sample = 0;

    // Contextによる重み
    this.weight = 1.0;

    // 評価理由
    this.reasons = [];

    // 更新日時
    this.updatedAt = null;
  }

  /**
   * スコア設定
   */
  setScore(score) {
    this.score = Utils.clamp(Number(score) || 0, 0, 100);
    return this;
  }

  /**
   * 信頼度設定
   */
  setConfidence(confidence) {
    this.confidence = Utils.clamp(Number(confidence) || 0, 0, 100);
    return this;
  }

  /**
   * サンプル数設定
   */
  setSample(sample) {
    this.sample = Math.max(0, Number(sample) || 0);
    return this;
  }

  /**
   * 重み設定
   */
  setWeight(weight) {
    this.weight = Math.max(0, Number(weight) || 0);
    return this;
  }

  /**
   * 理由追加
   */
  addReason(reason) {
    if (reason) {
      this.reasons.push(String(reason));
    }
    return this;
  }

  /**
   * 更新日時
   */
  touch(date = new Date()) {
    this.updatedAt = date;
    return this;
  }

  /**
   * 最終スコア
   *
   * score × weight
   */
  getFinalScore() {
    return this.score * this.weight;
  }

  /**
   * 信頼度係数
   */
  getConfidenceRate() {
    return this.confidence / 100;
  }

  /**
   * JSON化
   */
  toJSON() {
    return {
      name: this.name,
      score: this.score,
      confidence: this.confidence,
      sample: this.sample,
      weight: this.weight,
      finalScore: this.getFinalScore(),
      reasons: [...this.reasons],
      updatedAt: this.updatedAt
    };
  }

}
