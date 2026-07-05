/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * runOmegaAutoPipeline.js
 * ----------------------------------------------------------
 * 自動実行エントリーポイント
 * ==========================================================
 */

function runOmegaAutoPipeline() {

  const start = new Date();

  Logger.info("========================================");
  Logger.info("ΩMAX Auto Pipeline START");

  try {

    //---------------------------------------
    // 実行
    //---------------------------------------

    const result = OmegaPipeline.run();

    //---------------------------------------
    // 実行時間
    //---------------------------------------

    const elapsed =
      ((new Date()) - start) / 1000;

    Logger.info("ΩMAX Auto Pipeline SUCCESS");
    Logger.info("Elapsed : " + elapsed + " sec");

    return result;

  } catch (e) {

    Logger.error(
      "ΩMAX Auto Pipeline ERROR",
      e
    );

    throw e;

  } finally {

    Logger.info("ΩMAX Auto Pipeline END");
    Logger.info("========================================");

  }

}
