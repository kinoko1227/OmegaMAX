/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * Race.js
 * ----------------------------------------------------------
 * レース・馬データ正規化
 * DataSource → FeatureEngine の橋渡し
 * ==========================================================
 */

class Race {

  static build(raw) {
    const race = raw || {};

    const horses = Array.isArray(race.horses)
      ? race.horses
          .map(h => this.normalizeHorse(h))
          .filter(h => h.id)
      : [];

    return {
      id: String(race.id || ""),
      name: String(race.name || ""),
      course: String(race.course || ""),
      distance: Utils.toNumber(race.distance, 0),
      date: race.date || "",
      type: race.type || DataSource.detectRaceType(),
      surface: race.surface || SURFACE.UNKNOWN,
      going: race.going || GOING.UNKNOWN,
      distanceType: this.distanceType(race.distance),
      horses
    };
  }

  static normalizeHorse(raw) {
    const h = raw || {};

    return {
      raceId: String(h.raceId || ""),
      id: String(h.id || h.horseId || ""),
      name: String(h.name || ""),

      jockey: String(h.jockey || ""),
      trainer: String(h.trainer || ""),

      weight: Utils.toNumber(h.weight, 0),
      odds: Utils.toNumber(h.odds, 0),
      gate: Utils.toNumber(h.gate, 0),
      popularity: Utils.toNumber(h.popularity, 0),

      // ability
      speedIndex: Utils.toNumber(h.speedIndex || h.baseSpeed || h.speed, 0),
      finishIndex: Utils.toNumber(h.finishIndex || h.finishStrength || h.finish, 0),
      staminaIndex: Utils.toNumber(h.staminaIndex || h.stamina, 0),
      acceleration: Utils.toNumber(h.acceleration, 0),
      sustainedSpeed: Utils.toNumber(h.sustainedSpeed, 0),
      averageTime: Utils.toNumber(h.averageTime, 0),
      bestTime: Utils.toNumber(h.bestTime, 0),
      consistency: Utils.toNumber(h.consistency, 0),
      paceResponse: Utils.toNumber(h.paceResponse, 0),
      sectionScore: Utils.toNumber(h.sectionScore, 0),
      last3Speed: Utils.toNumber(h.last3Speed || h.last3Avg || h.last3, 0),
      last5Speed: Utils.toNumber(h.last5Speed || h.last5Avg || h.last5, 0),
      finishRankAvg: Utils.toNumber(h.finishRankAvg, 0),
      cornerEfficiency: Utils.toNumber(h.cornerEfficiency, 0),
      topSpeed: Utils.toNumber(h.topSpeed, 0),
      speedVariance: Utils.toNumber(h.speedVariance, 0),
      classSpeed: Utils.toNumber(h.classSpeed, 0),
      recoverySpeed: Utils.toNumber(h.recoverySpeed, 0),
      endurance: Utils.toNumber(h.endurance, 0),
      abilityScore: Utils.toNumber(h.abilityScore, 0),

      // fit
      distanceFit: Utils.toNumber(h.distanceFit, CONFIG.FEATURE.DEFAULT_SCORE),
      courseFit: Utils.toNumber(h.courseFit, CONFIG.FEATURE.DEFAULT_SCORE),
      surfaceFit: Utils.toNumber(h.surfaceFit, CONFIG.FEATURE.DEFAULT_SCORE),
      goingFit: Utils.toNumber(h.goingFit, CONFIG.FEATURE.DEFAULT_SCORE),
      gateFit: Utils.toNumber(h.gateFit, CONFIG.FEATURE.DEFAULT_SCORE),
      seasonFit: Utils.toNumber(h.seasonFit, CONFIG.FEATURE.DEFAULT_SCORE),
      venueFit: Utils.toNumber(h.venueFit, CONFIG.FEATURE.DEFAULT_SCORE),
      classFit: Utils.toNumber(h.classFit, CONFIG.FEATURE.DEFAULT_SCORE),
      jockeyCourseFit: Utils.toNumber(h.jockeyCourseFit, CONFIG.FEATURE.DEFAULT_SCORE),
      trainerCourseFit: Utils.toNumber(h.trainerCourseFit, CONFIG.FEATURE.DEFAULT_SCORE),

      // form
      last1Form: Utils.toNumber(h.last1Form, 0),
      last3Form: Utils.toNumber(h.last3Form || h.form, 0),
      last5Form: Utils.toNumber(h.last5Form, 0),
      trend: Utils.toNumber(h.trend, 0),
      recovery: Utils.toNumber(h.recovery, 0),
      layoff: Utils.toNumber(h.layoff, 0),
      training: Utils.toNumber(h.training, 0),
      bodyWeightChange: Utils.toNumber(h.bodyWeightChange, 0),
      fatigue: Utils.toNumber(h.fatigue, 0),
      currentFormScore: Utils.toNumber(h.currentFormScore, 0),

      // flow
      runningStyle: Utils.toNumber(h.runningStyle, 0),
      expectedPace: Utils.toNumber(h.expectedPace, CONFIG.FEATURE.DEFAULT_SCORE),
      paceAdvantage: Utils.toNumber(h.paceAdvantage, 0),
      positionAdvantage: Utils.toNumber(h.positionAdvantage, 0),
      earlySpeed: Utils.toNumber(h.earlySpeed, 0),
      closingAbility: Utils.toNumber(h.closingAbility, 0),
      trafficRisk: Utils.toNumber(h.trafficRisk, 0),
      courseBias: Utils.toNumber(h.courseBias, 0),
      drawBias: Utils.toNumber(h.drawBias, 0),
      raceFlowScore: Utils.toNumber(h.raceFlowScore, 0),

      // market
      oddsScore: Utils.toNumber(h.oddsScore, h.odds ? 1 / Utils.toNumber(h.odds, 1) : 0),
      popularityScore: Utils.toNumber(h.popularityScore, h.popularity ? 1 / Utils.toNumber(h.popularity, 1) : 0),
      marketBias: Utils.toNumber(h.marketBias, 0),
      overlay: Utils.toNumber(h.overlay, 0),
      underlay: Utils.toNumber(h.underlay, 0),
      impliedProbability: Utils.toNumber(h.impliedProbability, h.odds ? 1 / Utils.toNumber(h.odds, 1) : 0),
      valueScore: Utils.toNumber(h.valueScore, 0),
      marketStability: Utils.toNumber(h.marketStability, 0),
      crowdBias: Utils.toNumber(h.crowdBias, 0),
      investmentScore: Utils.toNumber(h.investmentScore, 0)
    };
  }

