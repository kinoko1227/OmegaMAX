/**
 * ==========================================================
 * ΩMAX AIOS
 * ExperimentManager.js
 * ----------------------------------------------------------
 * Production Experiment Manager v1.0.0
 *
 * Stable / Candidate / Experimental を管理し、
 * 学習結果をいきなり本番反映せず、検証・比較・昇格・却下・
 * ロールバックまで管理する実運用版。
 *
 * GAS V8 compatible.
 * ==========================================================
 */

class ExperimentManager {

  constructor(params) {
    params = params || {};

    this.version = "1.0.0";

    this.keyPrefix =
      params.keyPrefix ||
      "OMEGAMAX_EXPERIMENT_MANAGER";

    this.lockWaitMs =
      Number(params.lockWaitMs || 30000);

    this.experiments = {};
    this.releases = [];
    this.history = [];

    this.stable = {
      id: "",
      modelType: "",
      modelVersion: "",
      data: {},
      metrics: {},
      promotedAt: null,
      sourceExperimentId: ""
    };

    this.createdAt = new Date();
    this.updatedAt = new Date();

    if (params.autoLoad !== false) {
      this.loadFromStorage();
    }
  }

  /**
   * ======================================================
   * Constants
   * ======================================================
   */

  static get STATUS() {
    return {
      DRAFT: "DRAFT",
      RUNNING: "RUNNING",
      PAUSED: "PAUSED",
      CANDIDATE: "CANDIDATE",
      VALIDATING: "VALIDATING",
      APPROVED: "APPROVED",
      REJECTED: "REJECTED",
      PROMOTED: "PROMOTED",
      ROLLED_BACK: "ROLLED_BACK",
      ARCHIVED: "ARCHIVED"
    };
  }

  static get TYPES() {
    return {
      LEARNING: "LEARNING",
      WEIGHT: "WEIGHT",
      PROFILE: "PROFILE",
      RULE: "RULE",
      MODEL: "MODEL",
      STRATEGY: "STRATEGY",
      TICKET: "TICKET",
      CAPITAL: "CAPITAL"
    };
  }

  /**
   * ======================================================
   * Public API
   * ======================================================
   */

  /**
   * Experiment作成
   */
  createExperiment(params) {
    params = params || {};

    return this.withLock(function() {
      const id =
        params.id ||
        this.createId("EXP");

      if (this.experiments[id]) {
        throw new Error("Experiment already exists: " + id);
      }

      const now = new Date();

      const experiment = {
        id: id,
        name: params.name || id,
        type: params.type || ExperimentManager.TYPES.MODEL,
        status: ExperimentManager.STATUS.DRAFT,

        description: params.description || "",
        owner: params.owner || "OmegaMAX",

        baseline: this.safeClone(params.baseline || {}),
        candidate: this.safeClone(params.candidate || {}),
        experimental: this.safeClone(params.experimental || {}),

        baselineMetrics: this.normalizeMetrics(params.baselineMetrics || {}),
        candidateMetrics: this.normalizeMetrics(params.candidateMetrics || {}),
        experimentalMetrics: this.normalizeMetrics(params.experimentalMetrics || {}),

        validation: null,
        decision: null,

        policy: this.safeClone(params.policy || {}),
        evidence: this.safeClone(params.evidence || {}),

        tags: params.tags || [],

        startedAt: null,
        finishedAt: null,
        createdAt: now,
        updatedAt: now,

        snapshots: [],
        events: []
      };

      this.experiments[id] = experiment;

      this.addEvent(id, "CREATE", {
        message: "Experiment created.",
        params: this.safeClone(params)
      });

      this.addHistory("CREATE_EXPERIMENT", {
        experimentId: id,
        type: experiment.type,
        name: experiment.name
      });

      this.saveToStorage();

      return this.safeClone(experiment);
    });
  }

  /**
   * Experiment取得
   */
  getExperiment(id) {
    return this.safeClone(this.experiments[id] || null);
  }

