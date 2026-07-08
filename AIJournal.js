/**
 * ==========================================================
 * ΩMAX AIOS
 * AIJournal.js
 * ----------------------------------------------------------
 * Production AI Journal v1.0.0
 *
 * AIの学習・検証・実験・昇格・却下・ロールバック理由を
 * 監査可能な形で永続保存する。
 *
 * GAS V8 compatible.
 * ==========================================================
 */

class AIJournal {

  constructor(params) {
    params = params || {};

    this.version = "1.0.0";
    this.keyPrefix = params.keyPrefix || "OMEGAMAX_AI_JOURNAL";
    this.lockWaitMs = Number(params.lockWaitMs || 30000);

    this.entries = [];
    this.index = {
      byType: {},
      byCategory: {},
      byTarget: {},
      byResult: {}
    };

    this.createdAt = new Date();
    this.updatedAt = new Date();

    if (params.autoLoad !== false) {
      this.loadFromStorage();
    }
  }

  static get TYPE() {
    return {
      INFO: "INFO",
      LEARNING: "LEARNING",
      VALIDATION: "VALIDATION",
      EXPERIMENT: "EXPERIMENT",
      VERSION: "VERSION",
      WEIGHT: "WEIGHT",
      ROLLBACK: "ROLLBACK",
      ERROR: "ERROR",
      WARNING: "WARNING",
      SYSTEM: "SYSTEM"
    };
  }

  static get RESULT() {
    return {
      OK: "OK",
      APPROVED: "APPROVED",
      REJECTED: "REJECTED",
      PROMOTED: "PROMOTED",
      ROLLED_BACK: "ROLLED_BACK",
      FAILED: "FAILED",
      RECORDED: "RECORDED",
      SKIPPED: "SKIPPED"
    };
  }

  /**
   * Journal追加
   */
  add(entry) {
    entry = entry || {};

    return this.withLock(function() {
      const journal = {
        id: entry.id || this.createId("JNL"),

        type: entry.type || AIJournal.TYPE.INFO,
        category: entry.category || "",
        severity: entry.severity || this.resolveSeverity(entry),

        title: entry.title || "",
        message: entry.message || "",

        targetType: entry.targetType || "",
        targetId: entry.targetId || "",

        action: entry.action || "",
        result: entry.result || AIJournal.RESULT.RECORDED,

        evidence: this.safeClone(entry.evidence || {}),
        metrics: this.safeClone(entry.metrics || {}),
        diff: this.safeClone(entry.diff || {}),
        decision: this.safeClone(entry.decision || {}),

        relatedIds: entry.relatedIds || [],

        tags: entry.tags || [],

        createdAt: new Date()
      };

      this.entries.push(journal);
      this.addIndex(journal);
      this.touch();
      this.saveToStorage();

      return this.safeClone(journal);
    });
  }

  /**
   * 複数追加
   */
  addMany(entries) {
    entries = entries || [];
    const out = [];

    entries.forEach(function(entry) {
      out.push(this.add(entry));
    }, this);

    return out;
  }

  /**
   * Learning記録
   */
  recordLearning(params) {
    params = params || {};

    return this.add({
      type: AIJournal.TYPE.LEARNING,
      category: "LEARNING",
      title: params.title || "Learning completed",
      message: params.message || "Learning process completed.",
      targetType: params.targetType || "",
      targetId: params.targetId || "",
      action: params.action || "LEARN",
      result: params.result || AIJournal.RESULT.OK,
      evidence: params.evidence || {},
      metrics: params.metrics || {},
      decision: params.decision || {},
      tags: params.tags || ["LEARNING"]
    });
  }

  /**
   * Validation記録
   */
  recordValidation(params) {
    params = params || {};

    return this.add({
      type: AIJournal.TYPE.VALIDATION,
      category: "VALIDATION",
      title: params.title || "Validation completed",
      message: params.message || "Validation process completed.",
      targetType: params.targetType || "VALIDATION",
      targetId: params.targetId || params.validationId || "",
      action: params.action || "VALIDATE",
      result: params.result || (
        params.approved ? AIJournal.RESULT.APPROVED : AIJournal.RESULT.REJECTED
      ),
      evidence: params.evidence || {},
      metrics: params.metrics || {},
      decision: params.decision || {},
      tags: params.tags || ["VALIDATION"]
    });
  }

  /**
   * Experiment記録
   */
  recordExperiment(params) {
    params = params || {};

    return this.add({
      type: AIJournal.TYPE.EXPERIMENT,
      category: "EXPERIMENT",
      title: params.title || "Experiment event",
      message: params.message || "ExperimentManager event recorded.",
      targetType: "EXPERIMENT",
      targetId: params.experimentId || params.targetId || "",
      action: params.action || "",
      result: params.result || AIJournal.RESULT.RECORDED,
      evidence: params.evidence || {},
      metrics: params.metrics || {},
      decision: params.decision || {},
      tags: params.tags || ["EXPERIMENT"]
    });
  }

