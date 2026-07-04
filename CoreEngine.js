class CoreEngine {

  /**
   * メイン評価
   */
  static evaluate(race, featureObj) {

    const f = featureObj.features;

    // ① 重み取得
    const weights = LearningEngine.getWeights();

    // ② 加重スコア計算
    const rawScore = this._calcWeightedScore(f, weights);

    // ③ 正規化（勝率変換）
    const winProb = this._sigmoid(rawScore);

    // ④ オッズ取得
    const odds = f.odds || 2.0;

    // ⑤ EV計算
    const ev = (winProb * odds) - 1;

    // ⑥ ケリー基準
    const kelly = this._kelly(winProb, odds);

    // ⑦ 信頼度
    const confidence = this._confidence(winProb, f);

    return {
      horseId: featureObj.horseId,
      score: rawScore,
      winProb: winProb,
      ev: ev,
      kelly: kelly,
      confidence: confidence,
      odds: odds
    };
  }


  //////////////////////////////
  // 加重スコア
  //////////////////////////////
  static _calcWeightedScore(features, weights) {

    let score = 0;

    Object.keys(features).forEach(k => {

      const v = features[k];
      const w = weights[k] || 1;

      // 数値以外除外
      if (typeof v === "number") {
        score += v * w;
      }
    });

    return score;
  }


  //////////////////////////////
  // 勝率変換（シグモイド）
  //////////////////////////////
  static _sigmoid(x) {

    return 1 / (1 + Math.exp(-x));
  }


  //////////////////////////////
  // ケリー基準
  //////////////////////////////
  static _kelly(prob, odds) {

    const edge = (prob * odds) - 1;

    const denom = odds - 1;

    if (denom <= 0) return 0;

    const k = edge / denom;

    return Math.max(0, Math.min(k, 0.25)); // 安全制限
  }


  //////////////////////////////
  // 信頼度
  //////////////////////////////
  static _confidence(prob, features) {

    // 極端値を下げる
    const entropyPenalty = Math.abs(prob - 0.5);

    // データ密度（擬似）
    const stability = features.last3Avg ? 1 : 0.7;

    return Math.max(0, Math.min(1,
      (1 - entropyPenalty) * stability
    ));
  }
}