  /**
   * Experiment一覧
   */
  listExperiments(filter) {
    filter = filter || {};

    const list =
      Object.keys(this.experiments || {}).map(function(id) {
        return this.experiments[id];
      }, this);

    return list
      .filter(function(exp) {
        if (filter.status && exp.status !== filter.status) return false;
        if (filter.type && exp.type !== filter.type) return false;
        if (filter.tag && (exp.tags || []).indexOf(filter.tag) < 0) return false;
        return true;
      })
      .sort(function(a, b) {
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      })
      .map(function(exp) {
        return this.safeClone(exp);
      }, this);
  }

  /**
   * Experiment更新
   */
  updateExperiment(id, patch) {
    patch = patch || {};

    return this.withLock(function() {
      const exp = this.requireExperiment(id);

      const allowed = [
        "name",
        "description",
        "baseline",
        "candidate",
        "experimental",
        "baselineMetrics",
        "candidateMetrics",
        "experimentalMetrics",
        "policy",
        "evidence",
        "tags"
      ];

      allowed.forEach(function(key) {
        if (patch[key] !== undefined) {
          if (
            key === "baselineMetrics" ||
            key === "candidateMetrics" ||
            key === "experimentalMetrics"
          ) {
            exp[key] = this.normalizeMetrics(patch[key]);
          } else {
            exp[key] = this.safeClone(patch[key]);
          }
        }
      }, this);

      exp.updatedAt = new Date();

      this.addEvent(id, "UPDATE", {
        patchKeys: Object.keys(patch || {})
      });

      this.addHistory("UPDATE_EXPERIMENT", {
        experimentId: id,
        patchKeys: Object.keys(patch || {})
      });

      this.saveToStorage();

      return this.safeClone(exp);
    });
  }

  /**
   * 実験開始
   */
  startExperiment(id) {
    return this.withLock(function() {
      const exp = this.requireExperiment(id);

      if (
        exp.status !== ExperimentManager.STATUS.DRAFT &&
        exp.status !== ExperimentManager.STATUS.PAUSED &&
        exp.status !== ExperimentManager.STATUS.CANDIDATE
      ) {
        throw new Error("Cannot start experiment from status: " + exp.status);
      }

      exp.status = ExperimentManager.STATUS.RUNNING;
      exp.startedAt = exp.startedAt || new Date();
      exp.updatedAt = new Date();

      this.addSnapshot(id, "START", exp.candidate, "Before running experiment.");

      this.addEvent(id, "START", {
        message: "Experiment started."
      });

      this.addHistory("START_EXPERIMENT", {
        experimentId: id
      });

      this.saveToStorage();

      return this.safeClone(exp);
    });
  }

  /**
   * 一時停止
   */
  pauseExperiment(id, reason) {
    return this.withLock(function() {
      const exp = this.requireExperiment(id);

      exp.status = ExperimentManager.STATUS.PAUSED;
      exp.updatedAt = new Date();

      this.addEvent(id, "PAUSE", {
        reason: reason || ""
      });

      this.addHistory("PAUSE_EXPERIMENT", {
        experimentId: id,
        reason: reason || ""
      });

      this.saveToStorage();

      return this.safeClone(exp);
    });
  }

  /**
   * Candidate化
   */
  markCandidate(id, reason) {
    return this.withLock(function() {
      const exp = this.requireExperiment(id);

      exp.status = ExperimentManager.STATUS.CANDIDATE;
      exp.updatedAt = new Date();

      this.addSnapshot(id, "CANDIDATE", exp.candidate, reason || "Marked candidate.");

      this.addEvent(id, "MARK_CANDIDATE", {
        reason: reason || ""
      });

      this.addHistory("MARK_CANDIDATE", {
        experimentId: id,
        reason: reason || ""
      });

      this.saveToStorage();

      return this.safeClone(exp);
    });
  }

