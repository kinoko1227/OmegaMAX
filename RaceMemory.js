/**
 * ==========================================================
 * ΩMAX AIOS
 * RaceMemory.js
 * ----------------------------------------------------------
 * Race Memory v1.0.0
 *
 * レースそのものを記憶するProfile。
 *
 * RaceMemoryは「レース結果の保存」ではなく、
 * コース・馬場・天候・メンバー構成・展開・市場・投資結果を
 * まとめて記憶し、将来の類似レース検索・ScenarioEngine・ACEへ渡す。
 *
 * GAS V8 compatible.
 * ==========================================================
 */
 
class RaceMemory extends KnowledgeProfile {
 
  constructor(raceId) {
    super(raceId || "", "RACE_MEMORY");
 
    this.raceId = raceId || "";
 
    // -------------------------
    // Identity
    // -------------------------
    this.name = "";
    this.date = null;
    this.course = "";
    this.track = "";
    this.surface = "";
    this.distance = 0;
    this.raceClass = "";
    this.grade = "";
 
    // -------------------------
    // Course / Weather State
    // -------------------------
    this.going = "";
    this.weather = "";
    this.temperature = null;
    this.humidity = null;
    this.windDirection = "";
    this.windSpeed = null;
    this.cushionValue = null;
    this.moisture = null;
    this.trackBias = "";
    this.courseVersion = "";
 
    // -------------------------
    // Field Composition
    // -------------------------
    this.fieldSize = 0;
    this.runningStyleDistribution = {};
    this.abilityDistribution = {};
    this.popularityDistribution = {};
    this.jockeyDistribution = {};
    this.bloodlineDistribution = {};
 
    // -------------------------
    // Race Flow
    // -------------------------
    this.pace = "";
    this.lapProfile = [];
    this.firstHalf = null;
    this.secondHalf = null;
    this.final3f = null;
    this.positionFlow = [];
    this.cornerFlow = [];
 
    // -------------------------
    // Result Type
    // -------------------------
    this.raceType = "UNKNOWN";
    this.finishType = "UNKNOWN";
    this.biasType = "UNKNOWN";
    this.scenarioType = "UNKNOWN";
 
    // -------------------------
    // Investment / Market
    // -------------------------
    this.marketSkew = 0;
    this.expectedValue = 0;
    this.roi = 0;
    this.kellyRate = 0;
    this.betResult = null;
 
    // -------------------------
    // Knowledge Maps
    // -------------------------
    this.environmentKnowledge = {};
    this.fieldCompositionKnowledge = {};
    this.paceKnowledge = {};
    this.flowKnowledge = {};
    this.resultTypeKnowledge = {};
    this.marketKnowledge = {};
    this.investmentKnowledge = {};
    this.similarityKnowledge = {};
 
    // -------------------------
    // Similarity / Scenario
    // -------------------------
    this.similarRaceIds = [];
    this.scenarioProbabilities = {};
    this.recommendedBias = "";
 
    // -------------------------
    // Learning managers
    // -------------------------
    this.weights = new KnowledgeWeights("RACE_MEMORY");
    this.knowledgeHistory = new KnowledgeHistory();
    this.versionManager = new VersionManager();
    this.aiJournal = new AIJournal();
  }
 
  /**
   * Raw race resultからRaceMemoryを構築する
   */
  learnRace(rawRace) {
    rawRace = rawRace || {};
 
    this.applyRaceIdentity(rawRace);
    this.applyEnvironment(rawRace);
    this.applyFieldComposition(rawRace);
    this.applyRaceFlow(rawRace);
    this.applyMarket(rawRace);
 
    const observation = this.buildRaceObservation(rawRace);
 
    this.learn(observation);
 
    this.aiJournal.add({
      type: "LEARN",
      category: "RACE_MEMORY",
      title: "RaceMemory learned race",
      message: "RaceMemory updated from race result.",
      targetType: "RACE_MEMORY",
      targetId: this.raceId,
      evidence: {
        raceId: this.raceId,
        raceType: this.raceType,
        pace: this.pace,
        finishType: this.finishType,
        roi: this.roi
      }
    });
 
    this.touch();
    return this;
  }
 
