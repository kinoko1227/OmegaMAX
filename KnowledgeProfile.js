/**
 * ==========================================================
 * ΩMAX AIOS
 * KnowledgeProfile.js
 * ----------------------------------------------------------
 * Knowledge Profile
 * ProfileBaseを継承し、KnowledgeCellを管理する共通基盤。
 * ==========================================================
 */

class KnowledgeProfile extends ProfileBase {

  constructor(id, type) {
    super(id || "", type || "KNOWLEDGE");

    this.abilityKnowledge = {};
    this.distanceKnowledge = {};
    this.courseKnowledge = {};
    this.surfaceKnowledge = {};
    this.goingKnowledge = {};
    this.classKnowledge = {};
    this.seasonKnowledge = {};
    this.paceKnowledge = {};
    this.styleKnowledge = {};
    this.conditionKnowledge = {};
    this.relationshipKnowledge = {};
  }

  learn(observation) {
    ProfileBase.prototype.learn.call(this, observation);
    this.updateCommonKnowledge(observation);
    this.touch();
    return this;
  }

  updateCommonKnowledge(observation) {
    if (!observation) return this;

    this.updateBySchema("COMMON", observation);
    this.updateBySchema(this.type, observation);

    return this;
  }

  updateBySchema(type, observation) {
    const schema = KnowledgeSchema.getProfileSchema(type);

    Object.keys(schema).forEach(function(key) {
      const def = schema[key];
      const value = observation[def.key];

      this.updateKnowledgeCell(
        this.getKnowledgeMap(def.category),
        value,
        def.category,
        observation
      );
    }, this);

    return this;
  }

  getKnowledgeMap(category) {
    switch (category) {
      case "DISTANCE": return this.distanceKnowledge;
      case "COURSE": return this.courseKnowledge;
      case "SURFACE": return this.surfaceKnowledge;
      case "GOING": return this.goingKnowledge;
      case "CLASS": return this.classKnowledge;
      case "SEASON": return this.seasonKnowledge;
      case "PACE": return this.paceKnowledge;
      case "STYLE": return this.styleKnowledge;
      case "RELATIONSHIP": return this.relationshipKnowledge;
      default: return this.conditionKnowledge;
    }
  }

  updateKnowledgeCell(map, key, category, observation) {
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

    map[k].observe(observation);
    return map[k];
  }

  updateRelationship(key, observation) {
    return this.updateKnowledgeCell(
      this.relationshipKnowledge,
      key,
      "RELATIONSHIP",
      observation
    );
  }

  best(map) {
    return StatisticsEngine.bestCell(map);
  }

  top(map, limit) {
    return StatisticsEngine.topCells(map, limit || 5);
  }

  serializeMap(map) {
    const out = {};
    Object.keys(map || {}).forEach(function(key) {
      const cell = map[key];
      out[key] =
        cell && typeof cell.toJSON === "function"
          ? cell.toJSON()
          : cell;
    });
    return out;
  }

  loadMap(jsonMap) {
    const out = {};
    Object.keys(jsonMap || {}).forEach(function(key) {
      out[key] =
        jsonMap[key] instanceof KnowledgeCell
          ? jsonMap[key]
          : KnowledgeCell.fromJSON(jsonMap[key]);
    });
    return out;
  }

  toJSON() {
    const base = ProfileBase.prototype.toJSON.call(this);

    return Object.assign(base, {
      abilityKnowledge: this.serializeMap(this.abilityKnowledge),
      distanceKnowledge: this.serializeMap(this.distanceKnowledge),
      courseKnowledge: this.serializeMap(this.courseKnowledge),
      surfaceKnowledge: this.serializeMap(this.surfaceKnowledge),
      goingKnowledge: this.serializeMap(this.goingKnowledge),
      classKnowledge: this.serializeMap(this.classKnowledge),
      seasonKnowledge: this.serializeMap(this.seasonKnowledge),
      paceKnowledge: this.serializeMap(this.paceKnowledge),
      styleKnowledge: this.serializeMap(this.styleKnowledge),
      conditionKnowledge: this.serializeMap(this.conditionKnowledge),
      relationshipKnowledge: this.serializeMap(this.relationshipKnowledge)
    });
  }

  load(json) {
    ProfileBase.prototype.load.call(this, json);

    if (!json) return this;

    this.abilityKnowledge = this.loadMap(json.abilityKnowledge);
    this.distanceKnowledge = this.loadMap(json.distanceKnowledge);
    this.courseKnowledge = this.loadMap(json.courseKnowledge);
    this.surfaceKnowledge = this.loadMap(json.surfaceKnowledge);
    this.goingKnowledge = this.loadMap(json.goingKnowledge);
    this.classKnowledge = this.loadMap(json.classKnowledge);
    this.seasonKnowledge = this.loadMap(json.seasonKnowledge);
    this.paceKnowledge = this.loadMap(json.paceKnowledge);
    this.styleKnowledge = this.loadMap(json.styleKnowledge);
    this.conditionKnowledge = this.loadMap(json.conditionKnowledge);
    this.relationshipKnowledge = this.loadMap(json.relationshipKnowledge);

    return this;
  }
}