  /**
   * Version記録
   */
  recordVersion(params) {
    params = params || {};

    return this.add({
      type: AIJournal.TYPE.VERSION,
      category: "VERSION",
      title: params.title || "Version event",
      message: params.message || "VersionManager event recorded.",
      targetType: params.targetType || "VERSION",
      targetId: params.targetId || "",
      action: params.action || "",
      result: params.result || AIJournal.RESULT.RECORDED,
      evidence: params.evidence || {},
      diff: params.diff || {},
      tags: params.tags || ["VERSION"]
    });
  }

  /**
   * Error記録
   */
  recordError(params) {
    params = params || {};

    const error = params.error || {};

    return this.add({
      type: AIJournal.TYPE.ERROR,
      category: params.category || "ERROR",
      severity: "ERROR",
      title: params.title || "Error",
      message: params.message || (error.message || String(error || "")),
      targetType: params.targetType || "",
      targetId: params.targetId || "",
      action: params.action || "ERROR",
      result: AIJournal.RESULT.FAILED,
      evidence: {
        errorMessage: error.message || String(error || ""),
        stack: error.stack || "",
        context: params.context || {}
      },
      tags: params.tags || ["ERROR"]
    });
  }

  /**
   * 検索
   */
  search(filter) {
    filter = filter || {};

    return this.entries
      .filter(function(entry) {
        if (filter.type && entry.type !== filter.type) return false;
        if (filter.category && entry.category !== filter.category) return false;
        if (filter.result && entry.result !== filter.result) return false;
        if (filter.targetType && entry.targetType !== filter.targetType) return false;
        if (filter.targetId && entry.targetId !== filter.targetId) return false;
        if (filter.severity && entry.severity !== filter.severity) return false;
        if (filter.tag && (entry.tags || []).indexOf(filter.tag) < 0) return false;

        if (filter.fromDate && new Date(entry.createdAt) < new Date(filter.fromDate)) return false;
        if (filter.toDate && new Date(entry.createdAt) > new Date(filter.toDate)) return false;

        if (filter.keyword) {
          const text = [
            entry.title,
            entry.message,
            entry.action,
            JSON.stringify(entry.evidence || {})
          ].join(" ");

          if (text.indexOf(filter.keyword) < 0) return false;
        }

        return true;
      })
      .sort(function(a, b) {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      })
      .slice(0, Number(filter.limit || 100))
      .map(function(entry) {
        return this.safeClone(entry);
      }, this);
  }

  /**
   * 最新取得
   */
  latest(limit) {
    return this.search({
      limit: limit || 20
    });
  }

  /**
   * Target検索
   */
  findTarget(targetType, targetId, limit) {
    return this.search({
      targetType: targetType,
      targetId: targetId,
      limit: limit || 50
    });
  }

  /**
   * Type検索
   */
  findByType(type, limit) {
    return this.search({
      type: type,
      limit: limit || 50
    });
  }

  /**
   * Category検索
   */
  findByCategory(category, limit) {
    return this.search({
      category: category,
      limit: limit || 50
    });
  }

  /**
   * Summary
   */
  summarize() {
    const summary = {
      total: this.entries.length,
      byType: {},
      byCategory: {},
      byResult: {},
      bySeverity: {},
      latestAt: null
    };

    this.entries.forEach(function(entry) {
      summary.byType[entry.type] = (summary.byType[entry.type] || 0) + 1;
      summary.byCategory[entry.category] = (summary.byCategory[entry.category] || 0) + 1;
      summary.byResult[entry.result] = (summary.byResult[entry.result] || 0) + 1;
      summary.bySeverity[entry.severity] = (summary.bySeverity[entry.severity] || 0) + 1;

      if (!summary.latestAt || new Date(entry.createdAt) > new Date(summary.latestAt)) {
        summary.latestAt = entry.createdAt;
      }
    });

    return summary;
  }

  /**
   * Prune
   */
  prune(maxEntries) {
    maxEntries = Number(maxEntries || 5000);

    return this.withLock(function() {
      if (this.entries.length <= maxEntries) {
        return 0;
      }

      this.entries.sort(function(a, b) {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });

      const removed = this.entries.length - maxEntries;
      this.entries = this.entries.slice(0, maxEntries);
      this.rebuildIndex();
      this.touch();
      this.saveToStorage();

      return removed;
    });
  }

