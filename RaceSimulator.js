/**
 * ==========================================================
 * ΩMAX AIOS
 * RaceSimulator.js
 * ----------------------------------------------------------
 * Race Simulator v1.0.0
 *
 * ScenarioEngine が作成した複数展開シナリオを使い、
 * 各馬の着順分布・勝率・連対率・複勝率を推定する。
 *
 * 目的:
 * - 1頭ごとの「強さ」ではなく、レース内での相対的な結果分布を出す
 * - スロー / ミドル / ハイ / 超ハイの各シナリオを反映する
 * - HorseBrain / JockeyProfile / TrainerProfile / BloodlineProfile / RaceMemory を受け取れる
 * - EVEngine / TicketEngine が使える確率データを返す
 *
 * GAS V8 compatible.
 * ==========================================================
 */

class RaceSimulator {

  constructor(params) {
    params = params || {};

    this.version = "1.0.0";

    this.defaultIterations =
      Number(params.iterations || 5000);

    this.maxIterations =
      Number(params.maxIterations || 20000);

    this.minIterations =
      Number(params.minIterations || 500);

    this.randomSeed =
      params.randomSeed || null;

    this.records = [];

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Main
   *
   * @param {Object} input
   * @returns {Object}
   */
  run(input) {
    input = input || {};

    const normalized = this.normalizeInput(input);

    const iterations =
      this.resolveIterations(input.iterations);

    const scenarioResults = [];

    const aggregate =
      this.createAggregate(normalized.runners);

    normalized.scenarios.forEach(function(scenario) {

      const scenarioResult =
        this.simulateScenario(
          normalized,
          scenario,
          iterations
        );

      scenarioResults.push(scenarioResult);

      this.mergeScenarioResult(
        aggregate,
        scenarioResult,
        scenario.probability
      );

    }, this);

    const rankings =
      this.buildRankings(aggregate);

    const combinations =
      this.buildCombinationProbabilities(
        aggregate,
        normalized.runners
      );

    const result = {
      engine: "RaceSimulator",
      version: this.version,
      raceId: normalized.raceId,
      iterations: iterations,
      totalScenarioProbability:
        this.totalScenarioProbability(normalized.scenarios),
      scenarios: scenarioResults,
      runners: rankings,
      combinations: combinations,
      summary: this.buildSummary(rankings, scenarioResults),
      evidence: {
        scenarioCount: normalized.scenarios.length,
        runnerCount: normalized.runners.length,
        generatedAt: new Date()
      },
      createdAt: new Date()
    };

    this.records.push(result);
    this.touch();

    return result;
  }

  /**
   * 入力標準化
   */
  normalizeInput(input) {
    const race = input.race || {};
    const runners = this.normalizeRunners(input.runners || input.horses || []);
    const scenarios = this.normalizeScenarios(input.scenarios || []);

    return {
      raceId: race.id || input.raceId || "",
      race: race,
      runners: runners,
      scenarios: scenarios.length
        ? scenarios
        : this.defaultScenarios(),
      raceMemory: input.raceMemory || null,
      marketMemory: input.marketMemory || null
    };
  }

  /**
   * 出走馬標準化
   */
  normalizeRunners(rows) {
    return (rows || []).map(function(row, index) {

      const brain =
        row.brain ||
        row.horseBrain ||
        {};

      const profile =
        row.profile ||
        row.horseProfile ||
        {};

      const market =
        row.market ||
        {};

      return {
        runnerId:
          row.runnerId ||
          row.horseId ||
          row.id ||
          ("RUNNER_" + (index + 1)),

        horseId:
          row.horseId ||
          row.id ||
          "",

        name:
          row.name ||
          row.horseName ||
          "",

        number:
          Number(row.number || row.horseNumber || index + 1),

        frameNumber:
          Number(row.frameNumber || row.frame || 0),

        runningStyle:
          row.runningStyle ||
          row.style ||
          "",

        baseScore:
          Number(
            row.baseScore ||
            row.aceScore ||
            brain.score ||
            brain.aceScore ||
            profile.currentAbility ||
            50
          ),

        confidence:
          Number(
            row.confidence ||
            brain.confidence ||
            profile.confidence ||
            0
          ),

        volatility:
          Number(
            row.volatility ||
            brain.volatility ||
            0.20
          ),

        risk:
          Number(
            row.risk ||
            brain.risk ||
            0
          ),

        earlySpeed:
          Number(
            row.earlySpeed ||
            row.startIndex ||
            profile.startIndex ||
            profile.speedIndex ||
            50
          ),

        stamina:
          Number(
            row.stamina ||
            row.staminaIndex ||
            profile.staminaIndex ||
            50
          ),

        finish:
          Number(
            row.finishIndex ||
            row.lateSpeed ||
            profile.finishIndex ||
            50
          ),

        corner:
          Number(
            row.cornerIndex ||
            profile.cornerIndex ||
            50
          ),

        power:
          Number(
            row.powerIndex ||
            profile.powerIndex ||
            50
          ),

        mental:
          Number(
            row.mentalIndex ||
            profile.mentalIndex ||
            50
          ),

        consistency:
          Number(
            row.consistencyIndex ||
            profile.consistencyIndex ||
            50
          ),

        odds:
          Number(row.odds || market.odds || 0),

        popularity:
          Number(row.popularity || market.popularity || 0),

        raw: row
      };

    });
  }

  /**
   * シナリオ標準化
   */
  normalizeScenarios(scenarios) {
    return (scenarios || []).map(function(scenario) {
      return {
        id: scenario.id || "",
        type: scenario.type || "MIDDLE",
        paceLabel: scenario.paceLabel || scenario.type || "MIDDLE",
        probability:
          scenario.probability !== undefined
            ? Number(scenario.probability)
            : 0,
        favorableStyles: scenario.favorableStyles || [],
        unfavorableStyles: scenario.unfavorableStyles || [],
        positionAdvantage:
          Number(scenario.positionAdvantage || 50),
        staminaDemand:
          Number(scenario.staminaDemand || 50),
        volatility:
          Number(scenario.volatility || 0.25),
        risk:
          Number(scenario.risk || 0.20),
        evidence: scenario.evidence || {}
      };
    });
  }

  /**
   * デフォルトシナリオ
   */
  defaultScenarios() {
    return [
      {
        id: "SCENARIO_SLOW",
        type: "SLOW",
        paceLabel: "スロー",
        probability: 0.25,
        favorableStyles: ["逃げ", "先行"],
        unfavorableStyles: ["追込"],
        positionAdvantage: 70,
        staminaDemand: 35,
        volatility: 0.18,
        risk: 0.18,
        evidence: {}
      },
      {
        id: "SCENARIO_MIDDLE",
        type: "MIDDLE",
        paceLabel: "ミドル",
        probability: 0.50,
        favorableStyles: ["先行", "差し"],
        unfavorableStyles: [],
        positionAdvantage: 55,
        staminaDemand: 50,
        volatility: 0.22,
        risk: 0.22,
        evidence: {}
      },
      {
        id: "SCENARIO_HIGH",
        type: "HIGH",
        paceLabel: "ハイ",
        probability: 0.25,
        favorableStyles: ["差し", "追込"],
        unfavorableStyles: ["逃げ"],
        positionAdvantage: 42,
        staminaDemand: 70,
        volatility: 0.32,
        risk: 0.30,
        evidence: {}
      }
    ];
  }

  /**
   * 試行回数決定
   */
  resolveIterations(iterations) {
    let n =
      Number(iterations || this.defaultIterations);

    if (n < this.minIterations) {
      n = this.minIterations;
    }

    if (n > this.maxIterations) {
      n = this.maxIterations;
    }

    return Math.floor(n);
  }

  /**
   * シナリオ別シミュレーション
   */
  simulateScenario(normalized, scenario, iterations) {
    const runners = normalized.runners;

    const counts =
      this.createScenarioCounts(runners);

    for (let i = 0; i < iterations; i++) {
      const ordered =
        this.simulateOneRace(
          runners,
          scenario,
          normalized.race,
          i
        );

      ordered.forEach(function(item, index) {
        const id = item.runner.runnerId;
        const finish = index + 1;

        counts[id].runs += 1;

        if (finish === 1) counts[id].wins += 1;
        if (finish === 2) counts[id].seconds += 1;
        if (finish === 3) counts[id].thirds += 1;
        if (finish <= 2) counts[id].top2 += 1;
        if (finish <= 3) counts[id].top3 += 1;

        counts[id].finishSum += finish;

        if (!counts[id].finishDistribution[finish]) {
          counts[id].finishDistribution[finish] = 0;
        }

        counts[id].finishDistribution[finish] += 1;
      });
    }

    const runnersResult =
      Object.keys(counts).map(function(id) {
        const c = counts[id];
        const runs = Math.max(1, c.runs);

        return {
          runnerId: id,
          horseId: c.runner.horseId,
          name: c.runner.name,
          number: c.runner.number,

          winRate: c.wins / runs,
          quinellaRate: c.top2 / runs,
          placeRate: c.top3 / runs,

          secondRate: c.seconds / runs,
          thirdRate: c.thirds / runs,

          averageFinish: c.finishSum / runs,
          finishDistribution:
            this.normalizeDistribution(
              c.finishDistribution,
              runs
            ),

          rawCounts: c
        };
      }, this);

    return {
      scenarioId: scenario.id,
      scenarioType: scenario.type,
      paceLabel: scenario.paceLabel,
      probability: scenario.probability,
      iterations: iterations,
      runners: runnersResult,
      evidence: {
        scenario: scenario
      }
    };
  }

  /**
   * 1レース分を走らせる
   */
  simulateOneRace(runners, scenario, race, iterationIndex) {
    const scored =
      runners.map(function(runner) {
        return {
          runner: runner,
          score:
            this.calculateRunnerScenarioScore(
              runner,
              scenario,
              race,
              iterationIndex
            )
        };
      }, this);

    scored.sort(function(a, b) {
      return b.score - a.score;
    });

    return scored;
  }

  /**
   * 1頭のシナリオ内スコア
   */
  calculateRunnerScenarioScore(runner, scenario, race, iterationIndex) {
    let score = Number(runner.baseScore || 50);

    score += this.styleAdjustment(runner, scenario);
    score += this.positionAdjustment(runner, scenario, race);
    score += this.staminaAdjustment(runner, scenario);
    score += this.finishAdjustment(runner, scenario);
    score += this.riskAdjustment(runner, scenario);
    score += this.marketNoiseAdjustment(runner);

    const volatility =
      this.resolveVolatility(runner, scenario);

    score += this.randomNormal(iterationIndex, runner.number) * volatility;

    return score;
  }

  /**
   * 脚質補正
   */
  styleAdjustment(runner, scenario) {
    const style = runner.runningStyle || "";
    let adj = 0;

    if (this.containsStyle(scenario.favorableStyles, style)) {
      adj += 6;
    }

    if (this.containsStyle(scenario.unfavorableStyles, style)) {
      adj -= 7;
    }

    if (scenario.type === "SLOW") {
      if (style === "逃げ" || style === "先行") adj += 4;
      if (style === "追込") adj -= 5;
    }

    if (scenario.type === "HIGH" || scenario.type === "EXTREME_HIGH") {
      if (style === "差し" || style === "追込") adj += 5;
      if (style === "逃げ") adj -= 6;
    }

    return adj;
  }

  /**
   * 位置取り・枠補正
   */
  positionAdjustment(runner, scenario, race) {
    let adj = 0;

    const frame = Number(runner.frameNumber || 0);
    const positionAdvantage =
      Number(scenario.positionAdvantage || 50);

    if (positionAdvantage >= 65) {
      if (frame > 0 && frame <= 3) {
        adj += 2.5;
      }
      if (runner.earlySpeed >= 65) {
        adj += 3.5;
      }
    }

    if (positionAdvantage <= 40) {
      if (runner.finish >= 65) {
        adj += 3;
      }
      if (runner.earlySpeed >= 75) {
        adj -= 2;
      }
    }

    return adj;
  }

  /**
   * スタミナ補正
   */
  staminaAdjustment(runner, scenario) {
    const demand =
      Number(scenario.staminaDemand || 50);

    const stamina =
      Number(runner.stamina || 50);

    return (stamina - demand) * 0.12;
  }

  /**
   * 末脚補正
   */
  finishAdjustment(runner, scenario) {
    const finish =
      Number(runner.finish || 50);

    if (scenario.type === "SLOW") {
      return (finish - 50) * 0.08;
    }

    if (scenario.type === "HIGH" || scenario.type === "EXTREME_HIGH") {
      return (finish - 50) * 0.12;
    }

    return (finish - 50) * 0.06;
  }

  /**
   * リスク補正
   */
  riskAdjustment(runner, scenario) {
    const risk =
      Number(runner.risk || 0) +
      Number(scenario.risk || 0);

    return -1 * risk * 8;
  }

  /**
   * 市場ノイズ補正
   *
   * 人気は直接能力ではない。
   * ただし、極端な過小評価・過大評価をランダム分散に反映する。
   */
  marketNoiseAdjustment(runner) {
    if (!runner.odds || !runner.popularity) {
      return 0;
    }

    if (runner.odds >= 30) {
      return -1.5;
    }

    if (runner.odds <= 2.0) {
      return 0.8;
    }

    return 0;
  }

  /**
   * 分散解決
   */
  resolveVolatility(runner, scenario) {
    let v =
      Number(runner.volatility || 0.20) +
      Number(scenario.volatility || 0.20);

    const consistency =
      Number(runner.consistency || 50);

    v += (50 - consistency) / 100;

    return Utils.clamp(v * 10, 2, 18);
  }

  /**
   * 乱数
   * GAS標準のMath.randomを使う。
   * 将来Seed対応する場合はここを差し替える。
   */
  randomNormal(iterationIndex, runnerNumber) {
    let u = 0;
    let v = 0;

    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();

    return Math.sqrt(-2.0 * Math.log(u)) *
      Math.cos(2.0 * Math.PI * v);
  }

  containsStyle(list, style) {
    list = list || [];
    if (!style) return false;

    return list.indexOf(style) >= 0;
  }

  /**
   * 集計初期化
   */
  createScenarioCounts(runners) {
    const counts = {};

    runners.forEach(function(runner) {
      counts[runner.runnerId] = {
        runner: runner,
        runs: 0,
        wins: 0,
        seconds: 0,
        thirds: 0,
        top2: 0,
        top3: 0,
        finishSum: 0,
        finishDistribution: {}
      };
    });

    return counts;
  }

  createAggregate(runners) {
    const aggregate = {};

    runners.forEach(function(runner) {
      aggregate[runner.runnerId] = {
        runner: runner,
        winRate: 0,
        quinellaRate: 0,
        placeRate: 0,
        secondRate: 0,
        thirdRate: 0,
        averageFinish: 0,
        finishDistribution: {}
      };
    });

    return aggregate;
  }

  /**
   * シナリオ結果を統合
   */
  mergeScenarioResult(aggregate, scenarioResult, probability) {
    probability = Number(probability || 0);

    scenarioResult.runners.forEach(function(r) {
      const target = aggregate[r.runnerId];

      if (!target) {
        return;
      }

      target.winRate += r.winRate * probability;
      target.quinellaRate += r.quinellaRate * probability;
      target.placeRate += r.placeRate * probability;
      target.secondRate += r.secondRate * probability;
      target.thirdRate += r.thirdRate * probability;
      target.averageFinish += r.averageFinish * probability;

      Object.keys(r.finishDistribution || {}).forEach(function(finish) {
        if (!target.finishDistribution[finish]) {
          target.finishDistribution[finish] = 0;
        }

        target.finishDistribution[finish] +=
          r.finishDistribution[finish] * probability;
      });
    });
  }

  /**
   * ランキング構築
   */
  buildRankings(aggregate) {
    return Object.keys(aggregate || {})
      .map(function(id) {
        const a = aggregate[id];

        return {
          runnerId: id,
          horseId: a.runner.horseId,
          name: a.runner.name,
          number: a.runner.number,
          frameNumber: a.runner.frameNumber,
          runningStyle: a.runner.runningStyle,

          winRate: a.winRate,
          quinellaRate: a.quinellaRate,
          placeRate: a.placeRate,
          secondRate: a.secondRate,
          thirdRate: a.thirdRate,
          averageFinish: a.averageFinish,
          finishDistribution: a.finishDistribution,

          odds: a.runner.odds,
          popularity: a.runner.popularity,

          simulationScore:
            a.winRate * 100 +
            a.quinellaRate * 40 +
            a.placeRate * 20 -
            a.averageFinish
        };
      })
      .sort(function(a, b) {
        return b.simulationScore - a.simulationScore;
      });
  }

  /**
   * 券種用組み合わせ確率
   */
  buildCombinationProbabilities(aggregate, runners) {
    const ids = Object.keys(aggregate || {});

    const win = {};
    const place = {};
    const quinella = {};
    const wide = {};

    ids.forEach(function(id) {
      win[id] = aggregate[id].winRate;
      place[id] = aggregate[id].placeRate;
    });

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i];
        const b = ids[j];
        const key = a + "-" + b;

        const qa =
          aggregate[a].quinellaRate *
          aggregate[b].quinellaRate;

        const wa =
          aggregate[a].placeRate *
          aggregate[b].placeRate;

        quinella[key] = Utils.clamp(qa, 0, 1);
        wide[key] = Utils.clamp(wa, 0, 1);
      }
    }

    return {
      win: win,
      place: place,
      quinella: quinella,
      wide: wide
    };
  }

  normalizeDistribution(distribution, runs) {
    const out = {};

    Object.keys(distribution || {}).forEach(function(key) {
      out[key] =
        Number(distribution[key] || 0) /
        Math.max(1, runs);
    });

    return out;
  }

  totalScenarioProbability(scenarios) {
    return (scenarios || []).reduce(function(total, scenario) {
      return total + Number(scenario.probability || 0);
    }, 0);
  }

  buildSummary(rankings, scenarioResults) {
    const top = rankings.length ? rankings[0] : null;

    return {
      topRunnerId: top ? top.runnerId : "",
      topHorseId: top ? top.horseId : "",
      topName: top ? top.name : "",
      topWinRate: top ? top.winRate : 0,
      topPlaceRate: top ? top.placeRate : 0,
      scenarioCount: scenarioResults.length
    };
  }

  touch() {
    this.updatedAt = new Date();
    return this;
  }

  toJSON() {
    return {
      version: this.version,
      defaultIterations: this.defaultIterations,
      maxIterations: this.maxIterations,
      minIterations: this.minIterations,
      records: this.records,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  load(json) {
    if (!json) {
      return this;
    }

    this.version = json.version || this.version;
    this.defaultIterations = json.defaultIterations || this.defaultIterations;
    this.maxIterations = json.maxIterations || this.maxIterations;
    this.minIterations = json.minIterations || this.minIterations;
    this.records = json.records || [];
    this.createdAt = json.createdAt || new Date();
    this.updatedAt = json.updatedAt || new Date();

    return this;
  }

  static fromJSON(json) {
    return new RaceSimulator().load(json || {});
  }

}
