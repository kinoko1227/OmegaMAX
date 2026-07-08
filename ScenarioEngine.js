/**
 * ==========================================================
 * ΩMAX AIOS
 * ScenarioEngine.js
 * ----------------------------------------------------------
 * Scenario Engine v1.0.0
 *
 * レース展開を単一予想ではなく、複数シナリオとして生成する。
 *
 * 目的:
 * - スロー / ミドル / ハイ / 超ハイなどの展開候補を作る
 * - 各シナリオの発生確率を推定する
 * - 各シナリオで有利な脚質・位置取り・馬群構成を推定する
 * - RaceSimulator / ACEEngine / TicketEngine へ渡す
 *
 * GAS V8 compatible.
 * ==========================================================
 */

class ScenarioEngine {

  constructor() {
    this.version = "1.0.0";
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.records = [];
  }

  /**
   * メイン実行
   *
   * @param {Object} raceInput
   * @returns {Object}
   */
  run(raceInput) {
    raceInput = raceInput || {};

    const context = this.buildContext(raceInput);
    const pressure = this.calculatePacePressure(context);
    const bias = this.calculateTrackBias(context);
    const scenarioWeights = this.calculateScenarioWeights(context, pressure, bias);
    const scenarios = this.buildScenarios(context, pressure, bias, scenarioWeights);

    const result = {
      engine: "ScenarioEngine",
      version: this.version,
      raceId: context.raceId,
      context: context,
      pacePressure: pressure,
      trackBias: bias,
      scenarios: scenarios,
      summary: this.summarize(scenarios),
      createdAt: new Date()
    };

    this.records.push(result);
    this.touch();

    return result;
  }

  /**
   * 入力を標準化
   */
  buildContext(input) {
    const horses = input.horses || [];
    const race = input.race || {};
    const raceMemory = input.raceMemory || null;
    const marketMemory = input.marketMemory || null;

    return {
      raceId: race.id || input.raceId || "",
      course: race.course || race.track || "",
      surface: race.surface || "",
      distance: Number(race.distance || 0),
      going: race.going || "",
      raceClass: race.raceClass || race.className || "",
      fieldSize: Number(race.fieldSize || horses.length || 0),
      weather: race.weather || "",
      cushionValue: Number(race.cushionValue || 0),
      moisture: Number(race.moisture || 0),
      trackBias: race.trackBias || "",
      horses: horses,
      raceMemory: raceMemory,
      marketMemory: marketMemory
    };
  }

  /**
   * ペース圧力を計算
   *
   * 逃げ・先行馬の数、騎手の積極性、枠、距離から、
   * 前半が速くなりやすいかを推定する。
   */
  calculatePacePressure(context) {
    const horses = context.horses || [];

    let frontRunners = 0;
    let stalkers = 0;
    let closers = 0;
    let aggressiveJockeys = 0;
    let insideSpeed = 0;
    let totalEarly = 0;

    horses.forEach(function(horse) {
      const style = String(horse.runningStyle || horse.style || "").toUpperCase();
      const early = Number(horse.earlySpeed || horse.startIndex || horse.speedIndex || 0);
      const frame = Number(horse.frameNumber || 0);
      const jockeyAggression = Number(horse.jockeyAggression || 0);

      totalEarly += early;

      if (style === "逃げ" || style === "FRONT" || style === "LEADER") {
        frontRunners++;
      } else if (style === "先行" || style === "STALKER" || style === "FORWARD") {
        stalkers++;
      } else if (style === "差し" || style === "追込" || style === "CLOSER" || style === "DEEP") {
        closers++;
      }

      if (jockeyAggression >= 70) {
        aggressiveJockeys++;
      }

      if (frame > 0 && frame <= 3 && early >= 70) {
        insideSpeed++;
      }
    });

    const fieldSize = Math.max(1, Number(context.fieldSize || horses.length || 1));
    const avgEarly = totalEarly / fieldSize;

    let score = 50;
    score += frontRunners * 10;
    score += stalkers * 3;
    score += aggressiveJockeys * 4;
    score += insideSpeed * 5;
    score += Utils.clamp((avgEarly - 50) * 0.3, -10, 15);

    if (context.distance > 0 && context.distance <= 1200) {
      score += 8;
    } else if (context.distance >= 2200) {
      score -= 8;
    }

    score = Utils.clamp(score, 0, 100);

    return {
      score: score,
      frontRunners: frontRunners,
      stalkers: stalkers,
      closers: closers,
      aggressiveJockeys: aggressiveJockeys,
      insideSpeed: insideSpeed,
      averageEarlySpeed: avgEarly
    };
  }

