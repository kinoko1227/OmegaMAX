/**
 * ==========================================================
 * ΩMAX AIOS
 * KnowledgeCell.js
 * ----------------------------------------------------------
 * Knowledge Cell
 *
 * ΩMAXの知識最小単位
 *
 * 例）
 * 東京1600
 * 坂路
 * 左回り
 * G2
 * 良馬場
 * クッション値9.5
 *
 * 全Profile共通で利用する。
 * ==========================================================
 */

class KnowledgeCell {

  constructor(name = "") {

    // -------------------------
    // 基本
    // -------------------------

    this.name = name;
    this.category = "";

    // -------------------------
    // Observation
    // -------------------------

    this.sample = 0;
    this.runs = 0;

    this.wins = 0;
    this.seconds = 0;
    this.thirds = 0;

    // -------------------------
    // Statistics
    // -------------------------

    this.winRate = 0;
    this.placeRate = 0;

    this.averageFinish = 0;

    this.averageAbility = 0;
    this.averageACE = 0;

    this.averageROI = 0;

    // -------------------------
    // Index
    // -------------------------

    this.score = 50;

    this.confidence = 0;

    // -------------------------
    // History
    // -------------------------

    this.history = [];

    this.lastObservation = null;

    this.updatedAt = null;

    this.version = 1;

  }

  /**
   * 観測追加
   */
  observe(observation = {}) {

    this.sample++;
    this.runs++;

    const finish =
      Number(observation.finish || 0);

    if (finish === 1) this.wins++;
    if (finish === 2) this.seconds++;
    if (finish === 3) this.thirds++;

    this.history.push(observation);

    this.lastObservation = observation;

    this.updatedAt = new Date();

    this.calculate();

    return this;

  }

  /**
   * 再計算
   */
  calculate() {

    if (this.runs <= 0) {

      return this;

    }

    this.winRate =
      this.wins / this.runs;

    this.placeRate =
      (
        this.wins +
        this.seconds +
        this.thirds
      ) / this.runs;

    this.averageFinish =
      this.average("finish");

    this.averageAbility =
      this.average("abilityIndex");

    this.averageACE =
      this.average("aceScore");

    this.averageROI =
      this.average("roi");

    this.confidence =
      Utils.clamp(
        Math.sqrt(this.sample) * 5,
        0,
        100
      );

    this.score =
      Utils.clamp(
        this.placeRate * 70 +
        this.averageAbility * 0.30,
        0,
        100
      );

    return this;

  }

  /**
   * 平均
   */
  average(key) {

    if (!this.history.length) {

      return 0;

    }

    let total = 0;

    let count = 0;

    this.history.forEach(function(h) {

      if (
        h[key] !== undefined &&
        h[key] !== null
      ) {

        total += Number(h[key]);

        count++;

      }

    });

    return count
      ? total / count
      : 0;

  }

  /**
   * Version更新
   */
  bumpVersion() {

    this.version++;

    this.updatedAt = new Date();

    return this;

  }

  /**
   * JSON
   */
  toJSON() {

    return {

      name: this.name,

      category: this.category,

      sample: this.sample,

      runs: this.runs,

      wins: this.wins,

      seconds: this.seconds,

      thirds: this.thirds,

      winRate: this.winRate,

      placeRate: this.placeRate,

      averageFinish: this.averageFinish,

      averageAbility: this.averageAbility,

      averageACE: this.averageACE,

      averageROI: this.averageROI,

      score: this.score,

      confidence: this.confidence,

      history: this.history,

      lastObservation: this.lastObservation,

      updatedAt: this.updatedAt,

      version: this.version

    };

  }

  /**
   * JSON読込
   */
  load(json = {}) {

    Object.assign(this, json);

    return this;

  }

  /**
   * Factory
   */
  static fromJSON(json) {

    return new KnowledgeCell().load(json);

  }

}
