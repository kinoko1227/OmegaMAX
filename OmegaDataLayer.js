/**
 * ==========================================================
 * ΩMAX Ultimate v10
 * OmegaDataLayer.js
 * ----------------------------------------------------------
 * DataSource → Race変換
 * AIへ渡すデータ生成
 * ==========================================================
 */

class OmegaDataLayer {

  /**
   * 今日の全レース取得
   */
  static getTodayRaces() {

    const races = DataSource.getTodayRaces();

    return races
      .map(r => Race.build(r))
      .filter(Race.isValid);

  }

  /**
   * FeatureEngine入力生成
   */
  static getFeatureInputs() {

    return this
      .getTodayRaces()
      .map(r => Race.toFeatureInput(r));

  }

  /**
   * RaceID検索
   */
  static getRace(raceId) {

    return this
      .getTodayRaces()
      .find(r => r.id === String(raceId));

  }

  /**
   * 馬一覧
   */
  static getHorses(raceId) {

    const race = this.getRace(raceId);

    return race
      ? race.horses
      : [];

  }

  /**
   * 今日の件数
   */
  static countToday() {

    return this.getTodayRaces().length;

  }

}
