/**
 * ==========================================================
 * ΩMAX AIOS
 * HorseProfile.js
 * ----------------------------------------------------------
 * Horse Profile v3
 *
 * 馬個体の長期学習Profile。
 * KnowledgeProfile / KnowledgeCell / KnowledgeSchema を利用し、
 * 過去データ・日次結果から自己更新する。
 *
 * GAS V8 compatible.
 * ==========================================================
 */
 
class HorseProfile extends KnowledgeProfile {
 
  constructor(horseId) {
    super(horseId || "", "HORSE");
 
    this.horseId = horseId || "";
 
    // -------------------------
    // Identity
    // -------------------------
    this.name = "";
    this.sex = "";
    this.color = "";
    this.birthDate = null;
    this.birthYear = 0;
 
    this.fatherId = "";
    this.motherId = "";
    this.motherFatherId = "";
    this.sireLine = "";
    this.damLine = "";
    this.crossKey = "";
 
    this.breederId = "";
    this.ownerId = "";
    this.trainerId = "";
 
    // -------------------------
    // Ability indexes
    // -------------------------
    this.currentAbility = 0;
    this.averageAbility = 0;
    this.peakAbility = 0;
 
    this.speedIndex = 0;
    this.accelerationIndex = 0;
    this.staminaIndex = 0;
    this.powerIndex = 0;
    this.finishIndex = 0;
    this.startIndex = 0;
    this.cornerIndex = 0;
    this.mentalIndex = 0;
    this.consistencyIndex = 0;
 
    this.abilityHistory = [];
 
    // -------------------------
    // Horse-specific knowledge
    // -------------------------
    this.trainingKnowledge = {};
    this.trainingPatternKnowledge = {};
    this.bodyWeightKnowledge = {};
    this.bodyWeightChangeKnowledge = {};
    this.intervalKnowledge = {};
    this.ageKnowledge = {};
 
    this.physicalKnowledge = {};
    this.mentalKnowledge = {};
    this.fatigueKnowledge = {};
    this.recoveryKnowledge = {};
    this.riskKnowledge = {};
 
    this.jockeyRelationshipKnowledge = {};
    this.trainerRelationshipKnowledge = {};
    this.bloodlineRelationshipKnowledge = {};
    this.crossRelationshipKnowledge = {};
 
    // -------------------------
    // Current derived characteristics
    // -------------------------
    this.lifecycle = "UNKNOWN";
    this.maturityPattern = "";
    this.growthCurve = [];
 
    this.fatigueTolerance = null;
    this.riskTolerance = 0;
    this.recoveryScore = 0;
 
    // Environment/adaptability is kept as learned characteristic,
    // but EnvironmentAnalyzer is not part of current primary scoring.
    this.adaptability = 50;
    this.adaptabilitySample = 0;
 
    // -------------------------
    // Managers / learning assets
    // -------------------------
    this.weights = new KnowledgeWeights("HORSE");
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
 
    this.updateHorseKnowledge(observation);
    this.updateAbilityIndexes(observation);
    this.updateRelationships(observation);
    this.updateDerivedCharacteristics(observation);
    this.updateConfidence();
 
    this.aiJournal.add({
      type: "LEARN",
      category: "HORSE_PROFILE",
      title: "HorseProfile learned observation",
      message: "HorseProfile updated from observation.",
      targetType: "HORSE",
      targetId: this.horseId,
      evidence: {
        raceId: observation.raceId || "",
        finish: observation.finish || 0,
        abilityIndex: observation.abilityIndex || 0,
        aceScore: observation.aceScore || 0
      }
    });
 
    this.touch();
    return this;
  }
 
