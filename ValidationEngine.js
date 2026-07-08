/**
 * ==========================================================
 * ΩMAX AIOS
 * ValidationEngine.js
 * ----------------------------------------------------------
 * Production Validation Engine v1.0.0
 *
 * ExperimentManager / LearningPolicy / VersionManager /
 * AIJournal / KnowledgeHistory と連携し、
 * 学習結果・実験結果・重み変更を検証する。
 *
 * GAS V8 compatible.
 * ==========================================================
 */

class ValidationEngine {

  constructor(params) {
    params = params || {};

    this.version = "1.0.0";
    this.keyPrefix = params.keyPrefix || "OMEGAMAX_VALIDATION_ENGINE";
    this.lockWaitMs = Number(params.lockWaitMs || 30000);

    this.records = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();

    if (params.autoLoad !== false) {
      this.loadFromStorage();
    }
  }

  /**
   * 総合検証
   */
  run(input) {
    input = input || {};

    const baseline = this.normalizeMetrics(input.baseline || {});
    const candidate = this.normalizeMetrics(input.candidate || {});
    const policy = input.policy || LearningPolicy.DEFAULT || {};
    const context = input.context || {};

    const comparison = this.compareMetrics(baseline, candidate);
    const sample = this.evaluateSample(candidate, policy, context);
    const stability = this.evaluateStability(input, policy);
    const overfit = this.detectOverfitting(input, policy);
    const risk = this.evaluateRisk(comparison, stability, overfit, sample, policy);
    const score = this.calculateValidationScore(comparison, sample, stability, overfit, risk, policy);
    const decision = this.decide(score, comparison, sample, stability, overfit, risk, policy);

    const result = {
      id: this.createId("VAL"),
      engine: "ValidationEngine",
      version: this.version,
      validationScore: score,
      decision: decision,
      comparison: comparison,
      sample: sample,
      stability: stability,
      overfit: overfit,
      risk: risk,
      context: context,
      createdAt: new Date()
    };

    this.records.push(result);
    this.writeJournal(result);
    this.writeHistory(result);
    this.saveToStorage();

    return this.safeClone(result);
  }

  /**
   * Weight更新単体検証
   */
  validateWeightUpdate(params) {
    params = params || {};

    const profileType = params.profileType || "HORSE";
    const fieldKey = params.fieldKey || "";
    const policy = LearningPolicy.get(profileType, fieldKey);

    const before = Number(params.beforeWeight || policy.initialWeight || 1);
    const after = Number(params.afterWeight || before);
    const sample = Number(params.sample || 0);
    const confidence = Number(params.confidence || 0);
    const roi = Number(params.roi || 0);
    const validationScore = Number(params.validationScore || 0);

    const reasons = [];
    const diff = Math.abs(after - before);
    const max = Number(policy.maxWeightChangePerLearning || 0.03);

    if (diff > max + 0.000001) {
      reasons.push("1回の重み変更幅を超過");
    }

    if (!LearningPolicy.canLearn(sample, policy)) {
      reasons.push("最低サンプル数不足");
    }

    if (validationScore < Number(policy.minValidationScore || 60)) {
      reasons.push("検証スコア不足");
    }

    if (roi > 0 && roi < 0.85 && after > before) {
      reasons.push("ROIが低い条件で重みが増加している");
    }

    if (confidence < 20 && diff > max / 2) {
      reasons.push("低信頼度で変更幅が大きい");
    }

    const result = {
      id: this.createId("VAL_WEIGHT"),
      type: "WEIGHT_UPDATE",
      approved: reasons.length === 0,
      reasons: reasons,
      profileType: profileType,
      fieldKey: fieldKey,
      beforeWeight: before,
      afterWeight: after,
      diff: after - before,
      sample: sample,
      confidence: confidence,
      roi: roi,
      validationScore: validationScore,
      policy: policy,
      createdAt: new Date()
    };

    this.records.push(result);
    this.writeJournal(result);
    this.writeHistory(result);
    this.saveToStorage();

    return this.safeClone(result);
  }

