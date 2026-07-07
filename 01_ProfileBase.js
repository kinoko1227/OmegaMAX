/**
 * ==========================================================
 * ΩMAX AIOS
 * ProfileBase.js
 * ----------------------------------------------------------
 * 全Profile共通基底クラス
 *
 * HorseProfile
 * JockeyProfile
 * TrainerProfile
 * BloodlineProfile
 * CrossProfile
 *
 * すべての知識Profileはこのクラスを継承する。
 * ==========================================================
 */

class ProfileBase {

  constructor(id, type) {

    this.id = id || "";
    this.type = type || "GENERAL";
    this.name = "";

    // -------------------------
    // Version
    // -------------------------

    this.version = 1;
    this.status = "ACTIVE";

    // -------------------------
    // Learning
    // -------------------------

    this.sample = 0;
    this.confidence = 0;
    this.learningCount = 0;
    this.lastLearningDate = null;

    // -------------------------
    // Knowledge
    // -------------------------

    this.observations = [];
    this.statistics = {};
    this.knowledge = {};
    this.evidence = {};
    this.history = [];

    // -------------------------
    // Time
    // -------------------------

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 事実を記録する
   */
  observe(observation) {

    if (!observation) {
      return this;
    }

    this.observations.push({
      data: observation,
      createdAt: new Date()
    });

    this.sample += 1;
    this.touch();

    return this;
  }

  /**
   * 学習する
   */
  learn(observation) {

    this.observe(observation);

    this.learningCount += 1;
    this.lastLearningDate = new Date();

    this.updateStatistics(observation);
    this.updateKnowledge(observation);
    this.updateConfidence();

    this.addHistory("LEARN", {
      observation: observation
    });

    this.touch();

    return this;
  }

  /**
   * 統計更新
   * 子クラスで上書き可能
   */
  updateStatistics(observation) {

    if (!this.statistics.total) {
      this.statistics.total = 0;
    }

    this.statistics.total += 1;

    return this;
  }

  /**
   * 知識更新
   * 子クラスで上書き可能
   */
  updateKnowledge(observation) {

    this.knowledge.lastObservation = observation;

    return this;
  }

  /**
   * 信頼度更新
   */
  updateConfidence() {

    this.confidence = Utils.clamp(
      Math.sqrt(this.sample) * 4,
      0,
      100
    );

    return this;
  }

  /**
   * 根拠追加
   */
  addEvidence(key, value) {

    if (!key) {
      return this;
    }

    this.evidence[key] = value;
    this.touch();

    return this;
  }

  /**
   * 履歴追加
   */
  addHistory(action, payload) {

    this.history.push({
      version: this.version,
      action: action || "",
      payload: payload || {},
      createdAt: new Date()
    });

    return this;
  }

  /**
   * Version更新
   */
  bumpVersion(reason) {

    this.version += 1;

    this.addHistory("VERSION_UP", {
      reason: reason || ""
    });

    this.touch();

    return this;
  }

  /**
   * 他Profileと統合
   */
  merge(other) {

    if (!other) {
      return this;
    }

    this.sample += Number(other.sample || 0);

    this.observations =
      this.observations.concat(other.observations || []);

    this.history =
      this.history.concat(other.history || []);

    this.statistics = Object.assign(
      {},
      this.statistics,
      other.statistics || {}
    );

    this.knowledge = Object.assign(
      {},
      this.knowledge,
      other.knowledge || {}
    );

    this.evidence = Object.assign(
      {},
      this.evidence,
      other.evidence || {}
    );

    this.updateConfidence();

    this.addHistory("MERGE", {
      sourceId: other.id || ""
    });

    this.touch();

    return this;
  }

  /**
   * 有効化
   */
  activate() {
    this.status = "ACTIVE";
    this.touch();
    return this;
  }

  /**
   * 休眠
   */
  sleep() {
    this.status = "SLEEP";
    this.touch();
    return this;
  }

  /**
   * アーカイブ
   */
  archive() {
    this.status = "ARCHIVED";
    this.touch();
    return this;
  }

  /**
   * 更新日時
   */
  touch(date) {
    this.updatedAt = date || new Date();
    return this;
  }

  /**
   * JSON化
   */
  toJSON() {

    return {
      id: this.id,
      type: this.type,
      name: this.name,
      version: this.version,
      status: this.status,

      sample: this.sample,
      confidence: this.confidence,
      learningCount: this.learningCount,
      lastLearningDate: this.lastLearningDate,

      observations: this.observations,
      statistics: this.statistics,
      knowledge: this.knowledge,
      evidence: this.evidence,
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

    this.id = json.id || this.id;
    this.type = json.type || this.type;
    this.name = json.name || this.name;
    this.version = json.version || this.version;
    this.status = json.status || this.status;

    this.sample = json.sample || 0;
    this.confidence = json.confidence || 0;
    this.learningCount = json.learningCount || 0;
    this.lastLearningDate = json.lastLearningDate || null;

    this.observations = json.observations || [];
    this.statistics = json.statistics || {};
    this.knowledge = json.knowledge || {};
    this.evidence = json.evidence || {};
    this.history = json.history || [];

    this.createdAt = json.createdAt || new Date();
    this.updatedAt = json.updatedAt || new Date();

    return this;
  }

  /**
   * 複製
   */
  clone() {
    const cloned = new ProfileBase(this.id, this.type);
    cloned.load(this.toJSON());
    return cloned;
  }

}
