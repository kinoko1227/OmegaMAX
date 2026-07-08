/**
 * ==========================================================
 * ΩMAX AIOS
 * JockeyProfile.js
 * ----------------------------------------------------------
 * Jockey Profile v1
 *
 * 騎手個体の長期学習Profile。
 * KnowledgeProfile / KnowledgeCell / KnowledgeSchema を利用し、
 * 過去データ・日次結果から自己更新する。
 *
 * GAS V8 compatible.
 * ==========================================================
 */

class JockeyProfile extends KnowledgeProfile {

  constructor(jockeyId) {
    super(jockeyId || "", "JOCKEY");

    this.jockeyId = jockeyId || "";

    // -------------------------
    // Identity
    // -------------------------
    this.name = "";
    this.birthDate = null;
    this.birthYear = 0;
    this.debutYear = 0;
    this.affiliation = "";
    this.region = "";
    this.status = "ACTIVE";

    // -------------------------
    // Ability indexes
    // -------------------------
    this.currentAbility = 0;
    this.averageAbility = 0;
    this.peakAbility = 0;

    this.startIndex = 0;
    this.positionIndex = 0;
    this.paceReadIndex = 0;
    this.finishTimingIndex = 0;
    this.courseSelectionIndex = 0;
    this.pressureIndex = 0;
    this.longShotIndex = 0;
    this.favoriteIndex = 0;
    this.consistencyIndex = 0;

    this.abilityHistory = [];

    // -------------------------
    // Jockey-specific knowledge
    // -------------------------
    this.popularityKnowledge = {};
    this.oddsRangeKnowledge = {};
    this.finishPositionKnowledge = {};
    this.mountCountKnowledge = {};
    this.ageKnowledge = {};
    this.careerYearKnowledge = {};

    this.startKnowledge = {};
    this.positionKnowledge = {};
    this.paceReadKnowledge = {};
    this.finishTimingKnowledge = {};
    this.courseSelectionKnowledge = {};
    this.pressureKnowledge = {};

    this.horseRelationshipKnowledge = {};
    this.trainerRelationshipKnowledge = {};
    this.ownerRelationshipKnowledge = {};
    this.courseRelationshipKnowledge = {};

    // -------------------------
    // Derived characteristics
    // -------------------------
    this.lifecycle = "UNKNOWN";
    this.ridingStyle = "";
    this.growthCurve = [];
    this.recentForm = 50;
    this.riskTolerance = 0;

    // -------------------------
    // Managers / learning assets
    // -------------------------
    this.weights = new KnowledgeWeights("JOCKEY");
    this.knowledgeHistory = new KnowledgeHistory();
    this.versionManager = new VersionManager();
    this.aiJournal = new AIJournal();
  }

  /** Observation学習 */
  learn(observation) {
    if (!observation) {
      return this;
    }

    KnowledgeProfile.prototype.learn.call(this, observation);

    this.updateJockeyKnowledge(observation);
    this.updateAbilityIndexes(observation);
    this.updateRelationships(observation);
    this.updateDerivedCharacteristics(observation);
    this.updateConfidence();

    this.aiJournal.add({
      type: "LEARN",
      category: "JOCKEY_PROFILE",
      title: "JockeyProfile learned observation",
      message: "JockeyProfile updated from observation.",
      targetType: "JOCKEY",
      targetId: this.jockeyId,
      evidence: {
        raceId: observation.raceId || "",
        finish: observation.finish || 0,
        popularity: observation.popularity || 0,
        abilityIndex: observation.abilityIndex || 0,
        aceScore: observation.aceScore || 0
      }
    });

    this.touch();
    return this;
  }

