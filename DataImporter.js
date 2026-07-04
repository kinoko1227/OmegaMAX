class DataImporter {

  static importRaces(csvRows) {

    const sheet = SpreadsheetApp.getActive()
      .getSheetByName("RACES");

    sheet.clearContents();

    csvRows.forEach(r => {

      sheet.appendRow([
        r[0], // raceId
        r[1], // name
        r[2], // course
        r[3], // distance
        r[4]  // date
      ]);
    });
  }
}
