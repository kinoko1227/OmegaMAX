/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * Main.js
 * ----------------------------------------------------------
 * システムエントリーポイント
 * ==========================================================
 */

/**
 * 通常実行
 */
function runOmegaDaily() {
  return OmegaPipeline.run();
}

/**
 * 本番実行
 */
function runProduction() {
  return runOmegaDailyProduction();
}

/**
 * 自動実行
 */
function runAuto() {
  return runOmegaAutoPipeline();
}

/**
 * 学習のみ実行
 */
function runLearning() {

  Logger.info("Learning START");

  const races = OmegaDataLayer.loadToday();

  const history = ResultLoader.buildHistory(races);

  const result = LearningEngine.update(history);

  Logger.info("Learning END");

  return result;
}

/**
 * バックテストのみ
 */
function runBacktest() {

  Logger.info("Backtest START");

  const races = OmegaDataLayer.loadToday();

  const result = BacktestEngine.run(
    races,
    CONFIG.BANKROLL.INITIAL
  );

  Logger.info("Backtest END");

  return result;
}

/**
 * Dashboard更新のみ
 */
function runDashboard() {

  Logger.info("Dashboard START");

  const races = OmegaDataLayer.loadToday();

  const result = BacktestEngine.run(
    races,
    CONFIG.BANKROLL.INITIAL
  );

  const metrics = MetricsEngine.save(result);

  DashboardEngine.update({
    races,
    raceResults: [],
    metrics,
    bankroll: result.finalBankroll
  });

  Logger.info("Dashboard END");

  return true;
}

/**
 * システム確認
 */
function healthCheck() {

  const health = OmegaDataLayer.healthCheck();

  Logger.info("Health Check", health);

  return health;
}
