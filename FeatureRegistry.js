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
      this.f("speed_index", "ability", 1.20, true, true, (r, h) => h.baseSpeed),
      this.f("finish_index", "ability", 1.15, true, true, (r, h) => h.finishStrength),
      this.f("stamina_index", "ability", 1.10, true, true, (r, h) => h.stamina),
      this.f("acceleration", "ability", 1.08, true, true, (r, h) => h.acceleration),
      this.f("sustained_speed", "ability", 1.08, true, true, (r, h) => h.sustainedSpeed),
      this.f("average_time", "ability", 1.10, true, true, (r, h) => h.averageTime),
      this.f("best_time", "ability", 1.12, true, true, (r, h) => h.bestTime),
      this.f("consistency", "ability", 1.05, true, true, (r, h) => h.consistency),
      this.f("pace_response", "ability", 1.06, true, true, (r, h) => h.paceResponse),
      this.f("section_score", "ability", 1.08, true, true, (r, h) => h.sectionScore),
      this.f("last3_speed", "ability", 1.12, true, true, (r, h) => h.last3Avg),
      this.f("last5_speed", "ability", 1.08, true, true, (r, h) => h.last5Avg),
      this.f("finish_rank_avg", "ability", 1.08, true, true, (r, h) => h.finishRankAvg),
      this.f("corner_efficiency", "ability", 1.04, true, true, (r, h) => h.cornerEfficiency),
      this.f("top_speed", "ability", 1.10, true, true, (r, h) => h.topSpeed),
      this.f("speed_variance", "ability", 0.98, true, true, (r, h) => h.speedVariance),
      this.f("class_speed", "ability", 1.10, true, true, (r, h) => h.classSpeed),
      this.f("recovery_speed", "ability", 1.03, true, false, (r, h) => h.recoverySpeed),
      this.f("endurance", "ability", 1.08, true, true, (r, h) => h.endurance),
      this.f("ability_score", "ability", 1.20, true, true, (r, h) => h.abilityScore)
    ];
  }

  static fit() {
    return [
      this.f("distance_fit", "fit", 1.10, true, true, (r, h) => h.distanceFit),
      this.f("course_fit", "fit", 1.06, true, true, (r, h) => h.courseFit),
      this.f("surface_fit", "fit", 1.08, true, true, (r, h) => h.surfaceFit),
      this.f("going_fit", "fit", 1.06, true, true, (r, h) => h.goingFit),
      this.f("gate_fit", "fit", 1.02, false, true, (r, h) => h.gateFit),
      this.f("season_fit", "fit", 1.01, false, true, (r, h) => h.seasonFit),
      this.f("venue_fit", "fit", 1.04, true, true, (r, h) => h.venueFit),
      this.f("class_fit", "fit", 1.06, true, true, (r, h) => h.classFit),
      this.f("jockey_course_fit", "fit", 1.04, true, true, (r, h) => h.jockeyCourseFit),
      this.f("trainer_course_fit", "fit", 1.03, true, true, (r, h) => h.trainerCourseFit)
    ];
  }

  static form() {
    return [
      this.f("last1_form", "form", 1.08, true, true, (r, h) => h.last1Form),
      this.f("last3_form", "form", 1.12, true, true, (r, h) => h.form),
      this.f("last5_form", "form", 1.08, true, true, (r, h) => h.last5Form),
      this.f("trend", "form", 1.08, true, true, (r, h) => h.trend),
      this.f("recovery", "form", 1.03, true, false, (r, h) => h.recovery),
      this.f("layoff", "form", 0.98, true, true, (r, h) => h.layoff),
      this.f("training", "form", 1.06, true, true, (r, h) => h.training),
      this.f("body_weight_change", "form", 1.02, true, true, (r, h) => h.bodyWeightChange),
      this.f("fatigue", "form", 0.96, true, true, (r, h) => h.fatigue),
      this.f("current_form_score", "form", 1.12, true, true, (r, h) => h.currentFormScore)
    ];
  }

  static flow() {
    return [
      this.f("running_style", "flow", 1.04, true, true, (r, h) => h.runningStyleScore),
      this.f("expected_pace", "flow", 1.05, true, true, (r, h) => h.expectedPaceFit),
      this.f("pace_advantage", "flow", 1.08, true, true, (r, h) => h.paceAdvantage),
      this.f("position_advantage", "flow", 1.06, true, true, (r, h) => h.positionAdvantage),
      this.f("early_speed", "flow", 1.05, true, true, (r, h) => h.earlySpeed),
      this.f("closing_ability", "flow", 1.08, true, true, (r, h) => h.closingAbility),
      this.f("traffic_risk", "flow", 0.96, true, true, (r, h) => h.trafficRisk),
      this.f("course_bias", "flow", 1.03, true, true, (r, h) => h.courseBias),
      this.f("draw_bias", "flow", 1.02, true, true, (r, h) => h.drawBias),
      this.f("race_flow_score", "flow", 1.08, true, true, (r, h) => h.raceFlowScore)
    ];
  }

  static market() {
    return [
      this.f("odds_score", "market", 1.00, true, true, (r, h) => h.odds ? 1 / h.odds : 0),
      this.f("popularity_score", "market", 0.98, true, true, (r, h) => h.popularity ? 1 / h.popularity : 0),
      this.f("market_bias", "market", 1.05, true, true, (r, h) => h.marketBias),
      this.f("overlay", "market", 1.10, true, true, (r, h) => h.overlay),
      this.f("underlay", "market", 0.95, true, true, (r, h) => h.underlay),
      this.f("implied_probability", "market", 1.00, true, true, (r, h) => h.odds ? 1 / h.odds : 0),
      this.f("value_score", "market", 1.12, true, true, (r, h) => h.valueScore),
      this.f("market_stability", "market", 1.02, true, true, (r, h) => h.marketStability),
      this.f("crowd_bias", "market", 0.98, true, true, (r, h) => h.crowdBias),
      this.f("investment_score", "market", 1.15, true, true, (r, h) => h.investmentScore)
    ];
  }

  static f(key, group, defaultWeight, learning, calibration, calculator) {
    return {
      key,
      group,
      defaultWeight,
      learning,
      calibration,
      calculator
    };
  }
}
