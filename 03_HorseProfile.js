/**
 * ==========================================================
 * ΩMAX AIOS
 * HorseProfile.js
 * ----------------------------------------------------------
 * Horse Profile v2
 *
 * 馬個体の長期学習Profile
 * ProfileBaseを継承し、過去データ・日次結果から自己更新する。
 * ==========================================================
 */

class HorseProfile extends ProfileBase {

  constructor(horseId) {

    super(horseId || "", "HORSE");

    this.horseId = horseId || "";

    // -------------------------
    // 基本情報
    // -------------------------

    this.name = "";
    this.sex = "";
    this.birthYear = 0;

    // -------------------------
    // 能力
    // -------------------------

    this.peakAbility = 0;
    this.averageAbility = 0;
    this.currentAbility = 0;

    this.abilityHistory = [];

    // -------------------------
    // 適性統計
    // -------------------------

    this.distanceStats = {};
    this.courseStats = {};
    this.surfaceStats = {};
    this.goingStats = {};
    this.seasonStats = {};
    this.paceStats = {};
    this.runningStyleStats = {};

    // -------------------------
    // 調教・馬体
    // -------------------------

    this.trainingStats = {};
    this.bodyWeightStats = {};
    this.bestTrainingType = "";
    this.bestTrainingTimeRange = null;
    this.bestTrainingPattern = "";

    this.bestWeight = null;
    this.bestWeightRange = null;

    // -------------------------
    // ローテーション・回復
    // -------------------------

    this.intervalStats = {};
    this.bestIntervalDays = null;
    this.preferredRecoveryPattern = "";
    this.preferredRecoveryScore = 0;

    // -------------------------
    // 成長・成熟
    // -------------------------

    this.growthCurve = [];
    this.lifecycle = "Unknown";
    this.maturityPattern = "";

    // -------------------------
    // 環境適応
    // -------------------------

    this.adaptability = 50;
    this.adaptabilitySample = 0;
    this.preferredEnvironmentChanges = [];
    this.weakEnvironmentChanges = [];
    this.environmentTolerance = 0;
    this.preferredEnvironment = "";
    this.preferredTransportDistance = null;

    // -------------------------
    // リスク耐性
    // -------------------------

    this.fatigueTolerance = null;
    this.riskTolerance = 0;
    this.weakConditions = [];

    // -------------------------
    // Analyzer補助
    // -------------------------

    this.preferredTrainingScore = 0;
    this.preferredWeightScore = 0;
  }

  /**
   * 統計更新
   */
  updateStatistics(observation) {

    ProfileBase.prototype.updateStatistics.call(
      this,
      observation
    );

    if (!observation) {
      return this;
    }

    this.updateAbilityStatistics(observation);
    this.updateConditionStatistics(observation);
    this.updateEnvironmentStatistics(observation);

    return this;
  }

  /**
   * 能力統計
   */
  updateAbilityStatistics(observation) {

    const ability =
      Number(observation.abilityIndex || 0);

    if (ability > 0) {

      this.abilityHistory.push({
        value: ability,
        raceId: observation.raceId || "",
        date: observation.date || null
      });

      this.currentAbility = ability;

      if (
        this.peakAbility === 0 ||
        ability > this.peakAbility
      ) {
        this.peakAbility = ability;
      }

      this.averageAbility =
        this.average(
          this.abilityHistory.map(function(x) {
            return x.value;
          })
        );

    }

    this.updateStatMap(
      this.distanceStats,
      observation.distance,
      observation
    );

    this.updateStatMap(
      this.courseStats,
      observation.course,
      observation
    );

    this.updateStatMap(
      this.surfaceStats,
      observation.surface,
      observation
    );

    this.updateStatMap(
      this.goingStats,
      observation.going,
      observation
    );

    this.updateStatMap(
      this.seasonStats,
      observation.season,
      observation
    );

    this.updateStatMap(
      this.paceStats,
      observation.pace,
      observation
    );

    this.updateStatMap(
      this.runningStyleStats,
      observation.runningStyle,
      observation
    );

    return this;
  }

  /**
   * 状態統計
   */
  updateConditionStatistics(observation) {

    if (observation.trainingType) {
      this.updateStatMap(
        this.trainingStats,
        observation.trainingType,
        observation
      );
    }

    if (observation.bodyWeight) {
      this.updateStatMap(
        this.bodyWeightStats,
        String(observation.bodyWeight),
        observation
      );
    }

    if (observation.intervalDays) {
      this.updateStatMap(
        this.intervalStats,
        String(observation.intervalDays),
        observation
      );
    }

    return this;
  }

