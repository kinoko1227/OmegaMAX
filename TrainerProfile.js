/**
 * ==========================================================
 * ΩMAX AIOS
 * TrainerProfile.js
 * ----------------------------------------------------------
 * Trainer Profile v1
 *
 * 調教師・厩舎の長期学習Profile。
 * KnowledgeProfile / KnowledgeCell / KnowledgeSchema を利用し、
 * 仕上げ傾向・ローテーション・調教・遠征・クラス別傾向を学習する。
 *
 * GAS V8 compatible.
 * ==========================================================
 */

class TrainerProfile extends KnowledgeProfile {

  constructor(trainerId) {
    super(trainerId || "", "TRAINER");

    this.trainerId = trainerId || "";

    // -------------------------
    // Identity
    // -------------------------
    this.name = "";
    this.stableName = "";
    this.base = "";
    this.region = "";
    this.licenseYear = 0;
    this.birthYear = 0;

    // -------------------------
    // Ability / style indexes
    // -------------------------
    this.currentAbility = 0;
    this.averageAbility = 0;
    this.peakAbility = 0;

    this.preparationIndex = 0;
    this.trainingIndex = 0;
    this.recoveryIndex = 0;
    this.rotationIndex = 0;
    this.transportIndex = 0;
    this.classUpIndex = 0;
    this.heavyRaceIndex = 0;
    this.consistencyIndex = 0;

    this.abilityHistory = [];

    // -------------------------
    // Trainer-specific knowledge
    // -------------------------
    this.trainingKnowledge = {};
    this.trainingPatternKnowledge = {};
    this.intervalKnowledge = {};
    this.layoffKnowledge = {};
    this.classKnowledge = {};
    this.courseKnowledge = {};
    this.distanceKnowledge = {};
    this.surfaceKnowledge = {};
    this.goingKnowledge = {};
    this.seasonKnowledge = {};
    this.transportKnowledge = {};
    this.stablePatternKnowledge = {};
    this.raceTargetKnowledge = {};

    // -------------------------
    // Relationship knowledge
    // -------------------------
    this.horseRelationshipKnowledge = {};
    this.jockeyRelationshipKnowledge = {};
    this.ownerRelationshipKnowledge = {};
    this.bloodlineRelationshipKnowledge = {};

    // -------------------------
    // Derived characteristics
    // -------------------------
    this.preferredPreparationPattern = "";
    this.preferredRotationPattern = "";
    this.restStarterType = "UNKNOWN";
    this.secondUpType = "UNKNOWN";
    this.heavyRacePreparationType = "UNKNOWN";
    this.transportStyle = "UNKNOWN";
    this.developmentStyle = "UNKNOWN";

    // -------------------------
    // Managers / learning assets
    // -------------------------
    this.weights = new KnowledgeWeights("TRAINER");
    this.knowledgeHistory = new KnowledgeHistory();
    this.versionManager = new VersionManager();
    this.aiJournal = new AIJournal();
  }

  /** Observation学習 */
  learn(observation) {
    if (!observation) return this;

    KnowledgeProfile.prototype.learn.call(this, observation);

    this.updateTrainerKnowledge(observation);
    this.updateAbilityIndexes(observation);
    this.updateRelationships(observation);
    this.updateDerivedCharacteristics(observation);
    this.updateConfidence();

    this.aiJournal.add({
      type: "LEARN",
      category: "TRAINER_PROFILE",
      title: "TrainerProfile learned observation",
      message: "TrainerProfile updated from observation.",
      targetType: "TRAINER",
      targetId: this.trainerId,
      evidence: {
        raceId: observation.raceId || "",
        horseId: observation.horseId || "",
        finish: observation.finish || 0,
        abilityIndex: observation.abilityIndex || 0,
        aceScore: observation.aceScore || 0
      }
    });

    this.touch();
    return this;
  }

  /** 調教師固有Knowledge更新 */
  updateTrainerKnowledge(observation) {
    if (!observation) return this;

    this.updateKnowledgeCell(this.trainingKnowledge, observation.trainingType, "TRAINING", observation);
    this.updateKnowledgeCell(this.trainingPatternKnowledge, observation.trainingPattern, "TRAINING_PATTERN", observation);
    this.updateKnowledgeCell(this.intervalKnowledge, this.bucketValue(observation.intervalDays, 7), "INTERVAL", observation);
    this.updateKnowledgeCell(this.layoffKnowledge, observation.layoffType, "LAYOFF", observation);
    this.updateKnowledgeCell(this.classKnowledge, observation.raceClass, "CLASS", observation);
    this.updateKnowledgeCell(this.courseKnowledge, observation.course, "COURSE", observation);
    this.updateKnowledgeCell(this.distanceKnowledge, this.bucketValue(observation.distance, 200), "DISTANCE", observation);
    this.updateKnowledgeCell(this.surfaceKnowledge, observation.surface, "SURFACE", observation);
    this.updateKnowledgeCell(this.goingKnowledge, observation.going, "GOING", observation);
    this.updateKnowledgeCell(this.seasonKnowledge, observation.season, "SEASON", observation);
    this.updateKnowledgeCell(this.transportKnowledge, observation.transportPattern, "TRANSPORT", observation);
    this.updateKnowledgeCell(this.stablePatternKnowledge, observation.stablePattern, "STABLE_PATTERN", observation);
    this.updateKnowledgeCell(this.raceTargetKnowledge, observation.raceTargetType, "RACE_TARGET", observation);

    return this;
  }

