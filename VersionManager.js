/**
 * ==========================================================
 * ΩMAX AIOS
 * VersionManager.js
 * ----------------------------------------------------------
 * Production Version Manager v1.0.0
 *
 * Profile / Weight / Rule / Model / Experiment の
 * Snapshot・Version・Rollback・Release履歴を管理する。
 *
 * GAS V8 compatible.
 * ==========================================================
 */

class VersionManager {

  constructor(params) {
    params = params || {};

    this.version = "1.0.0";
    this.keyPrefix = params.keyPrefix || "OMEGAMAX_VERSION_MANAGER";
    this.lockWaitMs = Number(params.lockWaitMs || 30000);

    this.snapshots = {};
    this.index = {};
    this.releases = [];
    this.history = [];

    this.createdAt = new Date();
    this.updatedAt = new Date();

    if (params.autoLoad !== false) {
      this.loadFromStorage();
    }
  }

  static get TARGET() {
    return {
      PROFILE: "PROFILE",
      WEIGHT: "WEIGHT",
      RULE: "RULE",
      MODEL: "MODEL",
      EXPERIMENT: "EXPERIMENT",
      ENGINE: "ENGINE",
      CONFIG: "CONFIG"
    };
  }

  static get ACTION() {
    return {
      SNAPSHOT: "SNAPSHOT",
      RELEASE: "RELEASE",
      ROLLBACK: "ROLLBACK",
      RESTORE: "RESTORE",
      DELETE: "DELETE",
      ARCHIVE: "ARCHIVE"
    };
  }

  /**
   * Snapshot作成
   */
  createSnapshot(params) {
    params = params || {};

    return this.withLock(function() {
      const targetType = params.targetType || VersionManager.TARGET.MODEL;
      const targetId = params.targetId || "";
      const version = params.version || this.nextVersion(targetType, targetId);
      const id = params.id || this.createId("SNAP");

      if (!targetId) {
        throw new Error("targetId is required.");
      }

      const snapshot = {
        id: id,
        targetType: targetType,
        targetId: targetId,
        version: version,
        label: params.label || "",
        data: this.safeClone(params.data || {}),
        metadata: this.safeClone(params.metadata || {}),
        checksum: this.checksum(params.data || {}),
        reason: params.reason || "",
        tags: params.tags || [],
        archived: false,
        createdAt: new Date()
      };

      this.snapshots[id] = snapshot;
      this.addIndex(snapshot);
      this.addHistory(VersionManager.ACTION.SNAPSHOT, {
        snapshotId: id,
        targetType: targetType,
        targetId: targetId,
        version: version,
        reason: snapshot.reason
      });

      this.saveToStorage();

      return this.safeClone(snapshot);
    });
  }

  /**
   * Release作成
   */
  createRelease(params) {
    params = params || {};

    return this.withLock(function() {
      const snapshot =
        params.snapshotId
          ? this.getSnapshot(params.snapshotId)
          : null;

      const release = {
        id: params.id || this.createId("REL"),
        snapshotId: params.snapshotId || "",
        targetType: params.targetType || (snapshot ? snapshot.targetType : ""),
        targetId: params.targetId || (snapshot ? snapshot.targetId : ""),
        version: params.version || (snapshot ? snapshot.version : ""),
        label: params.label || "",
        status: params.status || "STABLE",
        metrics: this.safeClone(params.metrics || {}),
        reason: params.reason || "",
        createdAt: new Date()
      };

      this.releases.push(release);

      this.addHistory(VersionManager.ACTION.RELEASE, {
        releaseId: release.id,
        snapshotId: release.snapshotId,
        targetType: release.targetType,
        targetId: release.targetId,
        version: release.version
      });

      this.saveToStorage();

      return this.safeClone(release);
    });
  }

  /**
   * Snapshot取得
   */
  getSnapshot(id) {
    return this.safeClone(this.snapshots[id] || null);
  }

