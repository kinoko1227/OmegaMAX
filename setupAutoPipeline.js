function setupAutoPipeline() {

  ScriptApp.newTrigger("runOmegaAutoPipeline")
    .timeBased()
    .everyDays(1)
    .atHour(5)
    .create();
}
