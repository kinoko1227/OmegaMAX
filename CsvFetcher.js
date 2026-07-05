class CsvFetcher {

  /**
   * URLからCSV取得
   */
  static fetch(url) {
    if (!url) return [];

    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();

    if (code < 200 || code >= 300) {
      throw new Error("CSV fetch failed: " + code + " / " + url);
    }

    const text = response.getContentText("UTF-8");

    if (!text || text.trim() === "") {
      return [];
    }

    return Utilities.parseCsv(text);
  }

  /**
   * Google Drive上のCSVファイル名から取得
   */
  static fetchFromDriveFileName(fileName) {
    if (!fileName) return [];

    const files = DriveApp.getFilesByName(fileName);

    if (!files.hasNext()) {
      return [];
    }

    const file = files.next();
    const text = file.getBlob().getDataAsString("UTF-8");

    if (!text || text.trim() === "") {
      return [];
    }

    return Utilities.parseCsv(text);
  }

  /**
   * URL優先、なければDriveファイル名
   */
  static fetchAuto(url, fileName) {
    if (url) {
      return this.fetch(url);
    }

    if (fileName) {
      return this.fetchFromDriveFileName(fileName);
    }

    return [];
  }
}