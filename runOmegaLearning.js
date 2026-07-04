function runOmegaLearning() {

  try {

    const logs = OmegaState.loadLogs();

    if (!logs || logs.length === 0) return;

    // Backtest実行
    const backtest = BacktestEngine.run(logs);

    // 学習
    const weights = LearningEngine.update(backtest.history);

    // 補正
    const calibrated = CalibrationEngine.calibrate(
      backtest.history,
      weights
    );

    // 保存
    OmegaState.saveWeights(calibrated);

    Logger.log("ΩMAX Learning Complete");

  } catch (e) {

    Logger.log("LEARNING ERROR: " + e.toString());
  }
}
