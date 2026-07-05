class Main {

  static run(races, bankroll = null) {
    Logger.log("ΩMAX v10 START");

    const safeRaces = Array.isArray(races) ? races : [];

    Logger.log("RACES: " + safeRaces.length);

    if (safeRaces.length === 0) {
      return {
        finalBankroll: OmegaState.getBankroll(),
        returnRate: 1,
        races: 0,
        logs: []
      };
    }

    let currentBankroll =
      bankroll !== null
        ? Number(bankroll)
        : OmegaState.getBankroll();

    const logs = [];

    safeRaces.forEach((race, index) => {
      try {
        Logger.log("Processing Race " + (index + 1) + ": " + race.id);

        const normalizedRace = Race.build(race);
        const featureInput = Race.toFeatureInput(normalizedRace);

        const featureSet = this._buildFeatures(featureInput);

        const coreResults = featureSet.map(f =>
          CoreEngine.evaluate(normalizedRace, f)
        );

        const ticketResult = TicketEngine.build(
          normalizedRace,
          coreResults,
          currentBankroll
        );

        const backtest = BacktestEngine.run(
          [normalizedRace],
          currentBankroll
        );

        currentBankroll =
          backtest && backtest.finalBankroll
            ? backtest.finalBankroll
            : currentBankroll;

        logs.push(
          this._log(
            normalizedRace,
            coreResults,
            ticketResult,
            backtest
          )
        );

      } catch (e) {
        Logger.error("Race processing error: " + race.id, e);
      }
    });

    const summary = this._summary(logs, currentBankroll);

    OmegaState.setBankroll(currentBankroll);
    OmegaState.saveLogs(logs);

    Logger.log("ΩMAX v10 END");

    return summary;
  }

  static runToday() {
    const races = DataSource.getTodayRaces();
    return this.run(races);
  }

  static _buildFeatures(input) {
    if (!input) return [];

    const race = input.race || input;
    const horses = Array.isArray(input.horses) ? input.horses : [];

    const weights = LearningEngine.getWeights
      ? LearningEngine.getWeights()
      : OmegaState.getWeights();

    return horses.map(horse => {
      const base = FeatureEngine.build(race, horse);
      const features = base.features || {};

      Object.keys(features).forEach(k => {
        features[k] *= weights[k] || 1;
      });

      base.features = features;
      return base;
    });
  }

  static _log(race, core, ticket, backtest) {
    return {
      raceId: race.id,
      raceName: race.name || "",
      type: race.type || "",
      scoreSummary: (core || []).map(c => ({
        horseId: c.horseId,
        score: c.score,
        winProb: c.winProb,
        ev: c.ev,
        kelly: c.kelly
      })),
      tickets: ticket && ticket.tickets ? ticket.tickets : [],
      bankroll: backtest && backtest.finalBankroll ? backtest.finalBankroll : 0,
      drawdown: backtest && backtest.maxDrawdown ? backtest.maxDrawdown : 0
    };
  }

  static _summary(logs, finalBankroll) {
    const initial = CONFIG.BANKROLL.INITIAL;

    return {
      finalBankroll: finalBankroll,
      returnRate: finalBankroll / initial,
      races: logs.length,
      logs: logs
    };
  }
}
