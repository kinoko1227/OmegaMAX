/**
 * ==========================================================
 * ΩMAX AIOS
 * TimeState.js
 * ----------------------------------------------------------
 * Time State
 *
 * 時間軸による変化を管理する
 * ==========================================================
 */

class TimeState extends StateModel {

  constructor() {

    super("TimeState");

    // -------------------------
    // 基本
    // -------------------------

    this.horseId = "";

    this.raceDate = null;

    this.age = 0;

    this.career = 0;

    // -------------------------
    // 成長
    // -------------------------

    this.growthPhase = "";

    this.maturity = 0;

    this.peakPrediction = 0;

    this.declinePrediction = 0;

    // -------------------------
    // ローテーション
    // -------------------------

    this.daysSinceLastRace = 0;

    this.intervalCategory = "";

    this.recoveryDays = 0;

    // -------------------------
    // 季節
    // -------------------------

    this.season = "";

    this.month = 0;

    // -------------------------
    // 履歴
    // -------------------------

    this.recentForm = [];

    this.timelineScore = 0;

    // -------------------------
    // 将来予測
    // -------------------------

    this.futureTrend = "";

  }

  /**
   * 上昇局面判定
   */
  isImproving() {

    return this.futureTrend === "UP";

  }

  /**
   * 完成期判定
   */
  isPeak() {

    return this.growthPhase === "PEAK";

  }

  /**
   * JSON
   */
  toJSON() {

    return {

      ...super.toJSON(),

      horseId: this.horseId,

      raceDate: this.raceDate,

      age: this.age,

      career: this.career,

      growthPhase: this.growthPhase,

      maturity: this.maturity,

      peakPrediction: this.peakPrediction,

      declinePrediction: this.declinePrediction,

      daysSinceLastRace: this.daysSinceLastRace,

      intervalCategory: this.intervalCategory,

      recoveryDays: this.recoveryDays,

      season: this.season,

      month: this.month,

      recentForm: this.recentForm,

      timelineScore: this.timelineScore,

      futureTrend: this.futureTrend

    };

  }

}