  /**
   * 環境統計
   */
  updateEnvironmentStatistics(observation) {

    if (!observation.environmentChange) {
      return this;
    }

    this.adaptabilitySample += 1;

    const good =
      this.isGoodResult(observation) ? 1 : 0;

    const current =
      this.adaptability || 50;

    this.adaptability =
      Utils.clamp(
        current + (good ? 1 : -1),
        0,
        100
      );

    if (good) {
      this.addUnique(
        this.preferredEnvironmentChanges,
        observation.environmentChange
      );
    } else {
      this.addUnique(
        this.weakEnvironmentChanges,
        observation.environmentChange
      );
    }

    return this;
  }

  /**
   * 知識更新
   */
  updateKnowledge(observation) {

    ProfileBase.prototype.updateKnowledge.call(
      this,
      observation
    );

    this.knowledge.bestDistance =
      this.bestKeys(this.distanceStats);

    this.knowledge.bestCourse =
      this.bestKeys(this.courseStats);

    this.knowledge.bestSurface =
      this.bestKeys(this.surfaceStats);

    this.knowledge.bestGoing =
      this.bestKeys(this.goingStats);

    this.knowledge.adaptability =
      this.adaptability;

    this.updateBestWeight();
    this.updateBestInterval();

    return this;
  }

  /**
   * 汎用統計Map更新
   */
  updateStatMap(map, key, observation) {

    if (
      key === null ||
      key === undefined ||
      key === ""
    ) {
      return;
    }

    const k = String(key);

    if (!map[k]) {
      map[k] = {
        runs: 0,
        wins: 0,
        seconds: 0,
        thirds: 0,
        top3: 0,
        totalAbility: 0,
        totalAce: 0,
        roiTotal: 0
      };
    }

    const stat = map[k];

    stat.runs += 1;

    const finish =
      Number(observation.finish || 0);

    if (finish === 1) stat.wins += 1;
    if (finish === 2) stat.seconds += 1;
    if (finish === 3) stat.thirds += 1;
    if (finish >= 1 && finish <= 3) stat.top3 += 1;

    stat.totalAbility +=
      Number(observation.abilityIndex || 0);

    stat.totalAce +=
      Number(observation.aceScore || 0);

    stat.roiTotal +=
      Number(observation.roi || 0);

    stat.winRate =
      stat.runs > 0
        ? stat.wins / stat.runs
        : 0;

    stat.top3Rate =
      stat.runs > 0
        ? stat.top3 / stat.runs
        : 0;

    stat.averageAbility =
      stat.runs > 0
        ? stat.totalAbility / stat.runs
        : 0;

    stat.averageAce =
      stat.runs > 0
        ? stat.totalAce / stat.runs
        : 0;

    stat.averageRoi =
      stat.runs > 0
        ? stat.roiTotal / stat.runs
        : 0;
  }

  /**
   * ベスト体重更新
   */
  updateBestWeight() {

    const keys = Object.keys(this.bodyWeightStats || {});

    if (!keys.length) {
      return;
    }

    let bestKey = null;
    let bestScore = -1;

    keys.forEach(function(key) {

      const stat = this.bodyWeightStats[key];

      const score =
        stat.top3Rate * 70 +
        stat.averageAbility * 0.3;

      if (score > bestScore) {
        bestScore = score;
        bestKey = key;
      }

    }, this);

    if (bestKey !== null) {
      const w = Number(bestKey);
      this.bestWeight = w;
      this.bestWeightRange = {
        min: w - 4,
        max: w + 4
      };
    }
  }

  /**
   * ベスト間隔更新
   */
  updateBestInterval() {

    const keys = Object.keys(this.intervalStats || {});

    if (!keys.length) {
      return;
    }

    let bestKey = null;
    let bestScore = -1;

    keys.forEach(function(key) {

      const stat = this.intervalStats[key];

      const score =
        stat.top3Rate * 70 +
        stat.averageAbility * 0.3;

      if (score > bestScore) {
        bestScore = score;
        bestKey = key;
      }

    }, this);

    if (bestKey !== null) {
      this.bestIntervalDays = Number(bestKey);
    }
  }

  /**
   * 好走判定
   */
  isGoodResult(observation) {

    const finish =
      Number(observation.finish || 0);

    if (finish >= 1 && finish <= 3) {
      return true;
    }

    const roi =
      Number(observation.roi || 0);

    return roi >= 1.0;
  }

  /**
   * ベストキー抽出
   */
  bestKeys(map) {

    const keys = Object.keys(map || {});

    return keys
      .filter(function(key) {
        return map[key].runs >= 1;
      })
      .sort(function(a, b) {
        return (
          map[b].top3Rate -
          map[a].top3Rate
        );
      })
      .slice(0, 5);
  }

  /**
   * 平均
   */
  average(values) {

    if (!values || !values.length) {
      return 0;
    }

    const sum = values.reduce(function(a, b) {
      return a + b;
    }, 0);

    return sum / values.length;
  }

  /**
   * 重複なし追加
   */
  addUnique(list, value) {

    if (!value) {
      return;
    }

    if (list.indexOf(value) < 0) {
      list.push(value);
    }
  }