  /**
   * Metrics比較
   */
  compareMetrics(baseline, candidate) {
    return {
      baseline: baseline,
      candidate: candidate,

      roiDiff: candidate.roi - baseline.roi,
      hitRateDiff: candidate.hitRate - baseline.hitRate,
      evDiff: candidate.averageEV - baseline.averageEV,
      profitDiff: candidate.profit - baseline.profit,
      payoutDiff: candidate.payout - baseline.payout,

      drawdownDiff: candidate.maxDrawdown - baseline.maxDrawdown,
      volatilityDiff: candidate.volatility - baseline.volatility,

      sharpeDiff: candidate.sharpe - baseline.sharpe,
      recoveryFactorDiff: candidate.recoveryFactor - baseline.recoveryFactor,

      improvedROI: candidate.roi > baseline.roi,
      improvedEV: candidate.averageEV >= baseline.averageEV,
      improvedDrawdown: candidate.maxDrawdown <= baseline.maxDrawdown
    };
  }

  /**
   * Sample評価
   */
  evaluateSample(candidate, policy, context) {
    policy = policy || {};
    context = context || {};

    const sample = Number(candidate.sample || candidate.bets || context.sample || 0);
    const minimum = Number(policy.minimumSample || 100);

    let score = 0;

    if (sample >= 2000) score = 100;
    else if (sample >= 1000) score = 92;
    else if (sample >= 500) score = 82;
    else if (sample >= 300) score = 72;
    else if (sample >= minimum) score = 60;
    else if (sample >= minimum / 2) score = 40;
    else score = 20;

    return {
      sample: sample,
      minimumSample: minimum,
      score: score,
      ok: sample >= minimum
    };
  }

  /**
   * 安定性評価
   */
  evaluateStability(input, policy) {
    input = input || {};
    policy = policy || {};

    const candidate = input.candidate || {};
    const monthly = candidate.monthly || input.monthly || [];
    const byCourse = candidate.byCourse || input.byCourse || {};
    const byClass = candidate.byClass || input.byClass || {};
    const byBetType = candidate.byBetType || input.byBetType || {};

    let score = 75;
    const reasons = [];

    const badMonthRate = this.badRate(monthly, 0.90);
    if (badMonthRate >= 0.50) {
      score -= 22;
      reasons.push("月別ROIの悪化が多い");
    } else if (badMonthRate >= 0.30) {
      score -= 10;
      reasons.push("一部月でROI悪化");
    }

    const courseBad = this.objectBadRate(byCourse, 0.88);
    if (courseBad >= 0.50) {
      score -= 18;
      reasons.push("競馬場別の偏りが大きい");
    }

    const classBad = this.objectBadRate(byClass, 0.88);
    if (classBad >= 0.50) {
      score -= 14;
      reasons.push("クラス別の偏りが大きい");
    }

    const betBad = this.objectBadRate(byBetType, 0.88);
    if (betBad >= 0.50) {
      score -= 18;
      reasons.push("券種別の偏りが大きい");
    }

    const m = this.normalizeMetrics(candidate);
    if (m.maxDrawdown > Number(policy.maxDrawdownLimit || 0.30)) {
      score -= 20;
      reasons.push("最大ドローダウンが大きい");
    }

    if (m.volatility > Number(policy.maxVolatility || 0.40)) {
      score -= 10;
      reasons.push("収益ボラティリティが高い");
    }

    score = this.clamp(score, 0, 100);

    return {
      score: score,
      ok: score >= 55,
      reasons: reasons,
      badMonthRate: badMonthRate,
      courseBadRate: courseBad,
      classBadRate: classBad,
      betTypeBadRate: betBad
    };
  }

  /**
   * 過学習検知
   */
  detectOverfitting(input, policy) {
    input = input || {};
    policy = policy || {};

    const candidate = input.candidate || {};
    const train = this.normalizeMetrics(candidate.train || input.train || {});
    const test = this.normalizeMetrics(candidate.test || input.test || {});
    const out = this.normalizeMetrics(candidate.outOfSample || input.outOfSample || {});

    let risk = 0;
    const reasons = [];

    const hasSplit =
      train.bets > 0 && (test.bets > 0 || out.bets > 0);

    if (policy.requireOutOfSample !== false && !hasSplit) {
      risk += 25;
      reasons.push("Out-of-sample検証不足");
    }

    if (train.bets > 0 && test.bets > 0) {
      if (train.roi - test.roi > 0.20) {
        risk += 25;
        reasons.push("Train/TestのROI差が大きい");
      }

      if (train.hitRate - test.hitRate > 0.12) {
        risk += 15;
        reasons.push("Train/Testの的中率差が大きい");
      }
    }

    if (out.bets > 0 && out.roi < 0.95) {
      risk += 25;
      reasons.push("Out-of-sample ROIが低い");
    }

    const changed = Number(input.parametersChanged || candidate.parametersChanged || 0);
    if (changed >= 20) {
      risk += 15;
      reasons.push("同時変更パラメータが多い");
    }

    risk = this.clamp(risk, 0, 100);

    return {
      risk: risk,
      ok: risk < 50,
      reasons: reasons,
      train: train,
      test: test,
      outOfSample: out,
      parametersChanged: changed
    };
  }

