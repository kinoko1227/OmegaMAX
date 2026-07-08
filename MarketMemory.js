/**
 * ==========================================================
 * ΩMAX AIOS
 * MarketMemory.js
 * ----------------------------------------------------------
 * Market Memory v1.0.0
 *
 * オッズ・人気・市場歪み・EV・ROIを記憶する。
 * 「どの馬が売れたか」ではなく、
 * 「市場が何を過大評価・過小評価したか」を学習する。
 *
 * GAS V8 compatible.
 * ==========================================================
 */

class MarketMemory {

  constructor() {
    this.version = "1.0.0";
    this.memoryId = "MARKET_MEMORY";
    this.createdAt = new Date();
    this.updatedAt = new Date();

    // raceId -> market record
    this.races = {};

    // conditionKey -> KnowledgeCell
    this.conditionKnowledge = {};

    // horseId -> KnowledgeCell
    this.horseMarketKnowledge = {};

    // jockeyId -> KnowledgeCell
    this.jockeyMarketKnowledge = {};

    // trainerId -> KnowledgeCell
    this.trainerMarketKnowledge = {};

    // bloodline/cross -> KnowledgeCell
    this.bloodlineMarketKnowledge = {};
    this.crossMarketKnowledge = {};

    // ticketType -> KnowledgeCell
    this.ticketTypeKnowledge = {};

    // popularity bucket -> KnowledgeCell
    this.popularityKnowledge = {};

    // odds bucket -> KnowledgeCell
    this.oddsKnowledge = {};

    this.history = new KnowledgeHistory();
    this.journal = new AIJournal();
  }

