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

  /**
   * 初期キャリブレーション実行
   *
   * history形式：
   * [
   *   {
   *     raceId,
   *     features: { horseId: { speed_index: 0.7, ... } },
   *     result: { winner, place: [] }
   *   }
   * ]
   */
  static run(history) {
    Logger.info("Calibration START");

    if (!Array.isArray(history) || history.length === 0) {
      const defaults = FeatureEngine.defaultWeights();
      OmegaState.saveWeights(defaults);
      OmegaState.saveCalibration({
        mode: "default",
        count: 0,
        weights: defaults,
        createdAt: new Date().toISOString()
      });
      return defaults;
    }

    const weights = FeatureEngine.defaultWeights();
    const stats = this._collectStats(history);

    Object.keys(stats).forEach(key => {
      weights[key] = this._calcWeight(
        key,
        stats[key],
        weights[key] || 1
      );
    });

    const clipped = this._clipWeights(weights);

    OmegaState.saveWeights(clipped);
    OmegaState.saveCalibration({
      mode: "history",
      count: history.length,
      weights: clipped,
      stats: stats,
      createdAt: new Date().toISOString()
    });

    Logger.info("Calibration DONE", {
      races: history.length,
      features: Object.keys(clipped).length
    });

    return clipped;
  }

  /**
   * 履歴から特徴量別統計を作る
   */
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
      const result = item.result || {};
      const winner = String(result.winner || "");
      const featureMap = item.features || {};

      Object.keys(featureMap).forEach(horseId => {
        const f = featureMap[horseId] || {};
        const isWinner = String(horseId) === winner;

        Object.keys(stats).forEach(key => {
          const v = Utils.toNumber(f[key], 0);

          if (isWinner) {
            stats[key].winSum += v;
            stats[key].winCount += 1;
          } else {
            stats[key].loseSum += v;
            stats[key].loseCount += 1;
          }
        });
      });
    });

    return stats;
  }

  /**
   * 勝ち馬平均と負け馬平均の差からWeight生成
   */
  static _calcWeight(key, s, defaultWeight) {
    const winAvg =
      s.winCount > 0
        ? s.winSum / s.winCount
        : 0;

    const loseAvg =
      s.loseCount > 0
        ? s.loseSum / s.loseCount
        : 0;

    const diff = winAvg - loseAvg;

    const adjusted = defaultWeight + diff;

    return Utils.round(adjusted, 4);
  }

  /**
   * 暴走防止
   */
  static _clipWeights(weights) {
    const out = {};

    Object.keys(weights).forEach(key => {
      const v = Utils.toNumber(weights[key], 1);
      out[key] = Utils.round(
        Math.max(0.5, Math.min(2.0, v)),
        4
      );
    });

    return out;
  }

  /**
   * デフォルト初期化
   */
  static resetToDefault() {
    const weights = FeatureEngine.defaultWeights();

    OmegaState.saveWeights(weights);
    OmegaState.saveCalibration({
      mode: "default_reset",
      weights: weights,
      createdAt: new Date().toISOString()
    });

    Logger.info("Calibration reset to default");

    return weights;
  }
}
