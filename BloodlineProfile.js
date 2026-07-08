/**
 * ==========================================================
 * ΩMAX AIOS
 * BloodlineProfile.js
 * ----------------------------------------------------------
 * Bloodline Profile v1.0.0
 *
 * 血統を固定評価ではなく、条件ごとに自己学習する
 * Knowledge Profile として管理する。
 *
 * GAS V8 compatible.
 * ==========================================================
 */
 
class BloodlineProfile extends KnowledgeProfile {
 
  constructor(bloodlineId) {
    super(bloodlineId || "", "BLOODLINE");
 
    this.bloodlineId = bloodlineId || "";
 
    // -------------------------
    // Identity
    // -------------------------
    this.name = "";
    this.kind = "SIRE"; // SIRE / DAM / BROODMARE_SIRE / LINE / FAMILY
 
    this.fatherId = "";
    this.motherId = "";
    this.motherFatherId = "";
 
    this.sireLine = "";
    this.damLine = "";
    this.familyLine = "";
    this.originCountry = "";
 
    this.generation = 0;
    this.activeFrom = null;
    this.activeTo = null;
 
    // -------------------------
    // Bloodline-specific knowledge
    // -------------------------
    this.sireKnowledge = {};
    this.broodmareSireKnowledge = {};
    this.sireLineKnowledge = {};
    this.damLineKnowledge = {};
    this.familyKnowledge = {};
 
    this.turfKnowledge = {};
    this.dirtKnowledge = {};
    this.distanceRangeKnowledge = {};
    this.courseShapeKnowledge = {};
    this.cushionKnowledge = {};
    this.moistureKnowledge = {};
    this.trackBiasKnowledge = {};
 
    this.growthKnowledge = {};
    this.ageKnowledge = {};
    this.seasonalDevelopmentKnowledge = {};
 
    this.paceTypeKnowledge = {};
    this.raceShapeKnowledge = {};
    this.finishTypeKnowledge = {};
    this.fieldSizeKnowledge = {};
 
    this.raceMemoryKnowledge = {};
    this.marketMemoryKnowledge = {};
 
    // -------------------------
    // Ability tendencies
    // -------------------------
    this.speedTendency = 50;
    this.staminaTendency = 50;
    this.powerTendency = 50;
    this.accelerationTendency = 50;
    this.finishTendency = 50;
    this.mentalTendency = 50;
    this.consistencyTendency = 50;
 
    // -------------------------
    // Growth model
    // -------------------------
    this.growthType = "UNKNOWN"; // EARLY / NORMAL / LATE / UNKNOWN
    this.peakAge = 0;
    this.peakSeason = "";
    this.maturityCurve = [];
 
    // -------------------------
    // Learning assets
    // -------------------------
    this.weights = new KnowledgeWeights("BLOODLINE");
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
 
    this.updateIdentityFromObservation(observation);
    this.updateBloodlineKnowledge(observation);
    this.updateAbilityTendencies(observation);
    this.updateGrowthModel(observation);
    this.updateMemorySignals(observation);
    this.updateConfidence();
 
    this.aiJournal.add({
      type: "LEARN",
      category: "BLOODLINE_PROFILE",
      title: "BloodlineProfile learned observation",
      message: "BloodlineProfile updated from race observation.",
      targetType: "BLOODLINE",
      targetId: this.bloodlineId,
      evidence: {
        raceId: observation.raceId || "",
        horseId: observation.horseId || "",
        finish: observation.finish || 0,
        abilityIndex: observation.abilityIndex || 0,
        aceScore: observation.aceScore || 0,
        roi: observation.roi || 0
      }
    });
 
    this.touch();
    return this;
  }
 
  /**
   * Observationから固定情報を補完
   */
  updateIdentityFromObservation(observation) {
    if (observation.fatherId && !this.fatherId) {
      this.fatherId = observation.fatherId;
    }
 
    if (observation.motherId && !this.motherId) {
      this.motherId = observation.motherId;
    }
 
    if (observation.motherFatherId && !this.motherFatherId) {
      this.motherFatherId = observation.motherFatherId;
    }
 
    if (observation.sireLine && !this.sireLine) {
      this.sireLine = observation.sireLine;
    }
 
    if (observation.damLine && !this.damLine) {
      this.damLine = observation.damLine;
    }
 
    if (observation.familyLine && !this.familyLine) {
      this.familyLine = observation.familyLine;
    }
 
    return this;
  }
 