  /** 騎手固有Knowledge更新 */
  updateJockeyKnowledge(observation) {
    if (!observation) {
      return this;
    }

    this.updateKnowledgeCell(
      this.popularityKnowledge,
      this.bucketValue(observation.popularity, 1),
      "POPULARITY",
      observation
    );

    this.updateKnowledgeCell(
      this.oddsRangeKnowledge,
      this.bucketValue(observation.odds, 2),
      "ODDS_RANGE",
      observation
    );

    this.updateKnowledgeCell(
      this.finishPositionKnowledge,
      observation.finishPositionType,
      "FINISH_POSITION",
      observation
    );

    this.updateKnowledgeCell(
      this.mountCountKnowledge,
      this.bucketValue(observation.dailyMountCount, 1),
      "MOUNT_COUNT",
      observation
    );

    this.updateKnowledgeCell(
      this.ageKnowledge,
      observation.jockeyAge,
      "JOCKEY_AGE",
      observation
    );

    this.updateKnowledgeCell(
      this.careerYearKnowledge,
      observation.jockeyCareerYear,
      "CAREER_YEAR",
      observation
    );

    if (observation.startIndex !== undefined) {
      this.updateKnowledgeCell(
        this.startKnowledge,
        this.bucketValue(observation.startIndex, 5),
        "START",
        observation
      );
    }

    if (observation.positionIndex !== undefined) {
      this.updateKnowledgeCell(
        this.positionKnowledge,
        this.bucketValue(observation.positionIndex, 5),
        "POSITION",
        observation
      );
    }

    if (observation.paceReadIndex !== undefined) {
      this.updateKnowledgeCell(
        this.paceReadKnowledge,
        this.bucketValue(observation.paceReadIndex, 5),
        "PACE_READ",
        observation
      );
    }

    if (observation.finishTimingIndex !== undefined) {
      this.updateKnowledgeCell(
        this.finishTimingKnowledge,
        this.bucketValue(observation.finishTimingIndex, 5),
        "FINISH_TIMING",
        observation
      );
    }

    if (observation.courseSelectionIndex !== undefined) {
      this.updateKnowledgeCell(
        this.courseSelectionKnowledge,
        this.bucketValue(observation.courseSelectionIndex, 5),
        "COURSE_SELECTION",
        observation
      );
    }

    if (observation.pressureType) {
      this.updateKnowledgeCell(
        this.pressureKnowledge,
        observation.pressureType,
        "PRESSURE",
        observation
      );
    }

    return this;
  }

