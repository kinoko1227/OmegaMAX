class OmegaDataLayer {

  static buildRaceContext() {

    const races = DataResilienceLayer.getRacesSafe();

    return races.map(race => {

      const horses = DataResilienceLayer.getHorsesSafe(race.id);
      const odds = DataResilienceLayer.getOddsSafe(race.id);

      const enriched = horses.map(h => {

        const clean = DataSanitizer.sanitizeHorse({
          ...h,
          odds: odds[h.id] || h.odds || 0
        });

        return this._format(clean, race);
      });

      return DataSanitizer.sanitizeRace({
        ...race,
        horses: enriched
      });
    });
  }


  // ★ここが唯一の責任
  static _format(horse, race) {

    return {
      id: horse.id,
      name: horse.name,
      jockey: horse.jockey,
      trainer: horse.trainer,

      weight: horse.weight,
      odds: horse.odds,

      baseSpeed: horse.baseSpeed,
      stamina: horse.stamina,
      finishStrength: horse.finishStrength,

      last3Avg: horse.last3Avg,
      last5Avg: horse.last5Avg,
      trend: horse.trend,

      raceDistance: race.distance,
      raceCourse: race.course,

      meta: {
        source: "OmegaDataLayer",
        version: "v9"
      }
    };
  }
}
