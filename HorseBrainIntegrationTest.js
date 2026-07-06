/**
 * ==========================================================
 * ΩMAX AIOS
 * HorseBrainIntegrationTest.js
 * ----------------------------------------------------------
 * Horse Analyzer → Rule → HorseBrain 結合テスト
 * ==========================================================
 */

function testHorseBrainIntegration() {

  Logger.info("===== HorseBrain Integration Test START =====");

  RuleManager.seedDefaultRules();

  const context = new RaceContext({
    id: "TEST_RACE_001",
    name: "ΩMAXテストレース",
    track: "東京",
    date: "2026-07-06"
  });

  const raceState = new RaceState();
  raceState.raceId = "TEST_RACE_001";
  raceState.course = "東京";
  raceState.surface = "TURF";
  raceState.distance = 1600;
  raceState.className = "G2";
  raceState.fieldSize = 18;

  context.setRaceState(raceState);

  const profile = new HorseProfile("TEST_HORSE_001");
  profile.name = "オメガテスト";
  profile.sample = 100;
  profile.bestTrainingType = "坂路";
  profile.bestTrainingTimeRange = {
    min: 51.6,
    max: 52.4
  };
  profile.bestTrainingPattern = "強め-馬なり-馬なり";
  profile.bestWeightRange = {
    min: 488,
    max: 492
  };
  profile.bestIntervalDays = 56;
  profile.adaptability = 82;
  profile.adaptabilitySample = 80;
  profile.environmentTolerance = 6;
  profile.fatigueTolerance = 25;

  const horse = {
    id: "TEST_HORSE_001",
    name: "オメガテスト",

    training: {
      type: "坂路",
      time: 52.0,
      pattern: "強め-馬なり-馬なり",
      history: [
        { week: 3, load: "強め", time: 53.0 },
        { week: 2, load: "馬なり", time: 52.4 },
        { week: 1, load: "馬なり", time: 52.0 }
      ]
    },

    bodyWeight: {
      current: 490,
      previous: 486,
      change: 4,
      history: [482, 486, 490],
      pattern: "成長増"
    },

    intervalDays: 56,
    daysSinceLastRace: 56,

    fatigueIndex: 20,
    fatigueHistory: [35, 28, 20],

    recoveryPattern: "標準回復",
    recoveryHistory: [60, 72, 85],

    environment: {
      type: "遠征",
      changeType: "初東京",
      transportDistance: 420,
      firstCourse: true,
      firstNightRace: false
    },

    environmentHistory: [
      { type: "在厩", score: 70 },
      { type: "遠征", score: 82 }
    ],

    risk: {
      lamenessConcern: false,
      longLayoff: false,
      overRaced: false,
      jockeyChange: false,
      firstCondition: true
    },

    riskHistory: [
      { score: 80 },
      { score: 85 }
    ]
  };

  const analyzers =
    HorseAnalyzerRunner.run(
      horse,
      profile,
      context
    );

  const brain =
    HorseBrain.evaluate(analyzers);

  const result = {
    analyzers,
    brain
  };

  Logger.info(
    "HorseBrain Integration Test RESULT",
    result
  );

  console.log(JSON.stringify(result, null, 2));

  Logger.info("===== HorseBrain Integration Test END =====");

  return result;
}
