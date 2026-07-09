/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * OmegaPipeline.js
 * ----------------------------------------------------------
 * ΩMAX統合パイプライン Production RC1
 *
 * DataLayer
 *   ↓
 * FeatureEngine
 *   ↓
 * CoreEngine
 *   ↓
 * AIBrain
 *   ↓
 * TicketEngine
 *   ↓
 * Backtest / Learning / Dashboard
 *
 * GAS V8 compatible.
 * ==========================================================
 */

class OmegaPipeline {

  /**
   * 日次メイン実行
   */
  static run() {

    Logger.info("========== ΩMAX START ==========");

    try {

      //--------------------------------------------------
      // データ取得
      //--------------------------------------------------

      const races =
        OmegaDataLayer.loadToday();

      if (!Array.isArray(races) || races.length === 0) {

        Logger.warn("Today's races not found.");

        return {
          ok: false,
          reason: "NO_RACES",
          races: [],
          raceResults: []
        };

      }

      const raceResults = [];

      //--------------------------------------------------
      // レース毎解析
      //--------------------------------------------------

      races.forEach(race => {

        const result =
          this.analyzeRace(race);

        raceResults.push(result);

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

        ok: true,

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

    //--------------------------------------------------
    // Race標準化
    //--------------------------------------------------

    const normalizedRace =
      Race.build(race);

    //--------------------------------------------------
    // Feature
    //--------------------------------------------------

    const featureSets =
      FeatureEngine.buildRace(normalizedRace);

    //--------------------------------------------------
    // Core
    //--------------------------------------------------

    const coreResults =
      featureSets.map(f =>
        CoreEngine.evaluate(
          normalizedRace,
          f
        )
      );

    //--------------------------------------------------
    // AIBrain
    //--------------------------------------------------

    const aiBrainResult =
      this.runAIBrain(
        normalizedRace,
        coreResults
      );

    //--------------------------------------------------
    // Ticket
    // Phase4でTicketEngineをAIBrain完全対応へ更新する。
    // ここでは互換性維持のため、
    // buildFromAIBrain があれば優先し、
    // なければ既存 build を使う。
    //--------------------------------------------------

    const ticket =
      this.buildTicket(
        normalizedRace,
        coreResults,
        aiBrainResult
      );

    //--------------------------------------------------
    // Result
    //--------------------------------------------------

    return {

      race: normalizedRace,

      featureSets,

      coreResults,

      aiBrainResult,

      ticket

    };

  }


  /**
   * AIBrain実行
   */
  static runAIBrain(race, coreResults) {

    if (typeof AIBrain === "undefined") {

      Logger.warn("AIBrain is not defined. Skip AI brain analysis.");

      return null;

    }

    const runners =
      this.buildAIBrainRunners(
        race,
        coreResults
      );

    const brain =
      new AIBrain({
        iterations:
          CONFIG.AIBRAIN && CONFIG.AIBRAIN.ITERATIONS
            ? CONFIG.AIBRAIN.ITERATIONS
            : 3000
      });

    const result =
      brain.analyzeRace({

        race: {
          id: race.id,
          date: race.date,
          course: race.course,
          surface: race.surface,
          distance: race.distance,
          going: race.going,
          raceClass: race.raceClass || race.className || race.grade || "",
          fieldSize: runners.length,
          weather: race.weather || "",
          cushionValue: race.cushionValue || 0,
          moisture: race.moisture || 0,
          trackBias: race.trackBias || "",
          pace: race.pace || ""
        },

        runners,

        iterations:
          CONFIG.AIBRAIN && CONFIG.AIBRAIN.ITERATIONS
            ? CONFIG.AIBRAIN.ITERATIONS
            : 3000

      });

    return result;

  }


  /**
   * AIBrain用Runner生成
   */
  static buildAIBrainRunners(race, coreResults) {

    const horses =
      Array.isArray(race.horses)
        ? race.horses
        : [];

    const coreMap = {};

    (coreResults || []).forEach(result => {

      coreMap[String(result.horseId)] = result;

    });

    return horses.map((horse, index) => {

      const h =
        Race.normalizeHorse(horse);

      const core =
        coreMap[String(h.id)] || {};

      return {

        runnerId:
          h.id || core.horseId || ("RUNNER_" + (index + 1)),

        horseId:
          h.id || core.horseId || "",

        id:
          h.id || core.horseId || "",

        name:
          h.name || core.horseName || "",

        horseName:
          h.name || core.horseName || "",

        number:
          h.number || h.horseNumber || index + 1,

        horseNumber:
          h.number || h.horseNumber || index + 1,

        frameNumber:
          h.frameNumber || h.frame || 0,

        runningStyle:
          h.runningStyle || h.style || "",

        style:
          h.runningStyle || h.style || "",

        jockeyId:
          h.jockeyId || "",

        trainerId:
          h.trainerId || "",

        fatherId:
          h.fatherId || "",

        motherFatherId:
          h.motherFatherId || "",

        crossKey:
          h.crossKey || "",

        odds:
          core.odds || h.odds || 0,

        popularity:
          h.popularity || 0,

        predictedProbability:
          core.winProb || 0,

        abilityIndex:
          this.scoreToPercent(core.score),

        speedIndex:
          this.featureToPercent(core.features, "speedIndex", h.speedIndex),

        staminaIndex:
          this.featureToPercent(core.features, "staminaIndex", h.staminaIndex),

        finishIndex:
          this.featureToPercent(core.features, "finishIndex", h.finishIndex),

        startIndex:
          this.featureToPercent(core.features, "startIndex", h.startIndex),

        powerIndex:
          this.featureToPercent(core.features, "powerIndex", h.powerIndex),

        mentalIndex:
          this.featureToPercent(core.features, "mentalIndex", h.mentalIndex),

        consistencyIndex:
          this.featureToPercent(core.features, "consistencyIndex", h.consistencyIndex),

        conditionScore:
          this.featureToPercent(core.features, "conditionScore", h.conditionScore),

        trainingScore:
          this.featureToPercent(core.features, "trainingScore", h.trainingScore),

        bodyWeightScore:
          this.featureToPercent(core.features, "bodyWeightScore", h.bodyWeightScore),

        fatigueIndex:
          h.fatigueIndex || 0,

        risk:
          h.risk || 0,

        riskScore:
          h.riskScore || 0,

        coreResult:
          core,

        market: {
          odds:
            core.odds || h.odds || 0,

          popularity:
            h.popularity || 0,

          predictedProbability:
            core.winProb || 0
        },

        profile:
          h.profile || h.horseProfile || {},

        jockeyProfile:
          h.jockeyProfile || {},

        trainerProfile:
          h.trainerProfile || {},

        bloodlineProfile:
          h.bloodlineProfile || {},

        crossProfile:
          h.crossProfile || {}

      };

    });

  }


  /**
   * Ticket生成
   */
  static buildTicket(race, coreResults, aiBrainResult) {

    if (
      typeof TicketEngine !== "undefined" &&
      typeof TicketEngine.buildFromAIBrain === "function"
    ) {

      return TicketEngine.buildFromAIBrain(
        race,
        aiBrainResult,
        CONFIG.BANKROLL.INITIAL
      );

    }

    return TicketEngine.build(
      race,
      coreResults,
      CONFIG.BANKROLL.INITIAL
    );

  }


  /**
   * Core scoreを0-100へ
   */
  static scoreToPercent(score) {

    const s =
      Utils.toNumber(score, 0);

    if (s <= 1) {
      return Utils.round(s * 100, 4);
    }

    return Utils.round(
      Utils.clamp(s, 0, 100),
      4
    );

  }


  /**
   * Feature値を0-100へ
   */
  static featureToPercent(features, key, fallback) {

    features = features || {};

    const raw =
      features[key] !== undefined
        ? features[key]
        : fallback;

    const n =
      Utils.toNumber(raw, 50);

    if (n <= 1) {
      return Utils.round(n * 100, 4);
    }

    return Utils.round(
      Utils.clamp(n, 0, 100),
      4
    );

  }

}


/**
 * ==========================================================
 * GAS Test Helper
 * ==========================================================
 */

function testOmegaPipelineAIBrainIntegration() {

  const races =
    OmegaDataLayer.loadToday();

  if (!Array.isArray(races) || races.length === 0) {

    Logger.warn("No race data for integration test.");

    return null;

  }

  const result =
    OmegaPipeline.analyzeRace(races[0]);

  Logger.info(
    "AIBrain Integration Test Result",
    {
      raceId:
        result.race.id,

      coreCount:
        result.coreResults.length,

      hasAIBrain:
        !!result.aiBrainResult,

      decision:
        result.aiBrainResult
          ? result.aiBrainResult.decision
          : null,

      ticketCount:
        result.ticket && result.ticket.tickets
          ? result.ticket.tickets.length
          : 0
    }
  );

  return result;

}
