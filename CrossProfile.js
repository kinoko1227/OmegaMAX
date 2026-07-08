/**
 * ==========================================================
 * ΩMAX AIOS
 * CrossProfile.js
 * ----------------------------------------------------------
 * Cross Profile v1.0.0
 *
 * 配合・ニックス・インブリード・アウトクロスを
 * KnowledgeProfileとして長期学習する。
 *
 * BloodlineProfileが「血統単体の傾向」を持つのに対し、
 * CrossProfileは「父 × 母父 × 牝系 × 系統構成」の組み合わせを学習する。
 *
 * GAS V8 compatible.
 * ==========================================================
 */
 
class CrossProfile extends KnowledgeProfile {
 
  constructor(crossId) {
    super(crossId || "", "CROSS");
 
    this.crossId = crossId || "";
 
    // -------------------------
    // Identity
    // -------------------------
    this.crossKey = "";
    this.name = "";
 
    this.fatherId = "";
    this.fatherName = "";
    this.fatherLine = "";
 
    this.motherId = "";
    this.motherName = "";
 
    this.motherFatherId = "";
    this.motherFatherName = "";
    this.motherFatherLine = "";
 
    this.sireLine = "";
    this.damLine = "";
    this.familyNumber = "";
 
    // -------------------------
    // Cross structure
    // -------------------------
    this.nickType = "";
    this.crossPattern = "";
    this.inbreedingPattern = "";
    this.outcrossLevel = 0;
    this.linebreedingLevel = 0;
 
    this.inbreedingTargets = [];
    this.majorAncestors = [];
    this.lineBalance = "UNKNOWN";
 
    // -------------------------
    // Ability tendencies
    // -------------------------
    this.speedTendency = 0;
    this.staminaTendency = 0;
    this.powerTendency = 0;
    this.finishTendency = 0;
    this.durabilityTendency = 0;
    this.mentalTendency = 0;
    this.growthTendency = 0;
 
    // -------------------------
    // Knowledge maps
    // -------------------------
    this.nickKnowledge = {};
    this.inbreedingKnowledge = {};
    this.outcrossKnowledge = {};
    this.lineBalanceKnowledge = {};
    this.familyKnowledge = {};
 
    this.surfaceCrossKnowledge = {};
    this.distanceCrossKnowledge = {};
    this.courseCrossKnowledge = {};
    this.goingCrossKnowledge = {};
    this.cushionCrossKnowledge = {};
    this.moistureCrossKnowledge = {};
    this.paceCrossKnowledge = {};
    this.classCrossKnowledge = {};
    this.seasonCrossKnowledge = {};
 
    this.raceMemoryKnowledge = {};
    this.marketMemoryKnowledge = {};
 
    // -------------------------
    // Learning assets
    // -------------------------
    this.weights = new KnowledgeWeights("CROSS");
    this.knowledgeHistory = new KnowledgeHistory();
    this.versionManager = new VersionManager();
    this.aiJournal = new AIJournal();
  }
 
  /**
   * Observation学習
   */
  learn(observation) {
    if (!observation) {
      return this;
    }
 
    KnowledgeProfile.prototype.learn.call(this, observation);
 
    this.updateCrossIdentity(observation);
    this.updateCrossKnowledge(observation);
    this.updateRaceMemoryKnowledge(observation);
    this.updateMarketMemoryKnowledge(observation);
    this.updateTendencies(observation);
    this.updateConfidence();
 
    this.aiJournal.add({
      type: "LEARN",
      category: "CROSS_PROFILE",
      title: "CrossProfile learned observation",
      message: "CrossProfile updated from observation.",
      targetType: "CROSS",
      targetId: this.crossId,
      evidence: {
        raceId: observation.raceId || "",
        crossKey: observation.crossKey || this.crossKey,
        finish: observation.finish || 0,
        roi: observation.roi || 0,
        abilityIndex: observation.abilityIndex || 0,
        aceScore: observation.aceScore || 0
      }
    });
 
    this.touch();
    return this;
  }
 
