/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * ImportTodayData.js
 * ----------------------------------------------------------
 * CSV / Driveから当日データを取得し、
 * 各シートへ反映する
 * ==========================================================
 */

function ImportTodayData() {
  return importTodayData();
}

function importTodayData() {

  return Logger.time("ImportTodayData", () => {

    Logger.info("===== IMPORT START =====");

    const summary = {
      races: 0,
      horses: 0,
      odds: 0,
      results: 0,
      success: [],
      failed: []
    };

    const targets = [

      {
        key: "races",
        url: CONFIG.CSV.RACES_URL,
        file: CONFIG.CSV.RACES_FILE,
        importer: DataImporter.importRaces
      },

      {
        key: "horses",
        url: CONFIG.CSV.HORSES_URL,
        file: CONFIG.CSV.HORSES_FILE,
        importer: DataImporter.importHorses
      },

      {
        key: "odds",
        url: CONFIG.CSV.ODDS_URL,
        file: CONFIG.CSV.ODDS_FILE,
        importer: DataImporter.importOdds
      },

      {
        key: "results",
        url: CONFIG.CSV.RESULTS_URL,
        file: CONFIG.CSV.RESULTS_FILE,
        importer: DataImporter.importResults
      }

    ];

    targets.forEach(target => {

      try {

        Logger.info("Import : " + target.key);

        const csv = CsvFetcher.fetchAuto(
          target.url,
          target.file
        );

        if (!Array.isArray(csv) || csv.length <= 1) {

          Logger.warn(target.key + " : no data");

          return;

        }

        const imported =
          target.importer(csv);

        summary[target.key] =
          imported || (csv.length - 1);

        summary.success.push(target.key);

      } catch (e) {

        Logger.error(
          "Import failed : " + target.key,
          e
        );

        summary.failed.push(target.key);

      }

    });

    Logger.info(
      "===== IMPORT COMPLETE =====",
      summary
    );

    return summary;

  });

}