  /**
   * 通常のObservation学習
   */
  learn(observation) {
    if (!observation) {
      return this;
    }
 
    KnowledgeProfile.prototype.learn.call(this, observation);
 
    this.updateRaceKnowledge(observation);
    this.updateScenarioProbabilities(observation);
    this.updateConfidence();
 
    this.touch();
    return this;
  }
 
  applyRaceIdentity(rawRace) {
    this.raceId = rawRace.raceId || this.raceId;
    this.id = this.raceId;
    this.name = rawRace.name || this.name;
    this.date = rawRace.date || this.date;
    this.course = rawRace.course || this.course;
    this.track = rawRace.track || this.track;
    this.surface = rawRace.surface || this.surface;
    this.distance = Number(rawRace.distance || this.distance || 0);
    this.raceClass = rawRace.raceClass || this.raceClass;
    this.grade = rawRace.grade || this.grade;
    this.fieldSize = Number(rawRace.fieldSize || this.fieldSize || 0);
    return this;
  }
 
  applyEnvironment(rawRace) {
    this.going = rawRace.going || this.going;
    this.weather = rawRace.weather || this.weather;
    this.temperature = rawRace.temperature != null ? Number(rawRace.temperature) : this.temperature;
    this.humidity = rawRace.humidity != null ? Number(rawRace.humidity) : this.humidity;
    this.windDirection = rawRace.windDirection || this.windDirection;
    this.windSpeed = rawRace.windSpeed != null ? Number(rawRace.windSpeed) : this.windSpeed;
    this.cushionValue = rawRace.cushionValue != null ? Number(rawRace.cushionValue) : this.cushionValue;
    this.moisture = rawRace.moisture != null ? Number(rawRace.moisture) : this.moisture;
    this.trackBias = rawRace.trackBias || this.trackBias;
    this.courseVersion = rawRace.courseVersion || this.courseVersion;
    return this;
  }
 
  applyFieldComposition(rawRace) {
    this.runningStyleDistribution = rawRace.runningStyleDistribution || this.runningStyleDistribution || {};
    this.abilityDistribution = rawRace.abilityDistribution || this.abilityDistribution || {};
    this.popularityDistribution = rawRace.popularityDistribution || this.popularityDistribution || {};
    this.jockeyDistribution = rawRace.jockeyDistribution || this.jockeyDistribution || {};
    this.bloodlineDistribution = rawRace.bloodlineDistribution || this.bloodlineDistribution || {};
    return this;
  }
 
  applyRaceFlow(rawRace) {
    this.pace = rawRace.pace || this.pace;
    this.lapProfile = rawRace.lapProfile || this.lapProfile || [];
    this.firstHalf = rawRace.firstHalf != null ? Number(rawRace.firstHalf) : this.firstHalf;
    this.secondHalf = rawRace.secondHalf != null ? Number(rawRace.secondHalf) : this.secondHalf;
    this.final3f = rawRace.final3f != null ? Number(rawRace.final3f) : this.final3f;
    this.positionFlow = rawRace.positionFlow || this.positionFlow || [];
    this.cornerFlow = rawRace.cornerFlow || this.cornerFlow || [];
 
    this.raceType = rawRace.raceType || this.detectRaceType();
    this.finishType = rawRace.finishType || this.detectFinishType(rawRace);
    this.biasType = rawRace.biasType || this.detectBiasType(rawRace);
    this.scenarioType = rawRace.scenarioType || this.detectScenarioType();
 
    return this;
  }
 
  applyMarket(rawRace) {
    this.marketSkew = Number(rawRace.marketSkew || this.marketSkew || 0);
    this.expectedValue = Number(rawRace.expectedValue || this.expectedValue || 0);
    this.roi = Number(rawRace.roi || this.roi || 0);
    this.kellyRate = Number(rawRace.kellyRate || this.kellyRate || 0);
    this.betResult = rawRace.betResult || this.betResult;
    return this;
  }
 