  /**
   * トラックバイアスを簡易評価
   */
  calculateTrackBias(context) {
    let frontBias = 50;
    let outsideBias = 50;
    let staminaBias = 50;

    const bias = String(context.trackBias || "");

    if (bias.indexOf("前") >= 0 || bias.indexOf("内") >= 0) {
      frontBias += 12;
    }

    if (bias.indexOf("外") >= 0 || bias.indexOf("差") >= 0) {
      outsideBias += 12;
      frontBias -= 8;
    }

    if (context.going === "重" || context.going === "不良" || context.moisture >= 14) {
      staminaBias += 12;
      frontBias -= 3;
    }

    if (context.cushionValue >= 10) {
      frontBias += 5;
      staminaBias -= 4;
    }

    return {
      frontBias: Utils.clamp(frontBias, 0, 100),
      outsideBias: Utils.clamp(outsideBias, 0, 100),
      staminaBias: Utils.clamp(staminaBias, 0, 100),
      rawTrackBias: context.trackBias || ""
    };
  }

  /**
   * シナリオ発生確率を計算
   */
  calculateScenarioWeights(context, pressure, bias) {
    let slow = 25;
    let middle = 45;
    let high = 25;
    let extremeHigh = 5;

    const p = Number(pressure.score || 50);

    if (p >= 80) {
      high += 15;
      extremeHigh += 10;
      slow -= 15;
      middle -= 10;
    } else if (p >= 65) {
      high += 12;
      slow -= 8;
      middle -= 4;
    } else if (p <= 35) {
      slow += 15;
      high -= 10;
      extremeHigh -= 3;
    } else if (p <= 45) {
      slow += 8;
      high -= 5;
    }

    if (bias.frontBias >= 65) {
      slow += 3;
      middle += 2;
      high -= 3;
    }

    if (bias.staminaBias >= 65) {
      high += 4;
      extremeHigh += 2;
      slow -= 3;
    }

    slow = Math.max(1, slow);
    middle = Math.max(1, middle);
    high = Math.max(1, high);
    extremeHigh = Math.max(0, extremeHigh);

    const total = slow + middle + high + extremeHigh;

    return {
      SLOW: slow / total,
      MIDDLE: middle / total,
      HIGH: high / total,
      EXTREME_HIGH: extremeHigh / total
    };
  }

  /**
   * シナリオ作成
   */
  buildScenarios(context, pressure, bias, weights) {
    const scenarios = [];

    scenarios.push(this.createScenario("SLOW", weights.SLOW, context, pressure, bias));
    scenarios.push(this.createScenario("MIDDLE", weights.MIDDLE, context, pressure, bias));
    scenarios.push(this.createScenario("HIGH", weights.HIGH, context, pressure, bias));
    scenarios.push(this.createScenario("EXTREME_HIGH", weights.EXTREME_HIGH, context, pressure, bias));

    return scenarios
      .filter(function(s) {
        return s.probability > 0.005;
      })
      .sort(function(a, b) {
        return b.probability - a.probability;
      });
  }

  /**
   * 個別シナリオ
   */
  createScenario(type, probability, context, pressure, bias) {
    const favor = this.estimateScenarioFavor(type, context, pressure, bias);

    return {
      id: "SCENARIO_" + type,
      type: type,
      probability: probability,
      paceLabel: this.getPaceLabel(type),
      expectedFlow: this.describeFlow(type, pressure, bias),
      favorableStyles: favor.styles,
      unfavorableStyles: favor.negativeStyles,
      positionAdvantage: favor.positionAdvantage,
      staminaDemand: favor.staminaDemand,
      volatility: favor.volatility,
      risk: favor.risk,
      evidence: {
        pacePressure: pressure,
        trackBias: bias,
        fieldSize: context.fieldSize,
        distance: context.distance,
        going: context.going,
        cushionValue: context.cushionValue
      }
    };
  }