  /**
   * 検証実行
   */
  validateExperiment(id, validationEngine) {
    return this.withLock(function() {
      const exp = this.requireExperiment(id);

      exp.status = ExperimentManager.STATUS.VALIDATING;
      exp.updatedAt = new Date();

      const engine =
        validationEngine ||
        (typeof ValidationEngine !== "undefined"
          ? new ValidationEngine()
          : null);

      if (!engine || typeof engine.run !== "function") {
        throw new Error("ValidationEngine is required.");
      }

      const validation =
        engine.run({
          baseline: exp.baselineMetrics,
          candidate: exp.candidateMetrics,
          policy: exp.policy,
          context: {
            experimentId: id,
            type: exp.type,
            evidence: exp.evidence
          }
        });

      exp.validation = validation;
      exp.decision = validation.decision || null;

      if (
        validation.decision &&
        validation.decision.approved
      ) {
        exp.status = ExperimentManager.STATUS.APPROVED;
      } else {
        exp.status = ExperimentManager.STATUS.REJECTED;
      }

      exp.finishedAt = new Date();
      exp.updatedAt = new Date();

      this.addEvent(id, "VALIDATE", {
        validationScore: validation.validationScore,
        decision: validation.decision
      });

      this.addHistory("VALIDATE_EXPERIMENT", {
        experimentId: id,
        validationScore: validation.validationScore,
        approved:
          validation.decision &&
          validation.decision.approved
      });

      this.saveToStorage();

      return this.safeClone(exp);
    });
  }

  /**
   * Stableへ昇格
   */
  promoteToStable(id, reason) {
    return this.withLock(function() {
      const exp = this.requireExperiment(id);

      if (exp.status !== ExperimentManager.STATUS.APPROVED) {
        throw new Error("Only APPROVED experiment can be promoted.");
      }

      const previousStable =
        this.safeClone(this.stable || {});

      if (previousStable && previousStable.id) {
        this.releases.push({
          action: "ARCHIVE_STABLE",
          stable: previousStable,
          createdAt: new Date()
        });
      }

      this.stable = {
        id: this.createId("STABLE"),
        modelType: exp.type,
        modelVersion: exp.candidate.version || exp.candidate.modelVersion || "",
        data: this.safeClone(exp.candidate),
        metrics: this.safeClone(exp.candidateMetrics),
        promotedAt: new Date(),
        sourceExperimentId: id,
        reason: reason || ""
      };

      exp.status = ExperimentManager.STATUS.PROMOTED;
      exp.updatedAt = new Date();

      this.releases.push({
        action: "PROMOTE",
        experimentId: id,
        stableId: this.stable.id,
        previousStable: previousStable,
        newStable: this.safeClone(this.stable),
        reason: reason || "",
        createdAt: new Date()
      });

      this.addEvent(id, "PROMOTE", {
        stableId: this.stable.id,
        reason: reason || ""
      });

      this.addHistory("PROMOTE_EXPERIMENT", {
        experimentId: id,
        stableId: this.stable.id,
        reason: reason || ""
      });

      this.saveToStorage();

      return this.safeClone(this.stable);
    });
  }

  /**
   * Reject
   */
  rejectExperiment(id, reason) {
    return this.withLock(function() {
      const exp = this.requireExperiment(id);

      exp.status = ExperimentManager.STATUS.REJECTED;
      exp.finishedAt = new Date();
      exp.updatedAt = new Date();

      this.addEvent(id, "REJECT", {
        reason: reason || ""
      });

      this.addHistory("REJECT_EXPERIMENT", {
        experimentId: id,
        reason: reason || ""
      });

      this.saveToStorage();

      return this.safeClone(exp);
    });
  }

