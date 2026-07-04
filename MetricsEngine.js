class MetricsEngine {

  /**
   * 完全評価指標
   */
  static analyze(history) {

    let profit = 0;
    let peak = 0;
    let maxDrawdown = 0;

    history.forEach(h => {

      profit += h.pnl;

      if (h.bankroll > peak) {
        peak = h.bankroll;
      }

      const dd = peak - h.bankroll;

      if (dd > maxDrawdown) {
        maxDrawdown = dd;
      }
    });

    return {
      totalProfit: profit,
      roi: profit / 100000,
      trades: history.length,
      maxDrawdown: maxDrawdown,
      finalBankroll: history.length
        ? history[history.length - 1].bankroll
        : 100000
    };
  }
}
