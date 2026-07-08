/**
 * ==========================================================
 * ΩMAX AIOS
 * ValidationEngine.js
 * ----------------------------------------------------------
 * Production Validation Engine v1.0.0
 *
 * 学習結果・重み変更・実験モデルを検証し、
 * Stableへ採用してよいか判定する実運用版。
 *
 * GAS V8 compatible.
 * ==========================================================
 */

class ValidationEngine {

  constructor(params) {
    params = params || {};

    this.version = "1.0.0";
    this.records = [];

    this.minimumSample = Number(params.minimumSample || 100);
    this.minimumValidationScore = Number(params.minimumValidationScore || 60);

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 総合検証
   */
  run(input) {
    input = input || {};

    const baseline = input.baseline || {};
    const candidate = input.candidate || {};
    const policy = input.policy || LearningPolicy.DEFAULT;
    const context = input.context || {};

    const metrics = this.compareMetrics(baseline, candidate);
    const overfit = this.detectOverfitting(baseline, candidate, context);
    const stability = this.evaluateStability(candidate, context);
    const sample = this.evaluateSample(candidate, context);
    const score = this.calculateValidationScore(metrics, overfit, stability, sample, policy);
    const decision = this.decide(score, metrics, overfit, stability, sample, policy);

    const result = {
      engine: "ValidationEngine",
      version: this.version,
      decision: decision,
      validationScore: score,
      metrics: metrics,
      overfit: overfit,
      stability: stability,
      sample: sample,
      policy: policy,
      context: context,
      createdAt: new Date()
    };

    this.records.push(result);
    this.touch();

    return result;
  }

  /**
   * baselineとcandidateを比較
   */
  compareMetrics(baseline, candidate) {
    const b = this.normalizeMetrics(baseline);
    const c = this.normalizeMetrics(candidate);

    return {
      baseline: b,
      candidate: c,

      roiDiff: c.roi - b.roi,
      hitRateDiff: c.hitRate - b.hitRate,
      evDiff: c.averageEV - b.averageEV,
      profitDiff: c.profit - b.profit,

      drawdownDiff: c.maxDrawdown - b.maxDrawdown,
      volatilityDiff: c.volatility - b.volatility,

      sharpeDiff: c.sharpe - b.sharpe,
      recoveryFactorDiff: c.recoveryFactor - b.recoveryFactor
    };
  }

  normalizeMetrics(data) {
    data = data || {};

    const bets = Number(data.bets || data.count || 0);
    const investment = Number(data.investment || data.totalBet || 0);
    const payout = Number(data.payout || data.totalReturn || 0);
    const profit = data.profit !== undefined
      ? Number(data.profit)
      : payout - investment;

    const roi = data.roi !== undefined
      ? Number(data.roi)
      : investment > 0 ? payout / investment : 0;

    return {
      bets: bets,
      investment: investment,
      payout: payout,
      profit: profit,
      roi: roi,

      hitRate: Number(data.hitRate || 0),
      averageEV: Number(data.averageEV || 0),
      maxDrawdown: Number(data.maxDrawdown || 0),
      volatility: Number(data.volatility || 0),
      sharpe: Number(data.sharpe || 0),
      recoveryFactor: Number(data.recoveryFactor || 0)
    };
  }

  /**
   * 過学習検知
   */
  detectOverfitting(baseline, candidate, context) {
    context = context || {};

    const train = this.normalizeMetrics(candidate.train || candidate.training || {});
    const test = this.normalizeMetrics(candidate.test || candidate.validation || {});
    const outOfSample = this.normalizeMetrics(candidate.outOfSample || {});

    const hasSplit =
      train.bets > 0 &&
      (test.bets > 0 || outOfSample.bets > 0);

    let risk = 0;
    const reasons = [];

    if (!hasSplit) {
      risk += 25;
      reasons.push("期間分割またはOut-of-sample検証が不足");
    }

    if (train.roi > 1.2 && test.bets > 0 && test.roi < 1.0) {
      risk += 30;
      reasons.push("学習期間では良いが検証期間でROI低下");
    }

    if (train.hitRate > 0 && test.hitRate > 0 && (train.hitRate - test.hitRate) > 0.12) {
      risk += 20;
      reasons.push("学習期間と検証期間の的中率差が大きい");
    }

    if (outOfSample.bets > 0 && outOfSample.roi < 0.95) {
      risk += 25;
      reasons.push("Out-of-sample ROIが基準未満");
    }

    if (candidate.parametersChanged && candidate.parametersChanged > 20) {
      risk += 15;
      reasons.push("同時変更パラメータが多すぎる");
    }

    risk = this.clamp(risk, 0, 100);

    return {
      risk: risk,
      ok: risk < 50,
      reasons: reasons,
      train: train,
      test: test,
      outOfSample: outOfSample
    };
  }

  /**
   * 安定性評価
   */
  evaluateStability(candidate, context) {
    candidate = candidate || {};
    context = context || {};

    const monthly = candidate.monthly || [];
    const byCourse = candidate.byCourse || {};
    const byClass = candidate.byClass || {};

    let score = 70;
    const reasons = [];

    if (monthly.length >= 3) {
      const negativeMonths = monthly.filter(function(m) {
        return Number(m.roi || 0) < 0.9;
      }).length;

      if (negativeMonths >= Math.ceil(monthly.length / 2)) {
        score -= 20;
        reasons.push("月別成績の悪化月が多い");
      }
    }

    const courseKeys = Object.keys(byCourse || {});
    if (courseKeys.length >= 3) {
      const badCourses = courseKeys.filter(function(k) {
        return Number(byCourse[k].roi || 0) < 0.85;
      }).length;

      if (badCourses >= Math.ceil(courseKeys.length / 2)) {
        score -= 15;
        reasons.push("競馬場別の偏りが大きい");
      }
    }

    const classKeys = Object.keys(byClass || {});
    if (classKeys.length >= 3) {
      const badClasses = classKeys.filter(function(k) {
        return Number(byClass[k].roi || 0) < 0.85;
      }).length;

      if (badClasses >= Math.ceil(classKeys.length / 2)) {
        score -= 15;
        reasons.push("クラス別の偏りが大きい");
      }
    }

    const metrics = this.normalizeMetrics(candidate);
    if (metrics.maxDrawdown > 0.25) {
      score -= 20;
      reasons.push("最大ドローダウンが大きい");
    }

    if (metrics.volatility > 0.35) {
      score -= 10;
      reasons.push("収益ボラティリティが高い");
    }

    score = this.clamp(score, 0, 100);

    return {
      score: score,
      ok: score >= 55,
      reasons: reasons
    };
  }

  /**
   * サンプル評価
   */
  evaluateSample(candidate, context) {
    candidate = candidate || {};
    context = context || {};

    const metrics = this.normalizeMetrics(candidate);
    const sample = Number(metrics.bets || context.sample || 0);

    let score = 0;

    if (sample >= 1000) {
      score = 100;
    } else if (sample >= 500) {
      score = 85;
    } else if (sample >= 300) {
      score = 75;
    } else if (sample >= 100) {
      score = 60;
    } else if (sample >= 50) {
      score = 40;
    } else {
      score = 20;
    }

    return {
      sample: sample,
      score: score,
      ok: sample >= this.minimumSample
    };
  }

  /**
   * 検証スコア
   */
  calculateValidationScore(metrics, overfit, stability, sample, policy) {
    policy = policy || LearningPolicy.DEFAULT;

    let score = 50;

    score += this.clamp(metrics.roiDiff * 120, -25, 30);
    score += this.clamp(metrics.evDiff * 80, -15, 20);
    score += this.clamp(metrics.hitRateDiff * 100, -10, 15);
    score += this.clamp(metrics.sharpeDiff * 10, -10, 15);
    score += this.clamp(metrics.recoveryFactorDiff * 5, -10, 10);

    if (metrics.drawdownDiff > 0) {
      score -= this.clamp(metrics.drawdownDiff * 100, 0, 20);
    } else {
      score += this.clamp(Math.abs(metrics.drawdownDiff) * 40, 0, 10);
    }

    score -= this.clamp(overfit.risk * 0.35, 0, 35);
    score += this.clamp((stability.score - 50) * 0.25, -12, 15);
    score += this.clamp((sample.score - 50) * 0.20, -10, 10);

    return this.clamp(score, 0, 100);
  }

  /**
   * 採用判定
   */
  decide(score, metrics, overfit, stability, sample, policy) {
    policy = policy || LearningPolicy.DEFAULT;

    const reasons = [];

    if (sample.sample < Number(policy.minimumSample || this.minimumSample)) {
      reasons.push("サンプル不足");
    }

    if (!overfit.ok) {
      reasons.push("過学習リスク");
    }

    if (!stability.ok) {
      reasons.push("安定性不足");
    }

    if (metrics.roiDiff < Number(policy.minRoiImprovement || 0)) {
      reasons.push("ROI改善不足");
    }

    if (metrics.drawdownDiff > Number(policy.maxDrawdownWorsening || 0.03)) {
      reasons.push("ドローダウン悪化");
    }

    if (score < Number(policy.minValidationScore || this.minimumValidationScore)) {
      reasons.push("ValidationScore不足");
    }

    const approved = reasons.length === 0;

    return {
      approved: approved,
      action: approved ? "PROMOTE" : "REJECT",
      reasons: reasons
    };
  }

  /**
   * Weight更新単体検証
   */
  validateWeightUpdate(params) {
    params = params || {};

    const policy =
      LearningPolicy.get(
        params.profileType || "HORSE",
        params.fieldKey || ""
      );

    const before = Number(params.beforeWeight || policy.initialWeight || 1);
    const after = Number(params.afterWeight || before);
    const sample = Number(params.sample || 0);
    const validationScore = Number(params.validationScore || 0);

    const diff = Math.abs(after - before);
    const max = Number(policy.maxWeightChangePerLearning || 0.03);

    const reasons = [];

    if (diff > max + 0.000001) {
      reasons.push("1回のWeight変更幅超過");
    }

    if (!LearningPolicy.canLearn(sample, policy)) {
      reasons.push("Field学習サンプル不足");
    }

    if (validationScore < Number(policy.minValidationScore || 60)) {
      reasons.push("Field検証スコア不足");
    }

    return {
      approved: reasons.length === 0,
      reasons: reasons,
      beforeWeight: before,
      afterWeight: after,
      sample: sample,
      validationScore: validationScore,
      policy: policy
    };
  }

  /**
   * Rollback推奨判定
   */
  shouldRollback(validationResult) {
    validationResult = validationResult || {};

    if (!validationResult.decision) {
      return false;
    }

    return validationResult.decision.action === "REJECT";
  }

  /**
   * 最新結果
   */
  latest(limit) {
    limit = limit || 20;

    return this.records
      .slice()
      .sort(function(a, b) {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      })
      .slice(0, limit);
  }

  /**
   * JSON
   */
  toJSON() {
    return {
      version: this.version,
      minimumSample: this.minimumSample,
      minimumValidationScore: this.minimumValidationScore,
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

    this.version = json.version || this.version;
    this.minimumSample = json.minimumSample || this.minimumSample;
    this.minimumValidationScore =
      json.minimumValidationScore || this.minimumValidationScore;
    this.records = json.records || [];
    this.createdAt = json.createdAt || new Date();
    this.updatedAt = json.updatedAt || new Date();

    return this;
  }

  touch() {
    this.updatedAt = new Date();
    return this;
  }

  clamp(value, min, max) {
    value = Number(value || 0);
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  static fromJSON(json) {
    return new ValidationEngine().load(json || {});
  }

}