  /** 能力Index更新 */
  updateAbilityIndexes(observation) {
    const ability = Number(observation.trainerAbilityIndex || observation.abilityIndex || 0);

    if (ability > 0) {
      this.currentAbility = ability;
      this.abilityHistory.push({
        raceId: observation.raceId || "",
        date: observation.date || null,
        horseId: observation.horseId || "",
        value: ability,
        finish: observation.finish || 0,
        aceScore: observation.aceScore || 0
      });

      if (this.peakAbility === 0 || ability > this.peakAbility) this.peakAbility = ability;

      this.averageAbility = this.averageArray(
        this.abilityHistory.map(function(x) { return Number(x.value || 0); })
      );
    }

    this.preparationIndex = this.smoothValue(this.preparationIndex, observation.preparationIndex);
    this.trainingIndex = this.smoothValue(this.trainingIndex, observation.trainingIndex);
    this.recoveryIndex = this.smoothValue(this.recoveryIndex, observation.recoveryIndex);
    this.rotationIndex = this.smoothValue(this.rotationIndex, observation.rotationIndex);
    this.transportIndex = this.smoothValue(this.transportIndex, observation.transportIndex);
    this.classUpIndex = this.smoothValue(this.classUpIndex, observation.classUpIndex);
    this.heavyRaceIndex = this.smoothValue(this.heavyRaceIndex, observation.heavyRaceIndex);
    this.consistencyIndex = this.calculateConsistencyIndex();

    return this;
  }

  /** Relationship Knowledge更新 */
  updateRelationships(observation) {
    if (observation.horseId) {
      this.updateKnowledgeCell(this.horseRelationshipKnowledge, observation.horseId, "TRAINER_HORSE", observation);
    }
    if (observation.jockeyId) {
      this.updateKnowledgeCell(this.jockeyRelationshipKnowledge, observation.jockeyId, "TRAINER_JOCKEY", observation);
    }
    if (observation.ownerId) {
      this.updateKnowledgeCell(this.ownerRelationshipKnowledge, observation.ownerId, "TRAINER_OWNER", observation);
    }
    if (observation.fatherId) {
      this.updateKnowledgeCell(this.bloodlineRelationshipKnowledge, observation.fatherId, "TRAINER_BLOODLINE", observation);
    }
    return this;
  }

  /** 派生特性更新 */
  updateDerivedCharacteristics(observation) {
    this.updateStarterTypes(observation);
    this.updatePreparationPatterns(observation);
    return this;
  }

  updateStarterTypes(observation) {
    if (observation.layoffType === "REST_START") {
      this.restStarterType = this.isGoodResult(observation) ? "GOOD" : "CHECK";
    }
    if (observation.layoffType === "SECOND_UP") {
      this.secondUpType = this.isGoodResult(observation) ? "GOOD" : "CHECK";
    }
    if (observation.raceClass === "G1" || observation.raceClass === "G2" || observation.raceClass === "G3") {
      this.heavyRacePreparationType = this.isGoodResult(observation) ? "GOOD" : "CHECK";
    }
    return this;
  }

  updatePreparationPatterns(observation) {
    const bestTraining = this.best(this.trainingPatternKnowledge);
    if (bestTraining) this.preferredPreparationPattern = bestTraining.name;

    const bestInterval = this.best(this.intervalKnowledge);
    if (bestInterval) this.preferredRotationPattern = bestInterval.name;

    const bestTransport = this.best(this.transportKnowledge);
    if (bestTransport) this.transportStyle = bestTransport.name;

    const bestStable = this.best(this.stablePatternKnowledge);
    if (bestStable) this.developmentStyle = bestStable.name;

    return this;
  }

  /** 重み更新記録 */
  updateWeight(fieldKey, nextWeight, reason, evidence) {
    const current = this.weights.get(fieldKey);
    const before = current ? current.weight : LearningPolicy.get("TRAINER", fieldKey).initialWeight;
    const after = this.weights.set(fieldKey, nextWeight);

    const record = this.knowledgeHistory.add({
      targetType: "TRAINER",
      targetId: this.trainerId,
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
      category: "TRAINER_PROFILE",
      title: "TrainerProfile weight updated",
      message: fieldKey + " weight updated.",
      targetType: "TRAINER",
      targetId: this.trainerId,
      evidence: record
    });

    return after;
  }

