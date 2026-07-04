class CsvFetcher {

  static fetch(url) {

    const res = UrlFetchApp.fetch(url);
    const csv = res.getContentText("UTF-8");

    return Utilities.parseCsv(csv);
  }
}
