/**
 * ==========================================================
 * ΩMAX AIOS
 * HorseAnalyzerRunner.js
 * ----------------------------------------------------------
 * Horse Analyzer群を一括実行し、
 * HorseBrainへ渡す入力を生成する。
 * ==========================================================
 */

class HorseAnalyzerRunner {

  /**
   * @param {Object} horse
   * @param {HorseProfile} profile
   * @param {RaceContext} context
   * @returns {Object}
   */
  static run(horse, profile, context) {

    const analyzers = {
      ability: AbilityAnalyzer.analyze(horse, context),

      training: TrainingAnalyzer.analyze(
        horse,
        profile,
        context
      ),

      bodyWeight: BodyWeightAnalyzer.analyze(
        horse,
        profile,
        context
      ),

      growth: GrowthAnalyzer.analyze(
        horse,
        profile,
        context
      ),

      maturity: MaturityAnalyzer.analyze(
        horse,
        profile,
        context
      ),

      fatigue: FatigueAnalyzer.analyze(
        horse,
        profile,
        context
      ),

      recovery: RecoveryAnalyzer.analyze(
        horse,
        profile,
        context
      ),

      environment: EnvironmentAnalyzer.analyze(
        horse,
        profile,
        context
      ),

      risk: RiskAnalyzer.analyze(
        horse,
        profile,
        context
      )
    };

    analyzers.inference =
      InferenceRuleEngine.run(
        analyzers,
        "HORSE"
      );

    return analyzers;
  }

}