  /**
   * JSON化
   */
  toJSON() {

    const base =
      ProfileBase.prototype.toJSON.call(this);

    return Object.assign(base, {
      horseId: this.horseId,

      sex: this.sex,
      birthYear: this.birthYear,

      peakAbility: this.peakAbility,
      averageAbility: this.averageAbility,
      currentAbility: this.currentAbility,
      abilityHistory: this.abilityHistory,

      distanceStats: this.distanceStats,
      courseStats: this.courseStats,
      surfaceStats: this.surfaceStats,
      goingStats: this.goingStats,
      seasonStats: this.seasonStats,
      paceStats: this.paceStats,
      runningStyleStats: this.runningStyleStats,

      trainingStats: this.trainingStats,
      bodyWeightStats: this.bodyWeightStats,
      bestTrainingType: this.bestTrainingType,
      bestTrainingTimeRange: this.bestTrainingTimeRange,
      bestTrainingPattern: this.bestTrainingPattern,

      bestWeight: this.bestWeight,
      bestWeightRange: this.bestWeightRange,

      intervalStats: this.intervalStats,
      bestIntervalDays: this.bestIntervalDays,
      preferredRecoveryPattern: this.preferredRecoveryPattern,
      preferredRecoveryScore: this.preferredRecoveryScore,

      growthCurve: this.growthCurve,
      lifecycle: this.lifecycle,
      maturityPattern: this.maturityPattern,

      adaptability: this.adaptability,
      adaptabilitySample: this.adaptabilitySample,
      preferredEnvironmentChanges: this.preferredEnvironmentChanges,
      weakEnvironmentChanges: this.weakEnvironmentChanges,
      environmentTolerance: this.environmentTolerance,
      preferredEnvironment: this.preferredEnvironment,
      preferredTransportDistance: this.preferredTransportDistance,

      fatigueTolerance: this.fatigueTolerance,
      riskTolerance: this.riskTolerance,
      weakConditions: this.weakConditions,

      preferredTrainingScore: this.preferredTrainingScore,
      preferredWeightScore: this.preferredWeightScore
    });
  }

  /**
   * JSON読込
   */
  load(json) {

    ProfileBase.prototype.load.call(
      this,
      json
    );

    if (!json) {
      return this;
    }

    this.horseId = json.horseId || this.id;

    this.sex = json.sex || "";
    this.birthYear = json.birthYear || 0;

    this.peakAbility = json.peakAbility || 0;
    this.averageAbility = json.averageAbility || 0;
    this.currentAbility = json.currentAbility || 0;
    this.abilityHistory = json.abilityHistory || [];

    this.distanceStats = json.distanceStats || {};
    this.courseStats = json.courseStats || {};
    this.surfaceStats = json.surfaceStats || {};
    this.goingStats = json.goingStats || {};
    this.seasonStats = json.seasonStats || {};
    this.paceStats = json.paceStats || {};
    this.runningStyleStats = json.runningStyleStats || {};

    this.trainingStats = json.trainingStats || {};
    this.bodyWeightStats = json.bodyWeightStats || {};
    this.bestTrainingType = json.bestTrainingType || "";
    this.bestTrainingTimeRange = json.bestTrainingTimeRange || null;
    this.bestTrainingPattern = json.bestTrainingPattern || "";

    this.bestWeight = json.bestWeight || null;
    this.bestWeightRange = json.bestWeightRange || null;

    this.intervalStats = json.intervalStats || {};
    this.bestIntervalDays = json.bestIntervalDays || null;
    this.preferredRecoveryPattern = json.preferredRecoveryPattern || "";
    this.preferredRecoveryScore = json.preferredRecoveryScore || 0;

    this.growthCurve = json.growthCurve || [];
    this.lifecycle = json.lifecycle || "Unknown";
    this.maturityPattern = json.maturityPattern || "";

    this.adaptability =
      json.adaptability != null
        ? json.adaptability
        : 50;

    this.adaptabilitySample =
      json.adaptabilitySample || 0;

    this.preferredEnvironmentChanges =
      json.preferredEnvironmentChanges || [];

    this.weakEnvironmentChanges =
      json.weakEnvironmentChanges || [];

    this.environmentTolerance =
      json.environmentTolerance || 0;

    this.preferredEnvironment =
      json.preferredEnvironment || "";

    this.preferredTransportDistance =
      json.preferredTransportDistance || null;

    this.fatigueTolerance =
      json.fatigueTolerance || null;

    this.riskTolerance =
      json.riskTolerance || 0;

    this.weakConditions =
      json.weakConditions || [];

    this.preferredTrainingScore =
      json.preferredTrainingScore || 0;

    this.preferredWeightScore =
      json.preferredWeightScore || 0;

    return this;
  }

  static fromJSON(json) {
    const profile =
      new HorseProfile(
        json && json.horseId
          ? json.horseId
          : ""
      );

    return profile.load(json || {});
  }
}
