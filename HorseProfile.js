/**
 * ==========================================================
 * ΩMAX AIOS
 * HorseProfile.js
 * ----------------------------------------------------------
 * Horse Profile
 *
 * 馬個体の長期プロファイル
 * LearningEngineが更新する
 * ==========================================================
 */

class HorseProfile {

  constructor(horseId = "") {

    this.horseId = horseId;

    // -------------------------
    // 基本情報
    // -------------------------

    this.name = "";
    this.sex = "";
    this.birthYear = 0;

    // -------------------------
    // 能力推移
    // -------------------------

    this.peakAbility = 0;
    this.averageAbility = 0;
    this.currentAbility = 0;

    // -------------------------
    // ベスト条件
    // -------------------------

    this.bestWeight = null;
    this.bestWeightRange = null;
    this.bestTrainingType = "";
    this.bestTrainingTimeRange = null;
    this.bestTrainingPattern = "";
    this.bestDistance = [];
    this.bestCourse = [];
    this.bestSurface = [];
    this.bestGoing = [];
    this.bestSeason = [];
    this.bestIntervalDays = null;
    this.bestRunningStyle = "";

    // -------------------------
    // 苦手条件
    // -------------------------

    this.weakDistance = [];
    this.weakCourse = [];
    this.weakSurface = [];
    this.weakGoing = [];

    // -------------------------
    // 成長・成熟
    // -------------------------

    this.growthCurve = [];
    this.lifecycle = "Unknown";
    this.maturityPattern = "";

    // -------------------------
    // 環境適応力
    // -------------------------

    this.adaptability = 50;
    this.preferredEnvironmentChanges = [];
    this.weakEnvironmentChanges = [];
    this.adaptabilitySample = 0;

    // -------------------------
    // Analyzer補助
    // -------------------------

    this.preferredTrainingScore = 0;
    this.preferredWeightScore = 0;
    this.preferredRecoveryScore = 0;
    this.preferredRecoveryPattern = "";
    this.fatigueTolerance = null;
    this.preferredTransportDistance = null;
    this.environmentTolerance = 0;
    this.preferredEnvironment = "";

    // -------------------------
    // 学習情報
    // -------------------------

    this.sample = 0;
    this.updatedAt = null;
  }

  updateDate(date = new Date()) {
    this.updatedAt = date;
  }

  toJSON() {
    return {
      horseId: this.horseId,
      name: this.name,
      sex: this.sex,
      birthYear: this.birthYear,

      peakAbility: this.peakAbility,
      averageAbility: this.averageAbility,
      currentAbility: this.currentAbility,

      bestWeight: this.bestWeight,
      bestWeightRange: this.bestWeightRange,
      bestTrainingType: this.bestTrainingType,
      bestTrainingTimeRange: this.bestTrainingTimeRange,
      bestTrainingPattern: this.bestTrainingPattern,
      bestDistance: this.bestDistance,
      bestCourse: this.bestCourse,
      bestSurface: this.bestSurface,
      bestGoing: this.bestGoing,
      bestSeason: this.bestSeason,
      bestIntervalDays: this.bestIntervalDays,
      bestRunningStyle: this.bestRunningStyle,

      weakDistance: this.weakDistance,
      weakCourse: this.weakCourse,
      weakSurface: this.weakSurface,
      weakGoing: this.weakGoing,

      growthCurve: this.growthCurve,
      lifecycle: this.lifecycle,
      maturityPattern: this.maturityPattern,

      adaptability: this.adaptability,
      preferredEnvironmentChanges: this.preferredEnvironmentChanges,
      weakEnvironmentChanges: this.weakEnvironmentChanges,
      adaptabilitySample: this.adaptabilitySample,

      preferredTrainingScore: this.preferredTrainingScore,
      preferredWeightScore: this.preferredWeightScore,
      preferredRecoveryScore: this.preferredRecoveryScore,
      preferredRecoveryPattern: this.preferredRecoveryPattern,
      fatigueTolerance: this.fatigueTolerance,
      preferredTransportDistance: this.preferredTransportDistance,
      environmentTolerance: this.environmentTolerance,
      preferredEnvironment: this.preferredEnvironment,

      sample: this.sample,
      updatedAt: this.updatedAt
    };
  }
}
