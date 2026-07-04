function runOmegaAutoPipeline() {

  try {

    Logger.log("PIPELINE START");

    // ① CSV取得
    const racesCsv = CsvFetcher.fetch(CONFIG.CSV.RACES_URL);
    const horsesCsv = CsvFetcher.fetch(CONFIG.CSV.HORSES_URL);

    // ② Sheets反映
    DataImporter.importRaces(racesCsv);
    DataImporter.importHorses(horsesCsv);

    // ③ ΩMAX実行
    const races = DataSource.getTodayRaces();
    const result = Main.run(races);

    // ④ 学習更新
    LearningEngine.update(result.logs);

    Logger.log("PIPELINE DONE");

  } catch (e) {
    Logger.error("PIPELINE ERROR", e);
  }
}
