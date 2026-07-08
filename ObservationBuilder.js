/**
 * ==========================================================
 * ΩMAX AIOS
 * ObservationBuilder.js
 * ----------------------------------------------------------
 * 生データをΩMAX共通Observationへ変換する。
 * ==========================================================
 */

class ObservationBuilder {

  static build(raw) {

    raw = raw || {};

    const observation = {
      id: raw.id || Utilities.getUuid(),

      raceId: raw.raceId || "",
      horseId: raw.horseId || "",
      jockeyId: raw.jockeyId || "",
      trainerId: raw.trainerId || "",

      date: raw.date || null,

      course: raw.course || "",
      distance: Number(raw.distance || 0),
      surface: raw.surface || "",
      going: raw.going || "",
      raceClass: raw.raceClass || "",

      finish: Number(raw.finish || 0),
      popularity: Number(raw.popularity || 0),
      odds: Number(raw.odds || 0),

      time: Number(raw.time || 0),
      final3f: Number(raw.final3f || 0),
      pace: raw.pace || "",

      bodyWeight: Number(raw.bodyWeight || 0),
      bodyWeightChange: Number(raw.bodyWeightChange || 0),

      trainingType: raw.trainingType || "",
      trainingTime: Number(raw.trainingTime || 0),
      trainingPattern: raw.trainingPattern || "",

      intervalDays: Number(raw.intervalDays || 0),

      abilityIndex: this.calculateAbilityIndex(raw),
      aceScore: Number(raw.aceScore || 0),
      roi: this.calculateROI(raw),

      season: this.detectSeason(raw.date),
      runningStyle: raw.runningStyle || "",

      environmentChange: raw.environmentChange || "",

      createdAt: new Date()
    };

    return observation;
  }

  static buildMany(rows) {
    return (rows || []).map(function(row) {
      return ObservationBuilder.build(row);
    });
  }

  static calculateAbilityIndex(raw) {

    let score = 50;

    const finish = Number(raw.finish || 0);
    const popularity = Number(raw.popularity || 0);
    const final3f = Number(raw.final3f || 0);

    if (finish === 1) score += 25;
    else if (finish === 2) score += 18;
    else if (finish === 3) score += 12;
    else if (finish > 0 && finish <= 5) score += 5;

    if (popularity > 0 && finish > 0) {
      score += Utils.clamp(popularity - finish, -10, 10);
    }

    if (final3f > 0) {
      score += Utils.clamp((36 - final3f) * 2, -8, 8);
    }

    return Utils.clamp(score, 0, 120);
  }

  static calculateROI(raw) {

    const bet = Number(raw.betAmount || 100);
    const payout = Number(raw.payout || 0);

    if (bet <= 0) return 0;

    return payout / bet;
  }

  static detectSeason(dateValue) {

    if (!dateValue) return "";

    const date = new Date(dateValue);
    const month = date.getMonth() + 1;

    if (month >= 3 && month <= 5) return "SPRING";
    if (month >= 6 && month <= 8) return "SUMMER";
    if (month >= 9 && month <= 11) return "AUTUMN";

    return "WINTER";
  }

}