  /**
   * 馬固有Knowledge更新
   */
  updateHorseKnowledge(observation) {
    if (!observation) {
      return this;
    }
 
    this.updateKnowledgeCell(
      this.trainingKnowledge,
      observation.trainingType,
      "TRAINING",
      observation
    );
 
    this.updateKnowledgeCell(
      this.trainingPatternKnowledge,
      observation.trainingPattern,
      "TRAINING_PATTERN",
      observation
    );
 
    this.updateKnowledgeCell(
      this.bodyWeightKnowledge,
      this.bucketValue(observation.bodyWeight, 4),
      "BODY_WEIGHT",
      observation
    );
 
    this.updateKnowledgeCell(
      this.bodyWeightChangeKnowledge,
      this.bucketValue(observation.bodyWeightChange, 2),
      "BODY_WEIGHT_CHANGE",
      observation
    );
 
    this.updateKnowledgeCell(
      this.intervalKnowledge,
      this.bucketValue(observation.intervalDays, 7),
      "INTERVAL",
      observation
    );
 
    this.updateKnowledgeCell(
      this.ageKnowledge,
      observation.age,
      "AGE",
      observation
    );
 
    if (observation.fatigueIndex !== undefined) {
      this.updateKnowledgeCell(
        this.fatigueKnowledge,
        this.bucketValue(observation.fatigueIndex, 5),
        "FATIGUE",
        observation
      );
    }
 
    if (observation.recoveryScore !== undefined) {
      this.updateKnowledgeCell(
        this.recoveryKnowledge,
        this.bucketValue(observation.recoveryScore, 5),
        "RECOVERY",
        observation
      );
    }
 
    if (observation.riskType) {
      this.updateKnowledgeCell(
        this.riskKnowledge,
        observation.riskType,
        "RISK",
        observation
      );
    }
 
    return this;
  }
 
  /**
   * 能力Index更新
   */
  updateAbilityIndexes(observation) {
    const ability = Number(observation.abilityIndex || 0);
 
    if (ability > 0) {
      this.currentAbility = ability;
      this.abilityHistory.push({
        raceId: observation.raceId || "",
        date: observation.date || null,
        value: ability,
        finish: observation.finish || 0,
        aceScore: observation.aceScore || 0
      });
 
      if (this.peakAbility === 0 || ability > this.peakAbility) {
        this.peakAbility = ability;
      }
 
      this.averageAbility = this.averageArray(
        this.abilityHistory.map(function(x) {
          return Number(x.value || 0);
        })
      );
    }
 
    this.speedIndex = this.smoothValue(this.speedIndex, observation.speedIndex);
    this.accelerationIndex = this.smoothValue(this.accelerationIndex, observation.accelerationIndex);
    this.staminaIndex = this.smoothValue(this.staminaIndex, observation.staminaIndex);
    this.powerIndex = this.smoothValue(this.powerIndex, observation.powerIndex);
    this.finishIndex = this.smoothValue(this.finishIndex, observation.finishIndex);
    this.startIndex = this.smoothValue(this.startIndex, observation.startIndex);
    this.cornerIndex = this.smoothValue(this.cornerIndex, observation.cornerIndex);
    this.mentalIndex = this.smoothValue(this.mentalIndex, observation.mentalIndex);
    this.consistencyIndex = this.calculateConsistencyIndex();
 
    return this;
  }
 
  /**
   * Relationship Knowledge更新
   */
  updateRelationships(observation) {
    if (observation.jockeyId) {
      this.updateKnowledgeCell(
        this.jockeyRelationshipKnowledge,
        observation.jockeyId,
        "HORSE_JOCKEY",
        observation
      );
    }
 
    if (observation.trainerId) {
      this.updateKnowledgeCell(
        this.trainerRelationshipKnowledge,
        observation.trainerId,
        "HORSE_TRAINER",
        observation
      );
    }
 
    if (observation.fatherId) {
      this.updateKnowledgeCell(
        this.bloodlineRelationshipKnowledge,
        observation.fatherId,
        "HORSE_BLOODLINE",
        observation
      );
    }
 
    if (observation.crossKey) {
      this.updateKnowledgeCell(
        this.crossRelationshipKnowledge,
        observation.crossKey,
        "HORSE_CROSS",
        observation
      );
    }
 
    return this;
  }
 
  /**
   * 派生特性更新
   */
  updateDerivedCharacteristics(observation) {
    this.updateLifecycle(observation);
    this.updateAdaptability(observation);
    this.updateRecoveryAndRisk(observation);
    return this;
  }
 
