function runOmegaDailyProduction() {

  Logger.log("ΩMAX DAILY START");

  const bankroll = OmegaState.loadBankroll() || 100000;

  // ① 当日レース取得（Sheets前提）
  const races = DataSource.getTodayRaces();

  if (!races || races.length === 0) {
    Logger.log("NO RACES");
    return;
  }

  // ② 予想実行
  const result = Main.run(races, bankroll);

  // ③ 結果ロード
  const results = ResultLoader.getResults();

  // ④ 学習更新
  const weights = LearningEngine.update(result.logs);

  // ⑤ 保存
  OmegaState.save(result);

  Logger.log("ΩMAX DAILY END");
}
