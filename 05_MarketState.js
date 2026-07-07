/**
 * ==========================================================
 * ΩMAX AIOS
 * MarketState.js
 * ----------------------------------------------------------
 * Market State
 *
 * 市場心理・期待値を管理する
 * ==========================================================
 */

class MarketState extends StateModel {

  constructor() {

    super("MarketState");

    // -------------------------
    // 基本情報
    // -------------------------

    this.horseId = "";

    this.raceId = "";

    // -------------------------
    // オッズ
    // -------------------------

    this.currentOdds = 0;

    this.fairOdds = 0;

    this.expectedValue = 0;

    this.kellyRatio = 0;

    // -------------------------
    // 人気
    // -------------------------

    this.popularity = 0;

    this.marketConfidence = 0;

    // -------------------------
    // 市場分析
    // -------------------------

    this.marketBias = 0;

    this.overValue = 0;

    this.underValue = 0;

    this.moneyFlow = 0;

    this.lateOddsMove = 0;

    // -------------------------
    // 投資判断
    // -------------------------

    this.betValue = false;

    this.betRank = "";

  }

  /**
   * EV判定
   */
  isPositiveEV() {

    return this.expectedValue >= 1.0;

  }

  /**
   * 投資対象判定
   */
  isBetTarget() {

    return this.betValue;

  }

  /**
   * JSON
   */
  toJSON() {

    return {

      ...super.toJSON(),

      horseId: this.horseId,

      raceId: this.raceId,

      currentOdds: this.currentOdds,

      fairOdds: this.fairOdds,

      expectedValue: this.expectedValue,

      kellyRatio: this.kellyRatio,

      popularity: this.popularity,

      marketConfidence: this.marketConfidence,

      marketBias: this.marketBias,

      overValue: this.overValue,

      underValue: this.underValue,

      moneyFlow: this.moneyFlow,

      lateOddsMove: this.lateOddsMove,

      betValue: this.betValue,

      betRank: this.betRank

    };

  }

}