  /**
   * 成長段階推定
   */
  updateLifecycle(observation) {
    const age = Number(observation.age || 0);
 
    if (!age) {
      return this;
    }
 
    if (age <= 2) {
      this.lifecycle = "EARLY";
    } else if (age === 3) {
      this.lifecycle = "GROWTH";
    } else if (age >= 4 && age <= 5) {
      this.lifecycle = "PRIME";
    } else if (age >= 6 && age <= 7) {
      this.lifecycle = "MAINTAIN";
    } else {
      this.lifecycle = "DECLINE_CHECK";
    }
 
    this.growthCurve.push({
      date: observation.date || null,
      age: age,
      ability: Number(observation.abilityIndex || 0)
    });
 
    return this;
  }
 
  /**
   * 適応力更新
   * EnvironmentAnalyzerの主評価からは外しているが、
   * 長期知識としては保持する。
   */
  updateAdaptability(observation) {
    if (!observation.environmentChange) {
      return this;
    }
 
    const good = this.isGoodResult(observation);
    const delta = good ? 1 : -1;
 
    this.adaptabilitySample += 1;
    this.adaptability = Utils.clamp(
      Number(this.adaptability || 50) + delta,
      0,
      100
    );
 
    return this;
  }
 
  /**
   * 回復・リスク派生値
   */
  updateRecoveryAndRisk(observation) {
    if (observation.recoveryScore !== undefined) {
      this.recoveryScore = this.smoothValue(
        this.recoveryScore,
        observation.recoveryScore
      );
    }
 
    if (observation.fatigueIndex !== undefined) {
      const fatigue = Number(observation.fatigueIndex || 0);
      if (this.fatigueTolerance === null) {
        this.fatigueTolerance = fatigue;
      } else if (this.isGoodResult(observation)) {
        this.fatigueTolerance = this.smoothValue(
          this.fatigueTolerance,
          fatigue
        );
      }
    }
 
    if (observation.riskScore !== undefined) {
      const risk = Number(observation.riskScore || 0);
      const direction = this.isGoodResult(observation) ? 1 : -1;
      this.riskTolerance = Utils.clamp(
        Number(this.riskTolerance || 0) + direction * Math.min(3, risk / 20),
        -30,
        30
      );
    }
 
    return this;
  }
 
  /**
   * 重み更新記録
   */
  updateWeight(fieldKey, nextWeight, reason, evidence) {
    const current = this.weights.get(fieldKey);
    const before = current
      ? current.weight
      : LearningPolicy.get("HORSE", fieldKey).initialWeight;
 
    const after = this.weights.set(fieldKey, nextWeight);
 
    const record = this.knowledgeHistory.add({
      targetType: "HORSE",
      targetId: this.horseId,
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
      category: "HORSE_PROFILE",
      title: "HorseProfile weight updated",
      message: fieldKey + " weight updated.",
      targetType: "HORSE",
      targetId: this.horseId,
      evidence: record
    });
 
    return after;
  }
 
  /**
   * Snapshot作成
   */
  createSnapshot(label, reason) {
    return this.versionManager.createSnapshot({
      targetType: "HORSE",
      targetId: this.horseId,
      version: this.version,
      label: label || "",
      reason: reason || "",
      data: this.toJSON()
    });
  }
 
  /**
   * Snapshotから戻す
   */
  rollback(snapshotId) {
    const data = this.versionManager.rollback(
      "HORSE",
      this.horseId,
      snapshotId || null
    );
 
    if (!data) {
      return false;
    }
 
    this.load(data);
 
    this.aiJournal.add({
      type: "ROLLBACK",
      category: "HORSE_PROFILE",
      title: "HorseProfile rollback",
      message: "HorseProfile rolled back from snapshot.",
      targetType: "HORSE",
      targetId: this.horseId,
      evidence: {
        snapshotId: snapshotId || ""
      }
    });
 
    return true;
  }
 
  /**
   * Best getters
   */
  getBestDistance() {
    return this.best(this.distanceKnowledge);
  }
 
  getBestCourse() {
    return this.best(this.courseKnowledge);
  }
 
  getBestSurface() {
    return this.best(this.surfaceKnowledge);
  }
 
  getBestGoing() {
    return this.best(this.goingKnowledge);
  }
 
  getBestClass() {
    return this.best(this.classKnowledge);
  }
 
  getBestPace() {
    return this.best(this.paceKnowledge);
  }
 
  getBestRunningStyle() {
    return this.best(this.styleKnowledge);
  }
 
  getBestTrainingType() {
    return this.best(this.trainingKnowledge);
  }
 