  /**
   * 基本情報更新
   */
  updateCrossIdentity(observation) {
    if (!observation) {
      return this;
    }
 
    this.crossKey = observation.crossKey || this.crossKey;
    this.name = observation.crossName || this.name || this.crossKey;
 
    this.fatherId = observation.fatherId || this.fatherId;
    this.fatherName = observation.fatherName || this.fatherName;
    this.fatherLine = observation.fatherLine || this.fatherLine;
 
    this.motherId = observation.motherId || this.motherId;
    this.motherName = observation.motherName || this.motherName;
 
    this.motherFatherId = observation.motherFatherId || this.motherFatherId;
    this.motherFatherName = observation.motherFatherName || this.motherFatherName;
    this.motherFatherLine = observation.motherFatherLine || this.motherFatherLine;
 
    this.sireLine = observation.sireLine || this.sireLine;
    this.damLine = observation.damLine || this.damLine;
    this.familyNumber = observation.familyNumber || this.familyNumber;
 
    this.nickType = observation.nickType || this.nickType;
    this.crossPattern = observation.crossPattern || this.crossPattern;
    this.inbreedingPattern = observation.inbreedingPattern || this.inbreedingPattern;
 
    if (observation.outcrossLevel !== undefined) {
      this.outcrossLevel = Number(observation.outcrossLevel || 0);
    }
 
    if (observation.linebreedingLevel !== undefined) {
      this.linebreedingLevel = Number(observation.linebreedingLevel || 0);
    }
 
    if (observation.inbreedingTargets && Array.isArray(observation.inbreedingTargets)) {
      this.inbreedingTargets = observation.inbreedingTargets;
    }
 
    if (observation.majorAncestors && Array.isArray(observation.majorAncestors)) {
      this.majorAncestors = observation.majorAncestors;
    }
 
    this.lineBalance = observation.lineBalance || this.lineBalance;
 
    return this;
  }
 
  /**
   * 配合固有Knowledge更新
   */
  updateCrossKnowledge(observation) {
    if (!observation) {
      return this;
    }
 
    this.updateKnowledgeCell(this.nickKnowledge, observation.nickType, "NICK", observation);
    this.updateKnowledgeCell(this.inbreedingKnowledge, observation.inbreedingPattern, "INBREEDING", observation);
    this.updateKnowledgeCell(this.outcrossKnowledge, this.bucketValue(observation.outcrossLevel, 1), "OUTCROSS", observation);
    this.updateKnowledgeCell(this.lineBalanceKnowledge, observation.lineBalance, "LINE_BALANCE", observation);
    this.updateKnowledgeCell(this.familyKnowledge, observation.familyNumber, "FAMILY", observation);
 
    this.updateKnowledgeCell(this.surfaceCrossKnowledge, observation.surface, "CROSS_SURFACE", observation);
    this.updateKnowledgeCell(this.distanceCrossKnowledge, this.bucketValue(observation.distance, 200), "CROSS_DISTANCE", observation);
    this.updateKnowledgeCell(this.courseCrossKnowledge, observation.course, "CROSS_COURSE", observation);
    this.updateKnowledgeCell(this.goingCrossKnowledge, observation.going, "CROSS_GOING", observation);
    this.updateKnowledgeCell(this.cushionCrossKnowledge, this.bucketValue(observation.cushionValue, 0.5), "CROSS_CUSHION", observation);
    this.updateKnowledgeCell(this.moistureCrossKnowledge, this.bucketValue(observation.moisture, 1), "CROSS_MOISTURE", observation);
    this.updateKnowledgeCell(this.paceCrossKnowledge, observation.pace, "CROSS_PACE", observation);
    this.updateKnowledgeCell(this.classCrossKnowledge, observation.raceClass, "CROSS_CLASS", observation);
    this.updateKnowledgeCell(this.seasonCrossKnowledge, observation.season, "CROSS_SEASON", observation);
 
    return this;
  }
 
  /**
   * RaceMemory連携Knowledge
   */
  updateRaceMemoryKnowledge(observation) {
    if (!observation) {
      return this;
    }
 
    const raceShapeKey = this.buildRaceShapeKey(observation);
 
    this.updateKnowledgeCell(
      this.raceMemoryKnowledge,
      raceShapeKey,
      "RACE_MEMORY",
      observation
    );
 
    return this;
  }
 
  /**
   * MarketMemory連携Knowledge
   */
  updateMarketMemoryKnowledge(observation) {
    if (!observation) {
      return this;
    }
 
    const marketKey = this.buildMarketKey(observation);
 
    this.updateKnowledgeCell(
      this.marketMemoryKnowledge,
      marketKey,
      "MARKET_MEMORY",
      observation
    );
 
    return this;
  }
 
