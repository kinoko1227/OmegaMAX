/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * Constants.js
 * ----------------------------------------------------------
 * 共通定数・辞書
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

const PACE = Object.freeze({
  SLOW: "SLOW",
  AVERAGE: "AVERAGE",
  FAST: "FAST",
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

const FEATURE_KEY = Object.freeze({
  SPEED: "speed",
  STAMINA: "stamina",
  FINISH: "finish",
  FORM: "form",
  LAST3: "last3",
  LAST5: "last5",
  TREND: "trend",
  DISTANCE: "distance",
  SURFACE: "surface",
  GOING: "going",
  COURSE: "course",
  PACE: "pace",
  JOCKEY: "jockey",
  TRAINER: "trainer",
  GATE: "gate",
  WEIGHT: "weight",
  ODDS: "odds",
  POPULARITY: "popularity",
  MARKET: "market"
});

const DEFAULT_WEIGHT = Object.freeze({
  speed: 1.15,
  stamina: 1.05,
  finish: 1.10,
  form: 1.10,
  last3: 1.12,
  last5: 1.08,
  trend: 1.05,
  distance: 1.10,
  surface: 1.08,
  going: 1.05,
  course: 1.05,
  pace: 1.08,
  jockey: 1.05,
  trainer: 1.03,
  gate: 1.00,
  weight: 1.00,
  odds: 1.00,
  popularity: 0.98,
  market: 1.00
});

const SHEET_HEADERS = Object.freeze({
  RACES: [
    "id",
    "name",
    "course",
    "distance",
    "date",
    "type",
    "surface",
    "going"
  ],

  HORSES: [
    "raceId",
    "horseId",
    "name",
    "jockey",
    "trainer",
    "weight",
    "odds",
    "form",
    "gate",
    "popularity"
  ],

  ODDS: [
    "raceId",
    "horseId",
    "odds"
  ],

  RESULTS: [
    "raceId",
    "winner",
    "place",
    "payout"
  ],

  LOG: [
    "datetime",
    "level",
    "message"
  ]
});
