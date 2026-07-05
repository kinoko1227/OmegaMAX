/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * Utils.js
 * ----------------------------------------------------------
 * 共通ユーティリティ
 * ==========================================================
 */

class Utils {

  /**
   * null・undefinedチェック
   */
  static isEmpty(value) {

    return (
      value === null ||
      value === undefined ||
      value === ""
    );

  }

  /**
   * 数値変換
   */
  static toNumber(value, defaultValue = 0) {

    const n = Number(value);

    return isNaN(n)
      ? defaultValue
      : n;

  }

  /**
   * 小数丸め
   */
  static round(value, digit = 2) {

    const p = Math.pow(10, digit);

    return Math.round(value * p) / p;

  }

  /**
   * 0～1へ制限
   */
  static clamp01(value) {

    return Math.max(
      0,
      Math.min(1, value)
    );

  }

  /**
   * 配列平均
   */
  static average(list) {

    if (!list || list.length === 0) {
      return 0;
    }

    const sum = list.reduce(
      (a, b) => a + Number(b || 0),
      0
    );

    return sum / list.length;

  }

  /**
   * 合計
   */
  static sum(list) {

    if (!list) return 0;

    return list.reduce(
      (a, b) => a + Number(b || 0),
      0
    );

  }

  /**
   * 最大
   */
  static max(list) {

    return Math.max(...list);

  }

  /**
   * 最小
   */
  static min(list) {

    return Math.min(...list);

  }

  /**
   * ディープコピー
   */
  static clone(obj) {

    return JSON.parse(
      JSON.stringify(obj)
    );

  }

  /**
   * 今日文字列
   */
  static today() {

    return Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      DATE_FORMAT.DATE
    );

  }

  /**
   * UUID生成
   */
  static uuid() {

    return Utilities.getUuid();

  }

}
