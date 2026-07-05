/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * BacktestEngine.js
 * ----------------------------------------------------------
 * 的中判定・資金推移・回収率計算
 * TicketEngine結果 → 検証結果
 * ==========================================================
 */

class BacktestEngine {

  static run(races, bankroll = CONFIG.BANKROLL.INITIAL) {
    const safeRaces = Array.isArray(races) ? races : [];
    const results = DataSource.getResults();

    let currentBankroll = Utils.toNumber(bankroll, CONFIG.BANKROLL.INITIAL);
    let maxBankroll = currentBankroll;
    let maxDrawdown = 0;

    const history = [];

    safeRaces.forEach(race => {
      const result = results[race.id];

      if (!result) {
        history.push({
          raceId: race.id,
          skipped: true,
          reason: "NO_RESULT",
          bankroll: currentBankroll
        });
        return;
      }

      const featureSet = FeatureEngine.buildRace(race);

      const coreResults = featureSet.map(f =>
        CoreEngine.evaluate(race, f)
      );

      const ticketResult = TicketEngine.build(
        race,
        coreResults,
        currentBankroll
      );

      const settled = this.settleTickets(
        ticketResult.tickets,
        result
      );

      currentBankroll += settled.profit;

      maxBankroll = Math.max(maxBankroll, currentBankroll);

      const drawdown =
        maxBankroll > 0
          ? (maxBankroll - currentBankroll) / maxBankroll
          : 0;

      maxDrawdown = Math.max(maxDrawdown, drawdown);

      history.push({
        raceId: race.id,
        result: result,
        coreResults: coreResults,
        tickets: ticketResult.tickets,
        settled: settled,
        bankroll: currentBankroll
      });
    });

    const totalBet = Utils.sum(
      history.map(h => h.settled ? h.settled.totalBet : 0)
    );

    const totalReturn = Utils.sum(
      history.map(h => h.settled ? h.settled.totalReturn : 0)
    );

    return {
      initialBankroll: bankroll,
      finalBankroll: currentBankroll,
      profit: currentBankroll - bankroll,
      returnRate: totalBet > 0 ? Utils.round(totalReturn / totalBet, 4) : 1,
      totalBet: totalBet,
      totalReturn: totalReturn,
      maxDrawdown: Utils.round(maxDrawdown, 4),
      races: safeRaces.length,
      history: history
    };
  }

  static settleTickets(tickets, result) {
    const safeTickets = Array.isArray(tickets) ? tickets : [];

    let totalBet = 0;
    let totalReturn = 0;
    const details = [];

    safeTickets.forEach(ticket => {
      const amount = Utils.toNumber(ticket.amount, 0);
      totalBet += amount;

      const hit = this.isHit(ticket, result);
      const payoutRate = hit ? this.estimatePayoutRate(ticket) : 0;
      const returned = hit ? amount * payoutRate : 0;

      totalReturn += returned;

      details.push({
        ticket: ticket,
        hit: hit,
        amount: amount,
        payoutRate: payoutRate,
        returnAmount: returned,
        profit: returned - amount
      });
    });

    return {
      totalBet: totalBet,
      totalReturn: totalReturn,
      profit: totalReturn - totalBet,
      hitCount: details.filter(d => d.hit).length,
      details: details
    };
  }

  static isHit(ticket, result) {
    if (!ticket || !result) return false;

    const winner = String(result.winner || "");
    const places = Array.isArray(result.place)
      ? result.place.map(x => String(x))
      : [];

    if (ticket.type === TICKET_TYPE.WIN) {
      return String(ticket.horseId) === winner;
    }

    const horses = Array.isArray(ticket.horses)
      ? ticket.horses.map(x => String(x))
      : [];

    if (ticket.type === TICKET_TYPE.WIDE) {
      return horses.every(h => places.indexOf(h) >= 0);
    }

    if (ticket.type === TICKET_TYPE.QUINELLA) {
      return horses.length === 2 &&
        horses.indexOf(winner) >= 0 &&
        places.indexOf(horses[0]) >= 0 &&
        places.indexOf(horses[1]) >= 0;
    }

    if (ticket.type === TICKET_TYPE.EXACTA) {
      return horses.length >= 2 &&
        horses[0] === winner &&
        places.length >= 2 &&
        horses[1] === places[1];
    }

    if (ticket.type === TICKET_TYPE.TRIO) {
      return horses.length === 3 &&
        horses.every(h => places.indexOf(h) >= 0);
    }

    if (ticket.type === TICKET_TYPE.TRIFECTA) {
      return horses.length === 3 &&
        places.length >= 3 &&
        horses[0] === places[0] &&
        horses[1] === places[1] &&
        horses[2] === places[2];
    }

    return false;
  }

  static estimatePayoutRate(ticket) {
    if (!ticket) return 0;

    if (ticket.type === TICKET_TYPE.WIN) return Math.max(1.1, Utils.toNumber(ticket.ev, 1));
    if (ticket.type === TICKET_TYPE.WIDE) return 2.0;
    if (ticket.type === TICKET_TYPE.QUINELLA) return 5.0;
    if (ticket.type === TICKET_TYPE.EXACTA) return 10.0;
    if (ticket.type === TICKET_TYPE.TRIO) return 15.0;
    if (ticket.type === TICKET_TYPE.TRIFECTA) return 50.0;

    return 0;
  }
}
