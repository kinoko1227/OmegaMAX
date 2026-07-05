/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * Config.js
 * ----------------------------------------------------------
 * システム共通設定
 * ==========================================================
 */

const CONFIG = Object.freeze({

  APP: {
    NAME: "ΩMAX Ultimate",
    VERSION: "10.0.0"
  },

  SHEETS: {
    IMPORT: "IMPORT",
    RACES: "RACES",
    HORSES: "HORSES",
    ODDS: "ODDS",
    RESULTS: "RESULTS",
    LEARNING: "LEARNING",
    FEATURE_DB: "FEATURE_DB",
    BACKTEST: "BACKTEST",
    DASHBOARD: "DASHBOARD",
    LOG: "LOG"
  },

  CSV: {
    RACES_URL: "",
    HORSES_URL: "",
    ODDS_URL: "",
    RESULTS_URL: "",

    RACES_FILE: "RACES.csv",
    HORSES_FILE: "HORSES.csv",
    ODDS_FILE: "ODDS.csv",
    RESULTS_FILE: "RESULTS.csv"
  },

  RACING: {
    CENTRAL_DAYS: [0, 6],
    LOCAL_DAYS: [1, 2, 3, 4, 5]
  },

  AUTO: {
    ENABLE: true,
    RUN_HOUR: 5,
    LEARNING_HOUR: 19
  },

  BANKROLL: {
    INITIAL: 100000,
    MAX_BET_RATE: 0.05,
    MIN_BET: 100,
    KELLY_RATE: 0.5
  },

  EV: {
    MIN: 1.05,
    TARGET: 1.15,
    MAX: 3.00
  },

  DECISION: {
    BUY: 1.15,
    WATCH: 1.05,
    PASS: 1.00
  },

  CONFIDENCE: {
    S: 90,
    A: 80,
    B: 65,
    C: 50,
    D: 35
  },

  FEATURE: {
    DEFAULT_SCORE: 0.50,
    MAX_FEATURE_SCORE: 1.00
  },

  LEARNING: {
    ENABLE: true,
    LEARNING_RATE: 0.01,
    MAX_HISTORY: 5000
  },

  CALIBRATION: {
    ENABLE: true,
    YEARS: 3
  },

  TICKET: {
    MAX_PER_RACE: 8
  },

  DASHBOARD: {
    ENABLE: true
  },

  LOG: {
    ENABLE: true,
    MAX_ROWS: 5000,
    LEVEL: "INFO"
  },

  DEBUG: {
    ENABLE: true,
    ENABLE_TIMER: true
  }

});
