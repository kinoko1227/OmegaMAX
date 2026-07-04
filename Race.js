 /**
  * =========================================
  * ΩMAX v9 - Race Layer
  * =========================================
  * 役割：
  * - レースデータの正規化
  * - 出走馬データの統一フォーマット化
  * - FeatureEngineへの安定供給
  * - 下流エンジンの入力保証
  * =========================================
  */

class Race {

  /**
   * レースオブジェクト生成（標準化）
   */
  static build(raw) {
    if (!raw) {
      throw new Error("[Race.build] raw data is null");
    }

    const race = {
      id: this._safe(raw.id),
      name: this._safe(raw.name),
      date: this._safe(raw.date),

      course: this._normalizeCourse(raw.course),
      distance: Number(raw.distance || 0),
      ground: this._normalizeGround(raw.ground),

      grade: this._normalizeGrade(raw.grade),

      horses: this._buildHorses(raw.horses || []),

      meta: {
        source: raw.source || "unknown",
        createdAt: new Date().toISOString()
      }
    };

    return Validator.validateRace(race);
  }


  /**
   * 出走馬配列の統一化
   */
  static _buildHorses(horses) {
    return horses.map(h => ({
      id: this._safe(h.id),
      name: this._safe(h.name),

      odds: Number(h.odds || 0),
      popularity: Number(h.popularity || 0),
      bracket: Number(h.bracket || 0),
      horseNumber: Number(h.horseNumber || 0),

      jockey: this._safe(h.jockey),
      trainer: this._safe(h.trainer),

      weight: Number(h.weight || 0),
      weightDiff: Number(h.weightDiff || 0),

      age: Number(h.age || 0),
      sex: this._safe(h.sex),

      bloodline: this._safe(h.bloodline),

      pastRuns: this._normalizePastRuns(h.pastRuns || []),

      // FeatureEngine用プレースホルダ
      features: {}
    }));
  }


  /**
   * 過去走の正規化
   */
  static _normalizePastRuns(runs) {
    return runs.map(r => ({
      date: this._safe(r.date),
      course: this._normalizeCourse(r.course),
      distance: Number(r.distance || 0),

      finishPosition: Number(r.finishPosition || 0),
      time: Number(r.time || 0),

      last3f: Number(r.last3f || 0),

      pace: this._safe(r.pace),
      condition: this._safe(r.condition)
    }));
  }


  /**
   * コース正規化
   */
  static _normalizeCourse(course) {
    if (!course) return "unknown";

    return String(course)
      .replace(/\s+/g, "")
      .toUpperCase();
  }


  /**
   * 馬場状態正規化
   */
  static _normalizeGround(ground) {
    if (!ground) return "UNKNOWN";

    const g = String(ground).toLowerCase();

    if (g.includes("良")) return "GOOD";
    if (g.includes("稍")) return "GOOD_TO_YIELDING";
    if (g.includes("重")) return "HEAVY";
    if (g.includes("不")) return "VERY_HEAVY";

    return "UNKNOWN";
  }


  /**
   * レース格付け正規化
   */
  static _normalizeGrade(grade) {
    if (!grade) return "UNKNOWN";

    const g = String(grade).toUpperCase();

    if (g.includes("G1")) return "G1";
    if (g.includes("G2")) return "G2";
    if (g.includes("G3")) return "G3";
    if (g.includes("OP")) return "OPEN";

    return "UNKNOWN";
  }


  /**
   * 安全文字列化
   */
  static _safe(v) {
    if (v == null) return "";
    return String(v);
  }


  static extractContext(race) {

  const horses = race.horses || [];

  if (horses.length === 0) {
    return {
      horses: [],
      distance: race.distance,
      grade: race.grade,
      ground: race.ground,
      course: race.course,
      isShort: race.distance <= 1400,
      isMiddle: race.distance > 1400 && race.distance < 2200,
      isLong: race.distance >= 2200,
      isHeavyGround: race.ground === "HEAVY" || race.ground === "VERY_HEAVY"
    };
  }

  return {
    horses: horses.map(h => ({
      ...h
    })),

    distance: race.distance,
    grade: race.grade,
    ground: race.ground,
    course: race.course,

    isShort: race.distance <= 1400,
    isMiddle: race.distance > 1400 && race.distance < 2200,
    isLong: race.distance >= 2200,

    isHeavyGround: race.ground === "HEAVY" || race.ground === "VERY_HEAVY"
  };
}


  /**
   * FeatureEngine用入力セット生成
   */
  static toFeatureInput(race) {
    const context = this.extractContext(race);

    return {
      race: race,
      context: context,
      horses: race.horses
    };
  }


  /**
   * デバッグ用サマリー
   */
  static summary(race) {
    return {
      id: race.id,
      name: race.name,
      date: race.date,
      fieldSize: race.horses.length,
      distance: race.distance,
      grade: race.grade
    };
  }
}