  /** Snapshot作成 */
  createSnapshot(label, reason) {
    return this.versionManager.createSnapshot({
      targetType: "TRAINER",
      targetId: this.trainerId,
      version: this.version,
      label: label || "",
      reason: reason || "",
      data: this.toJSON()
    });
  }

  /** Rollback */
  rollback(snapshotId) {
    const data = this.versionManager.rollback("TRAINER", this.trainerId, snapshotId || null);
    if (!data) return false;
    this.load(data);
    return true;
  }

  /** Best getters */
  getBestTrainingType() { return this.best(this.trainingKnowledge); }
  getBestTrainingPattern() { return this.best(this.trainingPatternKnowledge); }
  getBestInterval() { return this.best(this.intervalKnowledge); }
  getBestLayoff() { return this.best(this.layoffKnowledge); }
  getBestCourse() { return this.best(this.courseKnowledge); }
  getBestDistance() { return this.best(this.distanceKnowledge); }
  getBestSurface() { return this.best(this.surfaceKnowledge); }
  getBestGoing() { return this.best(this.goingKnowledge); }
  getBestSeason() { return this.best(this.seasonKnowledge); }
  getHorseFit(horseId) { return horseId ? (this.horseRelationshipKnowledge[horseId] || null) : null; }
  getJockeyFit(jockeyId) { return jockeyId ? (this.jockeyRelationshipKnowledge[jockeyId] || null) : null; }

  /** Utility */
  bucketValue(value, bucketSize) {
    if (value === null || value === undefined || value === "") return "";
    const n = Number(value);
    if (isNaN(n)) return String(value);
    const b = Number(bucketSize || 1);
    if (b <= 0) return String(n);
    return String(Math.round(n / b) * b);
  }

  smoothValue(current, next) {
    if (next === null || next === undefined || next === "") return Number(current || 0);
    const n = Number(next);
    if (isNaN(n)) return Number(current || 0);
    if (!current) return n;
    return Number(current || 0) * 0.85 + n * 0.15;
  }

  averageArray(values) {
    values = (values || []).filter(function(v) { return !isNaN(Number(v)); });
    if (!values.length) return 0;
    const total = values.reduce(function(a, b) { return Number(a) + Number(b); }, 0);
    return total / values.length;
  }

  calculateConsistencyIndex() {
    if (!this.abilityHistory || this.abilityHistory.length < 2) return 50;
    const values = this.abilityHistory.map(function(x) { return Number(x.value || 0); });
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
    if (finish >= 1 && finish <= 3) return true;
    const roi = Number(observation.roi || 0);
    if (roi >= 1.0) return true;
    const ace = Number(observation.aceScore || 0);
    return ace >= 80 && finish > 0 && finish <= 5;
  }

  serializeMap(map) { return KnowledgeProfile.prototype.serializeMap.call(this, map); }
  loadMap(jsonMap) { return KnowledgeProfile.prototype.loadMap.call(this, jsonMap); }

  /** JSON */
  toJSON() {
    const base = KnowledgeProfile.prototype.toJSON.call(this);
    return Object.assign(base, {
      trainerId: this.trainerId,
      stableName: this.stableName,
      base: this.base,
      region: this.region,
      licenseYear: this.licenseYear,
      birthYear: this.birthYear,

      currentAbility: this.currentAbility,
      averageAbility: this.averageAbility,
      peakAbility: this.peakAbility,
      preparationIndex: this.preparationIndex,
      trainingIndex: this.trainingIndex,
      recoveryIndex: this.recoveryIndex,
      rotationIndex: this.rotationIndex,
      transportIndex: this.transportIndex,
      classUpIndex: this.classUpIndex,
      heavyRaceIndex: this.heavyRaceIndex,
      consistencyIndex: this.consistencyIndex,
      abilityHistory: this.abilityHistory,

      trainingKnowledge: this.serializeMap(this.trainingKnowledge),
      trainingPatternKnowledge: this.serializeMap(this.trainingPatternKnowledge),
      intervalKnowledge: this.serializeMap(this.intervalKnowledge),
      layoffKnowledge: this.serializeMap(this.layoffKnowledge),
      classKnowledge: this.serializeMap(this.classKnowledge),
      courseKnowledge: this.serializeMap(this.courseKnowledge),
      distanceKnowledge: this.serializeMap(this.distanceKnowledge),
      surfaceKnowledge: this.serializeMap(this.surfaceKnowledge),
      goingKnowledge: this.serializeMap(this.goingKnowledge),
      seasonKnowledge: this.serializeMap(this.seasonKnowledge),
      transportKnowledge: this.serializeMap(this.transportKnowledge),
      stablePatternKnowledge: this.serializeMap(this.stablePatternKnowledge),
      raceTargetKnowledge: this.serializeMap(this.raceTargetKnowledge),

      horseRelationshipKnowledge: this.serializeMap(this.horseRelationshipKnowledge),
      jockeyRelationshipKnowledge: this.serializeMap(this.jockeyRelationshipKnowledge),
      ownerRelationshipKnowledge: this.serializeMap(this.ownerRelationshipKnowledge),
      bloodlineRelationshipKnowledge: this.serializeMap(this.bloodlineRelationshipKnowledge),

      preferredPreparationPattern: this.preferredPreparationPattern,
      preferredRotationPattern: this.preferredRotationPattern,
      restStarterType: this.restStarterType,
      secondUpType: this.secondUpType,
      heavyRacePreparationType: this.heavyRacePreparationType,
      transportStyle: this.transportStyle,
      developmentStyle: this.developmentStyle,

      weights: this.weights.toJSON(),
      knowledgeHistory: this.knowledgeHistory.toJSON(),
      versionManager: this.versionManager.toJSON(),
      aiJournal: this.aiJournal.toJSON()
    });
  }

