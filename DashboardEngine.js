class DashboardEngine {

  /**
   * メインレポート生成
   */
  static generate() {

    const history = OmegaState.loadHistory() || [];
    const bankroll = OmegaState.loadBankroll() || 100000;
    const weights = OmegaState.getWeights?.() || {};

    return {
      bankroll: this._bankroll(bankroll, history),
      performance: this._performance(history),
      evGap: this._evGap(history),
      learning: this._learningState(weights),
      summary: this._summary(history)
    };
  }


  //////////////////////////////
  // ① 資金推移
  //////////////////////////////
  static _bankroll(current, history) {

    const curve = [];

    let base = 100000;

    history.forEach(h => {
      base += h.pnl || 0;
      curve.push(base);
    });

    return {
      current: current,
      curve: curve,
      profit: current - 100000,
      roi: (current - 100000) / 100000
    };
  }


  //////////////////////////////
  // ② パフォーマンス
  //////////////////////////////
  static _performance(history) {

    let wins = 0;
    let total = history.length;
    let profit = 0;

    history.forEach(h => {
      if (h.pnl > 0) wins++;
      profit += h.pnl;
    });

    return {
      winRate: total ? wins / total : 0,
      avgProfit: total ? profit / total : 0,
      totalProfit: profit,
      trades: total
    };
  }


  //////////////////////////////
  // ③ EV vs 実収益ギャップ
  //////////////////////////////
  static _evGap(history) {

    let evSum = 0;
    let pnlSum = 0;

    history.forEach(h => {
      evSum += h.ev || 0;
      pnlSum += h.pnl || 0;
    });

    return {
      ev: evSum,
      pnl: pnlSum,
      gap: pnlSum - evSum,
      ratio: evSum ? pnlSum / evSum : 0
    };
  }


  //////////////////////////////
  // ④ 学習状態
  //////////////////////////////
  static _learningState(weights) {

    const keys = Object.keys(weights);

    const avg =
      keys.reduce((a, k) => a + weights[k], 0) / (keys.length || 1);

    return {
      weightCount: keys.length,
      averageWeight: avg,
      dispersion: this._variance(weights)
    };
  }


  //////////////////////////////
  // ⑤ 分散
  //////////////////////////////
  static _variance(weights) {

    const vals = Object.values(weights);

    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);

    return vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length || 1);
  }


  //////////////////////////////
  // ⑥ サマリー
  //////////////////////////////
  static _summary(history) {

    return {
      status: history.length > 0 ? "ACTIVE" : "IDLE",
      stability: history.length > 50 ? "STABLE" : "WARMUP",
      maturity: history.length / 500
    };
  }
}
