/**
 * ==========================================================
 * ΩMAX AIOS
 * LearningEngine.js
 * ----------------------------------------------------------
 * Learning Engine v2.0.0
 *
 * Observationを起点に、
 * Profile / KnowledgeWeights / KnowledgeHistory / AIJournal
 * を更新する自己学習エンジン。
 *
 * 目的:
 * - 過去データ一括学習
 * - レース後の日次オンライン学習
 * - Horse / Jockey / Trainer / Bloodline / Cross を同じ流れで学習
 * - 学習前後のSnapshot作成
 * - ValidationEngine / ExperimentManager 連携の入口
 *
 * GAS V8 compatible.
 * ==========================================================
 */

class KnowledgeLearningEngine {

  constructor(params) {
    params = params || {};

    this.version = "2.0.0";

    this.profileStore =
      params.profileStore || {};

    this.observationStore =
      params.observationStore || new ObservationStore();

    this.validationEngine =
      params.validationEngine || null;

    this.experimentManager =
      params.experimentManager || null;

    this.aiJournal =
      params.aiJournal || new AIJournal();

    this.knowledgeHistory =
      params.knowledgeHistory || new KnowledgeHistory();

    this.versionManager =
      params.versionManager || new VersionManager();

    this.records = [];

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 単一レース結果を学習する
   *
   * @param {Object} rawResult
   * @returns {Object}
   */
  learnRace(rawResult) {
    rawResult = rawResult || {};

    const observations =
      this.buildObservations(rawResult);

    return this.learnObservations(observations, {
      mode: "ONLINE",
      source: "RACE_RESULT",
      raceId: rawResult.raceId || ""
    });
  }

  /**
   * 複数Observationを学習
   *
   * @param {Array<Object>} observations
   * @param {Object} options
   * @returns {Object}
   */
  learnObservations(observations, options) {
    observations = observations || [];
    options = options || {};

    const result = {
      engine: "LearningEngine",
      version: this.version,
      mode: options.mode || "ONLINE",
      source: options.source || "",
      raceId: options.raceId || "",
      total: observations.length,
      learned: 0,
      skipped: 0,
      profileUpdates: [],
      weightUpdates: [],
      validation: null,
      errors: [],
      startedAt: new Date(),
      finishedAt: null
    };

    observations.forEach(function(observation) {
      try {
        const itemResult =
          this.learnOneObservation(
            observation,
            options
          );

        result.profileUpdates =
          result.profileUpdates.concat(
            itemResult.profileUpdates || []
          );

        result.weightUpdates =
          result.weightUpdates.concat(
            itemResult.weightUpdates || []
          );

        result.learned += 1;

      } catch (e) {
        result.skipped += 1;
        result.errors.push({
          message: e && e.message ? e.message : String(e),
          observation: observation
        });
      }
    }, this);

    if (this.validationEngine) {
      result.validation =
        this.validationEngine.run({
          learningResult: result,
          observations: observations
        });
    }

    if (this.experimentManager) {
      this.experimentManager.addExperiment({
        type: "LEARNING_BATCH",
        title: "Learning batch",
        candidate: result,
        evidence: {
          total: result.total,
          learned: result.learned,
          skipped: result.skipped
        }
      });
    }

    result.finishedAt = new Date();

    this.records.push(result);

    this.aiJournal.add({
      type: "LEARNING",
      category: "LEARNING_ENGINE",
      title: "Learning batch completed",
      message: "LearningEngine processed observations.",
      evidence: {
        mode: result.mode,
        source: result.source,
        raceId: result.raceId,
        total: result.total,
        learned: result.learned,
        skipped: result.skipped
      },
      result: result.errors.length ? "PARTIAL" : "OK"
    });

    this.touch();

    return result;
  }

  /**
   * 1件のObservation学習
   */
  learnOneObservation(observation, options) {
    observation = observation || {};
    options = options || {};

    const observationId =
      this.observationStore.add(observation);

    const profileUpdates = [];
    const weightUpdates = [];

    const profileTargets =
      this.resolveProfileTargets(observation);

    profileTargets.forEach(function(target) {
      const profile =
        this.getOrCreateProfile(
          target.type,
          target.id,
          observation
        );

      if (!profile) {
        return;
      }

      if (profile.createSnapshot) {
        profile.createSnapshot(
          "before-learning",
          "LearningEngine before update"
        );
      }

      profile.learn(observation);

      profileUpdates.push({
        profileType: target.type,
        profileId: target.id,
        observationId: observationId,
        sample: profile.sample || 0,
        confidence: profile.confidence || 0
      });

      const updates =
        this.updateWeightsFromProfile(
          profile,
          target.type,
          observation
        );

      weightUpdates.push.apply(
        weightUpdates,
        updates
      );

    }, this);

    return {
      observationId: observationId,
      profileUpdates: profileUpdates,
      weightUpdates: weightUpdates
    };
  }

  /**
   * rawResultからObservation配列作成
   */
  buildObservations(rawResult) {
    if (rawResult.observations) {
      return rawResult.observations;
    }

    const rows =
      rawResult.results ||
      rawResult.runners ||
      rawResult.rows ||
      [];

    return ObservationBuilder.buildMany(
      rows.map(function(row) {
        return Object.assign(
          {},
          rawResult.race || {},
          row,
          {
            raceId:
              rawResult.raceId ||
              (rawResult.race && rawResult.race.id) ||
              row.raceId ||
              ""
          }
        );
      })
    );
  }

  /**
   * 学習対象Profileを決定
   */
  resolveProfileTargets(observation) {
    const targets = [];

    if (observation.horseId) {
      targets.push({
        type: "HORSE",
        id: observation.horseId
      });
    }

    if (observation.jockeyId) {
      targets.push({
        type: "JOCKEY",
        id: observation.jockeyId
      });
    }

    if (observation.trainerId) {
      targets.push({
        type: "TRAINER",
        id: observation.trainerId
      });
    }

    if (observation.fatherId) {
      targets.push({
        type: "BLOODLINE",
        id: observation.fatherId
      });
    }

    if (observation.crossKey) {
      targets.push({
        type: "CROSS",
        id: observation.crossKey
      });
    }

    return targets;
  }

  /**
   * Profile取得または作成
   */
  getOrCreateProfile(type, id, observation) {
    if (!type || !id) {
      return null;
    }

    if (!this.profileStore[type]) {
      this.profileStore[type] = {};
    }

    if (this.profileStore[type][id]) {
      return this.profileStore[type][id];
    }

    let profile = null;

    if (type === "HORSE") {
      profile = new HorseProfile(id);
    } else if (type === "JOCKEY") {
      profile = new JockeyProfile(id);
    } else if (type === "TRAINER") {
      profile = new TrainerProfile(id);
    } else if (type === "BLOODLINE") {
      profile = new BloodlineProfile(id);
    } else if (type === "CROSS") {
      profile = new CrossProfile(id);
    } else {
      profile = new KnowledgeProfile(id, type);
    }

    this.applyIdentity(profile, type, observation);

    this.profileStore[type][id] = profile;

    return profile;
  }

  /**
   * Profile基本情報をObservationから反映
   */
  applyIdentity(profile, type, observation) {
    if (!profile || !observation) {
      return profile;
    }

    if (type === "HORSE") {
      profile.name = observation.horseName || profile.name || "";
      profile.sex = observation.sex || profile.sex || "";
      profile.birthYear = observation.birthYear || profile.birthYear || 0;
      profile.fatherId = observation.fatherId || profile.fatherId || "";
      profile.motherFatherId = observation.motherFatherId || profile.motherFatherId || "";
      profile.crossKey = observation.crossKey || profile.crossKey || "";
      profile.trainerId = observation.trainerId || profile.trainerId || "";
    }

    if (type === "JOCKEY") {
      profile.name = observation.jockeyName || profile.name || "";
    }

    if (type === "TRAINER") {
      profile.name = observation.trainerName || profile.name || "";
    }

    if (type === "BLOODLINE") {
      profile.name = observation.fatherName || profile.name || "";
      if (profile.setIdentity) {
        profile.setIdentity({
          bloodlineId: observation.fatherId || profile.id,
          name: observation.fatherName || "",
          sireLine: observation.sireLine || "",
          damLine: observation.damLine || ""
        });
      }
    }

    if (type === "CROSS") {
      profile.name = observation.crossKey || profile.name || "";
      if (profile.setIdentity) {
        profile.setIdentity({
          crossKey: observation.crossKey || profile.id,
          fatherId: observation.fatherId || "",
          motherFatherId: observation.motherFatherId || "",
          sireLine: observation.sireLine || "",
          damLine: observation.damLine || ""
        });
      }
    }

    return profile;
  }

  /**
   * ProfileのKnowledgeCellから重み更新候補を作る
   */
  updateWeightsFromProfile(profile, profileType, observation) {
    const updates = [];

    if (!profile || !profile.weights) {
      return updates;
    }

    const schema =
      KnowledgeSchema.getProfileSchema(profileType);

    Object.keys(schema || {}).forEach(function(fieldKey) {
      const def = schema[fieldKey];
      const policy =
        LearningPolicy.get(profileType, fieldKey);

      const map =
        this.resolveKnowledgeMap(profile, def.category);

      if (!map) {
        return;
      }

      const value =
        observation[def.key];

      const cell =
        this.getCellFromMap(map, value, def);

      if (!cell) {
        return;
      }

      if (!LearningPolicy.canLearn(cell.sample, policy)) {
        return;
      }

      const currentWeight =
        this.resolveCurrentWeight(
          profile,
          fieldKey,
          policy
        );

      const proposedWeight =
        this.calculateProposedWeight(
          currentWeight,
          cell,
          policy
        );

      const nextWeight =
        profile.updateWeight
          ? profile.updateWeight(
              fieldKey,
              proposedWeight,
              "KnowledgeCell performance update",
              {
                cell: cell.toJSON ? cell.toJSON() : cell,
                observationId: observation.id || ""
              }
            )
          : profile.weights.set(fieldKey, proposedWeight);

      updates.push({
        profileType: profileType,
        profileId: profile.id,
        fieldKey: fieldKey,
        before: currentWeight,
        after: nextWeight,
        sample: cell.sample,
        confidence: cell.confidence
      });

    }, this);

    return updates;
  }

  /**
   * categoryからProfile内Mapを取得
   */
  resolveKnowledgeMap(profile, category) {
    if (!profile || !category) {
      return null;
    }

    if (profile.getKnowledgeMap) {
      return profile.getKnowledgeMap(category);
    }

    return null;
  }

  /**
   * Mapから該当Cell取得
   */
  getCellFromMap(map, value, def) {
    if (!map) {
      return null;
    }

    if (value === null || value === undefined || value === "") {
      return null;
    }

    let key = value;

    if (def && def.valueType === "number" && def.bucketSize) {
      const n = Number(value);
      if (!isNaN(n)) {
        key = String(Math.round(n / def.bucketSize) * def.bucketSize);
      }
    } else {
      key = String(value);
    }

    let cell = map[key];

    if (!cell) {
      return null;
    }

    if (!(cell instanceof KnowledgeCell)) {
      cell = KnowledgeCell.fromJSON(cell);
      map[key] = cell;
    }

    return cell;
  }

  /**
   * 現在Weight取得
   */
  resolveCurrentWeight(profile, fieldKey, policy) {
    if (!profile.weights) {
      return policy.initialWeight;
    }

    const current =
      profile.weights.get(fieldKey);

    return current
      ? Number(current.weight || policy.initialWeight)
      : Number(policy.initialWeight || 1.0);
  }

  /**
   * Weight更新案
   */
  calculateProposedWeight(currentWeight, cell, policy) {
    const roi =
      Number(cell.averageROI || 0);

    const score =
      Number(cell.score || 50);

    const confidence =
      Number(cell.confidence || 0) / 100;

    let signal = 0;

    if (roi > 1.0) {
      signal += Utils.clamp((roi - 1.0) * 0.25, 0, 0.20);
    } else if (roi > 0 && roi < 0.85) {
      signal -= Utils.clamp((0.85 - roi) * 0.20, 0, 0.15);
    }

    signal += Utils.clamp((score - 50) / 500, -0.10, 0.10);

    signal *= confidence;

    const rawNext =
      currentWeight +
      signal * Number(policy.learningRate || 0.05);

    const limited =
      LearningPolicy.limitWeightChange(
        currentWeight,
        rawNext,
        policy
      );

    return LearningPolicy.clampWeight(
      limited,
      policy
    );
  }

  /**
   * 過去データ一括学習
   *
   * IMPORTANT:
   * 未来データリークを避けるため、日付順に処理する。
   */
  learnHistorical(rows, options) {
    rows = rows || [];
    options = options || {};

    const sorted =
      rows.slice().sort(function(a, b) {
        return new Date(a.date || 0) - new Date(b.date || 0);
      });

    const observations =
      ObservationBuilder.buildMany(sorted);

    return this.learnObservations(observations, {
      mode: "HISTORICAL",
      source: options.source || "HISTORICAL_IMPORT",
      raceId: ""
    });
  }

  /**
   * ProfileStore JSON化
   */
  exportProfileStore() {
    const out = {};

    Object.keys(this.profileStore || {}).forEach(function(type) {
      out[type] = {};

      Object.keys(this.profileStore[type] || {}).forEach(function(id) {
        const profile = this.profileStore[type][id];

        out[type][id] =
          profile && typeof profile.toJSON === "function"
            ? profile.toJSON()
            : profile;
      }, this);
    }, this);

    return out;
  }

  /**
   * ProfileStore読込
   */
  loadProfileStore(json) {
    json = json || {};
    this.profileStore = {};

    Object.keys(json).forEach(function(type) {
      this.profileStore[type] = {};

      Object.keys(json[type] || {}).forEach(function(id) {
        const data = json[type][id];
        let profile = null;

        if (type === "HORSE") {
          profile = HorseProfile.fromJSON(data);
        } else if (type === "JOCKEY") {
          profile = JockeyProfile.fromJSON(data);
        } else if (type === "TRAINER") {
          profile = TrainerProfile.fromJSON(data);
        } else if (type === "BLOODLINE") {
          profile = BloodlineProfile.fromJSON(data);
        } else if (type === "CROSS") {
          profile = CrossProfile.fromJSON(data);
        } else {
          profile = new KnowledgeProfile(id, type).load(data);
        }

        this.profileStore[type][id] = profile;
      }, this);
    }, this);

    return this;
  }

  /**
   * 統計
   */
  getSummary() {
    const counts = {};

    Object.keys(this.profileStore || {}).forEach(function(type) {
      counts[type] =
        Object.keys(this.profileStore[type] || {}).length;
    }, this);

    return {
      version: this.version,
      records: this.records.length,
      profiles: counts,
      observations:
        this.observationStore && this.observationStore.count
          ? this.observationStore.count
          : 0,
      updatedAt: this.updatedAt
    };
  }

  /**
   * 更新日時
   */
  touch() {
    this.updatedAt = new Date();
    return this;
  }

  /**
   * JSON
   */
  toJSON() {
    return {
      version: this.version,
      profileStore: this.exportProfileStore(),
      observationStore:
        this.observationStore && this.observationStore.toJSON
          ? this.observationStore.toJSON()
          : {},
      records: this.records,
      aiJournal:
        this.aiJournal && this.aiJournal.toJSON
          ? this.aiJournal.toJSON()
          : {},
      knowledgeHistory:
        this.knowledgeHistory && this.knowledgeHistory.toJSON
          ? this.knowledgeHistory.toJSON()
          : {},
      versionManager:
        this.versionManager && this.versionManager.toJSON
          ? this.versionManager.toJSON()
          : {},
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * JSON読込
   */
  load(json) {
    if (!json) {
      return this;
    }

    this.version = json.version || this.version;
    this.records = json.records || [];

    this.observationStore =
      ObservationStore.fromJSON(json.observationStore || {});

    this.aiJournal =
      AIJournal.fromJSON(json.aiJournal || {});

    this.knowledgeHistory =
      KnowledgeHistory.fromJSON(json.knowledgeHistory || {});

    this.versionManager =
      VersionManager.fromJSON(json.versionManager || {});

    this.loadProfileStore(json.profileStore || {});

    this.createdAt = json.createdAt || new Date();
    this.updatedAt = json.updatedAt || new Date();

    return this;
  }

  /**
   * Factory
   */
  static fromJSON(json) {
    return new LearningEngine().load(json || {});
  }

}