  /** 能力Index更新 */
  updateAbilityIndexes(observation) {
    const ability = Number(observation.jockeyAbilityIndex || observation.abilityIndex || 0);

    if (ability > 0) {
      this.currentAbility = ability;
      this.abilityHistory.push({
        raceId: observation.raceId || "",
        date: observation.date || null,
        value: ability,
        finish: observation.finish || 0,
        popularity: observation.popularity || 0,
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

    this.startIndex = this.smoothValue(this.startIndex, observation.startIndex);
    this.positionIndex = this.smoothValue(this.positionIndex, observation.positionIndex);
    this.paceReadIndex = this.smoothValue(this.paceReadIndex, observation.paceReadIndex);
    this.finishTimingIndex = this.smoothValue(this.finishTimingIndex, observation.finishTimingIndex);
    this.courseSelectionIndex = this.smoothValue(this.courseSelectionIndex, observation.courseSelectionIndex);
    this.pressureIndex = this.smoothValue(this.pressureIndex, observation.pressureIndex);

    this.longShotIndex = this.updateLongShotIndex(observation);
    this.favoriteIndex = this.updateFavoriteIndex(observation);
    this.consistencyIndex = this.calculateConsistencyIndex();

    return this;
  }

  /** Relationship Knowledge更新 */
  updateRelationships(observation) {
    if (observation.horseId) {
      this.updateKnowledgeCell(
        this.horseRelationshipKnowledge,
        observation.horseId,
        "JOCKEY_HORSE",
        observation
      );
    }

    if (observation.trainerId) {
      this.updateKnowledgeCell(
        this.trainerRelationshipKnowledge,
        observation.trainerId,
        "JOCKEY_TRAINER",
        observation
      );
    }

    if (observation.ownerId) {
      this.updateKnowledgeCell(
        this.ownerRelationshipKnowledge,
        observation.ownerId,
        "JOCKEY_OWNER",
        observation
      );
    }

    if (observation.course) {
      this.updateKnowledgeCell(
        this.courseRelationshipKnowledge,
        observation.course,
        "JOCKEY_COURSE",
        observation
      );
    }

    return this;
  }

  /** 派生特性更新 */
  updateDerivedCharacteristics(observation) {
    this.updateLifecycle(observation);
    this.updateRecentForm(observation);
    this.updateRidingStyle(observation);
    return this;
  }

  /** ライフサイクル推定 */
  updateLifecycle(observation) {
    const career = Number(observation.jockeyCareerYear || 0);
    const age = Number(observation.jockeyAge || 0);

    if (career > 0) {
      if (career <= 3) {
        this.lifecycle = "ROOKIE";
      } else if (career <= 8) {
        this.lifecycle = "GROWTH";
      } else if (career <= 20) {
        this.lifecycle = "PRIME";
      } else {
        this.lifecycle = "VETERAN";
      }
    } else if (age > 0) {
      if (age <= 25) this.lifecycle = "ROOKIE";
      else if (age <= 32) this.lifecycle = "GROWTH";
      else if (age <= 45) this.lifecycle = "PRIME";
      else this.lifecycle = "VETERAN";
    }

    this.growthCurve.push({
      date: observation.date || null,
      age: age || null,
      career: career || null,
      ability: Number(observation.jockeyAbilityIndex || observation.abilityIndex || 0)
    });

    return this;
  }

  /** 近況更新 */
  updateRecentForm(observation) {
    const finish = Number(observation.finish || 0);
    if (!finish) {
      return this;
    }

    let score = 50;
    if (finish === 1) score = 90;
    else if (finish === 2) score = 78;
    else if (finish === 3) score = 68;
    else if (finish <= 5) score = 56;
    else score = 42;

    this.recentForm = this.smoothValue(this.recentForm, score);
    return this;
  }

  /** 騎乗スタイル推定 */
  updateRidingStyle(observation) {
    if (observation.jockeyStyle) {
      this.ridingStyle = observation.jockeyStyle;
      return this;
    }

    const bestStyle = this.best(this.styleKnowledge);
    if (bestStyle && bestStyle.name) {
      this.ridingStyle = bestStyle.name;
    }

    return this;
  }

  /** 人気薄指数 */
  updateLongShotIndex(observation) {
    const popularity = Number(observation.popularity || 0);
    if (popularity < 6) {
      return this.longShotIndex;
    }

    const good = this.isGoodResult(observation) ? 80 : 40;
    return this.smoothValue(this.longShotIndex || 50, good);
  }

  /** 人気馬指数 */
  updateFavoriteIndex(observation) {
    const popularity = Number(observation.popularity || 0);
    if (popularity <= 0 || popularity > 3) {
      return this.favoriteIndex;
    }

    const good = this.isGoodResult(observation) ? 85 : 35;
    return this.smoothValue(this.favoriteIndex || 50, good);
  }

  /** 重み更新記録 */
  updateWeight(fieldKey, nextWeight, reason, evidence) {
    const current = this.weights.get(fieldKey);
    const policy = LearningPolicy.get("JOCKEY", fieldKey);
    const before = current ? current.weight : policy.initialWeight;
    const after = this.weights.set(fieldKey, nextWeight);

    const record = this.knowledgeHistory.add({
      targetType: "JOCKEY",
      targetId: this.jockeyId,
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
      category: "JOCKEY_PROFILE",
      title: "JockeyProfile weight updated",
      message: fieldKey + " weight updated.",
      targetType: "JOCKEY",
      targetId: this.jockeyId,
      evidence: record
    });

    return after;
  }

  /** Snapshot作成 */
  createSnapshot(label, reason) {
    return this.versionManager.createSnapshot({
      targetType: "JOCKEY",
      targetId: this.jockeyId,
      version: this.version,
      label: label || "",
      reason: reason || "",
      data: this.toJSON()
    });
  }

  /** Snapshotから戻す */
  rollback(snapshotId) {
    const data = this.versionManager.rollback(
      "JOCKEY",
      this.jockeyId,
      snapshotId || null
    );

    if (!data) {
      return false;
    }

    this.load(data);

    this.aiJournal.add({
      type: "ROLLBACK",
      category: "JOCKEY_PROFILE",
      title: "JockeyProfile rollback",
      message: "JockeyProfile rolled back from snapshot.",
      targetType: "JOCKEY",
      targetId: this.jockeyId,
      evidence: {
        snapshotId: snapshotId || ""
      }
    });

    return true;
  }

  /** Best getters */
  getBestCourse() { return this.best(this.courseKnowledge); }
  getBestDistance() { return this.best(this.distanceKnowledge); }
  getBestSurface() { return this.best(this.surfaceKnowledge); }
  getBestGoing() { return this.best(this.goingKnowledge); }
  getBestClass() { return this.best(this.classKnowledge); }
  getBestPace() { return this.best(this.paceKnowledge); }
  getBestRunningStyle() { return this.best(this.styleKnowledge); }
  getBestPopularityRange() { return this.best(this.popularityKnowledge); }
  getBestOddsRange() { return this.best(this.oddsRangeKnowledge); }

  getHorseFit(horseId) {
    if (!horseId) return null;
    return this.horseRelationshipKnowledge[horseId] || null;
  }

  getTrainerFit(trainerId) {
    if (!trainerId) return null;
    return this.trainerRelationshipKnowledge[trainerId] || null;
  }

  /** Utility */
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

  /** JSON */
  toJSON() {
    const base = KnowledgeProfile.prototype.toJSON.call(this);

    return Object.assign(base, {
      jockeyId: this.jockeyId,
      birthDate: this.birthDate,
      birthYear: this.birthYear,
      debutYear: this.debutYear,
      affiliation: this.affiliation,
      region: this.region,

      currentAbility: this.currentAbility,
      averageAbility: this.averageAbility,
      peakAbility: this.peakAbility,

      startIndex: this.startIndex,
      positionIndex: this.positionIndex,
      paceReadIndex: this.paceReadIndex,
      finishTimingIndex: this.finishTimingIndex,
      courseSelectionIndex: this.courseSelectionIndex,
      pressureIndex: this.pressureIndex,
      longShotIndex: this.longShotIndex,
      favoriteIndex: this.favoriteIndex,
      consistencyIndex: this.consistencyIndex,

      abilityHistory: this.abilityHistory,

      popularityKnowledge: this.serializeMap(this.popularityKnowledge),
      oddsRangeKnowledge: this.serializeMap(this.oddsRangeKnowledge),
      finishPositionKnowledge: this.serializeMap(this.finishPositionKnowledge),
      mountCountKnowledge: this.serializeMap(this.mountCountKnowledge),
      ageKnowledge: this.serializeMap(this.ageKnowledge),
      careerYearKnowledge: this.serializeMap(this.careerYearKnowledge),

      startKnowledge: this.serializeMap(this.startKnowledge),
      positionKnowledge: this.serializeMap(this.positionKnowledge),
      paceReadKnowledge: this.serializeMap(this.paceReadKnowledge),
      finishTimingKnowledge: this.serializeMap(this.finishTimingKnowledge),
      courseSelectionKnowledge: this.serializeMap(this.courseSelectionKnowledge),
      pressureKnowledge: this.serializeMap(this.pressureKnowledge),

      horseRelationshipKnowledge: this.serializeMap(this.horseRelationshipKnowledge),
      trainerRelationshipKnowledge: this.serializeMap(this.trainerRelationshipKnowledge),
      ownerRelationshipKnowledge: this.serializeMap(this.ownerRelationshipKnowledge),
      courseRelationshipKnowledge: this.serializeMap(this.courseRelationshipKnowledge),

      lifecycle: this.lifecycle,
      ridingStyle: this.ridingStyle,
      growthCurve: this.growthCurve,
      recentForm: this.recentForm,
      riskTolerance: this.riskTolerance,

      weights: this.weights.toJSON(),
      knowledgeHistory: this.knowledgeHistory.toJSON(),
      versionManager: this.versionManager.toJSON(),
      aiJournal: this.aiJournal.toJSON()
    });
  }

  /** JSON読込 */
  load(json) {
    KnowledgeProfile.prototype.load.call(this, json);

    if (!json) {
      return this;
    }

    this.jockeyId = json.jockeyId || this.id;
    this.birthDate = json.birthDate || null;
    this.birthYear = json.birthYear || 0;
    this.debutYear = json.debutYear || 0;
    this.affiliation = json.affiliation || "";
    this.region = json.region || "";

    this.currentAbility = json.currentAbility || 0;
    this.averageAbility = json.averageAbility || 0;
    this.peakAbility = json.peakAbility || 0;

    this.startIndex = json.startIndex || 0;
    this.positionIndex = json.positionIndex || 0;
    this.paceReadIndex = json.paceReadIndex || 0;
    this.finishTimingIndex = json.finishTimingIndex || 0;
    this.courseSelectionIndex = json.courseSelectionIndex || 0;
    this.pressureIndex = json.pressureIndex || 0;
    this.longShotIndex = json.longShotIndex || 0;
    this.favoriteIndex = json.favoriteIndex || 0;
    this.consistencyIndex = json.consistencyIndex || 0;

    this.abilityHistory = json.abilityHistory || [];

    this.popularityKnowledge = this.loadMap(json.popularityKnowledge);
    this.oddsRangeKnowledge = this.loadMap(json.oddsRangeKnowledge);
    this.finishPositionKnowledge = this.loadMap(json.finishPositionKnowledge);
    this.mountCountKnowledge = this.loadMap(json.mountCountKnowledge);
    this.ageKnowledge = this.loadMap(json.ageKnowledge);
    this.careerYearKnowledge = this.loadMap(json.careerYearKnowledge);

    this.startKnowledge = this.loadMap(json.startKnowledge);
    this.positionKnowledge = this.loadMap(json.positionKnowledge);
    this.paceReadKnowledge = this.loadMap(json.paceReadKnowledge);
    this.finishTimingKnowledge = this.loadMap(json.finishTimingKnowledge);
    this.courseSelectionKnowledge = this.loadMap(json.courseSelectionKnowledge);
    this.pressureKnowledge = this.loadMap(json.pressureKnowledge);

    this.horseRelationshipKnowledge = this.loadMap(json.horseRelationshipKnowledge);
    this.trainerRelationshipKnowledge = this.loadMap(json.trainerRelationshipKnowledge);
    this.ownerRelationshipKnowledge = this.loadMap(json.ownerRelationshipKnowledge);
    this.courseRelationshipKnowledge = this.loadMap(json.courseRelationshipKnowledge);

    this.lifecycle = json.lifecycle || "UNKNOWN";
    this.ridingStyle = json.ridingStyle || "";
    this.growthCurve = json.growthCurve || [];
    this.recentForm = json.recentForm || 50;
    this.riskTolerance = json.riskTolerance || 0;

    this.weights = KnowledgeWeights.fromJSON(json.weights || { profileType: "JOCKEY" });
    this.knowledgeHistory = KnowledgeHistory.fromJSON(json.knowledgeHistory || {});
    this.versionManager = VersionManager.fromJSON(json.versionManager || {});
    this.aiJournal = AIJournal.fromJSON(json.aiJournal || {});

    return this;
  }

  static fromJSON(json) {
    const profile = new JockeyProfile(
      json && json.jockeyId ? json.jockeyId : ""
    );

    return profile.load(json || {});
  }

}