  /**
   * RaceMemory用Observation生成
   */
  buildRaceObservation(rawRace) {
    rawRace = rawRace || {};
 
    return {
      id: rawRace.observationId || Utilities.getUuid(),
      raceId: this.raceId,
      date: this.date,
      course: this.course,
      track: this.track,
      surface: this.surface,
      distance: this.distance,
      going: this.going,
      raceClass: this.raceClass,
      grade: this.grade,
      fieldSize: this.fieldSize,
      weather: this.weather,
      temperature: this.temperature,
      humidity: this.humidity,
      windDirection: this.windDirection,
      windSpeed: this.windSpeed,
      cushionValue: this.cushionValue,
      moisture: this.moisture,
      trackBias: this.trackBias,
      courseVersion: this.courseVersion,
      pace: this.pace,
      firstHalf: this.firstHalf,
      secondHalf: this.secondHalf,
      final3f: this.final3f,
      raceType: this.raceType,
      finishType: this.finishType,
      biasType: this.biasType,
      scenarioType: this.scenarioType,
      marketSkew: this.marketSkew,
      expectedValue: this.expectedValue,
      roi: this.roi,
      kellyRate: this.kellyRate,
      abilityIndex: Number(rawRace.raceAbilityIndex || 0),
      aceScore: Number(rawRace.aceScore || 0),
      finish: Number(rawRace.predictedTopFinish || 0),
      createdAt: new Date()
    };
  }
 
  updateRaceKnowledge(observation) {
    this.updateKnowledgeCell(this.environmentKnowledge, observation.weather, "WEATHER", observation);
    this.updateKnowledgeCell(this.environmentKnowledge, this.bucketValue(observation.temperature, 5), "TEMPERATURE", observation);
    this.updateKnowledgeCell(this.environmentKnowledge, this.bucketValue(observation.windSpeed, 1), "WIND", observation);
    this.updateKnowledgeCell(this.environmentKnowledge, this.bucketValue(observation.cushionValue, 0.5), "CUSHION", observation);
    this.updateKnowledgeCell(this.environmentKnowledge, this.bucketValue(observation.moisture, 1), "MOISTURE", observation);
    this.updateKnowledgeCell(this.environmentKnowledge, observation.trackBias, "TRACK_BIAS", observation);
 
    this.updateKnowledgeCell(this.fieldCompositionKnowledge, this.bucketValue(observation.fieldSize, 2), "FIELD_SIZE", observation);
    this.updateKnowledgeCell(this.paceKnowledge, observation.pace, "PACE", observation);
    this.updateKnowledgeCell(this.flowKnowledge, observation.raceType, "RACE_TYPE", observation);
    this.updateKnowledgeCell(this.resultTypeKnowledge, observation.finishType, "FINISH_TYPE", observation);
    this.updateKnowledgeCell(this.resultTypeKnowledge, observation.biasType, "BIAS_TYPE", observation);
    this.updateKnowledgeCell(this.marketKnowledge, this.bucketValue(observation.marketSkew, 0.1), "MARKET_SKEW", observation);
    this.updateKnowledgeCell(this.investmentKnowledge, this.bucketValue(observation.expectedValue, 0.1), "EXPECTED_VALUE", observation);
    this.updateKnowledgeCell(this.investmentKnowledge, this.bucketValue(observation.roi, 0.1), "ROI", observation);
 
    return this;
  }
 
  /**
   * 類似レース検索用ベクトル
   */
  buildSimilarityVector() {
    return {
      course: this.course,
      surface: this.surface,
      distance: this.distance,
      going: this.going,
      raceClass: this.raceClass,
      fieldSize: this.fieldSize,
      pace: this.pace,
      raceType: this.raceType,
      finishType: this.finishType,
      trackBias: this.trackBias,
      cushionValue: this.cushionValue,
      moisture: this.moisture,
      weather: this.weather
    };
  }
 
