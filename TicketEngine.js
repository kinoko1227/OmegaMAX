class TicketEngine {

  /**
   * メイン処理
   */
  static build(race, coreResults, bankroll = 100000) {

    // ① EVフィルタ
    const filtered = this._filterEV(coreResults);

    // ② ランク付け
    const ranked = this._rank(filtered);

    // ③ 資金配分
    const allocated = this._allocateBankroll(ranked, bankroll);

    // ④ 券種生成
    const tickets = this._composeTickets(ranked, allocated);

    // ⑤ リスク調整
    const finalTickets = this._riskBalance(tickets);

    return {
      raceId: race.id,
      tickets: finalTickets,

      // 🔥 Backtest用（重要）
      snapshot: this._buildSnapshot(race, ranked, allocated),

      // 評価用メタ
      expectedEV: this._portfolioEV(finalTickets),
      riskScore: this._riskScore(finalTickets)
    };
  }


  //////////////////////////////
  // ① EVフィルタ
  //////////////////////////////
  static _filterEV(results) {
    return results.filter(r =>
      r.ev > 0 &&
      r.score > 0.55 &&
      r.kelly > 0
    );
  }


  //////////////////////////////
  // ② ランク付け
  //////////////////////////////
  static _rank(results) {
    return results.sort((a, b) =>
      (b.ev * 0.5 + b.score * 0.5) -
      (a.ev * 0.5 + a.score * 0.5)
    );
  }


  //////////////////////////////
  // ③ 資金配分
  //////////////////////////////
  static _allocateBankroll(ranked, bankroll) {

    return ranked.map(r => {

      const safety = 0.25; // フラクショナルKelly

      let bet = bankroll * (r.kelly || 0) * safety;

      bet = Math.max(100, Math.min(bet, bankroll * 0.05));

      return {
        ...r,
        bet: Math.floor(bet)
      };
    });
  }


  //////////////////////////////
  // ④ 券種生成
  //////////////////////////////
  static _composeTickets(ranked, allocated) {

    const top = ranked.slice(0, 3);
    const tickets = [];

    // 🥇 単勝
    if (top[0]) {
      tickets.push({
        type: "WIN",
        horse: top[0].horseId,
        bet: allocated[0]?.bet || 0,

        // 🔥 Backtest必須
        odds: top[0].odds || 2.5,
        ev: top[0].ev
      });
    }

    // 🥈 複勝
    top.slice(0, 2).forEach((h, i) => {
      tickets.push({
        type: "PLACE",
        horse: h.horseId,
        bet: Math.floor((allocated[i]?.bet || 0) * 0.6),

        odds: h.odds || 1.5,
        ev: h.ev
      });
    });

    // 🥉 馬連
    if (top.length >= 2) {
      tickets.push({
        type: "QUINELLA",
        combo: [top[0].horseId, top[1].horseId],
        bet: Math.floor((allocated[0]?.bet || 0) * 0.5),

        odds: 5.0,
        ev: (top[0].ev + top[1].ev) / 2
      });
    }

    // 🔥 三連複（高EVのみ）
    if (top.length >= 3 && top[2].ev > 1.2) {
      tickets.push({
        type: "TRIO",
        combo: [top[0].horseId, top[1].horseId, top[2].horseId],
        bet: Math.floor((allocated[2]?.bet || 0) * 0.3),

        odds: 10.0,
        ev: top[2].ev
      });
    }

    return tickets;
  }


  //////////////////////////////
  // ⑤ リスク制御
  //////////////////////////////
  static _riskBalance(tickets) {

    return tickets
      .map(t => {

        if (t.bet > 20000) {
          t.bet *= 0.7;
        }

        if (t.bet < 100) {
          t.bet = 0;
        }

        return t;
      })
      .filter(t => t.bet > 0);
  }


  //////////////////////////////
  // ⑥ ポートフォリオEV
  //////////////////////////////
  static _portfolioEV(tickets) {

    return tickets.reduce((sum, t) => {
      return sum + (t.ev || 0) * (t.bet / 1000);
    }, 0);
  }


  //////////////////////////////
  // ⑦ リスクスコア
  //////////////////////////////
  static _riskScore(tickets) {

    let risk = 0;

    tickets.forEach(t => {

      if (t.bet > 10000) risk += 0.2;
      if (t.type === "TRIO") risk += 0.3;
      if (t.type === "QUINELLA") risk += 0.1;
    });

    return Math.min(risk, 1);
  }


  //////////////////////////////
  // 🔥 Backtest用スナップショット
  //////////////////////////////
  static _buildSnapshot(race, ranked, allocated) {

    return {
      raceId: race.id,

      decisions: ranked.map((r, i) => ({
        horseId: r.horseId,
        ev: r.ev,
        score: r.score,
        bet: allocated[i]?.bet || 0
      })),

      timestamp: new Date().toISOString()
    };
  }
}
