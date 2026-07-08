/**
 * ==========================================================
 * ΩMAX AIOS
 * KnowledgeSchema.js
 * ----------------------------------------------------------
 * Knowledge Schema
 *
 * ΩMAXが「何を知識として扱うか」を定義する。
 * ここは学習値ではなく、知識項目の設計図。
 * ==========================================================
 */

const KnowledgeSchema = {

  VERSION: 1,

  COMMON: {

    distance: {
      key: "distance",
      label: "距離",
      category: "DISTANCE",
      valueType: "number",
      bucketSize: 200,
      learnable: true
    },

    course: {
      key: "course",
      label: "競馬場",
      category: "COURSE",
      valueType: "string",
      learnable: true
    },

    surface: {
      key: "surface",
      label: "芝・ダート",
      category: "SURFACE",
      valueType: "string",
      learnable: true
    },

    going: {
      key: "going",
      label: "馬場状態",
      category: "GOING",
      valueType: "string",
      learnable: true
    },

    raceClass: {
      key: "raceClass",
      label: "レースクラス",
      category: "CLASS",
      valueType: "string",
      learnable: true
    },

    season: {
      key: "season",
      label: "季節",
      category: "SEASON",
      valueType: "string",
      learnable: true
    },

    pace: {
      key: "pace",
      label: "ペース",
      category: "PACE",
      valueType: "string",
      learnable: true
    },

    runningStyle: {
      key: "runningStyle",
      label: "脚質",
      category: "STYLE",
      valueType: "string",
      learnable: true
    },

    fieldSize: {
      key: "fieldSize",
      label: "頭数",
      category: "FIELD_SIZE",
      valueType: "number",
      bucketSize: 2,
      learnable: true
    },

    frameNumber: {
      key: "frameNumber",
      label: "枠番",
      category: "FRAME",
      valueType: "number",
      bucketSize: 1,
      learnable: true
    },

    horseNumber: {
      key: "horseNumber",
      label: "馬番",
      category: "HORSE_NUMBER",
      valueType: "number",
      bucketSize: 1,
      learnable: true
    }

  },

  HORSE: {

    trainingType: {
      key: "trainingType",
      label: "調教種類",
      category: "TRAINING",
      valueType: "string",
      learnable: true
    },

    trainingPattern: {
      key: "trainingPattern",
      label: "調整パターン",
      category: "TRAINING_PATTERN",
      valueType: "string",
      learnable: true
    },

    bodyWeight: {
      key: "bodyWeight",
      label: "馬体重",
      category: "BODY_WEIGHT",
      valueType: "number",
      bucketSize: 4,
      learnable: true
    },

    bodyWeightChange: {
      key: "bodyWeightChange",
      label: "馬体重増減",
      category: "BODY_WEIGHT_CHANGE",
      valueType: "number",
      bucketSize: 2,
      learnable: true
    },

    intervalDays: {
      key: "intervalDays",
      label: "レース間隔",
      category: "INTERVAL",
      valueType: "number",
      bucketSize: 7,
      learnable: true
    },

    age: {
      key: "age",
      label: "年齢",
      category: "AGE",
      valueType: "number",
      bucketSize: 1,
      learnable: true
    }

  },

  JOCKEY: {

    jockeyId: {
      key: "jockeyId",
      label: "騎手",
      category: "JOCKEY",
      valueType: "string",
      learnable: true
    },

    jockeyStyle: {
      key: "jockeyStyle",
      label: "騎乗傾向",
      category: "JOCKEY_STYLE",
      valueType: "string",
      learnable: true
    }

  },

  TRAINER: {

    trainerId: {
      key: "trainerId",
      label: "調教師",
      category: "TRAINER",
      valueType: "string",
      learnable: true
    },

    stablePattern: {
      key: "stablePattern",
      label: "厩舎傾向",
      category: "STABLE_PATTERN",
      valueType: "string",
      learnable: true
    }

  },

  BLOODLINE: {

    fatherId: {
      key: "fatherId",
      label: "父",
      category: "FATHER",
      valueType: "string",
      learnable: true
    },

    motherFatherId: {
      key: "motherFatherId",
      label: "母父",
      category: "BROODMARE_SIRE",
      valueType: "string",
      learnable: true
    },

    sireLine: {
      key: "sireLine",
      label: "父系",
      category: "SIRE_LINE",
      valueType: "string",
      learnable: true
    },

    damLine: {
      key: "damLine",
      label: "牝系",
      category: "DAM_LINE",
      valueType: "string",
      learnable: true
    }

  },

  CROSS: {

    crossKey: {
      key: "crossKey",
      label: "配合",
      category: "CROSS",
      valueType: "string",
      learnable: true
    },

    nickType: {
      key: "nickType",
      label: "ニックス",
      category: "NICK",
      valueType: "string",
      learnable: true
    }

  },

  COURSE_STATE: {

    cushionValue: {
      key: "cushionValue",
      label: "クッション値",
      category: "CUSHION",
      valueType: "number",
      bucketSize: 0.5,
      learnable: true
    },

    moisture: {
      key: "moisture",
      label: "含水率",
      category: "MOISTURE",
      valueType: "number",
      bucketSize: 1,
      learnable: true
    },

    trackBias: {
      key: "trackBias",
      label: "トラックバイアス",
      category: "TRACK_BIAS",
      valueType: "string",
      learnable: true
    }

  },

  getProfileSchema: function(type) {

    const common =
      this.COMMON || {};

    const specific =
      this[type] || {};

    return Object.assign(
      {},
      common,
      specific
    );

  },

  getDefinition: function(type, key) {

    const schema =
      this.getProfileSchema(type);

    return schema[key] || null;

  }

};
