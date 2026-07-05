/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * MetricsEngine.js
 * ----------------------------------------------------------
 * 成績指標計算
 * Backtest / Learning / Dashboard 共通
 * ==========================================================
 */

class MetricsEngine {

  static summarize(backtestResult) {
    const result = backtestResult || {};
    const history = Array.isArray(result.history) ? result.history : [];

    const settled = history
      .filter(h => h.settled)
      .map(h => h.settled);

    const totalBet = Utils.sum(
      settled.map(s => s.totalBet)
    );

    const totalReturn = Utils.sum(
      settled.map(s => s.totalReturn)
    );

    const profit = totalReturn - totalBet;

    const hitCount = Utils.sum(
      settled.map(s => s.hitCount)
    );

    const ticketCount = Utils.sum(
      settled.map(s => s.details ? s.details.length : 0)
    );

    const raceCount = history.length;

    return {
      races: raceCount,
      totalBet: totalBet,
      totalReturn: totalReturn,
      profit: profit,
      roi: totalBet > 0 ? Utils.round(totalReturn / totalBet, 4) : 1,
      hitRate: ticketCount > 0 ? Utils.round(hitCount / ticketCount, 4) : 0,
      finalBankroll: result.finalBankroll || CONFIG.BANKROLL.INITIAL,
      maxDrawdown: result.maxDrawdown || 0
    };
  }

  static byTicketType(backtestResult) {
    const history = Array.isArray(backtestResult.history)
      ? backtestResult.history
      : [];

    const map = {};

    history.forEach(h => {
      const details =
        h.settled && Array.isArray(h.settled.details)
          ? h.settled.details
          : [];

      details.forEach(d => {
        const type = d.ticket.type;

        if (!map[type]) {
          map[type] = {
            type: type,
            count: 0,
            hit: 0,
            bet: 0,
            returned: 0,
            profit: 0
          };
        }

        map[type].count += 1;
        map[type].hit += d.hit ? 1 : 0;
        map[type].bet += d.amount;
        map[type].returned += d.returnAmount;
        map[type].profit += d.profit;
      });
    });

    Object.keys(map).forEach(type => {
      const m = map[type];

      m.roi =
        m.bet > 0
          ? Utils.round(m.returned / m.bet, 4)
          : 1;

      m.hitRate =
        m.count > 0
          ? Utils.round(m.hit / m.count, 4)
          : 0;
    });

    return map;
  }

  static save(backtestResult) {
    const summary = this.summarize(backtestResult);

    OmegaState.saveStatistics(summary);

    return summary;
  }
}