  /**
   * 他RaceMemoryとの類似度 0〜100
   */
  similarityTo(other) {
    if (!other) {
      return 0;
    }
 
    const a = this.buildSimilarityVector();
    const b = typeof other.buildSimilarityVector === "function"
      ? other.buildSimilarityVector()
      : other;
 
    let score = 0;
    let max = 0;
 
    score += this.matchScore(a.course, b.course, 12); max += 12;
    score += this.matchScore(a.surface, b.surface, 10); max += 10;
    score += this.numericScore(a.distance, b.distance, 400, 12); max += 12;
    score += this.matchScore(a.going, b.going, 8); max += 8;
    score += this.matchScore(a.raceClass, b.raceClass, 8); max += 8;
    score += this.numericScore(a.fieldSize, b.fieldSize, 6, 8); max += 8;
    score += this.matchScore(a.pace, b.pace, 10); max += 10;
    score += this.matchScore(a.raceType, b.raceType, 10); max += 10;
    score += this.matchScore(a.finishType, b.finishType, 8); max += 8;
    score += this.matchScore(a.trackBias, b.trackBias, 6); max += 6;
    score += this.numericScore(a.cushionValue, b.cushionValue, 2, 5); max += 5;
    score += this.numericScore(a.moisture, b.moisture, 5, 3); max += 3;
 
    return max > 0 ? Utils.clamp((score / max) * 100, 0, 100) : 0;
  }
 
  matchScore(a, b, weight) {
    if (!a || !b) return 0;
    return String(a) === String(b) ? weight : 0;
  }
 
  numericScore(a, b, tolerance, weight) {
    if (a === null || a === undefined || b === null || b === undefined) {
      return 0;
    }
 
    const diff = Math.abs(Number(a) - Number(b));
    if (isNaN(diff)) return 0;
    if (diff >= tolerance) return 0;
 
    return weight * (1 - diff / tolerance);
  }
 
  /**
   * 類似レース一覧から上位抽出
   */
  findSimilarRaces(memories, limit) {
    limit = limit || 20;
 
    const list = (memories || []).map(function(memory) {
      return {
        raceId: memory.raceId || memory.id || "",
        similarity: this.similarityTo(memory),
        memory: memory
      };
    }, this)
    .filter(function(x) {
      return x.similarity > 0;
    })
    .sort(function(a, b) {
      return b.similarity - a.similarity;
    })
    .slice(0, limit);
 
    this.similarRaceIds = list.map(function(x) {
      return x.raceId;
    });
 
    return list;
  }
 
  /**
   * シナリオ確率更新
   */
  updateScenarioProbabilities(observation) {
    if (!observation || !observation.scenarioType) {
      return this;
    }
 
    if (!this.scenarioProbabilities[observation.scenarioType]) {
      this.scenarioProbabilities[observation.scenarioType] = {
        count: 0,
        probability: 0
      };
    }
 
    this.scenarioProbabilities[observation.scenarioType].count += 1;
 
    const total = Object.keys(this.scenarioProbabilities).reduce(function(sum, key) {
      return sum + Number(this.scenarioProbabilities[key].count || 0);
    }.bind(this), 0);
 
    Object.keys(this.scenarioProbabilities).forEach(function(key) {
      this.scenarioProbabilities[key].probability = total > 0
        ? this.scenarioProbabilities[key].count / total
        : 0;
    }, this);
 
    return this;
  }
 
  detectRaceType() {
    if (this.firstHalf !== null && this.secondHalf !== null) {
      const diff = Number(this.firstHalf) - Number(this.secondHalf);
      if (diff <= -1.0) return "FRONT_LOADED";
      if (diff >= 1.0) return "LATE_SPEED";
      return "BALANCED";
    }
 
    if (this.pace) {
      if (this.pace === "HIGH" || this.pace === "超ハイ") return "FRONT_LOADED";
      if (this.pace === "SLOW" || this.pace === "スロー") return "LATE_SPEED";
    }
 
    return "UNKNOWN";
  }
 
  detectFinishType(rawRace) {
    rawRace = rawRace || {};
 
    if (rawRace.finishType) {
      return rawRace.finishType;
    }
 
    const winnerStyle = rawRace.winnerRunningStyle || "";
 
    if (winnerStyle === "逃げ") return "FRONT_WIN";
    if (winnerStyle === "先行") return "STALKER_WIN";
    if (winnerStyle === "差し") return "CLOSER_WIN";
    if (winnerStyle === "追込") return "DEEP_CLOSER_WIN";
 
    return "UNKNOWN";
  }
 
  detectBiasType(rawRace) {
    rawRace = rawRace || {};
 
    if (rawRace.biasType) {
      return rawRace.biasType;
    }
 
    if (this.trackBias) {
      return this.trackBias;
    }
 
    return "UNKNOWN";
  }
 