  /**
   * Rollback
   */
  rollbackStable(releaseIndex, reason) {
    return this.withLock(function() {
      if (!this.releases.length) {
        throw new Error("No releases to rollback.");
      }

      let index =
        releaseIndex !== undefined && releaseIndex !== null
          ? Number(releaseIndex)
          : this.releases.length - 1;

      if (index < 0 || index >= this.releases.length) {
        throw new Error("Invalid release index: " + index);
      }

      const release = this.releases[index];

      if (!release.previousStable || !release.previousStable.id) {
        throw new Error("Selected release has no previous stable.");
      }

      const current =
        this.safeClone(this.stable);

      this.stable =
        this.safeClone(release.previousStable);

      this.releases.push({
        action: "ROLLBACK",
        rollbackFrom: current,
        rollbackTo: this.safeClone(this.stable),
        reason: reason || "",
        createdAt: new Date()
      });

      this.addHistory("ROLLBACK_STABLE", {
        fromStableId: current ? current.id : "",
        toStableId: this.stable ? this.stable.id : "",
        reason: reason || ""
      });

      this.saveToStorage();

      return this.safeClone(this.stable);
    });
  }

  /**
   * Archive
   */
  archiveExperiment(id, reason) {
    return this.withLock(function() {
      const exp = this.requireExperiment(id);

      exp.status = ExperimentManager.STATUS.ARCHIVED;
      exp.updatedAt = new Date();

      this.addEvent(id, "ARCHIVE", {
        reason: reason || ""
      });

      this.addHistory("ARCHIVE_EXPERIMENT", {
        experimentId: id,
        reason: reason || ""
      });

      this.saveToStorage();

      return this.safeClone(exp);
    });
  }

  /**
   * 削除
   */
  deleteExperiment(id) {
    return this.withLock(function() {
      const exp = this.requireExperiment(id);

      delete this.experiments[id];

      this.addHistory("DELETE_EXPERIMENT", {
        experimentId: id,
        deleted: this.safeClone(exp)
      });

      this.saveToStorage();

      return true;
    });
  }

  /**
   * A/B比較
   */
  compareAB(baselineMetrics, candidateMetrics) {
    const baseline =
      this.normalizeMetrics(baselineMetrics || {});

    const candidate =
      this.normalizeMetrics(candidateMetrics || {});

    return {
      baseline: baseline,
      candidate: candidate,

      roiDiff: candidate.roi - baseline.roi,
      hitRateDiff: candidate.hitRate - baseline.hitRate,
      evDiff: candidate.averageEV - baseline.averageEV,
      profitDiff: candidate.profit - baseline.profit,
      drawdownDiff: candidate.maxDrawdown - baseline.maxDrawdown,
      sharpeDiff: candidate.sharpe - baseline.sharpe,
      recoveryFactorDiff:
        candidate.recoveryFactor - baseline.recoveryFactor,

      improved:
        candidate.roi > baseline.roi &&
        candidate.averageEV >= baseline.averageEV &&
        candidate.maxDrawdown <= baseline.maxDrawdown + 0.03
    };
  }

  /**
   * Stable取得
   */
  getStable() {
    return this.safeClone(this.stable);
  }

  /**
   * Stable手動設定
   */
  setStable(model, metrics, reason) {
    return this.withLock(function() {
      const previous =
        this.safeClone(this.stable || {});

      this.stable = {
        id: this.createId("STABLE"),
        modelType: model && model.type ? model.type : "",
        modelVersion: model && model.version ? model.version : "",
        data: this.safeClone(model || {}),
        metrics: this.normalizeMetrics(metrics || {}),
        promotedAt: new Date(),
        sourceExperimentId: "",
        reason: reason || "Manual stable set"
      };

      this.releases.push({
        action: "SET_STABLE",
        previousStable: previous,
        newStable: this.safeClone(this.stable),
        reason: reason || "",
        createdAt: new Date()
      });

      this.addHistory("SET_STABLE", {
        stableId: this.stable.id,
        reason: reason || ""
      });

      this.saveToStorage();

      return this.safeClone(this.stable);
    });
  }

  /**
   * ======================================================
   * Events / Snapshot / History
   * ======================================================
   */

