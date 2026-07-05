/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * Validator.js
 * ----------------------------------------------------------
 * 入力検証・安全チェック
 * ==========================================================
 */

class Validator {

  static assert(condition, message = "Validation failed") {
    if (!condition) {
      throw new Error(message);
    }
  }

  static exists(value, message = "Value is required") {
    if (value === null || value === undefined || value === "") {
      throw new Error(message);
    }
    return true;
  }

  static isArray(value, message = "Value must be array") {
    if (!Array.isArray(value)) {
      throw new Error(message);
    }
    return true;
  }

  static isObject(value, message = "Value must be object") {
    if (
      value === null ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      throw new Error(message);
    }
    return true;
  }

  static isNumber(value, message = "Value must be number") {
    const n = Number(value);
    if (isNaN(n)) {
      throw new Error(message);
    }
    return true;
  }

  static hasSheet(sheetName) {
    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(sheetName);

    if (!sheet) {
      throw new Error("Sheet not found: " + sheetName);
    }

    return true;
  }

  static race(race) {
    this.isObject(race, "Race must be object");
    this.exists(race.id, "Race id required");
    this.exists(race.name, "Race name required");

    if (!Array.isArray(race.horses)) {
      race.horses = [];
    }

    return true;
  }

  static horse(horse) {
    this.isObject(horse, "Horse must be object");
    this.exists(horse.id, "Horse id required");
    this.exists(horse.name, "Horse name required");

    return true;
  }

  static ticket(ticket) {
    this.isObject(ticket, "Ticket must be object");
    this.exists(ticket.type, "Ticket type required");

    return true;
  }

  static safeRace(race) {
    try {
      this.race(race);
      return true;
    } catch (e) {
      Logger.warn("Invalid race", {
        error: e.toString(),
        race: race
      });
      return false;
    }
  }

  static safeHorse(horse) {
    try {
      this.horse(horse);
      return true;
    } catch (e) {
      Logger.warn("Invalid horse", {
        error: e.toString(),
        horse: horse
      });
      return false;
    }
  }

}
