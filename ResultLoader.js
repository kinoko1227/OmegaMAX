/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * ResultLoader.js
 * ----------------------------------------------------------
 * 結果データ読込
 * RESULTSシート → 学習・検証データ
 * ==========================================================
 */

class ResultLoader {

  /**
   * 全結果取得
   */
  static load() {

    const results = DataSource.getResults();

    return Object.keys(results).map(raceId => ({
      raceId,
      result: results[raceId]
    }));

  }

  /**
   * 指定レース取得
   */
  static loadRace(raceId) {

    const results = DataSource.getResults();

    return results[raceId] || null;

  }

  /**
   * 学習用履歴作成
   */
  static buildHistory(races) {

    const resultMap = DataSource.getResults();

    return (races || [])
      .filter(r => resultMap[r.id])
      .map(race => {

        const featureSet =
          FeatureEngine.buildRace(race);

        const scoreSummary =
          featureSet.map(f =>
            CoreEngine.evaluate(race, f)
          );

        return {

          raceId: race.id,

          result: resultMap[race.id],

          winner:
            resultMap[race.id].winner,

          scoreSummary

        };

      });

  }

  /**
   * 勝ち馬取得
   */
  static winner(raceId) {

    const result = this.loadRace(raceId);

    return result
      ? result.winner
      : null;

  }

  /**
   * 3着以内取得
   */
  static places(raceId) {

    const result = this.loadRace(raceId);

    return result
      ? result.place
      : [];

  }

}
