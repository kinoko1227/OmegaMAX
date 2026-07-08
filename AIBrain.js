/**
 * ==========================================================
 * ΩMAX AIOS
 * AIBrain.js
 * ----------------------------------------------------------
 * Production AI Brain v1.0.0
 *
 * Phase3:
 * - HorseBrain
 * - ScenarioEngine
 * - RaceSimulator
 * - ACEEngine
 * - ExplainEngine
 * - BrainCache
 *
 * 役割:
 * 1. 出走馬ごとの総合評価
 * 2. 展開シナリオ生成
 * 3. シナリオ別レースシミュレーション
 * 4. 勝率・連対率・複勝率・着順分布算出
 * 5. 市場評価・期待値・リスクを統合
 * 6. ACE最終評価を返す
 *
 * GAS V8 compatible.
 * ==========================================================
 */


/**
 * ==========================================================
 * BrainCache
 * ----------------------------------------------------------
 * AIBrain内部の軽量キャッシュ。
 * ==========================================================
 */
class BrainCache {

  constructor() {
    this.store = {};
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  get(key) {
    const item = this.store[key];
    if (!item) return null;

    if (item.expiresAt && new Date(item.expiresAt) < new Date()) {
      delete this.store[key];
      return null;
    }

    return item.value;
  }

  set(key, value, ttlSeconds) {
    const expiresAt =
      ttlSeconds
        ? new Date(new Date().getTime() + ttlSeconds * 1000)
        : null;

    this.store[key] = {
      value: value,
      expiresAt: expiresAt,
      createdAt: new Date()
    };

    this.updatedAt = new Date();

    return value;
  }

  clear() {
    this.store = {};
    this.updatedAt = new Date();
    return this;
  }

  toJSON() {
    return {
      store: this.store,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

}


/**
 * ==========================================================
 * ExplainEngine
 * ----------------------------------------------------------
 * 評価理由を生成する。
 * ==========================================================
 */
class ExplainEngine {

  static buildHorseExplanation(score) {
    const reasons = [];

    if (!score) return reasons;

    if (score.abilityScore >= 75) reasons.push("基礎能力が高い");
    if (score.fitScore >= 70) reasons.push("条件適性が高い");
    if (score.conditionScore >= 70) reasons.push("状態面が良い");
    if (score.scenarioScore >= 70) reasons.push("想定展開が向く");
    if (score.marketScore >= 70) reasons.push("市場評価に妙味がある");
    if (score.riskScore >= 65) reasons.push("リスクがやや高い");
    if (score.confidence >= 70) reasons.push("評価信頼度が高い");

    if (!reasons.length) {
      reasons.push("大きな加点材料は少ないが、総合バランスで評価");
    }

    return reasons;
  }

  static buildRaceExplanation(result) {
    const reasons = [];

    if (!result) return reasons;

    if (result.primaryScenario) {
      reasons.push("主想定シナリオは「" + result.primaryScenario.label + "」");
    }

    if (result.topHorse) {
      reasons.push("最上位評価は " + result.topHorse.name);
    }

    if (result.raceRisk >= 70) {
      reasons.push("レース全体の不確実性が高いため資金配分は抑制");
    }

    if (result.marketOpportunity >= 70) {
      reasons.push("市場との乖離があり期待値候補が存在");
    }

    return reasons;
  }

}


/**
 * ==========================================================
 * HorseBrain
 * ----------------------------------------------------------
 * 各馬の能力・適性・状態・関係性・市場評価を統合する。
 * ==========================================================
 */
class HorseBrain {

  constructor(params) {
    params = params || {};
    this.version = "1.0.0";
    this.cache = params.cache || new BrainCache();
  }

  /**
   * 出走馬評価
   */
  evaluateRunner(runner, context) {
    runner = runner || {};
    context = context || {};

    const profile = runner.profile || runner.horseProfile || {};
    const jockeyProfile = runner.jockeyProfile || {};
    const trainerProfile = runner.trainerProfile || {};
    const bloodlineProfile = runner.bloodlineProfile || {};
    const crossProfile = runner.crossProfile || {};
    const market = runner.market || {};

    const abilityScore =
      this.evaluateAbility(runner, profile);

    const fitScore =
      this.evaluateFit(runner, profile, context);

    const conditionScore =
      this.evaluateCondition(runner, profile, context);

    const relationScore =
      this.evaluateRelations(runner, profile, jockeyProfile, trainerProfile);

    const bloodlineScore =
      this.evaluateBloodline(runner, bloodlineProfile, crossProfile, context);

    const marketScore =
      this.evaluateMarket(runner, market, context);

    const riskScore =
      this.evaluateRisk(runner, profile, context);

    const confidence =
      this.evaluateConfidence([
        abilityScore,
        fitScore,
        conditionScore,
        relationScore,
        bloodlineScore,
        marketScore
      ], runner, profile);

    const baseScore =
      this.weightedAverage([
        { value: abilityScore, weight: 1.35 },
        { value: fitScore, weight: 1.20 },
        { value: conditionScore, weight: 1.10 },
        { value: relationScore, weight: 0.80 },
        { value: bloodlineScore, weight: 0.85 },
        { value: marketScore, weight: 0.75 }
      ]);

    const finalScore =
      this.clamp(baseScore - Math.max(0, riskScore - 50) * 0.20, 0, 100);

    const result = {
      runnerId: runner.runnerId || runner.horseId || runner.id || "",
      horseId: runner.horseId || runner.id || "",
      name: runner.name || runner.horseName || "",
      number: Number(runner.number || runner.horseNumber || 0),
      frameNumber: Number(runner.frameNumber || runner.frame || 0),
      runningStyle: runner.runningStyle || runner.style || "",

      abilityScore: abilityScore,
      fitScore: fitScore,
      conditionScore: conditionScore,
      relationScore: relationScore,
      bloodlineScore: bloodlineScore,
      marketScore: marketScore,
      riskScore: riskScore,
      confidence: confidence,
      finalScore: finalScore,

      indexes: {
        speed: Number(runner.speedIndex || profile.speedIndex || 50),
        stamina: Number(runner.staminaIndex || profile.staminaIndex || 50),
        finish: Number(runner.finishIndex || profile.finishIndex || 50),
        start: Number(runner.startIndex || profile.startIndex || 50),
        power: Number(runner.powerIndex || profile.powerIndex || 50),
        mental: Number(runner.mentalIndex || profile.mentalIndex || 50),
        consistency: Number(runner.consistencyIndex || profile.consistencyIndex || 50)
      },

      market: {
        odds: Number(runner.odds || market.odds || 0),
        popularity: Number(runner.popularity || market.popularity || 0),
        impliedProbability:
          this.impliedProbability(Number(runner.odds || market.odds || 0))
      },

      reasons: [],
      evidence: {
        profileSample: Number(profile.sample || 0),
        profileConfidence: Number(profile.confidence || 0),
        rawRunner: runner
      }
    };

    result.reasons =
      ExplainEngine.buildHorseExplanation(result);

    return result;
  }

  evaluateAbility(runner, profile) {
    const values = [
      Number(runner.abilityIndex || profile.currentAbility || 0),
      Number(runner.speedIndex || profile.speedIndex || 50),
      Number(runner.staminaIndex || profile.staminaIndex || 50),
      Number(runner.finishIndex || profile.finishIndex || 50),
      Number(runner.powerIndex || profile.powerIndex || 50),
      Number(runner.mentalIndex || profile.mentalIndex || 50)
    ];

    const filtered =
      values.filter(function(v) {
        return !isNaN(v) && v > 0;
      });

    if (!filtered.length) return 50;

    return this.clamp(this.average(filtered), 0, 100);
  }

  evaluateFit(runner, profile, context) {
    context = context || {};
    profile = profile || {};

    const scores = [];

    scores.push(this.cellFit(profile.distanceKnowledge, context.distance));
    scores.push(this.cellFit(profile.courseKnowledge, context.course));
    scores.push(this.cellFit(profile.surfaceKnowledge, context.surface));
    scores.push(this.cellFit(profile.goingKnowledge, context.going));
    scores.push(this.cellFit(profile.paceKnowledge, context.pace));
    scores.push(this.cellFit(profile.styleKnowledge, runner.runningStyle || runner.style));

    const valid =
      scores.filter(function(v) {
        return v !== null && !isNaN(v);
      });

    if (!valid.length) return 50;

    return this.clamp(this.average(valid), 0, 100);
  }

  evaluateCondition(runner, profile, context) {
    const scores = [];

    scores.push(Number(runner.conditionScore || 0));
    scores.push(Number(runner.trainingScore || 0));
    scores.push(Number(runner.bodyWeightScore || 0));
    scores.push(Number(runner.recoveryScore || profile.recoveryScore || 0));

    const fatigue = Number(runner.fatigueIndex || 0);
    if (fatigue) scores.push(this.clamp(100 - fatigue, 0, 100));

    const valid =
      scores.filter(function(v) {
        return !isNaN(v) && v > 0;
      });

    if (!valid.length) return 50;

    return this.clamp(this.average(valid), 0, 100);
  }

  evaluateRelations(runner, profile, jockeyProfile, trainerProfile) {
    const scores = [];

    if (profile && profile.getJockeyFit && runner.jockeyId) {
      const cell = profile.getJockeyFit(runner.jockeyId);
      scores.push(this.cellScore(cell));
    }

    if (profile && profile.getTrainerFit && runner.trainerId) {
      const cell = profile.getTrainerFit(runner.trainerId);
      scores.push(this.cellScore(cell));
    }

    scores.push(Number(jockeyProfile.currentScore || jockeyProfile.score || 0));
    scores.push(Number(trainerProfile.currentScore || trainerProfile.score || 0));

    const valid = scores.filter(function(v) {
      return !isNaN(v) && v > 0;
    });

    if (!valid.length) return 50;

    return this.clamp(this.average(valid), 0, 100);
  }

  evaluateBloodline(runner, bloodlineProfile, crossProfile, context) {
    const scores = [];

    scores.push(Number(bloodlineProfile.currentScore || bloodlineProfile.score || 0));
    scores.push(Number(crossProfile.currentScore || crossProfile.score || 0));

    if (bloodlineProfile && bloodlineProfile.evaluateFit) {
      const r = bloodlineProfile.evaluateFit(context);
      if (r && r.score !== undefined) scores.push(Number(r.score));
    }

    if (crossProfile && crossProfile.evaluateFit) {
      const c = crossProfile.evaluateFit(context);
      if (c && c.score !== undefined) scores.push(Number(c.score));
    }

    const valid = scores.filter(function(v) {
      return !isNaN(v) && v > 0;
    });

    if (!valid.length) return 50;

    return this.clamp(this.average(valid), 0, 100);
  }

  evaluateMarket(runner, market, context) {
    const odds = Number(runner.odds || market.odds || 0);
    const popularity = Number(runner.popularity || market.popularity || 0);
    const predicted = Number(runner.predictedProbability || market.predictedProbability || 0);

    if (!odds) return 50;

    const implied = this.impliedProbability(odds);

    let score = 50;

    if (predicted > 0) {
      const gap = predicted - implied;
      score += gap * 180;
    }

    if (popularity >= 8 && odds <= 15) {
      score += 5;
    }

    if (popularity <= 2 && odds <= 2.5) {
      score -= 3;
    }

    return this.clamp(score, 0, 100);
  }

  evaluateRisk(runner, profile, context) {
    let risk = 35;

    risk += Number(runner.risk || runner.riskScore || 0) * 30;
    risk += Number(profile.riskTolerance || 0) < -10 ? 10 : 0;

    const consistency =
      Number(runner.consistencyIndex || profile.consistencyIndex || 50);

    if (consistency < 40) risk += 15;
    if (consistency > 70) risk -= 8;

    const odds = Number(runner.odds || 0);
    if (odds >= 30) risk += 10;

    return this.clamp(risk, 0, 100);
  }

  evaluateConfidence(values, runner, profile) {
    const valid =
      values.filter(function(v) {
        return !isNaN(v);
      });

    let confidence = 40;

    if (valid.length >= 5) confidence += 20;

    const profileConfidence =
      Number(profile.confidence || 0);

    confidence += profileConfidence * 0.30;

    const sample =
      Number(profile.sample || runner.sample || 0);

    if (sample >= 30) confidence += 10;
    if (sample >= 100) confidence += 10;

    return this.clamp(confidence, 0, 100);
  }

  cellFit(map, key) {
    if (!map || key === undefined || key === null || key === "") return null;

    const cell =
      map[String(key)] ||
      map[key];

    return this.cellScore(cell);
  }

  cellScore(cell) {
    if (!cell) return null;

    if (cell.score !== undefined) return Number(cell.score);

    if (cell.averageROI !== undefined) {
      return this.clamp(50 + (Number(cell.averageROI) - 1.0) * 80, 0, 100);
    }

    if (cell.winRate !== undefined) {
      return this.clamp(Number(cell.winRate) * 100, 0, 100);
    }

    return null;
  }

  impliedProbability(odds) {
    odds = Number(odds || 0);
    if (odds <= 0) return 0;
    return 1 / odds;
  }

  weightedAverage(items) {
    let total = 0;
    let weight = 0;

    (items || []).forEach(function(item) {
      const v = Number(item.value);
      const w = Number(item.weight || 1);

      if (!isNaN(v)) {
        total += v * w;
        weight += w;
      }
    });

    return weight ? total / weight : 50;
  }

  average(values) {
    if (!values || !values.length) return 0;

    return values.reduce(function(a, b) {
      return Number(a) + Number(b);
    }, 0) / values.length;
  }

  clamp(value, min, max) {
    value = Number(value || 0);
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

}


/**
 * ==========================================================
 * ScenarioEngine
 * ----------------------------------------------------------
 * 複数展開シナリオを生成する。
 * ==========================================================
 */
class ScenarioEngine {

  constructor(params) {
    params = params || {};
    this.version = "1.0.0";
  }

  build(raceContext, evaluatedRunners) {
    raceContext = raceContext || {};
    evaluatedRunners = evaluatedRunners || [];

    const pressure =
      this.calculatePacePressure(raceContext, evaluatedRunners);

    const bias =
      this.calculateBias(raceContext);

    const weights =
      this.calculateScenarioWeights(pressure, bias, raceContext);

    const scenarios = [
      this.createScenario("SLOW", "スロー", weights.SLOW, pressure, bias),
      this.createScenario("MIDDLE", "ミドル", weights.MIDDLE, pressure, bias),
      this.createScenario("HIGH", "ハイ", weights.HIGH, pressure, bias),
      this.createScenario("EXTREME_HIGH", "超ハイ", weights.EXTREME_HIGH, pressure, bias)
    ].filter(function(s) {
      return s.probability > 0.01;
    });

    scenarios.sort(function(a, b) {
      return b.probability - a.probability;
    });

    return {
      pressure: pressure,
      bias: bias,
      scenarios: scenarios,
      primaryScenario: scenarios.length ? scenarios[0] : null
    };
  }

  calculatePacePressure(context, runners) {
    let front = 0;
    let forward = 0;
    let closer = 0;
    let earlyTotal = 0;

    runners.forEach(function(r) {
      const style = r.runningStyle || "";
      const early = Number(r.indexes && r.indexes.start ? r.indexes.start : 50);

      earlyTotal += early;

      if (style === "逃げ" || style === "FRONT" || style === "LEADER") front++;
      else if (style === "先行" || style === "STALKER" || style === "FORWARD") forward++;
      else closer++;
    });

    const field = Math.max(1, runners.length);
    const avgEarly = earlyTotal / field;

    let score = 50;
    score += front * 11;
    score += forward * 3;
    score += (avgEarly - 50) * 0.25;

    const distance = Number(context.distance || 0);
    if (distance > 0 && distance <= 1200) score += 7;
    if (distance >= 2200) score -= 7;

    score = this.clamp(score, 0, 100);

    return {
      score: score,
      frontRunners: front,
      forwardRunners: forward,
      closers: closer,
      averageEarly: avgEarly
    };
  }

  calculateBias(context) {
    let frontBias = 50;
    let outsideBias = 50;
    let staminaBias = 50;

    const trackBias = String(context.trackBias || "");

    if (trackBias.indexOf("前") >= 0 || trackBias.indexOf("内") >= 0) {
      frontBias += 12;
    }

    if (trackBias.indexOf("外") >= 0 || trackBias.indexOf("差") >= 0) {
      outsideBias += 12;
      frontBias -= 8;
    }

    const going = String(context.going || "");
    const moisture = Number(context.moisture || 0);

    if (going === "重" || going === "不良" || moisture >= 14) {
      staminaBias += 12;
      frontBias -= 4;
    }

    const cushion = Number(context.cushionValue || 0);
    if (cushion >= 10) {
      frontBias += 5;
      staminaBias -= 3;
    }

    return {
      frontBias: this.clamp(frontBias, 0, 100),
      outsideBias: this.clamp(outsideBias, 0, 100),
      staminaBias: this.clamp(staminaBias, 0, 100)
    };
  }

  calculateScenarioWeights(pressure, bias, context) {
    let slow = 25;
    let middle = 45;
    let high = 25;
    let extreme = 5;

    const p = pressure.score;

    if (p >= 80) {
      slow -= 15;
      middle -= 8;
      high += 13;
      extreme += 10;
    } else if (p >= 65) {
      slow -= 8;
      middle -= 4;
      high += 10;
      extreme += 2;
    } else if (p <= 35) {
      slow += 15;
      middle += 2;
      high -= 12;
      extreme -= 5;
    }

    if (bias.frontBias >= 65) {
      slow += 4;
      middle += 3;
      high -= 4;
    }

    if (bias.staminaBias >= 65) {
      high += 5;
      extreme += 3;
      slow -= 4;
    }

    slow = Math.max(1, slow);
    middle = Math.max(1, middle);
    high = Math.max(1, high);
    extreme = Math.max(0, extreme);

    const total = slow + middle + high + extreme;

    return {
      SLOW: slow / total,
      MIDDLE: middle / total,
      HIGH: high / total,
      EXTREME_HIGH: extreme / total
    };
  }

  createScenario(type, label, probability, pressure, bias) {
    const favor = this.favor(type, bias);

    return {
      id: "SCENARIO_" + type,
      type: type,
      label: label,
      probability: probability,
      favorableStyles: favor.favorableStyles,
      unfavorableStyles: favor.unfavorableStyles,
      positionAdvantage: favor.positionAdvantage,
      staminaDemand: favor.staminaDemand,
      volatility: favor.volatility,
      risk: favor.risk,
      evidence: {
        pressure: pressure,
        bias: bias
      }
    };
  }

  favor(type, bias) {
    const data = {
      favorableStyles: [],
      unfavorableStyles: [],
      positionAdvantage: 50,
      staminaDemand: 50,
      volatility: 0.22,
      risk: 0.22
    };

    if (type === "SLOW") {
      data.favorableStyles = ["逃げ", "先行", "瞬発型"];
      data.unfavorableStyles = ["追込"];
      data.positionAdvantage = 70;
      data.staminaDemand = 35;
      data.volatility = 0.18;
      data.risk = 0.18;
    } else if (type === "MIDDLE") {
      data.favorableStyles = ["先行", "差し", "総合型"];
      data.positionAdvantage = 55;
      data.staminaDemand = 50;
    } else if (type === "HIGH") {
      data.favorableStyles = ["差し", "追込", "持続型"];
      data.unfavorableStyles = ["逃げ"];
      data.positionAdvantage = 42;
      data.staminaDemand = 70;
      data.volatility = 0.32;
      data.risk = 0.30;
    } else {
      data.favorableStyles = ["差し", "追込", "消耗戦型"];
      data.unfavorableStyles = ["逃げ", "先行"];
      data.positionAdvantage = 35;
      data.staminaDemand = 85;
      data.volatility = 0.45;
      data.risk = 0.42;
    }

    if (bias.frontBias >= 65) {
      if (data.favorableStyles.indexOf("逃げ") < 0) data.favorableStyles.push("逃げ");
      if (data.favorableStyles.indexOf("先行") < 0) data.favorableStyles.push("先行");
      data.positionAdvantage += 5;
    }

    if (bias.outsideBias >= 65) {
      if (data.favorableStyles.indexOf("差し") < 0) data.favorableStyles.push("差し");
    }

    data.positionAdvantage = this.clamp(data.positionAdvantage, 0, 100);
    data.staminaDemand = this.clamp(data.staminaDemand, 0, 100);

    return data;
  }

  clamp(v, min, max) {
    v = Number(v || 0);
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

}


/**
 * ==========================================================
 * RaceSimulator
 * ----------------------------------------------------------
 * Scenario別に着順分布を推定する。
 * ==========================================================
 */
class RaceSimulator {

  constructor(params) {
    params = params || {};
    this.version = "1.0.0";
    this.iterations = Number(params.iterations || 3000);
  }

  run(raceContext, runners, scenarios, options) {
    raceContext = raceContext || {};
    runners = runners || [];
    scenarios = scenarios || [];
    options = options || {};

    const iterations = Number(options.iterations || this.iterations);
    const aggregate = this.createAggregate(runners);
    const scenarioResults = [];

    scenarios.forEach(function(scenario) {
      const sr = this.simulateScenario(raceContext, runners, scenario, iterations);
      scenarioResults.push(sr);
      this.merge(aggregate, sr, scenario.probability);
    }, this);

    const ranking =
      this.buildRanking(aggregate);

    return {
      iterations: iterations,
      scenarioResults: scenarioResults,
      runners: ranking,
      combinations: this.buildCombinations(aggregate),
      summary: {
        topHorse: ranking.length ? ranking[0] : null
      }
    };
  }

  simulateScenario(context, runners, scenario, iterations) {
    const counts = this.createCounts(runners);

    for (let i = 0; i < iterations; i++) {
      const ordered =
        runners.map(function(runner) {
          return {
            runner: runner,
            score: this.simScore(runner, scenario)
          };
        }, this).sort(function(a, b) {
          return b.score - a.score;
        });

      ordered.forEach(function(item, index) {
        const id = item.runner.runnerId;
        const finish = index + 1;
        const c = counts[id];

        c.runs++;
        c.finishSum += finish;

        if (finish === 1) c.win++;
        if (finish <= 2) c.top2++;
        if (finish <= 3) c.top3++;

        c.dist[finish] = (c.dist[finish] || 0) + 1;
      });
    }

    return {
      scenarioId: scenario.id,
      scenarioType: scenario.type,
      probability: scenario.probability,
      runners: Object.keys(counts).map(function(id) {
        const c = counts[id];
        const runs = Math.max(1, c.runs);

        return {
          runnerId: id,
          horseId: c.runner.horseId,
          name: c.runner.name,
          winRate: c.win / runs,
          quinellaRate: c.top2 / runs,
          placeRate: c.top3 / runs,
          averageFinish: c.finishSum / runs,
          finishDistribution: this.normalizeDist(c.dist, runs)
        };
      }, this)
    };
  }

  simScore(runner, scenario) {
    let score = Number(runner.finalScore || 50);

    const style = runner.runningStyle || "";

    if ((scenario.favorableStyles || []).indexOf(style) >= 0) score += 6;
    if ((scenario.unfavorableStyles || []).indexOf(style) >= 0) score -= 7;

    const idx = runner.indexes || {};

    score += (Number(idx.stamina || 50) - Number(scenario.staminaDemand || 50)) * 0.10;
    score += (Number(idx.finish || 50) - 50) * (scenario.type === "HIGH" || scenario.type === "EXTREME_HIGH" ? 0.14 : 0.07);
    score += (Number(idx.start || 50) - 50) * (scenario.type === "SLOW" ? 0.12 : 0.05);

    score -= Number(runner.riskScore || 35) * 0.05;

    const volatility = this.clamp(Number(scenario.volatility || 0.22) * 10 + (100 - Number(runner.confidence || 50)) * 0.04, 2, 15);
    score += this.randomNormal() * volatility;

    return score;
  }

  createCounts(runners) {
    const counts = {};

    runners.forEach(function(r) {
      counts[r.runnerId] = {
        runner: r,
        runs: 0,
        win: 0,
        top2: 0,
        top3: 0,
        finishSum: 0,
        dist: {}
      };
    });

    return counts;
  }

  createAggregate(runners) {
    const agg = {};
    runners.forEach(function(r) {
      agg[r.runnerId] = {
        runner: r,
        winRate: 0,
        quinellaRate: 0,
        placeRate: 0,
        averageFinish: 0,
        finishDistribution: {}
      };
    });
    return agg;
  }

  merge(aggregate, scenarioResult, probability) {
    probability = Number(probability || 0);

    scenarioResult.runners.forEach(function(r) {
      const a = aggregate[r.runnerId];
      if (!a) return;

      a.winRate += r.winRate * probability;
      a.quinellaRate += r.quinellaRate * probability;
      a.placeRate += r.placeRate * probability;
      a.averageFinish += r.averageFinish * probability;

      Object.keys(r.finishDistribution || {}).forEach(function(k) {
        a.finishDistribution[k] = (a.finishDistribution[k] || 0) + r.finishDistribution[k] * probability;
      });
    });
  }

  buildRanking(aggregate) {
    return Object.keys(aggregate).map(function(id) {
      const a = aggregate[id];
      return {
        runnerId: id,
        horseId: a.runner.horseId,
        name: a.runner.name,
        number: a.runner.number,
        winRate: a.winRate,
        quinellaRate: a.quinellaRate,
        placeRate: a.placeRate,
        averageFinish: a.averageFinish,
        finishDistribution: a.finishDistribution,
        finalScore: a.runner.finalScore,
        confidence: a.runner.confidence,
        riskScore: a.runner.riskScore,
        odds: a.runner.market ? a.runner.market.odds : 0,
        simulationScore: a.winRate * 100 + a.quinellaRate * 40 + a.placeRate * 20 - a.averageFinish
      };
    }).sort(function(a, b) {
      return b.simulationScore - a.simulationScore;
    });
  }

  buildCombinations(aggregate) {
    const ids = Object.keys(aggregate);
    const win = {};
    const quinella = {};
    const wide = {};

    ids.forEach(function(id) {
      win[id] = aggregate[id].winRate;
    });

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i];
        const b = ids[j];
        const key = a + "-" + b;

        quinella[key] =
          this.clamp(aggregate[a].quinellaRate * aggregate[b].quinellaRate, 0, 1);

        wide[key] =
          this.clamp(aggregate[a].placeRate * aggregate[b].placeRate, 0, 1);
      }
    }

    return {
      win: win,
      quinella: quinella,
      wide: wide
    };
  }

  normalizeDist(dist, runs) {
    const out = {};
    Object.keys(dist || {}).forEach(function(k) {
      out[k] = Number(dist[k] || 0) / Math.max(1, runs);
    });
    return out;
  }

  randomNormal() {
    let u = 0;
    let v = 0;

    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();

    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  clamp(v, min, max) {
    v = Number(v || 0);
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

}


/**
 * ==========================================================
 * ACEEngine
 * ----------------------------------------------------------
 * Brain結果・Simulation結果・市場評価を統合する。
 * ==========================================================
 */
class ACEEngine {

  constructor(params) {
    params = params || {};
    this.version = "1.0.0";
  }

  run(raceContext, evaluatedRunners, simulationResult) {
    raceContext = raceContext || {};
    evaluatedRunners = evaluatedRunners || [];
    simulationResult = simulationResult || {};

    const simMap = {};
    (simulationResult.runners || []).forEach(function(r) {
      simMap[r.runnerId] = r;
    });

    const runners =
      evaluatedRunners.map(function(r) {
        const sim = simMap[r.runnerId] || {};

        const winRate = Number(sim.winRate || 0);
        const odds = Number(r.market && r.market.odds ? r.market.odds : 0);
        const implied = odds > 0 ? 1 / odds : 0;

        const ev =
          odds > 0
            ? winRate * odds
            : 0;

        const marketGap =
          winRate - implied;

        const aceScore =
          this.clamp(
            r.finalScore * 0.45 +
            winRate * 100 * 0.35 +
            r.confidence * 0.10 +
            this.clamp((ev - 1) * 50 + 50, 0, 100) * 0.10 -
            Math.max(0, r.riskScore - 50) * 0.15,
            0,
            100
          );

        return Object.assign({}, r, {
          simulation: sim,
          winRate: winRate,
          quinellaRate: Number(sim.quinellaRate || 0),
          placeRate: Number(sim.placeRate || 0),
          averageFinish: Number(sim.averageFinish || 0),
          ev: ev,
          marketGap: marketGap,
          aceScore: aceScore,
          aceRankReason: this.reason(r, sim, ev, marketGap)
        });
      }, this)
      .sort(function(a, b) {
        return b.aceScore - a.aceScore;
      });

    const raceRisk =
      this.evaluateRaceRisk(raceContext, runners, simulationResult);

    const marketOpportunity =
      this.evaluateMarketOpportunity(runners);

    return {
      engine: "ACEEngine",
      version: this.version,
      runners: runners,
      top: runners.length ? runners[0] : null,
      raceRisk: raceRisk,
      marketOpportunity: marketOpportunity,
      decision: this.decideRace(raceRisk, marketOpportunity, runners),
      createdAt: new Date()
    };
  }

  reason(r, sim, ev, gap) {
    const reasons = [];

    if (r.finalScore >= 75) reasons.push("総合評価が高い");
    if (Number(sim.winRate || 0) >= 0.20) reasons.push("シミュレーション勝率が高い");
    if (ev >= 1.10) reasons.push("単勝期待値が高い");
    if (gap >= 0.03) reasons.push("市場評価より勝率が高い");
    if (r.riskScore >= 65) reasons.push("リスクは高め");

    if (!reasons.length) reasons.push("総合評価で上位");

    return reasons;
  }

  evaluateRaceRisk(context, runners, simulation) {
    let risk = 40;

    const top = runners[0];
    const second = runners[1];

    if (top && second && (top.aceScore - second.aceScore) < 5) risk += 15;

    const highRiskCount =
      runners.filter(function(r) {
        return Number(r.riskScore || 0) >= 65;
      }).length;

    risk += highRiskCount * 2;

    if (simulation && simulation.scenarioResults && simulation.scenarioResults.length >= 4) {
      risk += 5;
    }

    return this.clamp(risk, 0, 100);
  }

  evaluateMarketOpportunity(runners) {
    if (!runners || !runners.length) return 0;

    const best =
      runners.reduce(function(max, r) {
        return Math.max(max, Number(r.ev || 0));
      }, 0);

    return this.clamp((best - 1) * 100 + 50, 0, 100);
  }

  decideRace(risk, opportunity, runners) {
    if (!runners.length) {
      return {
        action: "SKIP",
        grade: "見送り",
        reason: "出走馬評価なし"
      };
    }

    const top = runners[0];

    if (risk >= 80) {
      return {
        action: "SKIP",
        grade: "見送り",
        reason: "レース不確実性が高い"
      };
    }

    if (top.ev >= 1.25 && top.aceScore >= 78 && opportunity >= 70) {
      return {
        action: "BET",
        grade: "S",
        reason: "高評価かつ期待値あり"
      };
    }

    if (top.ev >= 1.12 && top.aceScore >= 70) {
      return {
        action: "BET",
        grade: "A",
        reason: "期待値あり"
      };
    }

    if (top.aceScore >= 65 && opportunity >= 60) {
      return {
        action: "LIGHT_BET",
        grade: "B",
        reason: "軽勝負候補"
      };
    }

    return {
      action: "SKIP",
      grade: "見送り",
      reason: "期待値不足"
    };
  }

  clamp(v, min, max) {
    v = Number(v || 0);
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

}


/**
 * ==========================================================
 * AIBrain
 * ----------------------------------------------------------
 * Phase3統合ファサード。
 * ==========================================================
 */
class AIBrain {

  constructor(params) {
    params = params || {};

    this.version = "1.0.0";
    this.cache = new BrainCache();

    this.horseBrain =
      params.horseBrain || new HorseBrain({
        cache: this.cache
      });

    this.scenarioEngine =
      params.scenarioEngine || new ScenarioEngine();

    this.raceSimulator =
      params.raceSimulator || new RaceSimulator({
        iterations: params.iterations || 3000
      });

    this.aceEngine =
      params.aceEngine || new ACEEngine();

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * レース分析メイン
   */
  analyzeRace(input) {
    input = input || {};

    const context =
      this.buildRaceContext(input);

    const runners =
      input.runners ||
      input.horses ||
      [];

    const evaluated =
      runners.map(function(runner) {
        return this.horseBrain.evaluateRunner(runner, context);
      }, this);

    const scenarioPack =
      this.scenarioEngine.build(context, evaluated);

    const simulation =
      this.raceSimulator.run(
        context,
        evaluated,
        scenarioPack.scenarios,
        {
          iterations: input.iterations
        }
      );

    const ace =
      this.aceEngine.run(
        context,
        evaluated,
        simulation
      );

    const result = {
      engine: "AIBrain",
      version: this.version,
      raceId: context.raceId,
      context: context,
      evaluatedRunners: evaluated,
      scenarios: scenarioPack,
      simulation: simulation,
      ace: ace,
      primaryScenario: scenarioPack.primaryScenario,
      topHorse: ace.top,
      raceRisk: ace.raceRisk,
      marketOpportunity: ace.marketOpportunity,
      decision: ace.decision,
      explanations: ExplainEngine.buildRaceExplanation({
        primaryScenario: scenarioPack.primaryScenario,
        topHorse: ace.top,
        raceRisk: ace.raceRisk,
        marketOpportunity: ace.marketOpportunity
      }),
      createdAt: new Date()
    };

    this.updatedAt = new Date();

    return result;
  }

  buildRaceContext(input) {
    const race = input.race || input.context || {};

    return {
      raceId: race.id || input.raceId || "",
      date: race.date || input.date || "",
      course: race.course || race.track || "",
      surface: race.surface || "",
      distance: Number(race.distance || 0),
      going: race.going || "",
      raceClass: race.raceClass || race.className || "",
      fieldSize: Number(race.fieldSize || (input.runners || input.horses || []).length || 0),
      weather: race.weather || "",
      cushionValue: Number(race.cushionValue || 0),
      moisture: Number(race.moisture || 0),
      trackBias: race.trackBias || "",
      pace: race.pace || ""
    };
  }

  toJSON() {
    return {
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

}


/**
 * ==========================================================
 * GAS Test Helper
 * ==========================================================
 */
function testAIBrainProduction() {
  const brain = new AIBrain({
    iterations: 500
  });

  const result = brain.analyzeRace({
    race: {
      id: "TEST_RACE",
      course: "東京",
      surface: "芝",
      distance: 1600,
      going: "良",
      raceClass: "G2",
      fieldSize: 3,
      trackBias: "外差し"
    },
    runners: [
      {
        horseId: "H001",
        name: "Alpha",
        number: 1,
        runningStyle: "差し",
        abilityIndex: 78,
        speedIndex: 75,
        staminaIndex: 70,
        finishIndex: 82,
        startIndex: 55,
        consistencyIndex: 70,
        odds: 4.2,
        predictedProbability: 0.28,
        profile: {
          currentAbility: 78,
          confidence: 70,
          sample: 80
        }
      },
      {
        horseId: "H002",
        name: "Bravo",
        number: 2,
        runningStyle: "逃げ",
        abilityIndex: 74,
        speedIndex: 80,
        staminaIndex: 63,
        finishIndex: 65,
        startIndex: 84,
        consistencyIndex: 60,
        odds: 3.0,
        predictedProbability: 0.24,
        profile: {
          currentAbility: 74,
          confidence: 65,
          sample: 60
        }
      },
      {
        horseId: "H003",
        name: "Charlie",
        number: 3,
        runningStyle: "先行",
        abilityIndex: 70,
        speedIndex: 70,
        staminaIndex: 72,
        finishIndex: 68,
        startIndex: 70,
        consistencyIndex: 75,
        odds: 8.0,
        predictedProbability: 0.16,
        profile: {
          currentAbility: 70,
          confidence: 60,
          sample: 55
        }
      }
    ]
  });

  Logger.log(JSON.stringify(result.decision, null, 2));
  Logger.log(JSON.stringify(result.ace.runners, null, 2));

  return result;
}
