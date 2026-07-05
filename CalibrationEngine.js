/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * CalibrationEngine.js
 * ----------------------------------------------------------
 * 初期キャリブレーション
 * 過去データ → 初期Feature Weight生成
 * ==========================================================
 */

class CalibrationEngine {

  static run(history) {
    Logger.info("Calibration START");

    const defaultWeights = FeatureEngine.defaultWeights();

    if (!Array.isArray(history) || history.length === 0) {
      OmegaState.saveWeights(defaultWeights);
      OmegaState.saveCalibration({
        mode: "default",
        count: 0,
        weights: defaultWeights,
        createdAt: new Date().toISOString()
      });

      Logger.info("Calibration default weights applied");
      return defaultWeights;
    }

    const stats = this._collectStats(history);
    const weights = Object.assign({}, defaultWeights);

    Object.keys(stats).forEach(key => {
      weights[key] = this._calcWeight(
        stats[key],
        defaultWeights[key] || 1
      );
    });

    const clipped = this._clip(weights);

    OmegaState.saveWeights(clipped);
    OmegaState.saveCalibration({
      mode: "history",
      count: history.length,
      weights: clipped,
      stats,
      createdAt: new Date().toISOString()
    });

    Logger.info("Calibration DONE", {
      races: history.length,
      features: Object.keys(clipped).length
    });

    return clipped;
  }

  static _collectStats(history) {
    const stats = {};

    FeatureEngine.calibrationKeys().forEach(key => {
      stats[key] = {
        winSum: 0,
        loseSum: 0,
        winCount: 0,
        loseCount: 0
      };
    });

    history.forEach(item => {
      const winner = String((item.result || {}).winner || "");
      const featureMap = item.features || {};

      Object.keys(featureMap).forEach(horseId => {
        const isWinner = String(horseId) === winner;
        const features = featureMap[horseId] || {};

        Object.keys(stats).forEach(key => {
          const value = Utils.toNumber(features[key], 0);

          if (isWinner) {
            stats[key].winSum += value;
            stats[key].winCount += 1;
          } else {
            stats[key].loseSum += value;
            stats[key].loseCount += 1;
          }
        });
      });
    });

    return stats;
  }

  static _calcWeight(stat, defaultWeight) {
    const winAvg =
      stat.winCount > 0
        ? stat.winSum / stat.winCount
        : 0;

    const loseAvg =
      stat.loseCount > 0
        ? stat.loseSum / stat.loseCount
        : 0;

    return Utils.round(defaultWeight + (winAvg - loseAvg), 4);
  }

  static _clip(weights) {
    const out = {};

    Object.keys(weights).forEach(key => {
      const value = Utils.toNumber(weights[key], 1);
      out[key] = Utils.round(
        Math.max(0.5, Math.min(2.0, value)),
        4
      );
    });

    return out;
  }

  static resetToDefault() {
    const weights = FeatureEngine.defaultWeights();

    OmegaState.saveWeights(weights);
    OmegaState.saveCalibration({
      mode: "default_reset",
      weights,
      createdAt: new Date().toISOString()
    });

    Logger.info("Calibration reset to default");

    return weights;
  }
}
