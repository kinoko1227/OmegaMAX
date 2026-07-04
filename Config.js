const CONFIG = Object.freeze({

  APP: {
    NAME: "ΩMAX Ultimate",
    VERSION: "9.0.0"
  },

  SHEETS: {
    RACES: "RACES",
    ODDS: "ODDS",
    RESULTS: "RESULTS",
    LOG: "LOG"
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
    MAX: 3.0
  },

  CONFIDENCE: {
    S: 90,
    A: 80,
    B: 65,
    C: 50,
    D: 35
  },

  LOG: {
    ENABLE: true,
    MAX_ROWS: 500
  },

  DEBUG: {
    ENABLE: true
  }

});
