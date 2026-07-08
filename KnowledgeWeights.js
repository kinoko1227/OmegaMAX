/**
 * ==========================================================
 * ΩMAX AIOS
 * KnowledgeWeights.js
 * ----------------------------------------------------------
 * Learned Knowledge Weights
 *
 * AIが学習した現在の重みを保持する。
 *
 * Schema = 設計図
 * Policy = 学習ルール
 * Weights = 現在値
 * ==========================================================
 */

class KnowledgeWeights {

  constructor(profileType = "HORSE") {

    this.profileType = profileType;

    this.version = 1;

    this.updatedAt = null;

    this.weights = {};

  }

  /**
   * 重み取得
   */
  get(fieldKey) {

    return this.weights[fieldKey] || null;

  }

  /**
   * 重み設定
   */
  set(fieldKey, value) {

    const policy =
      LearningPolicy.get(
        this.profileType,
        fieldKey
      );

    if (!this.weights[fieldKey]) {

      this.weights[fieldKey] = {

        weight:
          policy.initialWeight,

        confidence:
          policy.initialConfidence,

        sample:0,

        updatedAt:null

      };

    }

    const current =
      this.weights[fieldKey].weight;

    let next =
      LearningPolicy.limitWeightChange(
        current,
        value,
        policy
      );

    next =
      LearningPolicy.clampWeight(
        next,
        policy
      );

    this.weights[fieldKey].weight =
      next;

    this.weights[fieldKey].updatedAt =
      new Date();

    this.updatedAt =
      new Date();

    return next;

  }

  /**
   * サンプル更新
   */
  addSample(fieldKey,count){

    if(!this.weights[fieldKey]){

      this.set(
        fieldKey,
        LearningPolicy.get(
          this.profileType,
          fieldKey
        ).initialWeight
      );

    }

    this.weights[fieldKey].sample +=
      Number(count||1);

  }

  /**
   * 信頼度更新
   */
  setConfidence(fieldKey,value){

    if(!this.weights[fieldKey]){

      return;

    }

    this.weights[fieldKey].confidence =
      Utils.clamp(
        value,
        0,
        100
      );

  }

  /**
   * JSON
   */
  toJSON(){

    return{

      profileType:this.profileType,

      version:this.version,

      updatedAt:this.updatedAt,

      weights:this.weights

    };

  }

  /**
   * JSON読込
   */
  load(json){

    if(!json){

      return this;

    }

    this.profileType=
      json.profileType||this.profileType;

    this.version=
      json.version||1;

    this.updatedAt=
      json.updatedAt||null;

    this.weights=
      json.weights||{};

    return this;

  }

  /**
   * Factory
   */
  static fromJSON(json){

    return new KnowledgeWeights().load(json);

  }

}