  /**
   * Index
   */
  addIndex(entry) {
    this.pushIndex(this.index.byType, entry.type, entry.id);
    this.pushIndex(this.index.byCategory, entry.category, entry.id);
    this.pushIndex(this.index.byResult, entry.result, entry.id);
    this.pushIndex(this.index.byTarget, this.targetKey(entry.targetType, entry.targetId), entry.id);
  }

  pushIndex(index, key, id) {
    key = String(key || "");
    if (!key) return;

    if (!index[key]) index[key] = [];
    if (index[key].indexOf(id) < 0) index[key].push(id);
  }

  rebuildIndex() {
    this.index = {
      byType: {},
      byCategory: {},
      byTarget: {},
      byResult: {}
    };

    this.entries.forEach(function(entry) {
      this.addIndex(entry);
    }, this);

    return this.index;
  }

  targetKey(targetType, targetId) {
    return String(targetType || "") + "::" + String(targetId || "");
  }

  /**
   * Storage
   */
  storageKey() {
    return this.keyPrefix + "_STATE";
  }

  saveToStorage() {
    const json = JSON.stringify(this.toJSON());
    const props = PropertiesService.getScriptProperties();
    const key = this.storageKey();
    const chunkSize = 8000;
    const chunks = [];

    for (let i = 0; i < json.length; i += chunkSize) {
      chunks.push(json.substring(i, i + chunkSize));
    }

    const oldCount = Number(props.getProperty(key + "_COUNT") || 0);

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
      const props = PropertiesService.getScriptProperties();
      const key = this.storageKey();
      const count = Number(props.getProperty(key + "_COUNT") || 0);

      if (!count) return false;

      let json = "";

      for (let i = 0; i < count; i++) {
        json += props.getProperty(key + "_" + i) || "";
      }

      if (!json) return false;

      this.load(JSON.parse(json));
      return true;
    } catch (e) {
      return false;
    }
  }

  clearStorage() {
    return this.withLock(function() {
      const props = PropertiesService.getScriptProperties();
      const key = this.storageKey();
      const count = Number(props.getProperty(key + "_COUNT") || 0);

      for (let i = 0; i < count; i++) {
        props.deleteProperty(key + "_" + i);
      }

      props.deleteProperty(key + "_COUNT");
      props.deleteProperty(key + "_UPDATED_AT");

      this.entries = [];
      this.rebuildIndex();
      this.touch();

      return true;
    });
  }

  /**
   * Lock
   */
  withLock(callback) {
    const lock = LockService.getScriptLock();
    lock.waitLock(this.lockWaitMs);

    try {
      return callback.call(this);
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * JSON
   */
  toJSON() {
    return {
      version: this.version,
      keyPrefix: this.keyPrefix,
      entries: this.entries,
      index: this.index,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  load(json) {
    if (!json) return this;

    this.version = json.version || this.version;
    this.keyPrefix = json.keyPrefix || this.keyPrefix;
    this.entries = json.entries || [];
    this.index = json.index || {};
    this.createdAt = json.createdAt || new Date();
    this.updatedAt = json.updatedAt || new Date();

    if (!this.index || !this.index.byType) {
      this.rebuildIndex();
    }

    return this;
  }

  /**
   * Helpers
   */
  resolveSeverity(entry) {
    if (entry.severity) return entry.severity;

    if (entry.type === AIJournal.TYPE.ERROR) return "ERROR";
    if (entry.type === AIJournal.TYPE.WARNING) return "WARN";
    if (entry.result === AIJournal.RESULT.FAILED) return "ERROR";
    if (entry.result === AIJournal.RESULT.REJECTED) return "WARN";

    return "INFO";
  }

  createId(prefix) {
    prefix = prefix || "JNL";

    let uuid = "";

    try {
      uuid = Utilities.getUuid();
    } catch (e) {
      uuid = String(new Date().getTime()) + "_" + Math.floor(Math.random() * 1000000);
    }

    return prefix + "_" + uuid;
  }

  safeClone(obj) {
    if (obj === null || obj === undefined) return obj;
    return JSON.parse(JSON.stringify(obj));
  }

  touch() {
    this.updatedAt = new Date();
    return this;
  }

  static fromJSON(json) {
    return new AIJournal({
      autoLoad: false
    }).load(json || {});
  }
}

/**
 * GAS Test Helper
 */
function testAIJournalProduction() {
  const journal = new AIJournal({
    autoLoad: false
  });

  journal.recordLearning({
    targetType: "HORSE",
    targetId: "H001",
    evidence: {
      sample: 120
    },
    metrics: {
      roi: 1.12
    }
  });

  journal.recordValidation({
    validationId: "VAL001",
    approved: true,
    decision: {
      action: "PROMOTE"
    }
  });

  Logger.log(JSON.stringify(journal.summarize(), null, 2));
  return journal.toJSON();
}
