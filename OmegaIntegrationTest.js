/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * OmegaIntegrationTest.js
 * ----------------------------------------------------------
 * 統合確認テスト
 * ==========================================================
 */

function testOmegaFoundation() {

  Logger.info("TEST Foundation START");

  const result = {
    config: !!CONFIG,
    constants: !!DATE_FORMAT && !!LOG_LEVEL && !!DECISION && !!TICKET_TYPE,
    utils: typeof Utils.toNumber === "function",
    logger: typeof Logger.info === "function",
    state: typeof OmegaState.getWeights === "function",
    featureRegistry: typeof FeatureRegistry.all === "function",
    featureCount: FeatureRegistry.all().length
  };

  Logger.info("TEST Foundation RESULT", result);

  return result;
}

function testOmegaDataLayer() {

  Logger.info("TEST DataLayer START");

  const health = OmegaDataLayer.healthCheck();

  Logger.info("TEST DataLayer RESULT", health);

  return health;
}

function testOmegaPipelineDryRun() {

  Logger.info("TEST Pipeline DryRun START");

  const result = OmegaPipeline.run();

  Logger.info("TEST Pipeline DryRun RESULT", result);

  return result;
}
