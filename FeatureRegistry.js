/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * FeatureRegistry.js
 * ----------------------------------------------------------
 * 特徴量辞典
 * ※Featureの定義のみを管理する
 * ==========================================================
 */

class FeatureRegistry {

  static all() {
    return [
      ...this.ability(),
      ...this.fit(),
      ...this.form(),
      ...this.flow(),
      ...this.market()
    ];
  }

  static ability() {
    return [
      this.f("speedIndex", "ability", 1.20, true, true),
      this.f("finishIndex", "ability", 1.15, true, true),
      this.f("staminaIndex", "ability", 1.10, true, true),
      this.f("acceleration", "ability", 1.08, true, true),
      this.f("sustainedSpeed", "ability", 1.08, true, true),
      this.f("averageTime", "ability", 1.10, true, true),
      this.f("bestTime", "ability", 1.12, true, true),
      this.f("consistency", "ability", 1.05, true, true),
      this.f("paceResponse", "ability", 1.06, true, true),
      this.f("sectionScore", "ability", 1.08, true, true),
      this.f("last3Speed", "ability", 1.12, true, true),
      this.f("last5Speed", "ability", 1.08, true, true),
      this.f("finishRankAvg", "ability", 1.08, true, true),
      this.f("cornerEfficiency", "ability", 1.04, true, true),
      this.f("topSpeed", "ability", 1.10, true, true),
      this.f("speedVariance", "ability", 0.98, true, true),
      this.f("classSpeed", "ability", 1.10, true, true),
      this.f("recoverySpeed", "ability", 1.03, true, false),
      this.f("endurance", "ability", 1.08, true, true),
      this.f("abilityScore", "ability", 1.20, true, true)
    ];
  }

  static fit() {
    return [
      this.f("distanceFit", "fit", 1.10, true, true),
      this.f("courseFit", "fit", 1.06, true, true),
      this.f("surfaceFit", "fit", 1.08, true, true),
      this.f("goingFit", "fit", 1.06, true, true),
      this.f("gateFit", "fit", 1.02, false, true),
      this.f("seasonFit", "fit", 1.01, false, true),
      this.f("venueFit", "fit", 1.04, true, true),
      this.f("classFit", "fit", 1.06, true, true),
      this.f("jockeyCourseFit", "fit", 1.04, true, true),
      this.f("trainerCourseFit", "fit", 1.03, true, true)
    ];
  }

  static form() {
    return [
      this.f("last1Form", "form", 1.08, true, true),
      this.f("last3Form", "form", 1.12, true, true),
      this.f("last5Form", "form", 1.08, true, true),
      this.f("trend", "form", 1.08, true, true),
      this.f("recovery", "form", 1.03, true, false),
      this.f("layoff", "form", 0.98, true, true),
      this.f("training", "form", 1.06, true, true),
      this.f("bodyWeightChange", "form", 1.02, true, true),
      this.f("fatigue", "form", 0.96, true, true),
      this.f("currentFormScore", "form", 1.12, true, true)
    ];
  }

  static flow() {
    return [
      this.f("runningStyle", "flow", 1.04, true, true),
      this.f("expectedPace", "flow", 1.05, true, true),
      this.f("paceAdvantage", "flow", 1.08, true, true),
      this.f("positionAdvantage", "flow", 1.06, true, true),
      this.f("earlySpeed", "flow", 1.05, true, true),
      this.f("closingAbility", "flow", 1.08, true, true),
      this.f("trafficRisk", "flow", 0.96, true, true),
      this.f("courseBias", "flow", 1.03, true, true),
      this.f("drawBias", "flow", 1.02, true, true),
      this.f("raceFlowScore", "flow", 1.08, true, true)
    ];
  }

  static market() {
    return [
      this.f("oddsScore", "market", 1.00, true, true),
      this.f("popularityScore", "market", 0.98, true, true),
      this.f("marketBias", "market", 1.05, true, true),
      this.f("overlay", "market", 1.10, true, true),
      this.f("underlay", "market", 0.95, true, true),
      this.f("impliedProbability", "market", 1.00, true, true),
      this.f("valueScore", "market", 1.12, true, true),
      this.f("marketStability", "market", 1.02, true, true),
      this.f("crowdBias", "market", 0.98, true, true),
      this.f("investmentScore", "market", 1.15, true, true)
    ];
  }

  static f(key, group, defaultWeight, learning, calibration) {
    return {
      key,
      group,
      defaultWeight,
      learning,
      calibration
    };
  }

  static keys() {
    return this.all().map(f => f.key);
  }

  static learningKeys() {
    return this.all()
      .filter(f => f.learning)
      .map(f => f.key);
  }

  static calibrationKeys() {
    return this.all()
      .filter(f => f.calibration)
      .map(f => f.key);
  }

  static defaultWeights() {
    const weights = {};

    this.all().forEach(f => {
      weights[f.key] = f.defaultWeight;
    });

    return weights;
  }
}
