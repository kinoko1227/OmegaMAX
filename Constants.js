/**
 * ==========================================================
 * ΩMAX Ultimate v9
 * 01_Constants.gs
 * ----------------------------------------------------------
 * システム共通定数
 * ==========================================================
 */

const APP = Object.freeze({
  NAME: CONFIG.APP.NAME,
  VERSION: CONFIG.APP.VERSION,
  AUTHOR: CONFIG.APP.AUTHOR
});

/**
 * 日付フォーマット
 */
const DATE_FORMAT = Object.freeze({
  DATE: "yyyy/MM/dd",
  TIME: "HH:mm",
  DATETIME: "yyyy/MM/dd HH:mm:ss",
  MONTH: "yyyy/MM",
  ID: "yyyyMMdd"
});

/**
 * 競馬場コード
 */
const TRACK_CODES = Object.freeze({

  Hakodate: "HK",
  Sapporo: "SP",
  Fukushima: "FK",

  Tokyo: "TK",
  Nakayama: "NK",
  Niigata: "NG",

  Chukyo: "CK",

  Kyoto: "KY",

  Hanshin: "HS",

  Kokura: "KR"

});

/**
 * レースグレード
 */
const RACE_GRADE = Object.freeze({
  G1: "G1",
  G2: "G2",
  G3: "G3",
  LISTED: "L",
  OPEN: "OP",
  CLASS3: "3勝",
  CLASS2: "2勝",
  CLASS1: "1勝",
  MAIDEN: "未勝利",
  NEWCOMER: "新馬"
});

/**
 * 馬場
 */
const SURFACE = Object.freeze({
  TURF: "芝",
  DIRT: "ダート",
  JUMP: "障害"
});

/**
 * 馬場状態
 */
const TRACK_CONDITION = Object.freeze({
  FIRM: "良",
  GOOD: "稍重",
  YIELDING: "重",
  SOFT: "不良"
});

/**
 * 券種
 */
const BET_TYPE = Object.freeze({
  WIN: "単勝",
  PLACE: "複勝",
  QUINELLA: "馬連",
  EXACTA: "馬単",
  WIDE: "ワイド",
  TRIO: "3連複",
  TRIFECTA: "3連単"
});

/**
 * 勝負度
 */
const CONFIDENCE_GRADE = Object.freeze({
  S: "S",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  SKIP: "見送り"
});

/**
 * ログレベル
 */
const LOG_LEVEL = Object.freeze({
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  DEBUG: "DEBUG"
});

/**
 * 処理結果
 */
const STATUS = Object.freeze({
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
  SKIP: "SKIP"
});

/**
 * シートカラー
 */
const COLORS = Object.freeze({
  HEADER_BG: "#222222",
  HEADER_FONT: "#FFFFFF",

  BUY: "#D9EAD3",
  WATCH: "#FFF2CC",

  ERROR: "#F4CCCC",
  SUCCESS: "#D9EAD3",

  INFO: "#D0E0E3"
});

/**
 * EventId説明キー
 */
const DESCRIPTION_KEYS = Object.freeze({
  EVENT_ID: "EventID",
  PLACE: "競馬場",
  RACE: "レース",
  RANK: "勝負度",
  EXPECT: "期待値",
  MEMO: "メモ"
});

/**
 * FeatureEngineで使用する特徴量キー
 */
const FEATURE_KEYS = Object.freeze({

  ODDS: "odds",
  POPULARITY: "popularity",

  DRAW: "draw",
  HORSE_NUMBER: "horseNumber",

  DISTANCE: "distance",

  COURSE: "course",

  SURFACE: "surface",

  TRACK: "trackCondition",

  WEATHER: "weather",

  PACE: "pace",

  LAST3F: "last3f",

  WEIGHT: "weight",

  AGE: "age",

  SEX: "sex",

  JOCKEY: "jockey",

  TRAINER: "trainer",

  BLOODLINE: "bloodline",

  CLASS: "class",

  FORM: "form",

  FATIGUE: "fatigue",

  GROWTH: "growth",

  TRANSPORT: "transport",

  BIAS: "bias",

  MARKET: "market",

  LEARNING: "learning"

});