  detectScenarioType() {
    const pace = this.pace || "";
    const finish = this.finishType || "";
 
    if ((pace === "HIGH" || pace === "超ハイ") && String(finish).indexOf("CLOSER") >= 0) {
      return "HIGH_PACE_CLOSER";
    }
 
    if ((pace === "SLOW" || pace === "スロー") && String(finish).indexOf("FRONT") >= 0) {
      return "SLOW_FRONT";
    }
 
    if (String(finish).indexOf("CLOSER") >= 0) {
      return "CLOSER_RACE";
    }
 
    if (String(finish).indexOf("FRONT") >= 0 || String(finish).indexOf("STALKER") >= 0) {
      return "FRONT_RACE";
    }
 
    return "BALANCED";
  }
 
  /**
   * Investment評価
   */
  isProfitable() {
    return Number(this.roi || 0) >= 1.0 || Number(this.expectedValue || 0) >= 1.1;
  }
 
  bucketValue(value, bucketSize) {
    if (value === null || value === undefined || value === "") return "";
    const n = Number(value);
    if (isNaN(n)) return String(value);
    const b = Number(bucketSize || 1);
    if (b <= 0) return String(n);
    return String(Math.round(n / b) * b);
  }
 
  serializeMap(map) {
    return KnowledgeProfile.prototype.serializeMap.call(this, map);
  }
 
  loadMap(jsonMap) {
    return KnowledgeProfile.prototype.loadMap.call(this, jsonMap);
  }
 
  createSnapshot(label, reason) {
    return this.versionManager.createSnapshot({
      targetType: "RACE_MEMORY",
      targetId: this.raceId,
      version: this.version,
      label: label || "",
      reason: reason || "",
      data: this.toJSON()
    });
  }
 
  rollback(snapshotId) {
    const data = this.versionManager.rollback(
      "RACE_MEMORY",
      this.raceId,
      snapshotId || null
    );
 
    if (!data) return false;
 
    this.load(data);
    return true;
  }
 
  toJSON() {
    const base = KnowledgeProfile.prototype.toJSON.call(this);
 
    return Object.assign(base, {
      raceId: this.raceId,
      name: this.name,
      date: this.date,
      course: this.course,
      track: this.track,
      surface: this.surface,
      distance: this.distance,
      raceClass: this.raceClass,
      grade: this.grade,
 
      going: this.going,
      weather: this.weather,
      temperature: this.temperature,
      humidity: this.humidity,
      windDirection: this.windDirection,
      windSpeed: this.windSpeed,
      cushionValue: this.cushionValue,
      moisture: this.moisture,
      trackBias: this.trackBias,
      courseVersion: this.courseVersion,
 
      fieldSize: this.fieldSize,
      runningStyleDistribution: this.runningStyleDistribution,
      abilityDistribution: this.abilityDistribution,
      popularityDistribution: this.popularityDistribution,
      jockeyDistribution: this.jockeyDistribution,
      bloodlineDistribution: this.bloodlineDistribution,
 
      pace: this.pace,
      lapProfile: this.lapProfile,
      firstHalf: this.firstHalf,
      secondHalf: this.secondHalf,
      final3f: this.final3f,
      positionFlow: this.positionFlow,
      cornerFlow: this.cornerFlow,
 
      raceType: this.raceType,
      finishType: this.finishType,
      biasType: this.biasType,
      scenarioType: this.scenarioType,
 
      marketSkew: this.marketSkew,
      expectedValue: this.expectedValue,
      roi: this.roi,
      kellyRate: this.kellyRate,
      betResult: this.betResult,
 
      environmentKnowledge: this.serializeMap(this.environmentKnowledge),
      fieldCompositionKnowledge: this.serializeMap(this.fieldCompositionKnowledge),
      paceKnowledge: this.serializeMap(this.paceKnowledge),
      flowKnowledge: this.serializeMap(this.flowKnowledge),
      resultTypeKnowledge: this.serializeMap(this.resultTypeKnowledge),
      marketKnowledge: this.serializeMap(this.marketKnowledge),
      investmentKnowledge: this.serializeMap(this.investmentKnowledge),
      similarityKnowledge: this.serializeMap(this.similarityKnowledge),
 
      similarRaceIds: this.similarRaceIds,
      scenarioProbabilities: this.scenarioProbabilities,
      recommendedBias: this.recommendedBias,
 
      weights: this.weights.toJSON(),
      knowledgeHistory: this.knowledgeHistory.toJSON(),
      versionManager: this.versionManager.toJSON(),
      aiJournal: this.aiJournal.toJSON()
    });
  }
 
