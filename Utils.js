/**
 * ==========================================================
 * ΩMAX Ultimate v9
 * 03_Utils.gs
 * ----------------------------------------------------------
 * 共通ユーティリティ
 * ==========================================================
 */

/**
 * シート取得
 */
function getSheet(name) {

  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(name);

  if (!sheet) {
    throw new Error(`Sheet not found : ${name}`);
  }

  return sheet;

}

/**
 * レース名
 */
function formatRace(place, race) {

  return `${place} ${race}`;

}

/**
 * 数値判定
 */
function isNumber(value) {

  return typeof value === "number" &&
         !isNaN(value) &&
         isFinite(value);

}

/**
 * 数値変換
 */
function toNumber(value, defaultValue = 0) {

  const n = Number(value);

  return isNaN(n)
    ? defaultValue
    : n;

}

/**
 * 小数丸め
 */
function round(value, digit = 2) {

  const p = Math.pow(10, digit);

  return Math.round(value * p) / p;

}

/**
 * 範囲制限
 */
function clamp(value, min, max) {

  return Math.min(
    Math.max(value, min),
    max
  );

}

/**
 * 割合
 */
function percent(value, digit = 1) {

  return round(value * 100, digit);

}

/**
 * 平均
 */
function average(array) {

  if (!array.length) return 0;

  return array.reduce((a, b) => a + b, 0)
    / array.length;

}

/**
 * 分散
 */
function variance(array) {

  if (!array.length) return 0;

  const avg = average(array);

  return array.reduce((sum, x) => {

    return sum + Math.pow(x - avg, 2);

  }, 0) / array.length;

}

/**
 * 標準偏差
 */
function standardDeviation(array) {

  return Math.sqrt(
    variance(array)
  );

}

/**
 * 配列合計
 */
function sum(array) {

  return array.reduce((a, b) => a + b, 0);

}

/**
 * 重複除去
 */
function unique(array) {

  return [...new Set(array)];

}

/**
 * 深いコピー
 */
function deepCopy(obj) {

  return JSON.parse(
    JSON.stringify(obj)
  );

}
