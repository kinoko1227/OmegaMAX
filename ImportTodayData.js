function importTodayData() {

  const date = Utilities.formatDate(
    new Date(),
    "Asia/Tokyo",
    "yyyyMMdd"
  );

  NetkeibaLoader.saveToSheets(date);

  Logger.log("IMPORT DONE");
}
