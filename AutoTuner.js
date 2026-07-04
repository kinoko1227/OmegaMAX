class AutoTuner {

  /**
   * メイン：システム全体最適化
   */
  static tune(history) {

    const metrics = this._analyze(history);

    const adjustments = this._calcAdjustments(metrics);

    this._apply(adjustments);

    return adjustments;
  }


  //////////////////////////////
  // ① 分析
  //////////////////////////////
  static _analyze(history) {

    let evSum = 0;
    let pnlSum = 0;
    let winCount = 0;

    history.forEach(h => {

      evSum += h.ev || 0;
      pnlSum += h.pnl || 0;

      if (h.pnl > 0) winCount++;
    });

    return {
      ev: evSum,
      pnl: pnlSum,
      winRate: winCount / (history.length || 1),
      edge: pnlSum - evSum,
      stability: this._stability(history)
    };
  }


  //////////////////////////////
  // ② 安定性評価
  //////////////////////////////
  static _stability(history) {

    if (history.length < 10) return 0.5;

    let variance = 0;

    const pnls = history.map(h => h.pnl || 0);

    const mean =
      pnls.reduce((a, b) => a + b, 0) / pnls.length;

    pnls.forEach(p => {
      variance += Math.pow(p - mean, 2);
    });

    return 1 / (1 + variance / pnls.length);
  }


  //////////////////////////////
  // ③ 調整値計算
  //////////////////////////////
  static _calcAdjustments(m) {

    const adjustments = {};

    // EVが過大 → 学習率下げる
    if (m.ev > m.pnl) {
      adjustments.learningRate = 0.008;
    } else {
      adjustments.learningRate = 0.012;
    }

    // 勝率低い → リスク減
    if (m.winRate < 0.3) {
      adjustments.betRatio = 0.7;
    }

    // 不安定 → 保守化
    if (m.stability < 0.5) {
      adjustments.marketBias = 0.9;
    }

    return adjustments;
  }


  //////////////////////////////
  // ④ 適用
  //////////////////////////////
  static _apply(a) {

    const current = OmegaState.get("systemParams") || {};

    const updated = {
      ...current,
      ...a
    };

    OmegaState.set("systemParams", updated);
  }
}