  /**
   * レース市場を記録する
   * @param {Object} raceMarket
   * @returns {Object}
   */
  recordRace(raceMarket) {
    raceMarket = raceMarket || {};

    const raceId = raceMarket.raceId || Utilities.getUuid();

    const record = {
      raceId: raceId,
      date: raceMarket.date || null,
      course: raceMarket.course || "",
      distance: Number(raceMarket.distance || 0),
      surface: raceMarket.surface || "",
      going: raceMarket.going || "",
      raceClass: raceMarket.raceClass || "",
      fieldSize: Number(raceMarket.fieldSize || 0),
      entries: raceMarket.entries || [],
      tickets: raceMarket.tickets || [],
      summary: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    record.summary = this.summarizeRace(record);

    this.races[raceId] = record;

    this.updateRaceKnowledge(record);
    this.updateEntryKnowledge(record);
    this.updateTicketKnowledge(record);

    this.journal.add({
      type: "MARKET_RECORD",
      category: "MARKET_MEMORY",
      title: "Market race recorded",
      message: "Race market memory was recorded.",
      targetType: "RACE",
      targetId: raceId,
      evidence: record.summary
    });

    this.touch();

    return record;
  }

  /**
   * レース市場の概要作成
   */
  summarizeRace(record) {
    const entries = record.entries || [];

    const oddsList = entries
      .map(function(e) { return Number(e.odds || 0); })
      .filter(function(x) { return x > 0; });

    const evList = entries
      .map(function(e) { return Number(e.ev || 0); })
      .filter(function(x) { return x > 0; });

    const overlay = entries.filter(function(e) {
      return Number(e.ev || 0) >= 1.1;
    });

    const underlay = entries.filter(function(e) {
      return Number(e.ev || 0) > 0 && Number(e.ev || 0) < 0.85;
    });

    const favorite = entries
      .slice()
      .sort(function(a, b) {
        return Number(a.popularity || 999) - Number(b.popularity || 999);
      })[0] || null;

    const bestEv = entries
      .slice()
      .sort(function(a, b) {
        return Number(b.ev || 0) - Number(a.ev || 0);
      })[0] || null;

    return {
      entryCount: entries.length,
      averageOdds: this.average(oddsList),
      averageEV: this.average(evList),
      overlayCount: overlay.length,
      underlayCount: underlay.length,
      favoriteHorseId: favorite ? favorite.horseId || "" : "",
      favoriteOdds: favorite ? Number(favorite.odds || 0) : 0,
      favoriteEV: favorite ? Number(favorite.ev || 0) : 0,
      bestEvHorseId: bestEv ? bestEv.horseId || "" : "",
      bestEV: bestEv ? Number(bestEv.ev || 0) : 0,
      marketTension: this.calculateMarketTension(entries),
      distortionScore: this.calculateDistortionScore(entries)
    };
  }

  /**
   * レース条件別の市場記憶
   */
  updateRaceKnowledge(record) {
    const keys = [
      "COURSE:" + record.course,
      "DISTANCE:" + record.distance,
      "SURFACE:" + record.surface,
      "GOING:" + record.going,
      "CLASS:" + record.raceClass,
      "FIELD:" + this.bucketValue(record.fieldSize, 2),
      "COURSE_DISTANCE:" + record.course + "_" + record.distance,
      "SURFACE_GOING:" + record.surface + "_" + record.going
    ];

    const observation = this.buildRaceObservation(record);

    keys.forEach(function(key) {
      this.updateCell(this.conditionKnowledge, key, "MARKET_CONDITION", observation);
    }, this);

    return this;
  }

  /**
   * 出走馬単位の市場記憶
   */
  updateEntryKnowledge(record) {
    const entries = record.entries || [];

    entries.forEach(function(entry) {
      const observation = this.buildEntryObservation(record, entry);

      if (entry.horseId) {
        this.updateCell(this.horseMarketKnowledge, entry.horseId, "HORSE_MARKET", observation);
      }

      if (entry.jockeyId) {
        this.updateCell(this.jockeyMarketKnowledge, entry.jockeyId, "JOCKEY_MARKET", observation);
      }

      if (entry.trainerId) {
        this.updateCell(this.trainerMarketKnowledge, entry.trainerId, "TRAINER_MARKET", observation);
      }

      if (entry.fatherId) {
        this.updateCell(this.bloodlineMarketKnowledge, entry.fatherId, "BLOODLINE_MARKET", observation);
      }

      if (entry.crossKey) {
        this.updateCell(this.crossMarketKnowledge, entry.crossKey, "CROSS_MARKET", observation);
      }

      this.updateCell(this.popularityKnowledge, this.bucketValue(entry.popularity, 1), "POPULARITY", observation);
      this.updateCell(this.oddsKnowledge, this.bucketOdds(entry.odds), "ODDS", observation);
    }, this);

    return this;
  }

  /**
   * 馬券種別の市場記憶
   */
  updateTicketKnowledge(record) {
    const tickets = record.tickets || [];

    tickets.forEach(function(ticket) {
      const observation = this.buildTicketObservation(record, ticket);
      this.updateCell(this.ticketTypeKnowledge, ticket.type || "UNKNOWN", "TICKET_MARKET", observation);
    }, this);

    return this;
  }

  /**
   * レースObservation
   */
  buildRaceObservation(record) {
    return {
      raceId: record.raceId,
      date: record.date,
      finish: 0,
      abilityIndex: Number(record.summary.distortionScore || 0),
      aceScore: Number(record.summary.marketTension || 0),
      roi: Number(record.summary.averageEV || 0),
      ev: Number(record.summary.averageEV || 0),
      overlayCount: Number(record.summary.overlayCount || 0),
      underlayCount: Number(record.summary.underlayCount || 0),
      marketTension: Number(record.summary.marketTension || 0),
      distortionScore: Number(record.summary.distortionScore || 0)
    };
  }

  /**
   * Entry Observation
   */
  buildEntryObservation(record, entry) {
    entry = entry || {};

    return {
      raceId: record.raceId,
      date: record.date,
      horseId: entry.horseId || "",
      jockeyId: entry.jockeyId || "",
      trainerId: entry.trainerId || "",
      finish: Number(entry.finish || 0),
      popularity: Number(entry.popularity || 0),
      odds: Number(entry.odds || 0),
      predictedWinRate: Number(entry.predictedWinRate || 0),
      impliedWinRate: this.impliedWinRate(entry.odds),
      ev: Number(entry.ev || 0),
      roi: Number(entry.roi || entry.ev || 0),
      abilityIndex: Number(entry.marketScore || entry.ev || 0) * 50,
      aceScore: Number(entry.aceScore || 0),
      overlay: Number(entry.ev || 0) >= 1.1,
      underlay: Number(entry.ev || 0) > 0 && Number(entry.ev || 0) < 0.85
    };
  }

  /**
   * Ticket Observation
   */
  buildTicketObservation(record, ticket) {
    ticket = ticket || {};

    return {
      raceId: record.raceId,
      date: record.date,
      ticketType: ticket.type || "",
      finish: Number(ticket.hit || 0) ? 1 : 0,
      odds: Number(ticket.odds || 0),
      payout: Number(ticket.payout || 0),
      stake: Number(ticket.stake || 0),
      ev: Number(ticket.ev || 0),
      roi: this.calculateTicketROI(ticket),
      abilityIndex: Number(ticket.ev || 0) * 50,
      aceScore: Number(ticket.confidence || 0)
    };
  }

  /**
   * 類似市場検索
   */
  findSimilarMarket(params, limit) {
    params = params || {};
    limit = limit || 20;

    const list = Object.keys(this.races || {}).map(function(id) {
      return this.races[id];
    }, this);

    return list
      .map(function(record) {
        return {
          race: record,
          similarity: this.calculateSimilarity(record, params)
        };
      }, this)
      .sort(function(a, b) {
        return b.similarity - a.similarity;
      })
      .slice(0, limit);
  }

  /**
   * 市場類似度
   */
  calculateSimilarity(record, params) {
    let score = 0;

    if (params.course && record.course === params.course) score += 15;
    if (params.surface && record.surface === params.surface) score += 10;
    if (params.going && record.going === params.going) score += 8;
    if (params.raceClass && record.raceClass === params.raceClass) score += 8;

    if (params.distance) {
      const diff = Math.abs(Number(record.distance || 0) - Number(params.distance || 0));
      score += Math.max(0, 15 - diff / 100);
    }

    if (params.fieldSize) {
      const diff = Math.abs(Number(record.fieldSize || 0) - Number(params.fieldSize || 0));
      score += Math.max(0, 10 - diff * 2);
    }

    if (params.marketTension !== undefined) {
      const diff = Math.abs(Number(record.summary.marketTension || 0) - Number(params.marketTension || 0));
      score += Math.max(0, 15 - diff / 5);
    }

    if (params.distortionScore !== undefined) {
      const diff = Math.abs(Number(record.summary.distortionScore || 0) - Number(params.distortionScore || 0));
      score += Math.max(0, 15 - diff / 5);
    }

    return Utils.clamp(score, 0, 100);
  }

  /**
   * 市場テンション
   */
  calculateMarketTension(entries) {
    entries = entries || [];

    if (!entries.length) return 0;

    const odds = entries
      .map(function(e) { return Number(e.odds || 0); })
      .filter(function(x) { return x > 0; });

    if (!odds.length) return 0;

    const avg = this.average(odds);
    const min = Math.min.apply(null, odds);

    if (avg <= 0) return 0;

    return Utils.clamp((avg / min) * 10, 0, 100);
  }

  /**
   * 市場歪みスコア
   */
  calculateDistortionScore(entries) {
    entries = entries || [];

    if (!entries.length) return 0;

    let total = 0;
    let count = 0;

    entries.forEach(function(e) {
      const predicted = Number(e.predictedWinRate || 0);
      const implied = this.impliedWinRate(e.odds);

      if (predicted > 0 && implied > 0) {
        total += Math.abs(predicted - implied);
        count += 1;
      }
    }, this);

    if (!count) return 0;

    return Utils.clamp((total / count) * 100, 0, 100);
  }

  /**
   * 暗黙勝率
   */
  impliedWinRate(odds) {
    odds = Number(odds || 0);
    if (odds <= 0) return 0;
    return 1 / odds;
  }

  /**
   * Ticket ROI
   */
  calculateTicketROI(ticket) {
    const stake = Number(ticket.stake || 0);
    const payout = Number(ticket.payout || 0);

    if (stake <= 0) {
      return Number(ticket.ev || 0);
    }

    return payout / stake;
  }

  /**
   * Cell更新
   */
  updateCell(map, key, category, observation) {
    if (key === null || key === undefined || key === "") {
      return null;
    }

    const k = String(key);

    if (!map[k]) {
      map[k] = new KnowledgeCell(k);
      map[k].category = category || "";
    } else if (!(map[k] instanceof KnowledgeCell)) {
      map[k] = KnowledgeCell.fromJSON(map[k]);
    }

    map[k].observe(observation || {});

    return map[k];
  }

  /**
   * Best / Top helpers
   */
  best(map) {
    return StatisticsEngine.bestCell(map);
  }

  top(map, limit) {
    return StatisticsEngine.topCells(map, limit || 5);
  }

  getBestOddsRange() {
    return this.best(this.oddsKnowledge);
  }

  getBestPopularityRange() {
    return this.best(this.popularityKnowledge);
  }

  getBestTicketType() {
    return this.best(this.ticketTypeKnowledge);
  }

  /**
   * Bucket helpers
   */
  bucketValue(value, bucketSize) {
    if (value === null || value === undefined || value === "") {
      return "";
    }

    const n = Number(value);
    if (isNaN(n)) return String(value);

    const b = Number(bucketSize || 1);
    return String(Math.round(n / b) * b);
  }

  bucketOdds(odds) {
    odds = Number(odds || 0);

    if (odds <= 0) return "UNKNOWN";
    if (odds < 2) return "1.0-1.9";
    if (odds < 3) return "2.0-2.9";
    if (odds < 5) return "3.0-4.9";
    if (odds < 10) return "5.0-9.9";
    if (odds < 20) return "10.0-19.9";
    if (odds < 50) return "20.0-49.9";
    return "50.0+";
  }

  average(values) {
    values = (values || []).filter(function(v) {
      return !isNaN(Number(v));
    });

    if (!values.length) return 0;

    const total = values.reduce(function(a, b) {
      return Number(a) + Number(b);
    }, 0);

    return total / values.length;
  }

  serializeMap(map) {
    const out = {};
    Object.keys(map || {}).forEach(function(key) {
      const cell = map[key];
      out[key] = cell && typeof cell.toJSON === "function" ? cell.toJSON() : cell;
    });
    return out;
  }

  loadMap(jsonMap) {
    const out = {};
    Object.keys(jsonMap || {}).forEach(function(key) {
      out[key] = jsonMap[key] instanceof KnowledgeCell
        ? jsonMap[key]
        : KnowledgeCell.fromJSON(jsonMap[key]);
    });
    return out;
  }

  touch() {
    this.updatedAt = new Date();
    return this;
  }

  /**
   * JSON
   */
  toJSON() {
    return {
      version: this.version,
      memoryId: this.memoryId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      races: this.races,
      conditionKnowledge: this.serializeMap(this.conditionKnowledge),
      horseMarketKnowledge: this.serializeMap(this.horseMarketKnowledge),
      jockeyMarketKnowledge: this.serializeMap(this.jockeyMarketKnowledge),
      trainerMarketKnowledge: this.serializeMap(this.trainerMarketKnowledge),
      bloodlineMarketKnowledge: this.serializeMap(this.bloodlineMarketKnowledge),
      crossMarketKnowledge: this.serializeMap(this.crossMarketKnowledge),
      ticketTypeKnowledge: this.serializeMap(this.ticketTypeKnowledge),
      popularityKnowledge: this.serializeMap(this.popularityKnowledge),
      oddsKnowledge: this.serializeMap(this.oddsKnowledge),
      history: this.history.toJSON(),
      journal: this.journal.toJSON()
    };
  }

  /**
   * JSON読込
   */
  load(json) {
    if (!json) return this;

    this.version = json.version || this.version;
    this.memoryId = json.memoryId || this.memoryId;
    this.createdAt = json.createdAt || new Date();
    this.updatedAt = json.updatedAt || new Date();
    this.races = json.races || {};

    this.conditionKnowledge = this.loadMap(json.conditionKnowledge);
    this.horseMarketKnowledge = this.loadMap(json.horseMarketKnowledge);
    this.jockeyMarketKnowledge = this.loadMap(json.jockeyMarketKnowledge);
    this.trainerMarketKnowledge = this.loadMap(json.trainerMarketKnowledge);
    this.bloodlineMarketKnowledge = this.loadMap(json.bloodlineMarketKnowledge);
    this.crossMarketKnowledge = this.loadMap(json.crossMarketKnowledge);
    this.ticketTypeKnowledge = this.loadMap(json.ticketTypeKnowledge);
    this.popularityKnowledge = this.loadMap(json.popularityKnowledge);
    this.oddsKnowledge = this.loadMap(json.oddsKnowledge);

    this.history = KnowledgeHistory.fromJSON(json.history || {});
    this.journal = AIJournal.fromJSON(json.journal || {});

    return this;
  }

  static fromJSON(json) {
    return new MarketMemory().load(json || {});
  }

}
