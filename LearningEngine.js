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

    const weights = this.getWeights();
    const updated = this._updateWeights(weights, history);

    OmegaState.saveWeights(updated);
    OmegaState.saveLastLearningAt(new Date());

    Logger.info("Learning DONE", {
      history: history.length,
      weights: Object.keys(updated).length
    });

    return updated;
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
    let hitSum = 0;
    let missSum = 0;
    let hitCount = 0;
    let missCount = 0;

    history.forEach(log => {
      const results = log.scoreSummary || [];
      const winner = log.winner || log.resultWinner || "";

      results.forEach(r => {
        const featureValue =
          r.features && r.features[key] !== undefined
            ? Utils.toNumber(r.features[key], 0)
            : 0;

        if (String(r.horseId) === String(winner)) {
          hitSum += featureValue;
          hitCount += 1;
        } else {
          missSum += featureValue;
          missCount += 1;
        }
      });
    });

    if (hitCount === 0 || missCount === 0) return 0;

    const hitAvg = hitSum / hitCount;
    const missAvg = missSum / missCount;

    return Utils.round((hitAvg - missAvg) * 0.01, 4);
  }

  static _clip(value) {
    const v = Utils.toNumber(value, 1);
    return Utils.round(
      Math.max(0.5, Math.min(2.0, v)),
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
