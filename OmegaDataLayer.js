/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * OmegaDataLayer.js
 * ----------------------------------------------------------
 * データアクセス層
 * DataSourceとAI層の橋渡し
 * ==========================================================
 */

class OmegaDataLayer {

  /**
   * 今日の全レース取得
   */
  static loadToday() {

    const races = DataSource.getTodayRaces();

    return (races || [])
      .map(race => {

        const horses = DataSource.getHorses(race.id);

        return Race.build({
          ...race,
          horses
        });

      })
      .filter(race => Race.isValid(race));

  }

  /**
   * FeatureEngine入力用
   */
  static getFeatureInputs() {

    return this.loadToday().map(race => ({
      race,
      context: Race.extractContext(race),
      horses: race.horses
    }));

  }

  /**
   * レース取得
   */
  static getRace(raceId) {

    return this.loadToday().find(
      race => String(race.id) === String(raceId)
    ) || null;

  }

  /**
   * 馬一覧取得
   */
  static getHorses(raceId) {

    const race = this.getRace(raceId);

    return race
      ? race.horses
      : [];

  }

  /**
   * オッズ取得
   */
  static getOdds(raceId) {

    return DataSource.getOdds(raceId);

  }

  /**
   * 結果取得
   */
  static getResult(raceId) {

    const results = DataSource.getResults();

    return results[raceId] || null;

  }

  /**
   * 全結果取得
   */
  static getResults() {

    return DataSource.getResults();

  }

  /**
   * 今日のレース数
   */
  static countToday() {

    return this.loadToday().length;

  }

  /**
   * データ確認
   */
  static healthCheck() {

    const races = this.loadToday();

    return {
      raceCount: races.length,
      horseCount: races.reduce(
        (sum, race) => sum + race.horses.length,
        0
      ),
      timestamp: new Date().toISOString()
    };

  }

}