  /**
   * 傾向指数更新
   */
  updateTendencies(observation) {
    this.speedTendency = this.smoothValue(this.speedTendency, observation.speedIndex);
    this.staminaTendency = this.smoothValue(this.staminaTendency, observation.staminaIndex);
    this.powerTendency = this.smoothValue(this.powerTendency, observation.powerIndex);
    this.finishTendency = this.smoothValue(this.finishTendency, observation.finishIndex);
    this.mentalTendency = this.smoothValue(this.mentalTendency, observation.mentalIndex);
 
    if (observation.durabilityIndex !== undefined) {
      this.durabilityTendency = this.smoothValue(this.durabilityTendency, observation.durabilityIndex);
    }
 
    if (observation.growthIndex !== undefined) {
      this.growthTendency = this.smoothValue(this.growthTendency, observation.growthIndex);
    }
 
    return this;
  }
 
  /**
   * レース形状キー
   */
  buildRaceShapeKey(observation) {
    const parts = [
      observation.course || "COURSE_UNKNOWN",
      observation.surface || "SURFACE_UNKNOWN",
      observation.distance ? this.bucketValue(observation.distance, 200) : "DIST_UNKNOWN",
      observation.pace || "PACE_UNKNOWN",
      observation.trackBias || "BIAS_UNKNOWN",
      observation.going || "GOING_UNKNOWN"
    ];
 
    return parts.join("|");
  }
 
  /**
   * 市場キー
   */
  buildMarketKey(observation) {
    const popularity = Number(observation.popularity || 0);
    let popBand = "POP_UNKNOWN";
 
    if (popularity > 0 && popularity <= 3) {
      popBand = "TOP_POP";
    } else if (popularity >= 4 && popularity <= 8) {
      popBand = "MID_POP";
    } else if (popularity >= 9) {
      popBand = "LONGSHOT";
    }
 
    const odds = Number(observation.odds || 0);
    let oddsBand = "ODDS_UNKNOWN";
 
    if (odds > 0 && odds < 3) {
      oddsBand = "LOW_ODDS";
    } else if (odds >= 3 && odds < 10) {
      oddsBand = "MID_ODDS";
    } else if (odds >= 10) {
      oddsBand = "HIGH_ODDS";
    }
 
    return [popBand, oddsBand, observation.raceClass || "CLASS_UNKNOWN"].join("|");
  }
 
  /**
   * 重み更新
   */
  updateWeight(fieldKey, nextWeight, reason, evidence) {
    const current = this.weights.get(fieldKey);
    const policy = LearningPolicy.get("CROSS", fieldKey);
    const before = current ? current.weight : policy.initialWeight;
 
    const after = this.weights.set(fieldKey, nextWeight);
 
    const record = this.knowledgeHistory.add({
      targetType: "CROSS",
      targetId: this.crossId,
      fieldKey: fieldKey,
      action: "WEIGHT_UPDATE",
      beforeValue: before,
      afterValue: after,
      reason: reason || "",
      evidence: evidence || {},
      confidence: current ? current.confidence : 0,
      sample: current ? current.sample : 0
    });
 
    this.aiJournal.add({
      type: "WEIGHT_UPDATE",
      category: "CROSS_PROFILE",
      title: "CrossProfile weight updated",
      message: fieldKey + " weight updated.",
      targetType: "CROSS",
      targetId: this.crossId,
      evidence: record
    });
 
    return after;
  }
 
  /**
   * Snapshot作成
   */
  createSnapshot(label, reason) {
    return this.versionManager.createSnapshot({
      targetType: "CROSS",
      targetId: this.crossId,
      version: this.version,
      label: label || "",
      reason: reason || "",
      data: this.toJSON()
    });
  }
 
  /**
   * Rollback
   */
  rollback(snapshotId) {
    const data = this.versionManager.rollback(
      "CROSS",
      this.crossId,
      snapshotId || null
    );
 
    if (!data) {
      return false;
    }
 
    this.load(data);
 
    this.aiJournal.add({
      type: "ROLLBACK",
      category: "CROSS_PROFILE",
      title: "CrossProfile rollback",
      message: "CrossProfile rolled back from snapshot.",
      targetType: "CROSS",
      targetId: this.crossId,
      evidence: {
        snapshotId: snapshotId || ""
      }
    });
 
    return true;
  }
 
