function setupOmegaTriggers() {

  // 既存トリガー削除（安全化）
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));

  // =========================
  // ① 朝データ取得（06:00）
  // =========================
  ScriptApp.newTrigger("runMorningData")
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();


  // =========================
  // ② レース前実行（10分前想定）
  // ※時間固定ではなく頻繁チェック型
  // =========================
  ScriptApp.newTrigger("runPreRace")
    .timeBased()
    .everyMinutes(10)
    .create();


  // =========================
  // ③ レース後処理（10分ごと監視）
  // =========================
  ScriptApp.newTrigger("runPostRace")
    .timeBased()
    .everyMinutes(10)
    .create();


  // =========================
  // ④ 夜学習（23:00）
  // =========================
  ScriptApp.newTrigger("runNightLearning")
    .timeBased()
    .atHour(23)
    .everyDays(1)
    .create();


  // =========================
  // ⑤ AutoTuner（週1：日曜1:00）
  // =========================
  ScriptApp.newTrigger("runAutoTune")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(1)
    .create();


  Logger.log("ΩMAX triggers setup completed");
}