  /**
   * Risk評価
   */
  evaluateRisk(comparison, stability, overfit, sample, policy) {
    policy = policy || {};

    let risk = 0;
    const reasons = [];

    if (comparison.drawdownDiff > Number(policy.maxDrawdownWorsening || 0.03)) {
      risk += 25;
      reasons.push("ドローダウン悪化");
    }

    if (comparison.volatilityDiff > 0.10) {
      risk += 15;
      reasons.push("ボラティリティ悪化");
    }

    if (!stability.ok) {
      risk += 20;
      reasons.push("安定性不足");
    }

    if (!sample.ok) {
      risk += 20;
      reasons.push("サンプル不足");
    }

    if (!overfit.ok) {
      risk += Math.min(35, overfit.risk * 0.5);
      reasons.push("過学習リスク");
    }

    risk = this.clamp(risk, 0, 100);

    return {
      risk: risk,
      ok: risk < 50,
      reasons: reasons
    };
  }

  /**
   * ValidationScore
   */
  calculateValidationScore(comparison, sample, stability, overfit, risk, policy) {
    policy = policy || {};

    let score = 50;

    score += this.clamp(comparison.roiDiff * 130, -30, 35);
    score += this.clamp(comparison.evDiff * 90, -20, 25);
    score += this.clamp(comparison.hitRateDiff * 100, -12, 18);
    score += this.clamp(comparison.sharpeDiff * 12, -12, 16);
    score += this.clamp(comparison.recoveryFactorDiff * 5, -10, 12);

    if (comparison.drawdownDiff > 0) {
      score -= this.clamp(comparison.drawdownDiff * 120, 0, 25);
    } else {
      score += this.clamp(Math.abs(comparison.drawdownDiff) * 50, 0, 10);
    }

    score += this.clamp((sample.score - 50) * 0.20, -10, 10);
    score += this.clamp((stability.score - 50) * 0.25, -12, 15);
    score -= this.clamp(overfit.risk * 0.35, 0, 35);
    score -= this.clamp(risk.risk * 0.25, 0, 25);

    return this.clamp(score, 0, 100);
  }

  /**
   * Decision
   */
  decide(score, comparison, sample, stability, overfit, risk, policy) {
    policy = policy || {};

    const reasons = [];

    if (score < Number(policy.minValidationScore || 60)) {
      reasons.push("ValidationScore不足");
    }

    if (comparison.roiDiff < Number(policy.minRoiImprovement || 0.01)) {
      reasons.push("ROI改善不足");
    }

    if (comparison.evDiff < Number(policy.minEVImprovement || 0)) {
      reasons.push("EV改善不足");
    }

    if (comparison.drawdownDiff > Number(policy.maxDrawdownWorsening || 0.03)) {
      reasons.push("ドローダウン悪化");
    }

    if (!sample.ok) {
      reasons.push("サンプル不足");
    }

    if (!stability.ok) {
      reasons.push("安定性不足");
    }

    if (!overfit.ok) {
      reasons.push("過学習リスク");
    }

    if (!risk.ok) {
      reasons.push("総合リスク高");
    }

    const approved = reasons.length === 0;

    return {
      approved: approved,
      action: approved ? "PROMOTE" : "REJECT",
      reasons: reasons
    };
  }

  /**
   * Metrics正規化
   */
  normalizeMetrics(data) {
    data = data || {};

    const investment = Number(data.investment || data.totalBet || 0);
    const payout = Number(data.payout || data.totalReturn || 0);

    const profit =
      data.profit !== undefined
        ? Number(data.profit)
        : payout - investment;

    const roi =
      data.roi !== undefined
        ? Number(data.roi)
        : investment > 0
          ? payout / investment
          : 0;

    const bets = Number(data.bets || data.count || data.sample || 0);

    return {
      bets: bets,
      sample: Number(data.sample || bets || 0),
      investment: investment,
      payout: payout,
      profit: profit,
      roi: roi,
      hitRate: Number(data.hitRate || 0),
      averageEV: Number(data.averageEV || data.ev || 0),
      maxDrawdown: Number(data.maxDrawdown || 0),
      volatility: Number(data.volatility || 0),
      sharpe: Number(data.sharpe || 0),
      recoveryFactor: Number(data.recoveryFactor || 0)
    };
  }

