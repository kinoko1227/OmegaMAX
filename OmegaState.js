/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * OmegaState.js
 * ----------------------------------------------------------
 * システム状態管理
 * PropertiesService 永続化対応
 * ==========================================================
 */

class OmegaState {

  static props() {
    return PropertiesService.getScriptProperties();
  }

  static get(key, defaultValue = null) {
    const raw = this.props().getProperty(key);

    if (raw === null || raw === undefined || raw === "") {
      return defaultValue;
    }

    try {
      return JSON.parse(raw);
    } catch (e) {
      return raw;
    }
  }

  static set(key, value) {
    const stored =
      typeof value === "object" && value !== null
        ? JSON.stringify(value)
        : String(value);

    this.props().setProperty(key, stored);

    return true;
  }

  static remove(key) {
    this.props().deleteProperty(key);
  }

  static getWeights() {
    return this.get(
      "OMEGA_WEIGHTS",
      FeatureEngine.defaultWeights()
    );
  }

  static saveWeights(weights) {
    return this.set(
      "OMEGA_WEIGHTS",
      weights || FeatureEngine.defaultWeights()
    );
  }

  static saveCalibration(calibration) {
    return this.set(
      "OMEGA_CALIBRATION",
      calibration || {}
    );
  }

  static getCalibration() {
    return this.get(
      "OMEGA_CALIBRATION",
      {}
    );
  }

  static saveStatistics(statistics) {
    return this.set(
      "OMEGA_STATISTICS",
      statistics || {}
    );
  }

  static getStatistics() {
    return this.get(
      "OMEGA_STATISTICS",
      {}
    );
  }

  static saveLastResult(result) {
    return this.set(
      "OMEGA_LAST_RESULT",
      result || {}
    );
  }

  static getLastResult() {
    return this.get(
      "OMEGA_LAST_RESULT",
      null
    );
  }

  static saveLastLearningAt(date = new Date()) {
    const value =
      date instanceof Date
        ? date.toISOString()
        : String(date);

    return this.set(
      "OMEGA_LAST_LEARNING_AT",
      value
    );
  }

  static getLastLearningAt() {
    return this.get(
      "OMEGA_LAST_LEARNING_AT",
      null
    );
  }

  static addLog(level, message) {
    const logs = this.getLogs();

    logs.push({
      datetime: Utils.now(),
      level,
      message
    });

    while (logs.length > CONFIG.LOG.MAX_ROWS) {
      logs.shift();
    }

    return this.set(
      "OMEGA_LOGS",
      logs
    );
  }

  static getLogs() {
    return this.get(
      "OMEGA_LOGS",
      []
    );
  }

  static clearLogs() {
    return this.set(
      "OMEGA_LOGS",
      []
    );
  }

  static getBankroll() {
    return Utils.toNumber(
      this.get("OMEGA_BANKROLL", CONFIG.BANKROLL.INITIAL),
      CONFIG.BANKROLL.INITIAL
    );
  }

  static setBankroll(value) {
    return this.set(
      "OMEGA_BANKROLL",
      Utils.toNumber(value, CONFIG.BANKROLL.INITIAL)
    );
  }

  static reset() {
    const keys = [
      "OMEGA_WEIGHTS",
      "OMEGA_CALIBRATION",
      "OMEGA_STATISTICS",
      "OMEGA_LAST_RESULT",
      "OMEGA_LAST_LEARNING_AT",
      "OMEGA_LOGS",
      "OMEGA_BANKROLL"
    ];

    keys.forEach(key => this.remove(key));

    this.saveWeights(FeatureEngine.defaultWeights());
    this.setBankroll(CONFIG.BANKROLL.INITIAL);

    Logger.info("OmegaState Reset");

    return true;
  }
}
