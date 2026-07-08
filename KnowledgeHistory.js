/**
 * ==========================================================
 * ΩMAX AIOS
 * KnowledgeHistory.js
 * ----------------------------------------------------------
 * Knowledge History
 *
 * 重み・知識・ルールが
 * いつ・なぜ・どう変わったかを記録する。
 * ==========================================================
 */

class KnowledgeHistory {

  constructor() {
    this.version = 1;
    this.records = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 履歴追加
   */
  add(params) {

    params = params || {};

    const record = {
      id: params.id || Utilities.getUuid(),

      targetType: params.targetType || "",
      targetId: params.targetId || "",
      fieldKey: params.fieldKey || "",

      action: params.action || "UPDATE",

      beforeValue:
        params.beforeValue !== undefined
          ? params.beforeValue
          : null,

      afterValue:
        params.afterValue !== undefined
          ? params.afterValue
          : null,

      reason: params.reason || "",
      evidence: params.evidence || {},

      validationScore:
        params.validationScore !== undefined
          ? params.validationScore
          : null,

      confidence:
        params.confidence !== undefined
          ? params.confidence
          : null,

      sample:
        params.sample !== undefined
          ? params.sample
          : 0,

      createdAt: new Date()
    };

    this.records.push(record);
    this.updatedAt = new Date();

    return record;
  }

  /**
   * 対象別取得
   */
  findByTarget(targetType, targetId) {
    return this.records.filter(function(record) {
      return (
        record.targetType === targetType &&
        record.targetId === targetId
      );
    });
  }

  /**
   * Field別取得
   */
  findByField(fieldKey) {
    return this.records.filter(function(record) {
      return record.fieldKey === fieldKey;
    });
  }

  /**
   * 最新履歴
   */
  latest(limit) {
    limit = limit || 20;

    return this.records
      .slice()
      .sort(function(a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .slice(0, limit);
  }

  /**
   * 全削除
   */
  clear() {
    this.records = [];
    this.updatedAt = new Date();
    return this;
  }

  /**
   * JSON
   */
  toJSON() {
    return {
      version: this.version,
      records: this.records,
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
    this.records = json.records || [];
    this.createdAt = json.createdAt || new Date();
    this.updatedAt = json.updatedAt || new Date();

    return this;
  }

  /**
   * Factory
   */
  static fromJSON(json) {
    return new KnowledgeHistory().load(json);
  }

}
