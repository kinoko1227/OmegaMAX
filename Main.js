class Main {

  static run(races) {

    Logger.log("ΩMAX START");

    if (!races || races.length === 0) {
      Logger.log("NO RACES");
      return { error: "no races" };
    }

    let bankroll = OmegaState.getBankroll();
    const logs = [];

    races.forEach(race => {

      // ① Feature生成
      const features = FeatureEngine.build(race);

      // ② Core評価
      const core = CoreEngine.evaluate(race, features);

      // ③ EV評価
      const evList = core.map(c => ({
        ...c,
        ev: this._calcEV(c.winProb, c.odds)
      }));

      // ④ Ticket生成
      const ticket = TicketEngine.build(race, evList, bankroll);

      // ⑤ 擬似バックテスト（本番では結果照合）
      const result = BacktestEngine.run([race], bankroll);

      bankroll = result.finalBankroll;

      logs.push({
        raceId: race.id,
        tickets: ticket,
        bankroll
      });
    });

    // ⑥ 保存
    OmegaState.setBankroll(bankroll);
    OmegaState.saveLogs(logs);

    Logger.log("ΩMAX END");

    return {
      finalBankroll: bankroll,
      logs
    };
  }

  /**
   * EV計算（簡易版）
   */
  static _calcEV(winProb, odds) {

    if (!winProb || !odds) return 0;

    return (winProb * odds);
  }
}