  /** JSON読込 */
  load(json) {
    KnowledgeProfile.prototype.load.call(this, json);
    if (!json) return this;

    this.trainerId = json.trainerId || this.id;
    this.stableName = json.stableName || "";
    this.base = json.base || "";
    this.region = json.region || "";
    this.licenseYear = json.licenseYear || 0;
    this.birthYear = json.birthYear || 0;

    this.currentAbility = json.currentAbility || 0;
    this.averageAbility = json.averageAbility || 0;
    this.peakAbility = json.peakAbility || 0;
    this.preparationIndex = json.preparationIndex || 0;
    this.trainingIndex = json.trainingIndex || 0;
    this.recoveryIndex = json.recoveryIndex || 0;
    this.rotationIndex = json.rotationIndex || 0;
    this.transportIndex = json.transportIndex || 0;
    this.classUpIndex = json.classUpIndex || 0;
    this.heavyRaceIndex = json.heavyRaceIndex || 0;
    this.consistencyIndex = json.consistencyIndex || 0;
    this.abilityHistory = json.abilityHistory || [];

    this.trainingKnowledge = this.loadMap(json.trainingKnowledge);
    this.trainingPatternKnowledge = this.loadMap(json.trainingPatternKnowledge);
    this.intervalKnowledge = this.loadMap(json.intervalKnowledge);
    this.layoffKnowledge = this.loadMap(json.layoffKnowledge);
    this.classKnowledge = this.loadMap(json.classKnowledge);
    this.courseKnowledge = this.loadMap(json.courseKnowledge);
    this.distanceKnowledge = this.loadMap(json.distanceKnowledge);
    this.surfaceKnowledge = this.loadMap(json.surfaceKnowledge);
    this.goingKnowledge = this.loadMap(json.goingKnowledge);
    this.seasonKnowledge = this.loadMap(json.seasonKnowledge);
    this.transportKnowledge = this.loadMap(json.transportKnowledge);
    this.stablePatternKnowledge = this.loadMap(json.stablePatternKnowledge);
    this.raceTargetKnowledge = this.loadMap(json.raceTargetKnowledge);

    this.horseRelationshipKnowledge = this.loadMap(json.horseRelationshipKnowledge);
    this.jockeyRelationshipKnowledge = this.loadMap(json.jockeyRelationshipKnowledge);
    this.ownerRelationshipKnowledge = this.loadMap(json.ownerRelationshipKnowledge);
    this.bloodlineRelationshipKnowledge = this.loadMap(json.bloodlineRelationshipKnowledge);

    this.preferredPreparationPattern = json.preferredPreparationPattern || "";
    this.preferredRotationPattern = json.preferredRotationPattern || "";
    this.restStarterType = json.restStarterType || "UNKNOWN";
    this.secondUpType = json.secondUpType || "UNKNOWN";
    this.heavyRacePreparationType = json.heavyRacePreparationType || "UNKNOWN";
    this.transportStyle = json.transportStyle || "UNKNOWN";
    this.developmentStyle = json.developmentStyle || "UNKNOWN";

    this.weights = KnowledgeWeights.fromJSON(json.weights || { profileType: "TRAINER" });
    this.knowledgeHistory = KnowledgeHistory.fromJSON(json.knowledgeHistory || {});
    this.versionManager = VersionManager.fromJSON(json.versionManager || {});
    this.aiJournal = AIJournal.fromJSON(json.aiJournal || {});

    return this;
  }

  static fromJSON(json) {
    const profile = new TrainerProfile(json && json.trainerId ? json.trainerId : "");
    return profile.load(json || {});
  }
}
