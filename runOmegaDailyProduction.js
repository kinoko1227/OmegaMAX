/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * runOmegaDailyProduction.js
 * ----------------------------------------------------------
 * 本番運用エントリーポイント
 * 毎朝トリガー実行用
 * ==========================================================
 */

function runOmegaDailyProduction() {

  const start = new Date();

  Logger.info("========================================");
  Logger.info("ΩMAX Daily Production START");

  try {

    const result = OmegaPipeline.run();

    const elapsed =
      ((new Date()) - start) / 1000;

    Logger.info("ΩMAX Daily Production SUCCESS");
    Logger.info("Elapsed : " + elapsed + " sec");

    return result;

  } catch (e) {

    Logger.error(
      "ΩMAX Daily Production ERROR",
      e
    );

    throw e;

  } finally {

    Logger.info("ΩMAX Daily Production END");
    Logger.info("========================================");

  }

}
