/**
 * ==========================================================
 * ΩMAX AIOS
 * StatisticsEngine.js
 * ----------------------------------------------------------
 * Observationを条件別に集計し、
 * KnowledgeCellを更新する。
 * ==========================================================
 */

class StatisticsEngine {

  /**
   * ProfileへObservationを反映する
   *
   * @param {ProfileBase} profile
   * @param {Object} observation
   * @returns {ProfileBase}
   */
  static apply(profile, observation) {

    if (!profile || !observation) {
      return profile;
    }

    profile.learn(observation);

    return profile;
  }

  /**
   * 複数Observationを反映
   */
  static applyMany(profile, observations) {

    (observations || []).forEach(function(observation) {
      StatisticsEngine.apply(profile, observation);
    });

    return profile;
  }

  /**
   * KnowledgeCell取得・作成
   */
  static getCell(map, key, category) {

    if (
      key === null ||
      key === undefined ||
      key === ""
    ) {
      return null;
    }

    const k = String(key);

    if (!map[k]) {
      map[k] = new KnowledgeCell(k);
      map[k].category = category || "";
    } else if (!(map[k] instanceof KnowledgeCell)) {
      map[k] = KnowledgeCell.fromJSON(map[k]);
    }

    return map[k];
  }

  /**
   * CellへObservation反映
   */
  static updateCell(map, key, category, observation) {

    const cell =
      this.getCell(map, key, category);

    if (!cell) {
      return null;
    }

    cell.observe(observation);

    return cell;
  }

  /**
   * 条件別まとめて更新
   */
  static updateCells(profile, observation, definitions) {

    (definitions || []).forEach(function(def) {

      if (!profile[def.map]) {
        profile[def.map] = {};
      }

      StatisticsEngine.updateCell(
        profile[def.map],
        observation[def.key],
        def.category,
        observation
      );

    });

    return profile;
  }

  /**
   * 最高スコアCellを取得
   */
  static bestCell(map) {

    const keys = Object.keys(map || {});

    if (!keys.length) {
      return null;
    }

    let best = null;

    keys.forEach(function(key) {

      let cell = map[key];

      if (!(cell instanceof KnowledgeCell)) {
        cell = KnowledgeCell.fromJSON(cell);
        map[key] = cell;
      }

      if (!best || cell.score > best.score) {
        best = cell;
      }

    });

    return best;
  }

  /**
   * 上位Cell一覧
   */
  static topCells(map, limit) {

    limit = limit || 5;

    return Object.keys(map || {})
      .map(function(key) {
        const cell =
          map[key] instanceof KnowledgeCell
            ? map[key]
            : KnowledgeCell.fromJSON(map[key]);

        map[key] = cell;

        return cell;
      })
      .sort(function(a, b) {
        return b.score - a.score;
      })
      .slice(0, limit);
  }

}
