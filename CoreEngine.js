/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * CoreEngine.js
 * ----------------------------------------------------------
 * 勝率・EV・Kelly・Confidence・Decision
 * ==========================================================
 */

class CoreEngine {

  static evaluate(race, featureSet) {
    const weights = LearningEngine.getWeights();
    const features = featureSet.features || {};
    const odds = Utils.toNumber(featureSet.odds, 0);

    const score = this.calcScore(features, weights);
    const winProb = this.calcWinProb(score);
    const ev = this.calcEV(winProb, odds);
    const kelly = this.calcKelly(winProb, odds);
    const confidencePoint = this.confidencePoint(score, ev);

    return {
      raceId: race.id,
      horseId: featureSet.horseId,
      horseName: featureSet.horseName || "",
      odds: odds,

      features: features,

      score: score,
      winProb: winProb,
      ev: ev,
      kelly: kelly,

      confidencePoint: confidencePoint,
      confidence: this.confidenceRank(confidencePoint),
      decision: this.decision(ev)
    };
  }

  static calcScore(features, weights) {
    const keys = Object.keys(features || {});
    if (keys.length === 0) return 0;

    let total = 0;
    let weightTotal = 0;

    keys.forEach(key => {
      const value = Utils.toNumber(features[key], 0);
      const weight = Utils.toNumber(weights[key], 1);

      total += value * weight;
      weightTotal += weight;
    });

    if (weightTotal <= 0) return 0;

    return Utils.round(total / weightTotal, 4);
  }

  static calcWinProb(score) {
    const x = Utils.toNumber(score, 0);

    const adjusted = (x - 0.5) * 4;
    const prob = 1 / (1 + Math.exp(-adjusted));

    return Utils.round(Utils.clamp01(prob), 4);
  }

  static calcEV(winProb, odds) {
    const p = Utils.toNumber(winProb, 0);
    const o = Utils.toNumber(odds, 0);

    if (p <= 0 || o <= 1) return 0;

    return Utils.round(p * o, 4);
  }

  static calcKelly(winProb, odds) {
    const p = Utils.toNumber(winProb, 0);
    const o = Utils.toNumber(odds, 0);

    if (p <= 0 || o <= 1) return 0;

    const b = o - 1;
    const q = 1 - p;

    const raw = (b * p - q) / b;
    const adjusted = raw * CONFIG.BANKROLL.KELLY_RATE;

    return Utils.round(
      Math.max(0, Math.min(adjusted, CONFIG.BANKROLL.MAX_BET_RATE)),
      4
    );
  }

  static decision(ev) {
    const e = Utils.toNumber(ev, 0);

    if (e >= CONFIG.DECISION.BUY) return DECISION.BUY;
    if (e >= CONFIG.DECISION.WATCH) return DECISION.WATCH;

    return DECISION.PASS;
  }

  static confidencePoint(score, ev) {
    const s = Utils.toNumber(score, 0);
    const e = Utils.toNumber(ev, 0);

    const scorePart = s * 70;
    const evPart = Math.max(0, Math.min(30, (e - 1) * 30));

    return Utils.round(
      Math.max(0, Math.min(100, scorePart + evPart)),
      2
    );
  }

  static confidenceRank(point) {
    const p = Utils.toNumber(point, 0);

    if (p >= CONFIG.CONFIDENCE.S) return CONFIDENCE_RANK.S;
    if (p >= CONFIG.CONFIDENCE.A) return CONFIDENCE_RANK.A;
    if (p >= CONFIG.CONFIDENCE.B) return CONFIDENCE_RANK.B;
    if (p >= CONFIG.CONFIDENCE.C) return CONFIDENCE_RANK.C;
    if (p >= CONFIG.CONFIDENCE.D) return CONFIDENCE_RANK.D;

    return CONFIDENCE_RANK.PASS;
  }
}
