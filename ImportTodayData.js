/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * ImportTodayData.js
 * ----------------------------------------------------------
 * CSV / Drive から当日データを取り込み、Sheetsへ反映
 * ==========================================================
 */

function ImportTodayData() {
  return importTodayData();
}

function importTodayData() {
  return Logger.time("ImportTodayData", () => {
    Logger.info("IMPORT START");

    const summary = {
      races: 0,
      horses: 0,
      odds: 0,
      results: 0
    };

    const racesCsv = CsvFetcher.fetchAuto(
      CONFIG.CSV.RACES_URL,
      CONFIG.CSV.RACES_FILE
    );

    if (racesCsv.length > 0) {
      DataImporter.importRaces(racesCsv);
      summary.races = Math.max(0, racesCsv.length - 1);
    }

    const horsesCsv = CsvFetcher.fetchAuto(
      CONFIG.CSV.HORSES_URL,
      CONFIG.CSV.HORSES_FILE
    );

    if (horsesCsv.length > 0) {
      DataImporter.importHorses(horsesCsv);
      summary.horses = Math.max(0, horsesCsv.length - 1);
    }

    const oddsCsv = CsvFetcher.fetchAuto(
      CONFIG.CSV.ODDS_URL,
      CONFIG.CSV.ODDS_FILE
    );

    if (oddsCsv.length > 0) {
      DataImporter.importOdds(oddsCsv);
      summary.odds = Math.max(0, oddsCsv.length - 1);
    }

    const resultsCsv = CsvFetcher.fetchAuto(
      CONFIG.CSV.RESULTS_URL,
      CONFIG.CSV.RESULTS_FILE
    );

    if (resultsCsv.length > 0) {
      DataImporter.importResults(resultsCsv);
      summary.results = Math.max(0, resultsCsv.length - 1);
    }

    Logger.info("IMPORT DONE", summary);

    return summary;
  });
}
