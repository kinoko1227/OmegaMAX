/**
 * ==========================================================
 * ΩMAX AIOS
 * ACEEngine.js
 * ----------------------------------------------------------
 * Adaptive Cognition Engine
 *
 * ΩMAXの統合頭脳
 * ==========================================================
 */

class ACEEngine {

  /**
   * レース評価
   *
   * @param {RaceContext} context
   * @returns {Object}
   */
  static evaluate(context) {

    if (!(context instanceof RaceContext)) {
      throw new Error("ACEEngine : RaceContext required.");
    }

    Logger.info("ACE START");

    // Horse Brain
    const horse = HorseBrain.evaluate(context);

    // Race Brain
    const race = RaceBrain.evaluate(context);

    // Market Brain
    const market = MarketBrain.evaluate(context);

    // Evolution Brain
    const evolution = EvolutionBrain.evaluate(
      horse,
      race,
      market,
      context
    );

    // Explain Brain
    const explain = ExplainBrain.evaluate(
      horse,
      race,
      market,
      evolution,
      context
    );

    const result = {

      horse,

      race,

      market,

      evolution,

      explain

    };

    Logger.info("ACE COMPLETE");

    return result;

  }

}x
