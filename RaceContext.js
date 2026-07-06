/**
 * ==========================================================
 * ΩMAX AIOS
 * RaceContext.js
 * ----------------------------------------------------------
 * ACE / RaceSimulator に渡すレース全体の文脈
 *
 * RaceContext は「1頭」ではなく「1レース全体」を表す。
 * ==========================================================
 */

class RaceContext {

  constructor(race = null) {

    this.race = race;

    // レース状態
    this.raceState = null;

    // 出走馬
    this.horses = [];

    // 馬ごとの状態
    this.horseStates = {};

    // 馬ごとの市場状態
    this.marketStates = {};

    // 時間状態
    this.timeState = null;

    // 展開・馬場・市場
    this.pacePrediction = null;
    this.trackBias = null;
    this.weather = null;
    this.oddsSnapshot = null;

    // ACE / Simulator 用
    this.scenarios = [];
    this.reasons = [];

    this.createdAt = new Date();
  }

  setRaceState(raceState) {
    this.raceState = raceState;
    return this;
  }

  setHorses(horses) {
    this.horses = Array.isArray(horses) ? horses : [];
    return this;
  }

  setHorseState(horseId, state) {
    if (horseId) {
      this.horseStates[String(horseId)] = state;
    }
    return this;
  }

  setMarketState(horseId, state) {
    if (horseId) {
      this.marketStates[String(horseId)] = state;
    }
    return this;
  }

  setTimeState(timeState) {
    this.timeState = timeState;
    return this;
  }

  setPacePrediction(pacePrediction) {
    this.pacePrediction = pacePrediction;
    return this;
  }

  setTrackBias(trackBias) {
    this.trackBias = trackBias;
    return this;
  }

  setWeather(weather) {
    this.weather = weather;
    return this;
  }

  setOddsSnapshot(snapshot) {
    this.oddsSnapshot = snapshot;
    return this;
  }

  addScenario(scenario) {
    if (scenario) {
      this.scenarios.push(scenario);
    }
    return this;
  }

  addReason(reason) {
    if (reason) {
      this.reasons.push(String(reason));
    }
    return this;
  }

  getHorseState(horseId) {
    return this.horseStates[String(horseId)] || null;
  }

  getMarketState(horseId) {
    return this.marketStates[String(horseId)] || null;
  }

  horseCount() {
    return this.horses.length;
  }

  toJSON() {
    return {
      race: this.race,
      raceState: this.raceState && typeof this.raceState.toJSON === "function"
        ? this.raceState.toJSON()
        : this.raceState,

      horses: this.horses,

      horseStates: this._mapToJSON(this.horseStates),
      marketStates: this._mapToJSON(this.marketStates),

      timeState: this.timeState && typeof this.timeState.toJSON === "function"
        ? this.timeState.toJSON()
        : this.timeState,

      pacePrediction: this.pacePrediction,
      trackBias: this.trackBias,
      weather: this.weather,
      oddsSnapshot: this.oddsSnapshot,
      scenarios: this.scenarios,
      reasons: this.reasons,
      createdAt: this.createdAt
    };
  }

  _mapToJSON(map) {
    const out = {};

    Object.keys(map || {}).forEach(key => {
      const value = map[key];

      out[key] =
        value && typeof value.toJSON === "function"
          ? value.toJSON()
          : value;
    });

    return out;
  }
}
