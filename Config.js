const CONFIG = Object.freeze({

  APP: {
    NAME: "ΩMAX Ultimate",
    VERSION: "10.0.0"
  },

  SHEETS: {
    RACES: "RACES",
    HORSES: "HORSES",
    ODDS: "ODDS",
    RESULTS: "RESULTS",
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
    WATCH: 1.05
  },

  CONFIDENCE: {
    S: 90,
    A: 80,
    B: 65,
    C: 50,
    D: 35
  },

  FEATURE: {
    DEFAULT_SCORE: 0.50
  },

  LEARNING: {
    ENABLE: true,
    LEARNING_RATE: 0.01
  },

  TICKET: {
    MAX_PER_RACE: 8
  },

  LOG: {
    ENABLE: true,
    MAX_ROWS: 5000
  },

  DEBUG: {
    ENABLE: true
  }

});