  /**
   * 対象別Snapshot
   */
  findSnapshots(targetType, targetId, options) {
    options = options || {};

    const key = this.indexKey(targetType, targetId);
    const ids = this.index[key] || [];

    let list = ids
      .map(function(id) {
        return this.snapshots[id];
      }, this)
      .filter(function(s) {
        if (!s) return false;
        if (!options.includeArchived && s.archived) return false;
        if (options.tag && (s.tags || []).indexOf(options.tag) < 0) return false;
        return true;
      });

    list.sort(function(a, b) {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    if (options.limit) {
      list = list.slice(0, Number(options.limit));
    }

    return this.safeClone(list);
  }

  /**
   * 最新Snapshot
   */
  latestSnapshot(targetType, targetId) {
    const list = this.findSnapshots(targetType, targetId, {
      limit: 1
    });

    return list.length ? list[0] : null;
  }

  /**
   * Version指定取得
   */
  findByVersion(targetType, targetId, version) {
    const list = this.findSnapshots(targetType, targetId, {
      includeArchived: true
    });

    for (let i = 0; i < list.length; i++) {
      if (String(list[i].version) === String(version)) {
        return list[i];
      }
    }

    return null;
  }

  /**
   * Rollbackデータ取得
   */
  rollback(targetType, targetId, snapshotId, reason) {
    return this.withLock(function() {
      let snapshot = null;

      if (snapshotId) {
        snapshot = this.snapshots[snapshotId] || null;
      } else {
        const latest = this.latestSnapshot(targetType, targetId);
        snapshot = latest ? this.snapshots[latest.id] : null;
      }

      if (!snapshot) {
        throw new Error("Rollback snapshot not found.");
      }

      this.addHistory(VersionManager.ACTION.ROLLBACK, {
        snapshotId: snapshot.id,
        targetType: snapshot.targetType,
        targetId: snapshot.targetId,
        version: snapshot.version,
        reason: reason || ""
      });

      this.saveToStorage();

      return this.safeClone(snapshot.data);
    });
  }

  /**
   * Restore用Snapshot作成
   */
  restoreFromSnapshot(snapshotId, reason) {
    return this.withLock(function() {
      const snapshot = this.snapshots[snapshotId];

      if (!snapshot) {
        throw new Error("Snapshot not found: " + snapshotId);
      }

      const restored = this.createSnapshot({
        targetType: snapshot.targetType,
        targetId: snapshot.targetId,
        label: "RESTORE_FROM_" + snapshot.version,
        data: snapshot.data,
        metadata: {
          restoredFrom: snapshot.id
        },
        reason: reason || "Restore from snapshot",
        tags: ["RESTORE"]
      });

      this.addHistory(VersionManager.ACTION.RESTORE, {
        fromSnapshotId: snapshot.id,
        toSnapshotId: restored.id,
        reason: reason || ""
      });

      this.saveToStorage();

      return restored;
    });
  }

  /**
   * Snapshotアーカイブ
   */
  archiveSnapshot(id, reason) {
    return this.withLock(function() {
      const snapshot = this.snapshots[id];

      if (!snapshot) {
        return false;
      }

      snapshot.archived = true;
      snapshot.archivedAt = new Date();
      snapshot.archiveReason = reason || "";

      this.addHistory(VersionManager.ACTION.ARCHIVE, {
        snapshotId: id,
        reason: reason || ""
      });

      this.saveToStorage();

      return true;
    });
  }

  /**
   * Snapshot削除
   */
  deleteSnapshot(id) {
    return this.withLock(function() {
      const snapshot = this.snapshots[id];

      if (!snapshot) {
        return false;
      }

      const key = this.indexKey(snapshot.targetType, snapshot.targetId);
      this.index[key] = (this.index[key] || []).filter(function(x) {
        return x !== id;
      });

      delete this.snapshots[id];

      this.addHistory(VersionManager.ACTION.DELETE, {
        snapshotId: id
      });

      this.saveToStorage();

      return true;
    });
  }

  /**
   * Diff比較
   */
  diffSnapshots(snapshotIdA, snapshotIdB) {
    const a = this.snapshots[snapshotIdA];
    const b = this.snapshots[snapshotIdB];

    if (!a || !b) {
      throw new Error("Both snapshots are required.");
    }

    return this.diffObjects(a.data || {}, b.data || {});
  }

  /**
   * Data比較
   */
  diffObjects(a, b) {
    const changes = [];
    const seen = {};

    this.walkDiff("", a || {}, b || {}, changes, seen);

    return {
      changed: changes.length > 0,
      count: changes.length,
      changes: changes
    };
  }

  walkDiff(path, a, b, changes, seen) {
    const keys = {};

    Object.keys(a || {}).forEach(function(k) {
      keys[k] = true;
    });

    Object.keys(b || {}).forEach(function(k) {
      keys[k] = true;
    });

    Object.keys(keys).forEach(function(key) {
      const nextPath = path ? path + "." + key : key;
      const av = a ? a[key] : undefined;
      const bv = b ? b[key] : undefined;

      if (this.isPlainObject(av) && this.isPlainObject(bv)) {
        this.walkDiff(nextPath, av, bv, changes, seen);
        return;
      }

      const aj = JSON.stringify(av);
      const bj = JSON.stringify(bv);

      if (aj !== bj) {
        changes.push({
          path: nextPath,
          beforeValue: av === undefined ? null : av,
          afterValue: bv === undefined ? null : bv
        });
      }
    }, this);
  }

  /**
   * 次Version
   */
  nextVersion(targetType, targetId) {
    const list = this.findSnapshots(targetType, targetId, {
      includeArchived: true
    });

    if (!list.length) {
      return "1.0.0";
    }

    const latest = list[0].version || "1.0.0";
    return this.incrementPatch(latest);
  }

  incrementPatch(version) {
    const parts = String(version || "1.0.0")
      .split(".")
      .map(function(x) {
        return Number(x || 0);
      });

    while (parts.length < 3) {
      parts.push(0);
    }

    parts[2] += 1;

    return parts.join(".");
  }

  /**
   * Index
   */
  addIndex(snapshot) {
    const key = this.indexKey(snapshot.targetType, snapshot.targetId);

    if (!this.index[key]) {
      this.index[key] = [];
    }

    if (this.index[key].indexOf(snapshot.id) < 0) {
      this.index[key].push(snapshot.id);
    }
  }

  rebuildIndex() {
    this.index = {};

    Object.keys(this.snapshots || {}).forEach(function(id) {
      this.addIndex(this.snapshots[id]);
    }, this);

    return this.index;
  }

  indexKey(targetType, targetId) {
    return String(targetType || "") + "::" + String(targetId || "");
  }

  /**
   * History
   */
  addHistory(action, payload) {
    const record = {
      id: this.createId("VER_HIS"),
      action: action || "",
      payload: this.safeClone(payload || {}),
      createdAt: new Date()
    };

    this.history.push(record);
    this.touch();
    this.writeJournal(record);

    return record;
  }

  writeJournal(record) {
    try {
      if (typeof AIJournal === "undefined") return;

      const journal = new AIJournal();

      if (typeof journal.loadFromStorage === "function") {
        journal.loadFromStorage();
      }

      if (typeof journal.add === "function") {
        journal.add({
          type: "VERSION",
          category: "VERSION_MANAGER",
          title: record.action,
          message: "VersionManager action: " + record.action,
          evidence: record.payload || {},
          result: "RECORDED"
        });
      }

      if (typeof journal.saveToStorage === "function") {
        journal.saveToStorage();
      }
    } catch (e) {}
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

      this.snapshots = {};
      this.index = {};
      this.releases = [];
      this.history = [];
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
      snapshots: this.snapshots,
      index: this.index,
      releases: this.releases,
      history: this.history,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  load(json) {
    if (!json) return this;

    this.version = json.version || this.version;
    this.keyPrefix = json.keyPrefix || this.keyPrefix;
    this.snapshots = json.snapshots || {};
    this.index = json.index || {};
    this.releases = json.releases || [];
    this.history = json.history || [];
    this.createdAt = json.createdAt || new Date();
    this.updatedAt = json.updatedAt || new Date();

    if (!this.index || !Object.keys(this.index).length) {
      this.rebuildIndex();
    }

    return this;
  }

  /**
   * Helpers
   */
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

  checksum(data) {
    const text = JSON.stringify(data || {});
    let hash = 0;

    for (let i = 0; i < text.length; i++) {
      const chr = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }

    return String(hash);
  }

  safeClone(obj) {
    if (obj === null || obj === undefined) return obj;
    return JSON.parse(JSON.stringify(obj));
  }

  isPlainObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
  }

  touch() {
    this.updatedAt = new Date();
    return this;
  }

  static fromJSON(json) {
    return new VersionManager({
      autoLoad: false
    }).load(json || {});
  }
}

/**
 * GAS Test Helper
 */
function testVersionManagerProduction() {
  const vm = new VersionManager({
    autoLoad: false
  });

  const s1 = vm.createSnapshot({
    targetType: VersionManager.TARGET.MODEL,
    targetId: "TEST_MODEL",
    data: {
      a: 1,
      b: {
        c: 2
      }
    },
    reason: "initial"
  });

  const s2 = vm.createSnapshot({
    targetType: VersionManager.TARGET.MODEL,
    targetId: "TEST_MODEL",
    data: {
      a: 1,
      b: {
        c: 3
      }
    },
    reason: "changed"
  });

  const diff = vm.diffSnapshots(s1.id, s2.id);
  const rollbackData = vm.rollback(VersionManager.TARGET.MODEL, "TEST_MODEL", s1.id, "test rollback");

  Logger.log(JSON.stringify({
    snapshots: vm.findSnapshots(VersionManager.TARGET.MODEL, "TEST_MODEL"),
    diff: diff,
    rollbackData: rollbackData
  }, null, 2));

  return vm.toJSON();
}
