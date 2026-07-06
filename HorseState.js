/**
 * ==========================================================
 * ΩMAX AIOS
 * HorseState.js
 * ----------------------------------------------------------
 * Horse State
 *
 * 馬個体の「今日の状態」を表現するクラス
 * ==========================================================
 */

class HorseState extends StateModel {

  constructor() {

    super("HorseState");

    // -------------------------
    // 基礎能力
    // -------------------------

    this.baseAbility = 0;

    // -------------------------
    // 状態
    // -------------------------

    this.condition = 0;

    this.training = 0;

    this.bodyWeight = 0;

    this.fatigue = 0;

    this.recovery = 0;

    this.transportation = 0;

    this.mental = 0;

    // -------------------------
    // 成長
    // -------------------------

    this.growth = 0;

    this.maturity = 0;

    this.decline = 0;

    // -------------------------
    // 適性
    // -------------------------

    this.surfaceFitness = 0;

    this.distanceFitness = 0;

    this.courseFitness = 0;

    this.trackFitness = 0;

    this.paceFitness = 0;

    this.runningStyleFitness = 0;

    // -------------------------
    // リスク
    // -------------------------

    this.risk = 0;

    // -------------------------
    // 能力発揮率
    // -------------------------

    this.performanceRate = 1.0;

  }

  /**
   * 今日の能力
   *
   * BaseAbility × PerformanceRate
   */
  getTodayAbility() {

    return this.baseAbility * this.performanceRate;

  }

  /**
   * JSON
   */
  toJSON() {

    return {

      ...super.toJSON(),

      baseAbility: this.baseAbility,

      condition: this.condition,

      training: this.training,

      bodyWeight: this.bodyWeight,

      fatigue: this.fatigue,

      recovery: this.recovery,

      transportation: this.transportation,

      mental: this.mental,

      growth: this.growth,

      maturity: this.maturity,

      decline: this.decline,

      surfaceFitness: this.surfaceFitness,

      distanceFitness: this.distanceFitness,

      courseFitness: this.courseFitness,

      trackFitness: this.trackFitness,

      paceFitness: this.paceFitness,

      runningStyleFitness: this.runningStyleFitness,

      risk: this.risk,

      performanceRate: this.performanceRate,

      todayAbility: this.getTodayAbility()

    };

  }

}