  getBestTrainingPattern() {
    return this.best(this.trainingPatternKnowledge);
  }
 
  getBestBodyWeightCell() {
    return this.best(this.bodyWeightKnowledge);
  }
 
  getBestIntervalCell() {
    return this.best(this.intervalKnowledge);
  }
 
  getJockeyFit(jockeyId) {
    if (!jockeyId) return null;
    return this.jockeyRelationshipKnowledge[jockeyId] || null;
  }
 
  getTrainerFit(trainerId) {
    if (!trainerId) return null;
    return this.trainerRelationshipKnowledge[trainerId] || null;
  }
 
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
 
  averageArray(values) {
    values = (values || []).filter(function(v) {
      return !isNaN(Number(v));
    });
 
    if (!values.length) {
      return 0;
    }
 
    const total = values.reduce(function(a, b) {
      return Number(a) + Number(b);
    }, 0);
 
    return total / values.length;
  }
 
  calculateConsistencyIndex() {
    if (!this.abilityHistory || this.abilityHistory.length < 2) {
      return 50;
    }
 
    const values = this.abilityHistory.map(function(x) {
      return Number(x.value || 0);
    });
 
    const avg = this.averageArray(values);
 
    const variance = values.reduce(function(total, value) {
      const diff = value - avg;
      return total + diff * diff;
    }, 0) / values.length;
 
    const std = Math.sqrt(variance);
 
    return Utils.clamp(100 - std, 0, 100);
  }
 