  /**
   * 血統固有Knowledge更新
   */
  updateBloodlineKnowledge(observation) {
    if (!observation) {
      return this;
    }
 
    this.updateKnowledgeCell(this.sireKnowledge, observation.fatherId, "SIRE", observation);
    this.updateKnowledgeCell(this.broodmareSireKnowledge, observation.motherFatherId, "BROODMARE_SIRE", observation);
    this.updateKnowledgeCell(this.sireLineKnowledge, observation.sireLine, "SIRE_LINE", observation);
    this.updateKnowledgeCell(this.damLineKnowledge, observation.damLine, "DAM_LINE", observation);
    this.updateKnowledgeCell(this.familyKnowledge, observation.familyLine, "FAMILY", observation);
 
    if (observation.surface === "TURF" || observation.surface === "芝") {
      this.updateKnowledgeCell(this.turfKnowledge, observation.course || "TURF", "TURF", observation);
    }
 
    if (observation.surface === "DIRT" || observation.surface === "ダート") {
      this.updateKnowledgeCell(this.dirtKnowledge, observation.course || "DIRT", "DIRT", observation);
    }
 
    this.updateKnowledgeCell(this.distanceRangeKnowledge, this.bucketValue(observation.distance, 200), "DISTANCE_RANGE", observation);
    this.updateKnowledgeCell(this.courseShapeKnowledge, observation.courseShape, "COURSE_SHAPE", observation);
    this.updateKnowledgeCell(this.cushionKnowledge, this.bucketValue(observation.cushionValue, 0.5), "CUSHION", observation);
    this.updateKnowledgeCell(this.moistureKnowledge, this.bucketValue(observation.moisture, 1), "MOISTURE", observation);
    this.updateKnowledgeCell(this.trackBiasKnowledge, observation.trackBias, "TRACK_BIAS", observation);
 
    this.updateKnowledgeCell(this.ageKnowledge, observation.age, "AGE", observation);
    this.updateKnowledgeCell(this.growthKnowledge, observation.growthPhase, "GROWTH_PHASE", observation);
    this.updateKnowledgeCell(this.seasonalDevelopmentKnowledge, observation.season, "SEASONAL_DEVELOPMENT", observation);
 
    this.updateKnowledgeCell(this.paceTypeKnowledge, observation.pace, "PACE_TYPE", observation);
    this.updateKnowledgeCell(this.raceShapeKnowledge, observation.raceShape, "RACE_SHAPE", observation);
    this.updateKnowledgeCell(this.finishTypeKnowledge, observation.finishType, "FINISH_TYPE", observation);
    this.updateKnowledgeCell(this.fieldSizeKnowledge, this.bucketValue(observation.fieldSize, 2), "FIELD_SIZE", observation);
 
    return this;
  }
 
  /**
   * 能力傾向更新
   */
  updateAbilityTendencies(observation) {
    this.speedTendency = this.smoothValue(this.speedTendency, observation.speedIndex);
    this.staminaTendency = this.smoothValue(this.staminaTendency, observation.staminaIndex);
    this.powerTendency = this.smoothValue(this.powerTendency, observation.powerIndex);
    this.accelerationTendency = this.smoothValue(this.accelerationTendency, observation.accelerationIndex);
    this.finishTendency = this.smoothValue(this.finishTendency, observation.finishIndex);
    this.mentalTendency = this.smoothValue(this.mentalTendency, observation.mentalIndex);
    this.consistencyTendency = this.smoothValue(this.consistencyTendency, observation.consistencyIndex);
 
    return this;
  }
 
  /**
   * 成長モデル更新
   */
  updateGrowthModel(observation) {
    const age = Number(observation.age || 0);
    const ability = Number(observation.abilityIndex || 0);
 
    if (!age || !ability) {
      return this;
    }
 
    this.maturityCurve.push({
      age: age,
      date: observation.date || null,
      ability: ability,
      raceId: observation.raceId || ""
    });
 
    const best = this.findBestMaturityPoint();
 
    if (best) {
      this.peakAge = best.age;
 
      if (best.age <= 2) {
        this.growthType = "EARLY";
      } else if (best.age >= 5) {
        this.growthType = "LATE";
      } else {
        this.growthType = "NORMAL";
      }
    }
 
    return this;
  }
 
  /**
   * RaceMemory / MarketMemory 信号更新
   */
  updateMemorySignals(observation) {
    if (observation.raceMemoryKey) {
      this.updateKnowledgeCell(this.raceMemoryKnowledge, observation.raceMemoryKey, "RACE_MEMORY", observation);
    }
 
    if (observation.marketMemoryKey) {
      this.updateKnowledgeCell(this.marketMemoryKnowledge, observation.marketMemoryKey, "MARKET_MEMORY", observation);
    }
 
    return this;
  }
 