  static toFeatureInput(race) {
    const r = this.build(race);

    return {
      race: r,
      context: this.extractContext(r),
      horses: r.horses
    };
  }

  static extractContext(race) {
    const distance = Utils.toNumber(race.distance, 0);

    return {
      raceId: race.id,
      type: race.type || RACE_TYPE.CENTRAL,
      course: race.course || "",
      surface: race.surface || SURFACE.UNKNOWN,
      going: race.going || GOING.UNKNOWN,
      distance,
      distanceType: this.distanceType(distance),
      horseCount: Array.isArray(race.horses) ? race.horses.length : 0,

      isShort: distance > 0 && distance <= 1400,
      isMile: distance > 1400 && distance <= 1800,
      isMiddle: distance > 1800 && distance < 2400,
      isLong: distance >= 2400,

      isCentral: race.type === RACE_TYPE.CENTRAL,
      isLocal: race.type === RACE_TYPE.LOCAL
    };
  }

  static distanceType(distance) {
    const d = Utils.toNumber(distance, 0);

    if (d <= 0) return DISTANCE_TYPE.UNKNOWN;
    if (d <= 1400) return DISTANCE_TYPE.SPRINT;
    if (d <= 1800) return DISTANCE_TYPE.MILE;
    if (d < 2400) return DISTANCE_TYPE.MIDDLE;

    return DISTANCE_TYPE.LONG;
  }

  static isValid(race) {
    if (!race) return false;
    if (!race.id) return false;
    if (!Array.isArray(race.horses)) return false;
    if (race.horses.length === 0) return false;

    return true;
  }
}
