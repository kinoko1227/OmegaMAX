/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * TicketEngine.js
 * ----------------------------------------------------------
 * 買い目生成・資金配分
 * CoreEngine結果 → 投資候補
 * ==========================================================
 */

class TicketEngine {

  static build(race, coreResults, bankroll) {
    const safeBankroll = Utils.toNumber(
      bankroll,
      CONFIG.BANKROLL.INITIAL
    );

    const candidates = (coreResults || [])
      .filter(r => r.decision !== DECISION.PASS)
      .sort((a, b) => b.ev - a.ev);

    const tickets = [];

    tickets.push(...this._winTickets(candidates, safeBankroll));
    tickets.push(...this._wideTickets(candidates, safeBankroll));
    tickets.push(...this._quinellaTickets(candidates, safeBankroll));
    tickets.push(...this._exactaTickets(candidates, safeBankroll));
    tickets.push(...this._trioTickets(candidates, safeBankroll));
    tickets.push(...this._trifectaTickets(candidates, safeBankroll));

    return {
      raceId: race.id,
      tickets: tickets
        .filter(t => t.amount >= CONFIG.BANKROLL.MIN_BET)
        .slice(0, CONFIG.TICKET && CONFIG.TICKET.MAX_PER_RACE ? CONFIG.TICKET.MAX_PER_RACE : 8)
    };
  }

  static _winTickets(list, bankroll) {
    return list
      .filter(r => r.decision === DECISION.BUY)
      .slice(0, 2)
      .map(r => ({
        type: TICKET_TYPE.WIN,
        horseId: r.horseId,
        horseName: r.horseName,
        ev: r.ev,
        confidence: r.confidence,
        amount: this._betAmount(bankroll, r.kelly)
      }));
  }

  static _wideTickets(list, bankroll) {
    const top = list.slice(0, 4);
    const tickets = [];

    for (let i = 0; i < top.length; i++) {
      for (let j = i + 1; j < top.length; j++) {
        const ev = Utils.average([top[i].ev, top[j].ev]);

        if (ev < CONFIG.DECISION.WATCH) continue;

        tickets.push({
          type: TICKET_TYPE.WIDE,
          horses: [top[i].horseId, top[j].horseId],
          horseNames: [top[i].horseName, top[j].horseName],
          ev: Utils.round(ev, 4),
          confidence: this._pairConfidence(top[i], top[j]),
          amount: this._fixedAmount(bankroll, 0.01)
        });
      }
    }

    return tickets;
  }

  static _quinellaTickets(list, bankroll) {
    const top = list.slice(0, 3);
    const tickets = [];

    for (let i = 0; i < top.length; i++) {
      for (let j = i + 1; j < top.length; j++) {
        const ev = Utils.average([top[i].ev, top[j].ev]);

        if (ev < CONFIG.DECISION.BUY) continue;

        tickets.push({
          type: TICKET_TYPE.QUINELLA,
          horses: [top[i].horseId, top[j].horseId],
          horseNames: [top[i].horseName, top[j].horseName],
          ev: Utils.round(ev, 4),
          confidence: this._pairConfidence(top[i], top[j]),
          amount: this._fixedAmount(bankroll, 0.008)
        });
      }
    }

    return tickets;
  }

  static _exactaTickets(list, bankroll) {
    const top = list.slice(0, 3);
    const tickets = [];

    for (let i = 0; i < top.length; i++) {
      for (let j = 0; j < top.length; j++) {
        if (i === j) continue;

        const ev = top[i].ev * 0.65 + top[j].ev * 0.35;

        if (ev < CONFIG.DECISION.BUY) continue;

        tickets.push({
          type: TICKET_TYPE.EXACTA,
          horses: [top[i].horseId, top[j].horseId],
          horseNames: [top[i].horseName, top[j].horseName],
          ev: Utils.round(ev, 4),
          confidence: this._pairConfidence(top[i], top[j]),
          amount: this._fixedAmount(bankroll, 0.006)
        });
      }
    }

    return tickets;
  }

  static _trioTickets(list, bankroll) {
    const top = list.slice(0, 5);
    const tickets = [];

    for (let i = 0; i < top.length; i++) {
      for (let j = i + 1; j < top.length; j++) {
        for (let k = j + 1; k < top.length; k++) {
          const ev = Utils.average([top[i].ev, top[j].ev, top[k].ev]);

          if (ev < CONFIG.DECISION.BUY) continue;

          tickets.push({
            type: TICKET_TYPE.TRIO,
            horses: [top[i].horseId, top[j].horseId, top[k].horseId],
            horseNames: [top[i].horseName, top[j].horseName, top[k].horseName],
            ev: Utils.round(ev, 4),
            confidence: this._multiConfidence([top[i], top[j], top[k]]),
            amount: this._fixedAmount(bankroll, 0.005)
          });
        }
      }
    }

    return tickets;
  }

  static _trifectaTickets(list, bankroll) {
    const top = list.slice(0, 4);
    const tickets = [];

    for (let i = 0; i < top.length; i++) {
      for (let j = 0; j < top.length; j++) {
        for (let k = 0; k < top.length; k++) {
          if (i === j || j === k || i === k) continue;

          const ev = top[i].ev * 0.5 + top[j].ev * 0.3 + top[k].ev * 0.2;

          if (ev < CONFIG.EV.TARGET) continue;

          tickets.push({
            type: TICKET_TYPE.TRIFECTA,
            horses: [top[i].horseId, top[j].horseId, top[k].horseId],
            horseNames: [top[i].horseName, top[j].horseName, top[k].horseName],
            ev: Utils.round(ev, 4),
            confidence: this._multiConfidence([top[i], top[j], top[k]]),
            amount: this._fixedAmount(bankroll, 0.003)
          });
        }
      }
    }

    return tickets;
  }

  static _betAmount(bankroll, kelly) {
    const amount = bankroll * Utils.toNumber(kelly, 0);

    return this._roundBet(
      Math.min(amount, bankroll * CONFIG.BANKROLL.MAX_BET_RATE)
    );
  }

  static _fixedAmount(bankroll, rate) {
    return this._roundBet(bankroll * rate);
  }

  static _roundBet(amount) {
    const a = Math.max(CONFIG.BANKROLL.MIN_BET, amount);
    return Math.floor(a / 100) * 100;
  }

  static _pairConfidence(a, b) {
    return this._multiConfidence([a, b]);
  }

  static _multiConfidence(list) {
    const avg = Utils.average(
      list.map(x => Utils.toNumber(x.confidencePoint, 0))
    );

    return CoreEngine.confidenceRank(avg);
  }
}
