/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * Constants.js
 * ----------------------------------------------------------
 * 共通定数
 * ==========================================================
 */

const DATE_FORMAT = Object.freeze({
  DATE: "yyyy/MM/dd",
  DATE_ID: "yyyyMMdd",
  DATETIME: "yyyy/MM/dd HH:mm:ss"
});

const LOG_LEVEL = Object.freeze({
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  DEBUG: "DEBUG"
});

const RACE_TYPE = Object.freeze({
  CENTRAL: "CENTRAL",
  LOCAL: "LOCAL"
});

const SURFACE = Object.freeze({
  TURF: "TURF",
  DIRT: "DIRT",
  OBSTACLE: "OBSTACLE",
  UNKNOWN: "UNKNOWN"
});

const GOING = Object.freeze({
  FIRM: "FIRM",
  GOOD: "GOOD",
  YIELDING: "YIELDING",
  SOFT: "SOFT",
  HEAVY: "HEAVY",
  UNKNOWN: "UNKNOWN"
});

const DISTANCE_TYPE = Object.freeze({
  SPRINT: "SPRINT",
  MILE: "MILE",
  MIDDLE: "MIDDLE",
  LONG: "LONG",
  UNKNOWN: "UNKNOWN"
});

const DECISION = Object.freeze({
  BUY: "BUY",
  WATCH: "WATCH",
  PASS: "PASS"
});

const CONFIDENCE_RANK = Object.freeze({
  S: "S",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  PASS: "見送り"
});

const TICKET_TYPE = Object.freeze({
  WIN: "単勝",
  QUINELLA: "馬連",
  EXACTA: "馬単",
  WIDE: "ワイド",
  TRIO: "3連複",
  TRIFECTA: "3連単"
});

const SHEET_HEADERS = Object.freeze({
  LOG: ["datetime", "level", "message"]
});