  isGoodResult(observation) {
    const finish = Number(observation.finish || 0);
    if (finish >= 1 && finish <= 3) {
      return true;
    }
 
    const roi = Number(observation.roi || 0);
    if (roi >= 1.0) {
      return true;
    }
 
    const ace = Number(observation.aceScore || 0);
    return ace >= 80 && finish > 0 && finish <= 5;
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
      horseId: this.horseId,
 
      sex: this.sex,
      color: this.color,
      birthDate: this.birthDate,
      birthYear: this.birthYear,
 
      fatherId: this.fatherId,
      motherId: this.motherId,
      motherFatherId: this.motherFatherId,
      sireLine: this.sireLine,
      damLine: this.damLine,
      crossKey: this.crossKey,
 
      breederId: this.breederId,
      ownerId: this.ownerId,
      trainerId: this.trainerId,
 
      currentAbility: this.currentAbility,
      averageAbility: this.averageAbility,
      peakAbility: this.peakAbility,
 
      speedIndex: this.speedIndex,
      accelerationIndex: this.accelerationIndex,
      staminaIndex: this.staminaIndex,
      powerIndex: this.powerIndex,
      finishIndex: this.finishIndex,
      startIndex: this.startIndex,
      cornerIndex: this.cornerIndex,
      mentalIndex: this.mentalIndex,
      consistencyIndex: this.consistencyIndex,
 
      abilityHistory: this.abilityHistory,
 
      trainingKnowledge: this.serializeMap(this.trainingKnowledge),
      trainingPatternKnowledge: this.serializeMap(this.trainingPatternKnowledge),
      bodyWeightKnowledge: this.serializeMap(this.bodyWeightKnowledge),
      bodyWeightChangeKnowledge: this.serializeMap(this.bodyWeightChangeKnowledge),
      intervalKnowledge: this.serializeMap(this.intervalKnowledge),
      ageKnowledge: this.serializeMap(this.ageKnowledge),
 
      physicalKnowledge: this.serializeMap(this.physicalKnowledge),
      mentalKnowledge: this.serializeMap(this.mentalKnowledge),
      fatigueKnowledge: this.serializeMap(this.fatigueKnowledge),
      recoveryKnowledge: this.serializeMap(this.recoveryKnowledge),
      riskKnowledge: this.serializeMap(this.riskKnowledge),
 
      jockeyRelationshipKnowledge: this.serializeMap(this.jockeyRelationshipKnowledge),
      trainerRelationshipKnowledge: this.serializeMap(this.trainerRelationshipKnowledge),
      bloodlineRelationshipKnowledge: this.serializeMap(this.bloodlineRelationshipKnowledge),
      crossRelationshipKnowledge: this.serializeMap(this.crossRelationshipKnowledge),
 
      lifecycle: this.lifecycle,
      maturityPattern: this.maturityPattern,
      growthCurve: this.growthCurve,
 
      fatigueTolerance: this.fatigueTolerance,
      riskTolerance: this.riskTolerance,
      recoveryScore: this.recoveryScore,
 
      adaptability: this.adaptability,
      adaptabilitySample: this.adaptabilitySample,
 
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
 
    this.horseId = json.horseId || this.id;
 
    this.sex = json.sex || "";
    this.color = json.color || "";
    this.birthDate = json.birthDate || null;
    this.birthYear = json.birthYear || 0;
 
    this.fatherId = json.fatherId || "";
    this.motherId = json.motherId || "";
    this.motherFatherId = json.motherFatherId || "";
    this.sireLine = json.sireLine || "";
    this.damLine = json.damLine || "";
    this.crossKey = json.crossKey || "";
 
    this.breederId = json.breederId || "";
    this.ownerId = json.ownerId || "";
    this.trainerId = json.trainerId || "";
 
    this.currentAbility = json.currentAbility || 0;
    this.averageAbility = json.averageAbility || 0;
    this.peakAbility = json.peakAbility || 0;
 
    this.speedIndex = json.speedIndex || 0;
    this.accelerationIndex = json.accelerationIndex || 0;
    this.staminaIndex = json.staminaIndex || 0;
    this.powerIndex = json.powerIndex || 0;
    this.finishIndex = json.finishIndex || 0;
    this.startIndex = json.startIndex || 0;
    this.cornerIndex = json.cornerIndex || 0;
    this.mentalIndex = json.mentalIndex || 0;
    this.consistencyIndex = json.consistencyIndex || 0;
 
    this.abilityHistory = json.abilityHistory || [];
 
    this.trainingKnowledge = this.loadMap(json.trainingKnowledge);
    this.trainingPatternKnowledge = this.loadMap(json.trainingPatternKnowledge);
    this.bodyWeightKnowledge = this.loadMap(json.bodyWeightKnowledge);
    this.bodyWeightChangeKnowledge = this.loadMap(json.bodyWeightChangeKnowledge);
    this.intervalKnowledge = this.loadMap(json.intervalKnowledge);
    this.ageKnowledge = this.loadMap(json.ageKnowledge);
 
    this.physicalKnowledge = this.loadMap(json.physicalKnowledge);
    this.mentalKnowledge = this.loadMap(json.mentalKnowledge);
    this.fatigueKnowledge = this.loadMap(json.fatigueKnowledge);
    this.recoveryKnowledge = this.loadMap(json.recoveryKnowledge);
    this.riskKnowledge = this.loadMap(json.riskKnowledge);
 
    this.jockeyRelationshipKnowledge = this.loadMap(json.jockeyRelationshipKnowledge);
    this.trainerRelationshipKnowledge = this.loadMap(json.trainerRelationshipKnowledge);
    this.bloodlineRelationshipKnowledge = this.loadMap(json.bloodlineRelationshipKnowledge);
    this.crossRelationshipKnowledge = this.loadMap(json.crossRelationshipKnowledge);
 
    this.lifecycle = json.lifecycle || "UNKNOWN";
    this.maturityPattern = json.maturityPattern || "";
    this.growthCurve = json.growthCurve || [];
 
    this.fatigueTolerance =
      json.fatigueTolerance !== undefined
        ? json.fatigueTolerance
        : null;
 
    this.riskTolerance = json.riskTolerance || 0;
    this.recoveryScore = json.recoveryScore || 0;
 
    this.adaptability =
      json.adaptability !== undefined
        ? json.adaptability
        : 50;
 
    this.adaptabilitySample = json.adaptabilitySample || 0;
 
    this.weights = KnowledgeWeights.fromJSON(json.weights || { profileType: "HORSE" });
    this.knowledgeHistory = KnowledgeHistory.fromJSON(json.knowledgeHistory || {});
    this.versionManager = VersionManager.fromJSON(json.versionManager || {});
    this.aiJournal = AIJournal.fromJSON(json.aiJournal || {});
 
    return this;
  }
 
  static fromJSON(json) {
    const profile = new HorseProfile(
      json && json.horseId ? json.horseId : ""
    );
 
    return profile.load(json || {});
  }
 
}
