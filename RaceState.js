/**
 * ==========================================================
 * ΩMAX AIOS
 * RaceState.js
 * ----------------------------------------------------------
 * Race State
 *
 * 今日の競馬場・レース環境を表現する
 * ==========================================================
 */

class RaceState extends StateModel {

  constructor() {

    super("RaceState");

    // -------------------------
    // 開催情報
    // -------------------------

    this.raceId = "";

    this.course = "";

    this.surface = "";

    this.distance = 0;

    this.direction = "";

    this.className = "";

    this.fieldSize = 0;

    // -------------------------
    // 馬場
    // -------------------------

    this.weather = "";

    this.trackCondition = "";

    this.cushionValue = null;

    this.moisture = null;

    this.trackBias = "";

    this.courseChange = false;

    this.meetingDay = 1;

    // -------------------------
    // 気象
    // -------------------------

    this.temperature = null;

    this.humidity = null;

    this.windSpeed = null;

    this.windDirection = "";

    // -------------------------
    // 展開
    // -------------------------

    this.expectedPace = "";

    this.escapeCount = 0;

    this.frontCount = 0;

    this.stalkerCount = 0;

    this.closerCount = 0;

    // -------------------------
    // 難易度
    // -------------------------

    this.difficulty = 0;

    // -------------------------
    // レース品質
    // -------------------------

    this.raceLevel = 0;

  }

  /**
   * JSON
   */
  toJSON() {

    return {

      ...super.toJSON(),

      raceId: this.raceId,

      course: this.course,

      surface: this.surface,

      distance: this.distance,

      direction: this.direction,

      className: this.className,

      fieldSize: this.fieldSize,

      weather: this.weather,

      trackCondition: this.trackCondition,

      cushionValue: this.cushionValue,

      moisture: this.moisture,

      trackBias: this.trackBias,

      courseChange: this.courseChange,

      meetingDay: this.meetingDay,

      temperature: this.temperature,

      humidity: this.humidity,

      windSpeed: this.windSpeed,

      windDirection: this.windDirection,

      expectedPace: this.expectedPace,

      escapeCount: this.escapeCount,

      frontCount: this.frontCount,

      stalkerCount: this.stalkerCount,

      closerCount: this.closerCount,

      difficulty: this.difficulty,

      raceLevel: this.raceLevel

    };

  }

}
