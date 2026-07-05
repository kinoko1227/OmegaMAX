/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * LearningEngine.js
 * ----------------------------------------------------------
 * 日次学習
 * 結果ログ → Feature Weight微調整
 * ==========================================================
 */

class LearningEngine {

  static getWeights() {
    return OmegaState.getWeights();
  }

  static update(history) {
    Logger.info("Learning START");

    if (!CONFIG.LEARNING.ENABLE) {
      Logger.info("Learning skipped: disabled");
      return this.getWeights();
    }

    if (!Array.isArray(history) || history.length === 0) {
      Logger.info("Learning skipped: empty history");
      return this.getWeights();
    }

    const currentWeights = this.getWeights();
    const nextWeights = this._updateWeights(currentWeights, history);

    OmegaState.saveWeights(nextWeights);
    OmegaState.saveLastLearningAt(new Date());

    Logger.info("Learning DONE", {
      history: history.length,
      weights: Object.keys(nextWeights).length
    });

    return nextWeights;
  }

  static _updateWeights(weights, history) {
    const next = Object.assign({}, weights);
    const keys = FeatureEngine.learningKeys();

    keys.forEach(key => {
      const delta = this._calcDelta(key, history);
      const current = Utils.toNumber(next[key], 1);
      next[key] = this._clip(current + delta);
    });

    return next;
  }

  static _calcDelta(key, history) {
    let winnerSum = 0;
    let loserSum = 0;
    let winnerCount = 0;
    let loserCount = 0;

    history.forEach(log => {
      const winner =
        log.winner ||
        log.resultWinner ||
        (log.result && log.result.winner) ||
        "";

      const rows = log.scoreSummary || [];

      rows.forEach(row => {
        const features = row.features || {};
        const value = Utils.toNumber(features[key], 0);

        if (String(row.horseId) === String(winner)) {
          winnerSum += value;
          winnerCount += 1;
        } else {
          loserSum += value;
          loserCount += 1;
        }
      });
    });

    if (winnerCount === 0 || loserCount === 0) return 0;

    const winnerAvg = winnerSum / winnerCount;
    const loserAvg = loserSum / loserCount;

    const diff = winnerAvg - loserAvg;
    const rate = Utils.toNumber(CONFIG.LEARNING.LEARNING_RATE, 0.01);

    return Utils.round(diff * rate, 4);
  }

  static _clip(value) {
    return Utils.round(
      Math.max(0.5, Math.min(2.0, Utils.toNumber(value, 1))),
      4
    );
  }

  static reset() {
    const weights = FeatureEngine.defaultWeights();
    OmegaState.saveWeights(weights);
    Logger.info("Learning weights reset");
    return weights;
  }
}
