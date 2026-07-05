/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * OmegaPipeline.js
 * ----------------------------------------------------------
 * ΩMAX統合パイプライン
 * ==========================================================
 */

class OmegaPipeline {

  static run() {

    Logger.info("========== ΩMAX START ==========");

    try {

      //--------------------------------------------------
      // データ取得
      //--------------------------------------------------

      const races = OmegaDataLayer.loadToday();

      if (!Array.isArray(races) || races.length === 0) {
        Logger.warn("Today's races not found.");
        return null;
      }

      const raceResults = [];

      //--------------------------------------------------
      // レース毎解析
      //--------------------------------------------------

      races.forEach(race => {

        raceResults.push(
          this.analyzeRace(race)
        );

      });

      //--------------------------------------------------
      // Backtest
      //--------------------------------------------------

      const backtest =
        BacktestEngine.run(
          races,
          CONFIG.BANKROLL.INITIAL
        );

      //--------------------------------------------------
      // Metrics
      //--------------------------------------------------

      const metrics =
        MetricsEngine.save(backtest);

      //--------------------------------------------------
      // Learning
      //--------------------------------------------------

      const history =
        ResultLoader.buildHistory(races);

      LearningEngine.update(history);

      //--------------------------------------------------
      // Dashboard
      //--------------------------------------------------

      DashboardEngine.update({

        races,

        raceResults,

        metrics,

        bankroll:
          backtest.finalBankroll

      });

      Logger.info("========== ΩMAX END ==========");

      return {

        races,

        raceResults,

        metrics,

        bankroll:
          backtest.finalBankroll

      };

    } catch (e) {

      Logger.error("OmegaPipeline Error", e);

      throw e;

    }

  }

  /**
   * 1レース解析
   */
  static analyzeRace(race) {

    const featureSets =
      FeatureEngine.buildRace(race);

    const coreResults =
      featureSets.map(f =>
        CoreEngine.evaluate(race, f)
      );

    const ticket =
      TicketEngine.build(
        race,
        coreResults,
        CONFIG.BANKROLL.INITIAL
      );

    return {

      race,

      featureSets,

      coreResults,

      ticket

    };

  }

}
