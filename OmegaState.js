/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * OmegaState.js
 * ----------------------------------------------------------
 * 状態管理：資金・ログ・重み・補正・統計
 * ==========================================================
 */

class OmegaState {

  static props() {
    return PropertiesService.getScriptProperties();
  }

  static get(key, defaultValue = null) {
    const raw = this.props().getProperty(key);

    if (raw === null || raw === undefined) {
      return defaultValue;
    }

    try {
      return JSON.parse(raw);
    } catch (e) {
      return raw;
    }
  }

  static set(key, value) {
    const v =
      typeof value === "object" && value !== null
        ? JSON.stringify(value)
        : String(value);

    this.props().setProperty(key, v);
  }

  // -----------------------------
  // Bankroll
  // -----------------------------

  static getBankroll() {
    return Number(
      this.get("OMEGA_BANKROLL", CONFIG.BANKROLL.INITIAL)
    ) || CONFIG.BANKROLL.INITIAL;
  }

  static setBankroll(value) {
    this.set("OMEGA_BANKROLL", Number(value) || CONFIG.BANKROLL.INITIAL);
  }

  // 旧コード互換
  static loadBankroll() {
    return this.getBankroll();
  }

  // -----------------------------
  // Logs
  // -----------------------------

  static getLogs() {
    return this.get("OMEGA_LOGS", []);
  }

  static saveLogs(logs) {
    this.set("OMEGA_LOGS", Array.isArray(logs) ? logs : []);
  }

  static loadLogs() {
    return this.getLogs();
  }

  // -----------------------------
  // Weights
  // -----------------------------

  static getWeights() {
    return this.get("OMEGA_WEIGHTS", DEFAULT_WEIGHT || {});
  }

  static saveWeights(weights) {
    this.set("OMEGA_WEIGHTS", weights || {});
  }

  // -----------------------------
  // Calibration
  // -----------------------------

  static getCalibration() {
    return this.get("OMEGA_CALIBRATION", {});
  }

  static saveCalibration(data) {
    this.set("OMEGA_CALIBRATION", data || {});
  }

  // -----------------------------
  // Statistics
  // -----------------------------

  static getStatistics() {
    return this.get("OMEGA_STATS", {});
  }

  static saveStatistics(stats) {
    this.set("OMEGA_STATS", stats || {});
  }

  // -----------------------------
  // Learning timestamp
  // -----------------------------

  static getLastLearningAt() {
    return this.get("OMEGA_LAST_LEARNING_AT", null);
  }

  static saveLastLearningAt(date = new Date()) {
    this.set("OMEGA_LAST_LEARNING_AT", date.toISOString());
  }

  // -----------------------------
  // Result save helper
  // -----------------------------

  static save(result) {
    if (!result) return;

    if (result.finalBankroll !== undefined) {
      this.setBankroll(result.finalBankroll);
    }

    if (result.logs) {
      this.saveLogs(result.logs);
    }

    this.set("OMEGA_LAST_RESULT", result);
  }

  static getLastResult() {
    return this.get("OMEGA_LAST_RESULT", null);
  }

  // -----------------------------
  // Reset
  // -----------------------------

  static reset() {
    this.props().deleteAllProperties();
  }
}