  /**
   * 重み更新
   */
  updateWeight(fieldKey, nextWeight, reason, evidence) {
    const current = this.weights.get(fieldKey);
    const before = current ? current.weight : LearningPolicy.get("BLOODLINE", fieldKey).initialWeight;
    const after = this.weights.set(fieldKey, nextWeight);
 
    const record = this.knowledgeHistory.add({
      targetType: "BLOODLINE",
      targetId: this.bloodlineId,
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
      category: "BLOODLINE_PROFILE",
      title: "BloodlineProfile weight updated",
      message: fieldKey + " weight updated.",
      targetType: "BLOODLINE",
      targetId: this.bloodlineId,
      evidence: record
    });
 
    return after;
  }
 
  /**
   * Snapshot作成
   */
  createSnapshot(label, reason) {
    return this.versionManager.createSnapshot({
      targetType: "BLOODLINE",
      targetId: this.bloodlineId,
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
      "BLOODLINE",
      this.bloodlineId,
      snapshotId || null
    );
 
    if (!data) {
      return false;
    }
 
    this.load(data);
 
    this.aiJournal.add({
      type: "ROLLBACK",
      category: "BLOODLINE_PROFILE",
      title: "BloodlineProfile rollback",
      message: "BloodlineProfile rolled back from snapshot.",
      targetType: "BLOODLINE",
      targetId: this.bloodlineId,
      evidence: { snapshotId: snapshotId || "" }
    });
 
    return true;
  }
 
  /**
   * Best getters
   */
  getBestSurface() { return this.best(this.surfaceKnowledge); }
  getBestGoing() { return this.best(this.goingKnowledge); }
  getBestDistanceRange() { return this.best(this.distanceRangeKnowledge); }
  getBestCourse() { return this.best(this.courseKnowledge); }
  getBestCushion() { return this.best(this.cushionKnowledge); }
  getBestPaceType() { return this.best(this.paceTypeKnowledge); }
  getBestRaceShape() { return this.best(this.raceShapeKnowledge); }
  getBestRaceMemory() { return this.best(this.raceMemoryKnowledge); }
  getBestMarketMemory() { return this.best(this.marketMemoryKnowledge); }
 
  /**
   * Utility
   */
  findBestMaturityPoint() {
    if (!this.maturityCurve || !this.maturityCurve.length) {
      return null;
    }
 
    return this.maturityCurve.slice().sort(function(a, b) {
      return Number(b.ability || 0) - Number(a.ability || 0);
    })[0];
  }
 
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
      return Number(current || 50);
    }
 
    const n = Number(next);
    if (isNaN(n)) {
      return Number(current || 50);
    }
 
    return Number(current || 50) * 0.90 + n * 0.10;
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
      bloodlineId: this.bloodlineId,
      kind: this.kind,
 
      fatherId: this.fatherId,
      motherId: this.motherId,
      motherFatherId: this.motherFatherId,
      sireLine: this.sireLine,
      damLine: this.damLine,
      familyLine: this.familyLine,
      originCountry: this.originCountry,
      generation: this.generation,
      activeFrom: this.activeFrom,
      activeTo: this.activeTo,
 
      sireKnowledge: this.serializeMap(this.sireKnowledge),
      broodmareSireKnowledge: this.serializeMap(this.broodmareSireKnowledge),
      sireLineKnowledge: this.serializeMap(this.sireLineKnowledge),
      damLineKnowledge: this.serializeMap(this.damLineKnowledge),
      familyKnowledge: this.serializeMap(this.familyKnowledge),
 
      turfKnowledge: this.serializeMap(this.turfKnowledge),
      dirtKnowledge: this.serializeMap(this.dirtKnowledge),
      distanceRangeKnowledge: this.serializeMap(this.distanceRangeKnowledge),
      courseShapeKnowledge: this.serializeMap(this.courseShapeKnowledge),
      cushionKnowledge: this.serializeMap(this.cushionKnowledge),
      moistureKnowledge: this.serializeMap(this.moistureKnowledge),
      trackBiasKnowledge: this.serializeMap(this.trackBiasKnowledge),
 
      growthKnowledge: this.serializeMap(this.growthKnowledge),
      ageKnowledge: this.serializeMap(this.ageKnowledge),
      seasonalDevelopmentKnowledge: this.serializeMap(this.seasonalDevelopmentKnowledge),
 
