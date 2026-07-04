class BacktestEngine {

  /**
   * メイン：完全一致バックテスト
   */
  static run(races, initialBankroll = 100000) {

    let bankroll = initialBankroll;

    const logs = [];

    races.forEach(race => {

      // ① Feature生成（実運用と同じ）
      const featureInputs = Race.toFeatureInput(race);
      const featureSet = Main._buildFeatures(featureInputs);

      // ② Core評価（実運用と同じ）
      const coreResults = featureSet.map(f =>
        CoreEngine.evaluate(race, f)
      );

      // ③ Ticket生成（ここが最重要）
      const ticketResult = TicketEngine.build(
        race,
        coreResults,
        bankroll
      );

      // ④ 実際のレース結果取得
      const result = this._getRaceResult(race);

      // ⑤ 損益計算（完全一致ルール）
      const pnl = this._calcPnL(ticketResult, result);

      bankroll += pnl;

      logs.push({
        raceId: race.id,
        pnl,
        bankroll,
        tickets: ticketResult.tickets
      });
    });

    return {
      finalBankroll: bankroll,
      logs,
      maxDrawdown: this._calcDrawdown(logs)
    };
  }


  //////////////////////////////
  // 実結果取得（DataSource依存）
  //////////////////////////////
  static _getRaceResult(race) {

    return DataSource.getResult(race.id) || {
      winners: [],
      payouts: {}
    };
  }


  //////////////////////////////
  // 損益計算（完全一致ルール）
  //////////////////////////////
  static _calcPnL(ticketResult, result) {

    let pnl = 0;

    ticketResult.tickets.forEach(t => {

      const payout = result.payouts?.[t.type] || 0;

      if (this._isWin(t, result)) {
        pnl += t.bet * payout;
      } else {
        pnl -= t.bet;
      }
    });

    return pnl;
  }


  //////////////////////////////
  // 的中判定
  //////////////////////////////
  static _isWin(ticket, result) {

    const winners = result.winners || [];

    if (ticket.type === "WIN") {
      return winners[0] === ticket.horse;
    }

    if (ticket.type === "PLACE") {
      return winners.slice(0, 3).includes(ticket.horse);
    }

    if (ticket.type === "QUINELLA") {
      return ticket.combo.every(h =>
        winners.slice(0, 2).includes(h)
      );
    }

    if (ticket.type === "TRIO") {
      return ticket.combo.every(h =>
        winners.slice(0, 3).includes(h)
      );
    }

    return false;
  }


  //////////////////////////////
  // ドローダウン
  //////////////////////////////
  static _calcDrawdown(logs) {

    let peak = 100000;
    let maxDD = 0;

    logs.forEach(l => {

      if (l.bankroll > peak) peak = l.bankroll;

      const dd = (peak - l.bankroll) / peak;

      if (dd > maxDD) maxDD = dd;
    });

    return maxDD;
  }
}