  addSnapshot(experimentId, label, data, reason) {
    const exp = this.requireExperiment(experimentId);

    const snapshot = {
      id: this.createId("SNAP"),
      label: label || "",
      data: this.safeClone(data || {}),
      reason: reason || "",
      createdAt: new Date()
    };

    exp.snapshots.push(snapshot);
    exp.updatedAt = new Date();

    return snapshot;
  }

  addEvent(experimentId, action, payload) {
    const exp = this.requireExperiment(experimentId);

    const event = {
      id: this.createId("EVT"),
      action: action || "",
      payload: this.safeClone(payload || {}),
      createdAt: new Date()
    };

    exp.events.push(event);
    exp.updatedAt = new Date();

    return event;
  }

  addHistory(action, payload) {
    const record = {
      id: this.createId("HIS"),
      action: action || "",
      payload: this.safeClone(payload || {}),
      createdAt: new Date()
    };

    this.history.push(record);
    this.touch();

    this.writeJournal(action, payload);

    return record;
  }

  writeJournal(action, payload) {
    try {
      if (typeof AIJournal === "undefined") {
        return;
      }

      const journal = new AIJournal();

      if (typeof journal.loadFromStorage === "function") {
        journal.loadFromStorage();
      }

      if (typeof journal.add === "function") {
        journal.add({
          type: "EXPERIMENT",
          category: "EXPERIMENT_MANAGER",
          title: action,
          message: "ExperimentManager action: " + action,
          evidence: payload || {},
          result: "RECORDED"
        });
      }

      if (typeof journal.saveToStorage === "function") {
        journal.saveToStorage();
      }
    } catch (e) {
      // Journal失敗で本処理を止めない
    }
  }

  /**
   * ======================================================
   * Metrics
   * ======================================================
   */

  normalizeMetrics(data) {
    data = data || {};

    const investment =
      Number(data.investment || data.totalBet || 0);

    const payout =
      Number(data.payout || data.totalReturn || 0);

    const profit =
      data.profit !== undefined
        ? Number(data.profit)
        : payout - investment;

    const roi =
      data.roi !== undefined
        ? Number(data.roi)
        : investment > 0
          ? payout / investment
          : 0;

    return {
      bets: Number(data.bets || data.count || 0),
      wins: Number(data.wins || 0),
      losses: Number(data.losses || 0),
      investment: investment,
      payout: payout,
      profit: profit,
      roi: roi,
      hitRate: Number(data.hitRate || 0),
      averageEV: Number(data.averageEV || data.ev || 0),
      maxDrawdown: Number(data.maxDrawdown || 0),
      volatility: Number(data.volatility || 0),
      sharpe: Number(data.sharpe || 0),
      recoveryFactor: Number(data.recoveryFactor || 0),
      confidence: Number(data.confidence || 0),
      sample: Number(data.sample || data.bets || 0)
    };
  }

  /**
   * ======================================================
   * Storage
   * ======================================================
   */

  storageKey() {
    return this.keyPrefix + "_STATE";
  }

  saveToStorage() {
    const json =
      JSON.stringify(this.toJSON());

    const props =
      PropertiesService.getScriptProperties();

    const key =
      this.storageKey();

    const chunkSize = 8000;
    const chunks = [];

    for (let i = 0; i < json.length; i += chunkSize) {
      chunks.push(json.substring(i, i + chunkSize));
    }

    const oldCount =
      Number(props.getProperty(key + "_COUNT") || 0);

    for (let j = 0; j < oldCount; j++) {
      props.deleteProperty(key + "_" + j);
    }

    chunks.forEach(function(chunk, index) {
      props.setProperty(key + "_" + index, chunk);
    });

    props.setProperty(key + "_COUNT", String(chunks.length));
    props.setProperty(key + "_UPDATED_AT", String(new Date().toISOString()));

    return true;
  }

