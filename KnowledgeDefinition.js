/**
 * ==========================================================
 * ΩMAX AIOS
 * KnowledgeDefinition.js
 * ----------------------------------------------------------
 * Knowledge Definition
 *
 * ΩMAXが学習する知識項目を定義する。
 *
 * HorseProfile
 * JockeyProfile
 * TrainerProfile
 * BloodlineProfile
 * など全Profile共通。
 * ==========================================================
 */

const KnowledgeDefinition = {

  /**
   * Horse共通知識
   */
  HORSE: {

    distance: {
      category: "DISTANCE",
      label: "距離"
    },

    course: {
      category: "COURSE",
      label: "競馬場"
    },

    surface: {
      category: "SURFACE",
      label: "芝ダート"
    },

    going: {
      category: "GOING",
      label: "馬場状態"
    },

    raceClass: {
      category: "CLASS",
      label: "クラス"
    },

    season: {
      category: "SEASON",
      label: "季節"
    },

    pace: {
      category: "PACE",
      label: "ペース"
    },

    runningStyle: {
      category: "STYLE",
      label: "脚質"
    },

    trainingType: {
      category: "TRAINING",
      label: "調教"
    },

    bodyWeight: {
      category: "BODY_WEIGHT",
      label: "馬体重"
    },

    intervalDays: {
      category: "INTERVAL",
      label: "ローテーション"
    }

  },

  /**
   * 騎手
   */
  JOCKEY: {

    course: {
      category: "COURSE",
      label: "競馬場"
    },

    distance: {
      category: "DISTANCE",
      label: "距離"
    },

    pace: {
      category: "PACE",
      label: "ペース"
    },

    runningStyle: {
      category: "STYLE",
      label: "脚質"
    }

  },

  /**
   * 調教師
   */
  TRAINER: {

    course: {
      category: "COURSE",
      label: "競馬場"
    },

    trainingType: {
      category: "TRAINING",
      label: "調教"
    }

  },

  /**
   * 血統
   */
  BLOODLINE: {

    distance: {
      category: "DISTANCE",
      label: "距離"
    },

    surface: {
      category: "SURFACE",
      label: "芝ダート"
    },

    going: {
      category: "GOING",
      label: "馬場"
    }

  },

  /**
   * 配合
   */
  CROSS: {

    distance: {
      category: "DISTANCE",
      label: "距離"
    },

    course: {
      category: "COURSE",
      label: "競馬場"
    }

  }

};