  /**
   * Journal連携
   */
  writeJournal(result) {
    try {
      if (typeof AIJournal === "undefined") return;

      const journal = new AIJournal();

      if (typeof journal.loadFromStorage === "function") {
        journal.loadFromStorage();
      }

      journal.add({
        type: "VALIDATION",
        category: "VALIDATION_ENGINE",
        title: "Validation completed",
        message: "ValidationEngine evaluated candidate.",
        evidence: {
          id: result.id,
          validationScore: result.validationScore,
          decision: result.decision
        },
        result:
          result.decision && result.decision.approved
            ? "APPROVED"
            : "REJECTED"
      });

      if (typeof journal.saveToStorage === "function") {
        journal.saveToStorage();
      }
    } catch (e) {}
  }

  /**
   * KnowledgeHistory連携
   */
  writeHistory(result) {
    try {
      if (typeof KnowledgeHistory === "undefined") return;

      const history = new KnowledgeHistory();

      if (typeof history.loadFromStorage === "function") {
        history.loadFromStorage();
      }

      if (typeof history.add === "function") {
        history.add({
          targetType: "VALIDATION",
          targetId: result.id,
          fieldKey: "validationScore",
          action: "VALIDATE",
          beforeValue: null,
          afterValue: result.validationScore,
          reason: "ValidationEngine completed.",
          evidence: result,
          confidence: result.validationScore,
          sample:
            result.sample && result.sample.sample
              ? result.sample.sample
              : 0
        });
      }

      if (typeof history.saveToStorage === "function") {
        history.saveToStorage();
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
    const props = PropertiesService.getScriptProperties();
    const key = this.storageKey();
    const count = Number(props.getProperty(key + "_COUNT") || 0);

    for (let i = 0; i < count; i++) {
      props.deleteProperty(key + "_" + i);
    }

    props.deleteProperty(key + "_COUNT");
    props.deleteProperty(key + "_UPDATED_AT");

    return true;
  }

  /**
   * Records
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
      keyPrefix: this.keyPrefix,
      records: this.records,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  load(json) {
    if (!json) return this;

    this.version = json.version || this.version;
    this.keyPrefix = json.keyPrefix || this.keyPrefix;
    this.records = json.records || [];
    this.createdAt = json.createdAt || new Date();
    this.updatedAt = json.updatedAt || new Date();

    return this;
  }

  /**
   * Helpers
   */
  createId(prefix) {
    prefix = prefix || "VAL";

    let uuid = "";

    try {
      uuid = Utilities.getUuid();
    } catch (e) {
      uuid = String(new Date().getTime()) + "_" + Math.floor(Math.random() * 1000000);
    }

    return prefix + "_" + uuid;
  }

  badRate(list, threshold) {
    list = list || [];
    if (!list.length) return 0;

    const bad = list.filter(function(x) {
      return Number(x.roi || 0) > 0 && Number(x.roi || 0) < threshold;
    }).length;

    return bad / list.length;
  }

  objectBadRate(obj, threshold) {
    obj = obj || {};
    const keys = Object.keys(obj);

    if (!keys.length) return 0;

    const bad = keys.filter(function(k) {
      return Number(obj[k].roi || 0) > 0 && Number(obj[k].roi || 0) < threshold;
    }).length;

    return bad / keys.length;
  }

  clamp(value, min, max) {
    value = Number(value || 0);
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  static fromJSON(json) {
    return new ValidationEngine({
      autoLoad: false
    }).load(json || {});
  }
}

/**
 * ==========================================================
 * GAS Test Helper
 * ==========================================================
 */

function testValidationEngineProduction() {
  const engine = new ValidationEngine({
    autoLoad: false
  });

  const result = engine.run({
    baseline: {
      bets: 500,
      investment: 50000,
      payout: 52000,
      hitRate: 0.22,
      averageEV: 1.04,
      maxDrawdown: 0.14,
      sharpe: 0.7
    },
    candidate: {
      bets: 500,
      investment: 50000,
      payout: 57500,
      hitRate: 0.24,
      averageEV: 1.13,
      maxDrawdown: 0.13,
      sharpe: 0.9,
      train: {
        bets: 300,
        investment: 30000,
        payout: 34500,
        hitRate: 0.25,
        averageEV: 1.14
      },
      test: {
        bets: 200,
        investment: 20000,
        payout: 23000,
        hitRate: 0.235,
        averageEV: 1.11
      }
    },
    policy: LearningPolicy.DEFAULT,
    context: {
      test: true
    }
  });

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