  loadFromStorage() {
    try {
      const props =
        PropertiesService.getScriptProperties();

      const key =
        this.storageKey();

      const count =
        Number(props.getProperty(key + "_COUNT") || 0);

      if (!count) {
        return false;
      }

      let json = "";

      for (let i = 0; i < count; i++) {
        json += props.getProperty(key + "_" + i) || "";
      }

      if (!json) {
        return false;
      }

      this.load(JSON.parse(json));

      return true;
    } catch (e) {
      return false;
    }
  }

  clearStorage() {
    return this.withLock(function() {
      const props =
        PropertiesService.getScriptProperties();

      const key =
        this.storageKey();

      const count =
        Number(props.getProperty(key + "_COUNT") || 0);

      for (let i = 0; i < count; i++) {
        props.deleteProperty(key + "_" + i);
      }

      props.deleteProperty(key + "_COUNT");
      props.deleteProperty(key + "_UPDATED_AT");

      return true;
    });
  }

  /**
   * ======================================================
   * Lock
   * ======================================================
   */

  withLock(callback) {
    const lock =
      LockService.getScriptLock();

    lock.waitLock(this.lockWaitMs);

    try {
      return callback.call(this);
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * ======================================================
   * Helpers
   * ======================================================
   */

  requireExperiment(id) {
    if (!id || !this.experiments[id]) {
      throw new Error("Experiment not found: " + id);
    }

    return this.experiments[id];
  }

  createId(prefix) {
    prefix = prefix || "ID";

    let uuid = "";

    try {
      uuid = Utilities.getUuid();
    } catch (e) {
      uuid = String(new Date().getTime()) + "_" + Math.floor(Math.random() * 1000000);
    }

    return prefix + "_" + uuid;
  }

  safeClone(obj) {
    if (obj === null || obj === undefined) {
      return obj;
    }

    return JSON.parse(JSON.stringify(obj));
  }

  touch() {
    this.updatedAt = new Date();
    return this;
  }

  /**
   * ======================================================
   * JSON
   * ======================================================
   */

  toJSON() {
    return {
      version: this.version,
      keyPrefix: this.keyPrefix,
      experiments: this.experiments,
      releases: this.releases,
      history: this.history,
      stable: this.stable,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  load(json) {
    if (!json) {
      return this;
    }

    this.version = json.version || this.version;
    this.keyPrefix = json.keyPrefix || this.keyPrefix;
    this.experiments = json.experiments || {};
    this.releases = json.releases || [];
    this.history = json.history || [];
    this.stable = json.stable || this.stable;
    this.createdAt = json.createdAt || new Date();
    this.updatedAt = json.updatedAt || new Date();

    return this;
  }

  static fromJSON(json) {
    return new ExperimentManager({
      autoLoad: false
    }).load(json || {});
  }

}

/**
 * ==========================================================
 * GAS Helper Functions
 * ==========================================================
 */

function testExperimentManagerProduction() {
  const manager = new ExperimentManager({
    autoLoad: false
  });

  const exp = manager.createExperiment({
    name: "Test Experiment",
    type: ExperimentManager.TYPES.MODEL,
    baseline: {
      version: "stable"
    },
    candidate: {
      version: "candidate"
    },
    baselineMetrics: {
      bets: 300,
      investment: 30000,
      payout: 31500,
      hitRate: 0.22,
      averageEV: 1.05,
      maxDrawdown: 0.12,
      sharpe: 0.8
    },
    candidateMetrics: {
      bets: 300,
      investment: 30000,
      payout: 34500,
      hitRate: 0.24,
      averageEV: 1.12,
      maxDrawdown: 0.11,
      sharpe: 0.95
    },
    policy: LearningPolicy.DEFAULT
  });

  manager.startExperiment(exp.id);

  const validated =
    manager.validateExperiment(
      exp.id,
      new ValidationEngine()
    );

  if (validated.status === ExperimentManager.STATUS.APPROVED) {
    manager.promoteToStable(exp.id, "Test promotion");
  }

  Logger.log(JSON.stringify(manager.toJSON(), null, 2));

  return manager.toJSON();
}
