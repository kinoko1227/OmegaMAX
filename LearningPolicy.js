/**
 * ==========================================================
 * ΩMAX AIOS
 * LearningPolicy.js
 * ----------------------------------------------------------
 * Production Learning Policy v1.0.0
 *
 * 「何をどこまで自動学習してよいか」を管理する。
 *
 * 役割:
 * - Profile種別ごとの学習制限
 * - Fieldごとの初期重み・上下限・最低サンプル
 * - 1回の学習変更幅制限
 * - 信頼度更新制限
 * - 検証必須条件
 * - 暴走防止
 * - Stable / Experimental 運用の安全ルール
 *
 * GAS V8 compatible.
 * ==========================================================
 */

const LearningPolicy = {

  VERSION: "1.0.0",

  /**
   * 全体共通デフォルト
   */
  DEFAULT: {
    learnable: true,

    initialWeight: 1.0,
    minWeight: 0.50,
    maxWeight: 2.00,

    minimumSample: 20,
    requireMinimumSample: true,

    learningRate: 0.05,

    maxWeightChangePerLearning: 0.03,
    maxWeightChangePerDay: 0.08,
    maxWeightChangePerVersion: 0.20,

    initialConfidence: 0,
    minConfidence: 0,
    maxConfidence: 100,
    maxConfidenceChangePerLearning: 2.5,

    validationRequired: true,
    rollbackEnabled: true,
    experimentRequired: true,

    minValidationScore: 60,
    minRoiImprovement: 0.01,
    minHitRateImprovement: 0.00,
    maxDrawdownWorsening: 0.03,

    overfitGuard: true,
    requireOutOfSample: true,

    stablePromotionMinimumSample: 200,
    stablePromotionMinimumDays: 14,

    allowNegativeLearning: true,
    allowAutoDisable: true,

    autoDisableSample: 100,
    autoDisableRoiThreshold: 0.70,

    journalRequired: true,
    historyRequired: true
  },

  /**
   * Profile種別ごとの安全設定
   */
  PROFILE: {
    HORSE: {
      minimumSample: 8,
      learningRate: 0.050,
      maxWeightChangePerLearning: 0.040,
      stablePromotionMinimumSample: 60
    },

    JOCKEY: {
      minimumSample: 25,
      learningRate: 0.035,
      maxWeightChangePerLearning: 0.030,
      stablePromotionMinimumSample: 150
    },

    TRAINER: {
      minimumSample: 30,
      learningRate: 0.030,
      maxWeightChangePerLearning: 0.025,
      stablePromotionMinimumSample: 180
    },

    BLOODLINE: {
      minimumSample: 80,
      learningRate: 0.020,
      maxWeightChangePerLearning: 0.018,
      stablePromotionMinimumSample: 350
    },

    CROSS: {
      minimumSample: 120,
      learningRate: 0.018,
      maxWeightChangePerLearning: 0.015,
      stablePromotionMinimumSample: 500
    },

    RACE: {
      minimumSample: 100,
      learningRate: 0.020,
      maxWeightChangePerLearning: 0.020,
      stablePromotionMinimumSample: 400
    },

    MARKET: {
      minimumSample: 200,
      learningRate: 0.015,
      maxWeightChangePerLearning: 0.015,
      stablePromotionMinimumSample: 800
    }
  },

  /**
   * Field別設定
   */
  FIELD: {
    distance: {
      initialWeight: 1.22,
      minWeight: 0.70,
      maxWeight: 1.80,
      minimumSample: 12
    },

    course: {
      initialWeight: 1.18,
      minWeight: 0.70,
      maxWeight: 1.75,
      minimumSample: 12
    },

    surface: {
      initialWeight: 1.28,
      minWeight: 0.75,
      maxWeight: 1.90,
      minimumSample: 12
    },

    going: {
      initialWeight: 1.12,
      minWeight: 0.70,
      maxWeight: 1.65,
      minimumSample: 20
    },

    raceClass: {
      initialWeight: 1.10,
      minWeight: 0.75,
      maxWeight: 1.60,
      minimumSample: 20
    },

    season: {
      initialWeight: 1.03,
      minWeight: 0.80,
      maxWeight: 1.35,
      minimumSample: 30
    },

    pace: {
      initialWeight: 1.15,
      minWeight: 0.70,
      maxWeight: 1.75,
      minimumSample: 30
    },

    runningStyle: {
      initialWeight: 1.18,
      minWeight: 0.70,
      maxWeight: 1.75,
      minimumSample: 30
    },

    fieldSize: {
      initialWeight: 1.04,
      minWeight: 0.80,
      maxWeight: 1.35,
      minimumSample: 40
    },

    frameNumber: {
      initialWeight: 1.06,
      minWeight: 0.75,
      maxWeight: 1.45,
      minimumSample: 50
    },

    horseNumber: {
      initialWeight: 1.02,
      minWeight: 0.80,
      maxWeight: 1.25,
      minimumSample: 80
    },

    trainingType: {
      initialWeight: 1.10,
      minWeight: 0.75,
      maxWeight: 1.65,
      minimumSample: 12
    },

    trainingPattern: {
      initialWeight: 1.18,
      minWeight: 0.70,
      maxWeight: 1.80,
      minimumSample: 18
    },

    bodyWeight: {
      initialWeight: 1.10,
      minWeight: 0.75,
      maxWeight: 1.60,
      minimumSample: 12
    },

    bodyWeightChange: {
      initialWeight: 1.05,
      minWeight: 0.80,
      maxWeight: 1.35,
      minimumSample: 12
    },

    intervalDays: {
      initialWeight: 1.12,
      minWeight: 0.75,
      maxWeight: 1.65,
      minimumSample: 12
    },

    age: {
      initialWeight: 1.08,
      minWeight: 0.80,
      maxWeight: 1.45,
      minimumSample: 20
    },

    jockeyId: {
      initialWeight: 1.14,
      minWeight: 0.70,
      maxWeight: 1.75,
      minimumSample: 30
    },

    jockeyStyle: {
      initialWeight: 1.10,
      minWeight: 0.75,
      maxWeight: 1.60,
      minimumSample: 40
    },

    trainerId: {
      initialWeight: 1.10,
      minWeight: 0.75,
      maxWeight: 1.60,
      minimumSample: 40
    },

    stablePattern: {
      initialWeight: 1.12,
      minWeight: 0.75,
      maxWeight: 1.65,
      minimumSample: 45
    },

    fatherId: {
      initialWeight: 1.14,
      minWeight: 0.75,
      maxWeight: 1.70,
      minimumSample: 100
    },

    motherFatherId: {
      initialWeight: 1.10,
      minWeight: 0.78,
      maxWeight: 1.60,
      minimumSample: 100
    },

    sireLine: {
      initialWeight: 1.08,
      minWeight: 0.80,
      maxWeight: 1.45,
      minimumSample: 150
    },

    damLine: {
      initialWeight: 1.05,
      minWeight: 0.82,
      maxWeight: 1.35,
      minimumSample: 150
    },

    crossKey: {
      initialWeight: 1.18,
      minWeight: 0.70,
      maxWeight: 1.85,
      minimumSample: 150
    },

    nickType: {
      initialWeight: 1.12,
      minWeight: 0.75,
      maxWeight: 1.65,
      minimumSample: 200
    },

    cushionValue: {
      initialWeight: 1.08,
      minWeight: 0.80,
      maxWeight: 1.50,
      minimumSample: 80
    },

    moisture: {
      initialWeight: 1.05,
      minWeight: 0.82,
      maxWeight: 1.40,
      minimumSample: 80
    },

    trackBias: {
      initialWeight: 1.15,
      minWeight: 0.75,
      maxWeight: 1.70,
      minimumSample: 80
    },

    oddsRange: {
      initialWeight: 1.12,
      minWeight: 0.70,
      maxWeight: 1.75,
      minimumSample: 200
    },

    popularity: {
      initialWeight: 1.10,
      minWeight: 0.75,
      maxWeight: 1.60,
      minimumSample: 200
    },

    marketGap: {
      initialWeight: 1.25,
      minWeight: 0.70,
      maxWeight: 2.00,
      minimumSample: 200
    },

    evBand: {
      initialWeight: 1.30,
      minWeight: 0.70,
      maxWeight: 2.00,
      minimumSample: 200
    }
  },

  /**
   * ProfileType + FieldKey から最終Policy取得
   */
  get: function(profileType, fieldKey) {
    const base =
      this.clone(this.DEFAULT);

    const profile =
      this.PROFILE[profileType] || {};

    const field =
      this.FIELD[fieldKey] || {};

    return this.normalizePolicy(
      this.merge(base, profile, field)
    );
  },

  /**
   * Field定義だけ取得
   */
  getFieldPolicy: function(fieldKey) {
    return this.normalizePolicy(
      this.merge(
        this.clone(this.DEFAULT),
        this.FIELD[fieldKey] || {}
      )
    );
  },

  /**
   * Profile定義だけ取得
   */
  getProfilePolicy: function(profileType) {
    return this.normalizePolicy(
      this.merge(
        this.clone(this.DEFAULT),
        this.PROFILE[profileType] || {}
      )
    );
  },

  /**
   * 学習可能判定
   */
  canLearn: function(sample, policy) {
    policy = this.normalizePolicy(policy || this.DEFAULT);

    if (!policy.learnable) {
      return false;
    }

    if (
      policy.requireMinimumSample &&
      Number(sample || 0) < Number(policy.minimumSample || 0)
    ) {
      return false;
    }

    return true;
  },

  /**
   * Stable昇格可能判定
   */
  canPromoteStable: function(params) {
    params = params || {};

    const policy =
      this.normalizePolicy(params.policy || this.DEFAULT);

    const sample =
      Number(params.sample || 0);

    const days =
      Number(params.days || 0);

    const validationScore =
      Number(params.validationScore || 0);

    const roiImprovement =
      Number(params.roiImprovement || 0);

    const hitRateImprovement =
      Number(params.hitRateImprovement || 0);

    const drawdownWorsening =
      Number(params.drawdownWorsening || 0);

    if (sample < policy.stablePromotionMinimumSample) {
      return false;
    }

    if (days < policy.stablePromotionMinimumDays) {
      return false;
    }

    if (validationScore < policy.minValidationScore) {
      return false;
    }

    if (roiImprovement < policy.minRoiImprovement) {
      return false;
    }

    if (hitRateImprovement < policy.minHitRateImprovement) {
      return false;
    }

    if (drawdownWorsening > policy.maxDrawdownWorsening) {
      return false;
    }

    return true;
  },

  /**
   * 自動無効化判定
   */
  shouldAutoDisable: function(params) {
    params = params || {};

    const policy =
      this.normalizePolicy(params.policy || this.DEFAULT);

    if (!policy.allowAutoDisable) {
      return false;
    }

    const sample =
      Number(params.sample || 0);

    const roi =
      Number(params.roi || 0);

    if (sample < policy.autoDisableSample) {
      return false;
    }

    return roi > 0 && roi < policy.autoDisableRoiThreshold;
  },

  /**
   * Weightを安全範囲へ
   */
  clampWeight: function(value, policy) {
    policy = this.normalizePolicy(policy || this.DEFAULT);

    return this.clamp(
      Number(value || policy.initialWeight || 1.0),
      Number(policy.minWeight),
      Number(policy.maxWeight)
    );
  },

  /**
   * Confidenceを安全範囲へ
   */
  clampConfidence: function(value, policy) {
    policy = this.normalizePolicy(policy || this.DEFAULT);

    return this.clamp(
      Number(value || 0),
      Number(policy.minConfidence),
      Number(policy.maxConfidence)
    );
  },

  /**
   * 1回のWeight更新幅制限
   */
  limitWeightChange: function(current, next, policy) {
    policy = this.normalizePolicy(policy || this.DEFAULT);

    current =
      Number(current || policy.initialWeight || 1.0);

    next =
      Number(next || current);

    const max =
      Number(policy.maxWeightChangePerLearning || 0.03);

    const diff = next - current;

    if (diff > max) {
      return current + max;
    }

    if (diff < -max) {
      return current - max;
    }

    return next;
  },

  /**
   * 1回のConfidence更新幅制限
   */
  limitConfidenceChange: function(current, next, policy) {
    policy = this.normalizePolicy(policy || this.DEFAULT);

    current = Number(current || 0);
    next = Number(next || current);

    const max =
      Number(policy.maxConfidenceChangePerLearning || 2.5);

    const diff = next - current;

    if (diff > max) {
      return current + max;
    }

    if (diff < -max) {
      return current - max;
    }

    return next;
  },

  /**
   * Weight更新値を生成
   */
  proposeWeight: function(params) {
    params = params || {};

    const policy =
      this.normalizePolicy(params.policy || this.DEFAULT);

    const current =
      Number(params.currentWeight || policy.initialWeight || 1.0);

    const signal =
      Number(params.signal || 0);

    const confidence =
      this.clamp(Number(params.confidence || 0), 0, 100) / 100;

    const learningRate =
      Number(policy.learningRate || 0.05);

    let raw =
      current + signal * confidence * learningRate;

    raw =
      this.limitWeightChange(
        current,
        raw,
        policy
      );

    return this.clampWeight(raw, policy);
  },

  /**
   * ROI/Scoreから学習Signalを作る
   */
  buildSignal: function(params) {
    params = params || {};

    const roi =
      Number(params.roi || 0);

    const score =
      Number(params.score || 50);

    const validationScore =
      Number(params.validationScore || 50);

    let signal = 0;

    if (roi > 1.0) {
      signal += this.clamp((roi - 1.0) * 0.40, 0, 0.35);
    } else if (roi > 0 && roi < 0.85) {
      signal -= this.clamp((0.85 - roi) * 0.35, 0, 0.30);
    }

    signal += this.clamp((score - 50) / 200, -0.25, 0.25);
    signal += this.clamp((validationScore - 50) / 300, -0.15, 0.15);

    return this.clamp(signal, -1, 1);
  },

  /**
   * Policy妥当性正規化
   */
  normalizePolicy: function(policy) {
    policy = policy || {};

    if (policy.minWeight === undefined) {
      policy.minWeight = this.DEFAULT.minWeight;
    }

    if (policy.maxWeight === undefined) {
      policy.maxWeight = this.DEFAULT.maxWeight;
    }

    if (policy.initialWeight === undefined) {
      policy.initialWeight = this.DEFAULT.initialWeight;
    }

    if (policy.minimumSample === undefined) {
      policy.minimumSample = this.DEFAULT.minimumSample;
    }

    if (policy.learningRate === undefined) {
      policy.learningRate = this.DEFAULT.learningRate;
    }

    if (policy.maxWeightChangePerLearning === undefined) {
      policy.maxWeightChangePerLearning =
        this.DEFAULT.maxWeightChangePerLearning;
    }

    if (policy.initialConfidence === undefined) {
      policy.initialConfidence = this.DEFAULT.initialConfidence;
    }

    if (policy.minConfidence === undefined) {
      policy.minConfidence = this.DEFAULT.minConfidence;
    }

    if (policy.maxConfidence === undefined) {
      policy.maxConfidence = this.DEFAULT.maxConfidence;
    }

    if (policy.maxConfidenceChangePerLearning === undefined) {
      policy.maxConfidenceChangePerLearning =
        this.DEFAULT.maxConfidenceChangePerLearning;
    }

    if (policy.learnable === undefined) {
      policy.learnable = true;
    }

    if (policy.validationRequired === undefined) {
      policy.validationRequired = true;
    }

    if (policy.rollbackEnabled === undefined) {
      policy.rollbackEnabled = true;
    }

    if (policy.experimentRequired === undefined) {
      policy.experimentRequired = true;
    }

    if (policy.requireMinimumSample === undefined) {
      policy.requireMinimumSample = true;
    }

    return policy;
  },

  /**
   * merge helper
   */
  merge: function() {
    const out = {};

    for (let i = 0; i < arguments.length; i++) {
      const obj = arguments[i] || {};

      Object.keys(obj).forEach(function(key) {
        out[key] = obj[key];
      });
    }

    return out;
  },

  /**
   * clone helper
   */
  clone: function(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  },

  /**
   * clamp helper
   */
  clamp: function(value, min, max) {
    value = Number(value || 0);
    min = Number(min);
    max = Number(max);

    if (value < min) return min;
    if (value > max) return max;

    return value;
  }

}