  /**
   * Best getters
   */
  getBestNick() { return this.best(this.nickKnowledge); }
  getBestInbreeding() { return this.best(this.inbreedingKnowledge); }
  getBestOutcross() { return this.best(this.outcrossKnowledge); }
  getBestSurface() { return this.best(this.surfaceCrossKnowledge); }
  getBestDistance() { return this.best(this.distanceCrossKnowledge); }
  getBestCourse() { return this.best(this.courseCrossKnowledge); }
  getBestGoing() { return this.best(this.goingCrossKnowledge); }
  getBestPace() { return this.best(this.paceCrossKnowledge); }
  getBestRaceShape() { return this.best(this.raceMemoryKnowledge); }
  getBestMarketPattern() { return this.best(this.marketMemoryKnowledge); }
 
  /**
   * Utility
   */
  bucketValue(value, bucketSize) {
    if (value === null || value === undefined || value === "") {
      return "";
    }
 
    const n = Number(value);
    if (isNaN(n)) {
      return String(value);
    }
 
    const b = Number(bucketSize || 1);
    if (b <= 0) {
      return String(n);
    }
 
    return String(Math.round(n / b) * b);
  }
 
  smoothValue(current, next) {
    if (next === null || next === undefined || next === "") {
      return Number(current || 0);
    }
 
    const n = Number(next);
    if (isNaN(n)) {
      return Number(current || 0);
    }
 
    if (!current) {
      return n;
    }
 
    return Number(current || 0) * 0.85 + n * 0.15;
  }
 
  serializeMap(map) {
    return KnowledgeProfile.prototype.serializeMap.call(this, map);
  }
 
  loadMap(jsonMap) {
    return KnowledgeProfile.prototype.loadMap.call(this, jsonMap);
  }
 
  /**
   * JSON
   */
  toJSON() {
    const base = KnowledgeProfile.prototype.toJSON.call(this);
 
    return Object.assign(base, {
      crossId: this.crossId,
      crossKey: this.crossKey,
 
      fatherId: this.fatherId,
      fatherName: this.fatherName,
      fatherLine: this.fatherLine,
      motherId: this.motherId,
      motherName: this.motherName,
      motherFatherId: this.motherFatherId,
      motherFatherName: this.motherFatherName,
      motherFatherLine: this.motherFatherLine,
      sireLine: this.sireLine,
      damLine: this.damLine,
      familyNumber: this.familyNumber,
 
      nickType: this.nickType,
      crossPattern: this.crossPattern,
      inbreedingPattern: this.inbreedingPattern,
      outcrossLevel: this.outcrossLevel,
      linebreedingLevel: this.linebreedingLevel,
      inbreedingTargets: this.inbreedingTargets,
      majorAncestors: this.majorAncestors,
      lineBalance: this.lineBalance,
 
      speedTendency: this.speedTendency,
      staminaTendency: this.staminaTendency,
      powerTendency: this.powerTendency,
      finishTendency: this.finishTendency,
      durabilityTendency: this.durabilityTendency,
      mentalTendency: this.mentalTendency,
      growthTendency: this.growthTendency,
 
      nickKnowledge: this.serializeMap(this.nickKnowledge),
      inbreedingKnowledge: this.serializeMap(this.inbreedingKnowledge),
      outcrossKnowledge: this.serializeMap(this.outcrossKnowledge),
      lineBalanceKnowledge: this.serializeMap(this.lineBalanceKnowledge),
      familyKnowledge: this.serializeMap(this.familyKnowledge),
 
      surfaceCrossKnowledge: this.serializeMap(this.surfaceCrossKnowledge),
      distanceCrossKnowledge: this.serializeMap(this.distanceCrossKnowledge),
      courseCrossKnowledge: this.serializeMap(this.courseCrossKnowledge),
      goingCrossKnowledge: this.serializeMap(this.goingCrossKnowledge),
      cushionCrossKnowledge: this.serializeMap(this.cushionCrossKnowledge),
      moistureCrossKnowledge: this.serializeMap(this.moistureCrossKnowledge),
      paceCrossKnowledge: this.serializeMap(this.paceCrossKnowledge),
      classCrossKnowledge: this.serializeMap(this.classCrossKnowledge),
      seasonCrossKnowledge: this.serializeMap(this.seasonCrossKnowledge),
 
      raceMemoryKnowledge: this.serializeMap(this.raceMemoryKnowledge),
      marketMemoryKnowledge: this.serializeMap(this.marketMemoryKnowledge),
 
      weights: this.weights.toJSON(),
      knowledgeHistory: this.knowledgeHistory.toJSON(),
      versionManager: this.versionManager.toJSON(),
      aiJournal: this.aiJournal.toJSON()
    });
  }
 
