/**
 * ==========================================================
 * ΩMAX AIOS
 * RuleModel.js
 * ----------------------------------------------------------
 * 推論ルールモデル
 *
 * Ruleはコードではなく「知識」として扱う。
 * LearningEngine / RuleManager が更新する。
 * ==========================================================
 */

class RuleModel {

  constructor(params = {}) {

    this.id = params.id || "";
    this.name = params.name || "";
    this.category = params.category || "GENERAL";

    // HORSE / RACE / MARKET / ACE
    this.domain = params.domain || "HORSE";

    // ACTIVE / SLEEP / EXPERIMENTAL / ARCHIVED
    this.status = params.status || "ACTIVE";

    // 条件定義
    this.conditions = params.conditions || [];

    // 効果定義
    this.effects = params.effects || {};

    // 信頼度
    this.confidence = Utils.clamp(
      params.confidence || 0,
      0,
      100
    );

    // サンプル数
    this.sample = Math.max(
      0,
      Number(params.sample || 0)
    );

    // 説明
    this.description = params.description || "";

    // 根拠
    this.evidence = params.evidence || {};

    this.createdAt = params.createdAt || new Date();
    this.updatedAt = params.updatedAt || new Date();

  }

  isActive() {
    return this.status === "ACTIVE";
  }

  isExperimental() {
    return this.status === "EXPERIMENTAL";
  }

  sleep() {
    this.status = "SLEEP";
    this.touch();
    return this;
  }

  activate() {
    this.status = "ACTIVE";
    this.touch();
    return this;
  }

  archive() {
    this.status = "ARCHIVED";
    this.touch();
    return this;
  }

  setConfidence(value) {
    this.confidence = Utils.clamp(value, 0, 100);
    this.touch();
    return this;
  }

  setSample(value) {
    this.sample = Math.max(0, Number(value) || 0);
    this.touch();
    return this;
  }

  updateEffects(effects = {}) {
    this.effects = {
      ...this.effects,
      ...effects
    };
    this.touch();
    return this;
  }

  addEvidence(key, value) {
    if (key) {
      this.evidence[key] = value;
    }
    this.touch();
    return this;
  }

  touch(date = new Date()) {
    this.updatedAt = date;
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      domain: this.domain,
      status: this.status,
      conditions: this.conditions,
      effects: this.effects,
      confidence: this.confidence,
      sample: this.sample,
      description: this.description,
      evidence: this.evidence,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromJSON(json = {}) {
    return new RuleModel(json);
  }

}
