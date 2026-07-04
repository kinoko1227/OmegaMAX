/**
 * ==========================================================
 * ΩMAX LearningEngine（修正版）
 * ==========================================================
 */
class LearningEngine {

  /**
   * 重み取得（安全版）
   */
  static getWeights() {

    try {
      const raw = PropertiesService.getScriptProperties()
        .getProperty("Ω_WEIGHTS");

      if (!raw) return {};

      const parsed = JSON.parse(raw);

      // 型安全化（壊れ防止）
      if (typeof parsed !== "object" || Array.isArray(parsed)) {
        return {};
      }

      return parsed;

    } catch (e) {
      Logger.error("LearningEngine getWeights error", e);
      return {};
    }
  }

  /**
   * 学習更新（仮実装：Backtest結果から補正）
   */
  static update(history) {

    if (!history || history.length === 0) return {};

    const weights = this.getWeights();

    // 超シンプル更新ロジック（安定優先）
    history.forEach(h => {

      if (!h.scoreSummary) return;

      h.scoreSummary.forEach(s => {

        const k = s.horseId;

        if (!weights[k]) {
          weights[k] = 1;
        }

        // EVベース微調整
        const ev = s.ev || 0;

        weights[k] += ev * 0.01;

        // クリップ（暴走防止）
        weights[k] = Math.max(0.5, Math.min(weights[k], 2.0));
      });
    });

    PropertiesService.getScriptProperties()
      .setProperty("Ω_WEIGHTS", JSON.stringify(weights));

    return weights;
  }
}
