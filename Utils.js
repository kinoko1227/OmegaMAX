/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * Utils.js
 * ----------------------------------------------------------
 * 共通ユーティリティ
 * ==========================================================
 */

class Utils {

  static isEmpty(value) {
    return value === null ||
      value === undefined ||
      value === "";
  }

  static toNumber(value, defaultValue = 0) {
    const n = Number(value);
    return isNaN(n) ? defaultValue : n;
  }

  static round(value, digits = 2) {
    const n = this.toNumber(value, 0);
    const p = Math.pow(10, digits);
    return Math.round(n * p) / p;
  }

  static clamp(value, min, max) {
    const n = this.toNumber(value, min);
    return Math.max(min, Math.min(max, n));
  }

  static clamp01(value) {
    return this.clamp(value, 0, 1);
  }

  static sum(list) {
    if (!Array.isArray(list)) return 0;

    return list.reduce((total, v) => {
      return total + this.toNumber(v, 0);
    }, 0);
  }

  static average(list) {
    if (!Array.isArray(list) || list.length === 0) {
      return 0;
    }

    return this.sum(list) / list.length;
  }

  static max(list) {
    if (!Array.isArray(list) || list.length === 0) {
      return 0;
    }

    return Math.max.apply(null, list.map(v => this.toNumber(v, 0)));
  }

  static min(list) {
    if (!Array.isArray(list) || list.length === 0) {
      return 0;
    }

    return Math.min.apply(null, list.map(v => this.toNumber(v, 0)));
  }

  static clone(obj) {
    if (obj === null || obj === undefined) return obj;
    return JSON.parse(JSON.stringify(obj));
  }

  static now() {
    return Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      DATE_FORMAT.DATETIME
    );
  }

  static today() {
    return Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      DATE_FORMAT.DATE
    );
  }

  static dateId(date = new Date()) {
    return Utilities.formatDate(
      date,
      Session.getScriptTimeZone(),
      DATE_FORMAT.DATE_ID
    );
  }

  static uuid() {
    return Utilities.getUuid();
  }
}
