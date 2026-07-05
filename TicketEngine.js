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
        .sort((a, b) => b.ev - a.ev)
        .slice(0, CONFIG.TICKET.MAX_PER_RACE)
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
        amount: this._confidenceBetAmount(bankroll, r)
      }));
  }

  static _wideTickets(list, bankroll) {
    return this._pairTickets(
      list.slice(0, 4),
      bankroll,
      TICKET_TYPE.WIDE,
      CONFIG.DECISION.WATCH,
      0.010
    );
  }

  static _quinellaTickets(list, bankroll) {
    return this._pairTickets(
      list.slice(0, 3),
      bankroll,
      TICKET_TYPE.QUINELLA,
      CONFIG.DECISION.BUY,
      0.008
    );
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
          confidence: this._multiConfidence([top[i], top[j]]),
          amount: this._confidenceFixedAmount(bankroll, [top[i], top[j]], 0.006)
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
          const trio = [top[i], top[j], top[k]];
          const ev = Utils.average(trio.map(x => x.ev));

          if (ev < CONFIG.DECISION.BUY) continue;

          tickets.push({
            type: TICKET_TYPE.TRIO,
            horses: trio.map(x => x.horseId),
            horseNames: trio.map(x => x.horseName),
            ev: Utils.round(ev, 4),
            confidence: this._multiConfidence(trio),
            amount: this._confidenceFixedAmount(bankroll, trio, 0.005)
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

          const trio = [top[i], top[j], top[k]];
          const ev = top[i].ev * 0.5 + top[j].ev * 0.3 + top[k].ev * 0.2;

          if (ev < CONFIG.EV.TARGET) continue;

          tickets.push({
            type: TICKET_TYPE.TRIFECTA,
            horses: trio.map(x => x.horseId),
            horseNames: trio.map(x => x.horseName),
            ev: Utils.round(ev, 4),
            confidence: this._multiConfidence(trio),
            amount: this._confidenceFixedAmount(bankroll, trio, 0.003)
          });
        }
      }
    }

    return tickets;
  }

  static _pairTickets(list, bankroll, type, minEv, rate) {
    const tickets = [];

    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const pair = [list[i], list[j]];
        const ev = Utils.average(pair.map(x => x.ev));

        if (ev < minEv) continue;

        tickets.push({
          type: type,
          horses: pair.map(x => x.horseId),
          horseNames: pair.map(x => x.horseName),
          ev: Utils.round(ev, 4),
          confidence: this._multiConfidence(pair),
          amount: this._confidenceFixedAmount(bankroll, pair, rate)
        });
      }
    }

    return tickets;
  }

  static _confidenceBetAmount(bankroll, result) {
    const base = bankroll * Utils.toNumber(result.kelly, 0);
    const adjusted = base * this._confidenceMultiplier(result.confidence);

    return this._roundBet(
      Math.min(adjusted, bankroll * CONFIG.BANKROLL.MAX_BET_RATE)
    );
  }

  static _confidenceFixedAmount(bankroll, list, rate) {
    const confidence = this._multiConfidence(list);
    const base = bankroll * rate;
    const adjusted = base * this._confidenceMultiplier(confidence);

    return this._roundBet(adjusted);
  }

  static _confidenceMultiplier(confidence) {
    if (confidence === CONFIDENCE_RANK.S) return 1.20;
    if (confidence === CONFIDENCE_RANK.A) return 1.00;
    if (confidence === CONFIDENCE_RANK.B) return 0.80;
    if (confidence === CONFIDENCE_RANK.C) return 0.60;
    if (confidence === CONFIDENCE_RANK.D) return 0.40;

    return 0;
  }

  static _roundBet(amount) {
    const a = Math.max(CONFIG.BANKROLL.MIN_BET, amount);
    return Math.floor(a / 100) * 100;
  }

  static _multiConfidence(list) {
    const avg = Utils.average(
      list.map(x => Utils.toNumber(x.confidencePoint, 0))
    );

    return CoreEngine.confidenceRank(avg);
  }
}