  /**
   * JSON読込
   */
  load(json) {
    KnowledgeProfile.prototype.load.call(this, json);
 
    if (!json) {
      return this;
    }
 
    this.crossId = json.crossId || this.id;
    this.crossKey = json.crossKey || "";
 
    this.fatherId = json.fatherId || "";
    this.fatherName = json.fatherName || "";
    this.fatherLine = json.fatherLine || "";
    this.motherId = json.motherId || "";
    this.motherName = json.motherName || "";
    this.motherFatherId = json.motherFatherId || "";
    this.motherFatherName = json.motherFatherName || "";
    this.motherFatherLine = json.motherFatherLine || "";
    this.sireLine = json.sireLine || "";
    this.damLine = json.damLine || "";
    this.familyNumber = json.familyNumber || "";
 
    this.nickType = json.nickType || "";
    this.crossPattern = json.crossPattern || "";
    this.inbreedingPattern = json.inbreedingPattern || "";
    this.outcrossLevel = json.outcrossLevel || 0;
    this.linebreedingLevel = json.linebreedingLevel || 0;
    this.inbreedingTargets = json.inbreedingTargets || [];
    this.majorAncestors = json.majorAncestors || [];
    this.lineBalance = json.lineBalance || "UNKNOWN";
 
    this.speedTendency = json.speedTendency || 0;
    this.staminaTendency = json.staminaTendency || 0;
    this.powerTendency = json.powerTendency || 0;
    this.finishTendency = json.finishTendency || 0;
    this.durabilityTendency = json.durabilityTendency || 0;
    this.mentalTendency = json.mentalTendency || 0;
    this.growthTendency = json.growthTendency || 0;
 
    this.nickKnowledge = this.loadMap(json.nickKnowledge);
    this.inbreedingKnowledge = this.loadMap(json.inbreedingKnowledge);
    this.outcrossKnowledge = this.loadMap(json.outcrossKnowledge);
    this.lineBalanceKnowledge = this.loadMap(json.lineBalanceKnowledge);
    this.familyKnowledge = this.loadMap(json.familyKnowledge);
 
    this.surfaceCrossKnowledge = this.loadMap(json.surfaceCrossKnowledge);
    this.distanceCrossKnowledge = this.loadMap(json.distanceCrossKnowledge);
    this.courseCrossKnowledge = this.loadMap(json.courseCrossKnowledge);
    this.goingCrossKnowledge = this.loadMap(json.goingCrossKnowledge);
    this.cushionCrossKnowledge = this.loadMap(json.cushionCrossKnowledge);
    this.moistureCrossKnowledge = this.loadMap(json.moistureCrossKnowledge);
    this.paceCrossKnowledge = this.loadMap(json.paceCrossKnowledge);
    this.classCrossKnowledge = this.loadMap(json.classCrossKnowledge);
    this.seasonCrossKnowledge = this.loadMap(json.seasonCrossKnowledge);
 
    this.raceMemoryKnowledge = this.loadMap(json.raceMemoryKnowledge);
    this.marketMemoryKnowledge = this.loadMap(json.marketMemoryKnowledge);
 
    this.weights = KnowledgeWeights.fromJSON(json.weights || { profileType: "CROSS" });
    this.knowledgeHistory = KnowledgeHistory.fromJSON(json.knowledgeHistory || {});
    this.versionManager = VersionManager.fromJSON(json.versionManager || {});
    this.aiJournal = AIJournal.fromJSON(json.aiJournal || {});
 
    return this;
  }
 
  static fromJSON(json) {
    const profile = new CrossProfile(
      json && json.crossId ? json.crossId : ""
    );
 
    return profile.load(json || {});
  }
 
}
