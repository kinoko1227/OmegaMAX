/**
 * ==========================================================
 * ΩMAX AIOS
 * AIJournal.js
 * ----------------------------------------------------------
 * AI Journal
 *
 * AIの学習・判断・検証履歴を記録する。
 * Explainable AI（説明可能AI）のための研究ノート。
 * ==========================================================
 */

class AIJournal {

  constructor() {

    this.version = 1;

    this.entries = [];

    this.createdAt = new Date();

    this.updatedAt = new Date();

  }

  /**
   * Journal追加
   */
  add(entry = {}) {

    const journal = {

      id: entry.id || Utilities.getUuid(),

      type: entry.type || "INFO",

      category: entry.category || "",

      title: entry.title || "",

      message: entry.message || "",

      targetType: entry.targetType || "",

      targetId: entry.targetId || "",

      evidence: entry.evidence || {},

      metrics: entry.metrics || {},

      result: entry.result || "",

      createdAt: new Date()

    };

    this.entries.push(journal);

    this.updatedAt = new Date();

    return journal;

  }

  /**
   * 最新取得
   */
  latest(limit = 20) {

    return this.entries
      .slice()
      .sort(function(a, b) {

        return new Date(b.createdAt) -
               new Date(a.createdAt);

      })
      .slice(0, limit);

  }

  /**
   * カテゴリ検索
   */
  findByCategory(category) {

    return this.entries.filter(function(e) {

      return e.category === category;

    });

  }

  /**
   * Type検索
   */
  findByType(type) {

    return this.entries.filter(function(e) {

      return e.type === type;

    });

  }

  /**
   * Target検索
   */
  findTarget(targetType, targetId) {

    return this.entries.filter(function(e){

      return e.targetType === targetType &&
             e.targetId === targetId;

    });

  }

  /**
   * JSON
   */
  toJSON(){

    return {

      version:this.version,

      entries:this.entries,

      createdAt:this.createdAt,

      updatedAt:this.updatedAt

    };

  }

  /**
   * JSON読込
   */
  load(json){

    if(!json){

      return this;

    }

    this.version =
      json.version || 1;

    this.entries =
      json.entries || [];

    this.createdAt =
      json.createdAt || new Date();

    this.updatedAt =
      json.updatedAt || new Date();

    return this;

  }

  /**
   * Factory
   */
  static fromJSON(json){

    return new AIJournal().load(json);

  }

}