      paceTypeKnowledge: this.serializeMap(this.paceTypeKnowledge),
      raceShapeKnowledge: this.serializeMap(this.raceShapeKnowledge),
      finishTypeKnowledge: this.serializeMap(this.finishTypeKnowledge),
      fieldSizeKnowledge: this.serializeMap(this.fieldSizeKnowledge),
 
      raceMemoryKnowledge: this.serializeMap(this.raceMemoryKnowledge),
      marketMemoryKnowledge: this.serializeMap(this.marketMemoryKnowledge),
 
      speedTendency: this.speedTendency,
      staminaTendency: this.staminaTendency,
      powerTendency: this.powerTendency,
      accelerationTendency: this.accelerationTendency,
      finishTendency: this.finishTendency,
      mentalTendency: this.mentalTendency,
      consistencyTendency: this.consistencyTendency,
 
      growthType: this.growthType,
      peakAge: this.peakAge,
      peakSeason: this.peakSeason,
      maturityCurve: this.maturityCurve,
 
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
 
    this.bloodlineId = json.bloodlineId || this.id;
    this.kind = json.kind || "SIRE";
 
    this.fatherId = json.fatherId || "";
    this.motherId = json.motherId || "";
    this.motherFatherId = json.motherFatherId || "";
    this.sireLine = json.sireLine || "";
    this.damLine = json.damLine || "";
    this.familyLine = json.familyLine || "";
    this.originCountry = json.originCountry || "";
    this.generation = json.generation || 0;
    this.activeFrom = json.activeFrom || null;
    this.activeTo = json.activeTo || null;
 
    this.sireKnowledge = this.loadMap(json.sireKnowledge);
    this.broodmareSireKnowledge = this.loadMap(json.broodmareSireKnowledge);
    this.sireLineKnowledge = this.loadMap(json.sireLineKnowledge);
    this.damLineKnowledge = this.loadMap(json.damLineKnowledge);
    this.familyKnowledge = this.loadMap(json.familyKnowledge);
 
    this.turfKnowledge = this.loadMap(json.turfKnowledge);
    this.dirtKnowledge = this.loadMap(json.dirtKnowledge);
    this.distanceRangeKnowledge = this.loadMap(json.distanceRangeKnowledge);
    this.courseShapeKnowledge = this.loadMap(json.courseShapeKnowledge);
    this.cushionKnowledge = this.loadMap(json.cushionKnowledge);
    this.moistureKnowledge = this.loadMap(json.moistureKnowledge);
    this.trackBiasKnowledge = this.loadMap(json.trackBiasKnowledge);
 
    this.growthKnowledge = this.loadMap(json.growthKnowledge);
    this.ageKnowledge = this.loadMap(json.ageKnowledge);
    this.seasonalDevelopmentKnowledge = this.loadMap(json.seasonalDevelopmentKnowledge);
 
    this.paceTypeKnowledge = this.loadMap(json.paceTypeKnowledge);
    this.raceShapeKnowledge = this.loadMap(json.raceShapeKnowledge);
    this.finishTypeKnowledge = this.loadMap(json.finishTypeKnowledge);
    this.fieldSizeKnowledge = this.loadMap(json.fieldSizeKnowledge);
 
    this.raceMemoryKnowledge = this.loadMap(json.raceMemoryKnowledge);
    this.marketMemoryKnowledge = this.loadMap(json.marketMemoryKnowledge);
 
    this.speedTendency = json.speedTendency || 50;
    this.staminaTendency = json.staminaTendency || 50;
    this.powerTendency = json.powerTendency || 50;
    this.accelerationTendency = json.accelerationTendency || 50;
    this.finishTendency = json.finishTendency || 50;
    this.mentalTendency = json.mentalTendency || 50;
    this.consistencyTendency = json.consistencyTendency || 50;
 
    this.growthType = json.growthType || "UNKNOWN";
    this.peakAge = json.peakAge || 0;
    this.peakSeason = json.peakSeason || "";
    this.maturityCurve = json.maturityCurve || [];
 
    this.weights = KnowledgeWeights.fromJSON(json.weights || { profileType: "BLOODLINE" });
    this.knowledgeHistory = KnowledgeHistory.fromJSON(json.knowledgeHistory || {});
    this.versionManager = VersionManager.fromJSON(json.versionManager || {});
    this.aiJournal = AIJournal.fromJSON(json.aiJournal || {});
 
    return this;
  }
 
  static fromJSON(json) {
    const profile = new BloodlineProfile(
      json && json.bloodlineId ? json.bloodlineId : ""
    );
 
    return profile.load(json || {});
  }
 
}