  getPaceLabel(type) {
    if (type === "SLOW") return "スロー";
    if (type === "MIDDLE") return "ミドル";
    if (type === "HIGH") return "ハイ";
    if (type === "EXTREME_HIGH") return "超ハイ";
    return "不明";
  }

  describeFlow(type, pressure, bias) {
    if (type === "SLOW") {
      return "前半は落ち着きやすく、位置取りと瞬発力が重要。";
    }
    if (type === "MIDDLE") {
      return "平均的な流れで、総合力とコース適性が反映されやすい。";
    }
    if (type === "HIGH") {
      return "前半から流れやすく、先行馬の消耗と差し馬の台頭を考慮。";
    }
    if (type === "EXTREME_HIGH") {
      return "かなり速い流れになりやすく、スタミナ・持続力・差し性能が重要。";
    }
    return "";
  }

  estimateScenarioFavor(type, context, pressure, bias) {
    const result = {
      styles: [],
      negativeStyles: [],
      positionAdvantage: 50,
      staminaDemand: 50,
      volatility: 0.2,
      risk: 0.2
    };

    if (type === "SLOW") {
      result.styles = ["逃げ", "先行", "瞬発型"];
      result.negativeStyles = ["追込"];
      result.positionAdvantage = 70;
      result.staminaDemand = 35;
      result.volatility = 0.18;
      result.risk = 0.18;
    } else if (type === "MIDDLE") {
      result.styles = ["先行", "差し", "総合型"];
      result.negativeStyles = [];
      result.positionAdvantage = 55;
      result.staminaDemand = 50;
      result.volatility = 0.22;
      result.risk = 0.22;
    } else if (type === "HIGH") {
      result.styles = ["差し", "持続型", "スタミナ型"];
      result.negativeStyles = ["逃げ"];
      result.positionAdvantage = 42;
      result.staminaDemand = 70;
      result.volatility = 0.32;
      result.risk = 0.30;
    } else if (type === "EXTREME_HIGH") {
      result.styles = ["差し", "追込", "消耗戦型"];
      result.negativeStyles = ["逃げ", "先行"];
      result.positionAdvantage = 35;
      result.staminaDemand = 85;
      result.volatility = 0.45;
      result.risk = 0.42;
    }

    if (bias.frontBias >= 65) {
      result.positionAdvantage += 8;
      if (result.styles.indexOf("逃げ") < 0) result.styles.push("逃げ");
      if (result.styles.indexOf("先行") < 0) result.styles.push("先行");
    }

    if (bias.outsideBias >= 65) {
      if (result.styles.indexOf("差し") < 0) result.styles.push("差し");
    }

    result.positionAdvantage = Utils.clamp(result.positionAdvantage, 0, 100);
    result.staminaDemand = Utils.clamp(result.staminaDemand, 0, 100);

    return result;
  }

  /**
   * 要約
   */
  summarize(scenarios) {
    scenarios = scenarios || [];

    let primary = scenarios.length ? scenarios[0] : null;

    return {
      primaryScenario: primary ? primary.type : "",
      primaryLabel: primary ? primary.paceLabel : "",
      primaryProbability: primary ? primary.probability : 0,
      scenarioCount: scenarios.length,
      totalProbability: scenarios.reduce(function(total, s) {
        return total + Number(s.probability || 0);
      }, 0)
    };
  }

  /**
   * 更新日時
   */
  touch() {
    this.updatedAt = new Date();
    return this;
  }

  /**
   * JSON
   */
  toJSON() {
    return {
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      records: this.records
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
    this.createdAt = json.createdAt || new Date();
    this.updatedAt = json.updatedAt || new Date();
    this.records = json.records || [];

    return this;
  }

  /**
   * Factory
   */
  static fromJSON(json) {
    return new ScenarioEngine().load(json || {});
  }

}