  load(json) {
    KnowledgeProfile.prototype.load.call(this, json);
 
    if (!json) return this;
 
    this.raceId = json.raceId || this.id;
    this.name = json.name || "";
    this.date = json.date || null;
    this.course = json.course || "";
    this.track = json.track || "";
    this.surface = json.surface || "";
    this.distance = json.distance || 0;
    this.raceClass = json.raceClass || "";
    this.grade = json.grade || "";
 
    this.going = json.going || "";
    this.weather = json.weather || "";
    this.temperature = json.temperature != null ? json.temperature : null;
    this.humidity = json.humidity != null ? json.humidity : null;
    this.windDirection = json.windDirection || "";
    this.windSpeed = json.windSpeed != null ? json.windSpeed : null;
    this.cushionValue = json.cushionValue != null ? json.cushionValue : null;
    this.moisture = json.moisture != null ? json.moisture : null;
    this.trackBias = json.trackBias || "";
    this.courseVersion = json.courseVersion || "";
 
    this.fieldSize = json.fieldSize || 0;
    this.runningStyleDistribution = json.runningStyleDistribution || {};
    this.abilityDistribution = json.abilityDistribution || {};
    this.popularityDistribution = json.popularityDistribution || {};
    this.jockeyDistribution = json.jockeyDistribution || {};
    this.bloodlineDistribution = json.bloodlineDistribution || {};
 
    this.pace = json.pace || "";
    this.lapProfile = json.lapProfile || [];
    this.firstHalf = json.firstHalf != null ? json.firstHalf : null;
    this.secondHalf = json.secondHalf != null ? json.secondHalf : null;
    this.final3f = json.final3f != null ? json.final3f : null;
    this.positionFlow = json.positionFlow || [];
    this.cornerFlow = json.cornerFlow || [];
 
    this.raceType = json.raceType || "UNKNOWN";
    this.finishType = json.finishType || "UNKNOWN";
    this.biasType = json.biasType || "UNKNOWN";
    this.scenarioType = json.scenarioType || "UNKNOWN";
 
    this.marketSkew = json.marketSkew || 0;
    this.expectedValue = json.expectedValue || 0;
    this.roi = json.roi || 0;
    this.kellyRate = json.kellyRate || 0;
    this.betResult = json.betResult || null;
 
    this.environmentKnowledge = this.loadMap(json.environmentKnowledge);
    this.fieldCompositionKnowledge = this.loadMap(json.fieldCompositionKnowledge);
    this.paceKnowledge = this.loadMap(json.paceKnowledge);
    this.flowKnowledge = this.loadMap(json.flowKnowledge);
    this.resultTypeKnowledge = this.loadMap(json.resultTypeKnowledge);
    this.marketKnowledge = this.loadMap(json.marketKnowledge);
    this.investmentKnowledge = this.loadMap(json.investmentKnowledge);
    this.similarityKnowledge = this.loadMap(json.similarityKnowledge);
 
    this.similarRaceIds = json.similarRaceIds || [];
    this.scenarioProbabilities = json.scenarioProbabilities || {};
    this.recommendedBias = json.recommendedBias || "";
 
    this.weights = KnowledgeWeights.fromJSON(json.weights || { profileType: "RACE_MEMORY" });
    this.knowledgeHistory = KnowledgeHistory.fromJSON(json.knowledgeHistory || {});
    this.versionManager = VersionManager.fromJSON(json.versionManager || {});
    this.aiJournal = AIJournal.fromJSON(json.aiJournal || {});
 
    return this;
  }
 
  static fromJSON(json) {
    const memory = new RaceMemory(
      json && json.raceId ? json.raceId : ""
    );
 
    return memory.load(json || {});
  }
 
}
