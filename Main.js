/**
 * ==========================================================
 * ΩMAX Ver.1.0 RC1
 * Main.gs
 * ----------------------------------------------------------
 * System Entry Point
 *
 * Main
 *   ↓
 * OmegaPipeline.run()
 *
 * GAS V8 compatible.
 * ==========================================================
 */

class Main {

  /**
   * ΩMAX 日次メイン実行
   */
  static run() {

    this.logInfo("========== ΩMAX MAIN START ==========");

    try {

      this.validateDependencies();

      const result =
        OmegaPipeline.run();

      this.logInfo("ΩMAX MAIN COMPLETE", {
        ok: result && result.ok,
        races:
          result && result.races
            ? result.races.length
            : 0,
        raceResults:
          result && result.raceResults
            ? result.raceResults.length
            : 0,
        bankroll:
          result ? result.bankroll : null
      });

      return result;

    } catch (e) {

      this.logError("ΩMAX MAIN ERROR", e);

      return {
        ok: false,
        reason: "MAIN_ERROR",
        message: e && e.message ? e.message : String(e),
        error: e
      };

    } finally {

      this.logInfo("========== ΩMAX MAIN END ==========");

    }

  }


  /**
   * 手動実行用
   */
  static manualRun() {

    return this.run();

  }


  /**
   * トリガー実行用
   */
  static triggerRun() {

    return this.run();

  }


  /**
   * ドライラン
   * 実データを1レースだけ解析して接続確認する
   */
  static dryRun() {

    this.logInfo("========== ΩMAX DRY RUN START ==========");

    try {

      this.validateDependencies();

      const races =
        OmegaDataLayer.loadToday();

      if (!Array.isArray(races) || races.length === 0) {

        this.logWarn("DryRun: no races found.");

        return {
          ok: false,
          reason: "NO_RACES",
          races: [],
          result: null
        };

      }

      const result =
        OmegaPipeline.analyzeRace(races[0]);

      this.logInfo("ΩMAX DRY RUN COMPLETE", {
        raceId:
          result && result.race
            ? result.race.id
            : null,
        coreCount:
          result && result.coreResults
            ? result.coreResults.length
            : 0,
        hasAIBrain:
          !!(result && result.aiBrainResult),
        hasTicket:
          !!(result && result.ticket)
      });

      return {
        ok: true,
        race: races[0],
        result
      };

    } catch (e) {

      this.logError("ΩMAX DRY RUN ERROR", e);

      return {
        ok: false,
        reason: "DRY_RUN_ERROR",
        message: e && e.message ? e.message : String(e),
        error: e
      };

    } finally {

      this.logInfo("========== ΩMAX DRY RUN END ==========");

    }

  }


  /**
   * 最小ヘルスチェック
   */
  static healthCheck() {

    const checks = {
      CONFIG:
        typeof CONFIG !== "undefined",

      Logger:
        typeof Logger !== "undefined",

      OmegaDataLayer:
        typeof OmegaDataLayer !== "undefined",

      OmegaPipeline:
        typeof OmegaPipeline !== "undefined",

      Race:
        typeof Race !== "undefined",

      FeatureEngine:
        typeof FeatureEngine !== "undefined",

      CoreEngine:
        typeof CoreEngine !== "undefined",

      AIBrain:
        typeof AIBrain !== "undefined",

      TicketEngine:
        typeof TicketEngine !== "undefined",

      BacktestEngine:
        typeof BacktestEngine !== "undefined",

      LearningEngine:
        typeof LearningEngine !== "undefined",

      DashboardEngine:
        typeof DashboardEngine !== "undefined"
    };

    const missing =
      Object.keys(checks).filter(key => !checks[key]);

    const result = {
      ok: missing.length === 0,
      checks,
      missing
    };

    if (result.ok) {
      this.logInfo("ΩMAX HealthCheck OK", result);
    } else {
      this.logWarn("ΩMAX HealthCheck Missing Dependencies", result);
    }

    return result;

  }


  /**
   * 必須依存チェック
   */
  static validateDependencies() {

    const required = [
      "OmegaDataLayer",
      "OmegaPipeline",
      "Race",
      "FeatureEngine",
      "CoreEngine",
      "TicketEngine"
    ];

    const missing =
      required.filter(name => typeof this.globalValue(name) === "undefined");

    if (missing.length > 0) {
      throw new Error(
        "Missing required dependencies: " + missing.join(", ")
      );
    }

    return true;

  }


  /**
   * グローバル参照
   */
  static globalValue(name) {

    try {
      return Function("return typeof " + name + " !== 'undefined' ? " + name + " : undefined;")();
    } catch (e) {
      return undefined;
    }

  }


  /**
   * バージョン情報
   */
  static version() {

    return {
      name: "ΩMAX",
      version: "1.0.0-RC1",
      module: "Main",
      pipeline: "OmegaPipeline_AIBrainIntegration_v1.0.0",
      status: "Release Candidate Entry Point"
    };

  }


  /**
   * Logger.info 安全ラッパー
   */
  static logInfo(message, data) {

    if (
      typeof Logger !== "undefined" &&
      typeof Logger.info === "function"
    ) {
      Logger.info(message, data || {});
      return;
    }

    console.log(message, data || "");

  }


  /**
   * Logger.warn 安全ラッパー
   */
  static logWarn(message, data) {

    if (
      typeof Logger !== "undefined" &&
      typeof Logger.warn === "function"
    ) {
      Logger.warn(message, data || {});
      return;
    }

    console.warn(message, data || "");

  }


  /**
   * Logger.error 安全ラッパー
   */
  static logError(message, error) {

    if (
      typeof Logger !== "undefined" &&
      typeof Logger.error === "function"
    ) {
      Logger.error(message, error);
      return;
    }

    console.error(message, error || "");

  }

}


/**
 * ==========================================================
 * GAS Entry Points
 * ==========================================================
 */

/**
 * メイン実行
 */
function main() {
  return Main.run();
}


/**
 * ΩMAX日次実行
 */
function runOmegaDaily() {
  return Main.run();
}


/**
 * 旧名互換
 */
function omegaRunDaily() {
  return Main.run();
}


/**
 * 手動実行
 */
function manualRunOmega() {
  return Main.manualRun();
}


/**
 * トリガー実行
 */
function triggerRunOmega() {
  return Main.triggerRun();
}


/**
 * ドライラン
 */
function dryRunOmega() {
  return Main.dryRun();
}


/**
 * ヘルスチェック
 */
function healthCheckOmega() {
  return Main.healthCheck();
}


/**
 * バージョン確認
 */
function omegaVersion() {
  return Main.version();
}


/**
 * Main単体テスト
 */
function testMain() {

  const health =
    Main.healthCheck();

  if (!health.ok) {
    Logger.warn("testMain stopped by health check.", health);
    return health;
  }

  return Main.dryRun();

}
