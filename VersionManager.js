/**
 * ==========================================================
 * ΩMAX AIOS
 * VersionManager.js
 * ----------------------------------------------------------
 * Version Manager
 *
 * Profile / Rule / Weight / Schema / Policy の
 * バージョン管理・バックアップ・ロールバックを担当する。
 * ==========================================================
 */

class VersionManager {

  constructor() {
    this.version = 1;
    this.snapshots = {};
    this.history = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Snapshot作成
   */
  createSnapshot(params) {

    params = params || {};

    const id =
      params.id ||
      Utilities.getUuid();

    const snapshot = {
      id: id,
      targetType: params.targetType || "",
      targetId: params.targetId || "",
      version: params.version || 1,
      label: params.label || "",
      data: params.data || {},
      reason: params.reason || "",
      createdAt: new Date()
    };

    this.snapshots[id] = snapshot;

    this.history.push({
      action: "CREATE_SNAPSHOT",
      snapshotId: id,
      targetType: snapshot.targetType,
      targetId: snapshot.targetId,
      version: snapshot.version,
      reason: snapshot.reason,
      createdAt: new Date()
    });

    this.touch();

    return snapshot;
  }

  /**
   * Snapshot取得
   */
  getSnapshot(id) {
    return this.snapshots[id] || null;
  }

  /**
   * 対象別Snapshot取得
   */
  findSnapshots(targetType, targetId) {

    const list = [];

    Object.keys(this.snapshots || {}).forEach(function(id) {

      const snapshot = this.snapshots[id];

      if (
        snapshot.targetType === targetType &&
        snapshot.targetId === targetId
      ) {
        list.push(snapshot);
      }

    }, this);

    return list.sort(function(a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  /**
   * 最新Snapshot取得
   */
  latestSnapshot(targetType, targetId) {

    const list =
      this.findSnapshots(targetType, targetId);

    return list.length ? list[0] : null;
  }

  /**
   * Rollback用データ取得
   */
  rollback(targetType, targetId, snapshotId) {

    let snapshot = null;

    if (snapshotId) {
      snapshot = this.getSnapshot(snapshotId);
    } else {
      snapshot = this.latestSnapshot(targetType, targetId);
    }

    if (!snapshot) {
      return null;
    }

    this.history.push({
      action: "ROLLBACK",
      snapshotId: snapshot.id,
      targetType: snapshot.targetType,
      targetId: snapshot.targetId,
      version: snapshot.version,
      createdAt: new Date()
    });

    this.touch();

    return snapshot.data;
  }

  /**
   * Snapshot削除
   */
  removeSnapshot(id) {

    if (!this.snapshots[id]) {
      return false;
    }

    delete this.snapshots[id];

    this.history.push({
      action: "REMOVE_SNAPSHOT",
      snapshotId: id,
      createdAt: new Date()
    });

    this.touch();

    return true;
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
      snapshots: this.snapshots,
      history: this.history,
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

    this.version = json.version || 1;
    this.snapshots = json.snapshots || {};
    this.history = json.history || [];
    this.createdAt = json.createdAt || new Date();
    this.updatedAt = json.updatedAt || new Date();

    return this;
  }

  /**
   * Factory
   */
  static fromJSON(json) {
    return new VersionManager().load(json);
  }

}
