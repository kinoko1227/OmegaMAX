class OmegaState {

  static getBankroll() {
    return Number(PropertiesService.getScriptProperties()
      .getProperty("Ω_BANKROLL")) || CONFIG.BANKROLL.INITIAL;
  }

  static setBankroll(value) {
    PropertiesService.getScriptProperties()
      .setProperty("Ω_BANKROLL", String(value));
  }

  static getLogs() {
    const v = PropertiesService.getScriptProperties()
      .getProperty("Ω_LOGS");

    return v ? JSON.parse(v) : [];
  }

  static saveLogs(logs) {
    PropertiesService.getScriptProperties()
      .setProperty("Ω_LOGS", JSON.stringify(logs));
  }

  static getWeights() {
    const v = PropertiesService.getScriptProperties()
      .getProperty("Ω_WEIGHTS");

    return v ? JSON.parse(v) : {};
  }

  static saveWeights(w) {
    PropertiesService.getScriptProperties()
      .setProperty("Ω_WEIGHTS", JSON.stringify(w));
  }

  static reset() {
    PropertiesService.getScriptProperties().deleteAllProperties();
  }
}
