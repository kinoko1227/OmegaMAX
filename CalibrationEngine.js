class CalibrationEngine {

  /**
   * メイン補正
   */
  static calibrate(coreResults, marketData) {

    return coreResults.map(r => {

      const ev = r.ev;

      const marketBias = this._marketBias(r, marketData);

      const drift = this._driftFactor(r);

      const calibratedEV =
        ev * marketBias * drift;

      return {
        ...r,
        rawEV: ev,
        calibratedEV
      };
    });
  }


  //////////////////////////////
  // ① 市場バイアス補正
  //////////////////////////////
  static _marketBias(r, marketData) {

    const odds = marketData[r.horseId]?.odds || 1;

    const popularity = marketData[r.horseId]?.popularity || 0.5;

    // 人気馬は過大評価されやすい
    const popularityPenalty = 1 - (popularity - 0.5) * 0.3;

    // オッズ歪み補正
    const oddsAdjustment = Math.log(odds + 1) / (odds + 1);

    return popularityPenalty * oddsAdjustment;
  }


  //////////////////////////////
  // ② ドリフト補正
  //////////////////////////////
  static _driftFactor(r) {

    const ageFactor = r.horseAge ? 1 - (r.horseAge - 3) * 0.02 : 1;

    const formStability = r.formStability || 1;

    return ageFactor * formStability;
  }
}
