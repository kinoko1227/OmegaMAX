/**
 * ==========================================================
 * ΩMAX AIOS
 * ObservationStore.js
 * ----------------------------------------------------------
 * Production Observation Store v1.0.0
 *
 * レース単位・馬単位のObservationを永続保存する実運用版。
 * Google Apps Script / PropertiesService / Spreadsheet fallback 対応。
 *
 * 設計方針:
 * - KnowledgeCellには集計済み知識だけを持たせる
 * - 生データObservationはこのStoreが保持する
 * - 大量データを想定し、PropertiesServiceへチャンク保存
 * - 検索高速化のため raceId / horseId / date / profileType の簡易Indexを保持
 * - Historical Learning / Online Learning / Backtest で共通利用
 *
 * GAS V8 compatible.
 * ==========================================================
 */

class ObservationStore {

  constructor(options) {
    options = options || {};

    this.version = "1.0.0";
    this.namespace = options.namespace || "OMEGA_OBSERVATION_STORE";
    this.chunkSize = Number(options.chunkSize || 100);
    this.maxIndexIds = Number(options.maxIndexIds || 5000);

    this.memoryMode = !!options.memoryMode;
    this.memory = {
      records: {},
      index: this.createEmptyIndex(),
      meta: this.createDefaultMeta()
    };

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Public: Observation追加
   */
  add(observation) {
    observation = this.normalizeObservation(observation || {});

    if (!observation.id) {
      observation.id = this.createId(observation);
    }

    const existing = this.get(observation.id);
    if (existing) {
      return this.update(observation.id, observation);
    }

    const meta = this.getMeta();
    const chunkKey = this.resolveAppendChunkKey(meta);
    const chunk = this.loadChunk(chunkKey);

    chunk.records[observation.id] = observation;
    chunk.count += 1;
    chunk.updatedAt = new Date();

    this.saveChunk(chunkKey, chunk);

    meta.count += 1;
    meta.lastObservationId = observation.id;
    meta.updatedAt = new Date();
    meta.chunkKeys = this.addUnique(meta.chunkKeys || [], chunkKey);
    this.saveMeta(meta);

    const index = this.getIndex();
    this.indexObservation(index, observation);
    this.saveIndex(index);

    this.touch();
    return observation.id;
  }

  /**
   * Public: 複数追加
   */
  addMany(observations) {
    observations = observations || [];
    const ids = [];

    observations.forEach(function(observation) {
      ids.push(this.add(observation));
    }, this);

    return ids;
  }

  /**
   * Public: ID取得
   */
  get(id) {
    if (!id) return null;

    if (this.memoryMode) {
      return this.memory.records[id] || null;
    }

    const meta = this.getMeta();
    const chunkKeys = meta.chunkKeys || [];

    for (let i = 0; i < chunkKeys.length; i++) {
      const chunk = this.loadChunk(chunkKeys[i]);
      if (chunk.records && chunk.records[id]) {
        return chunk.records[id];
      }
    }

    return null;
  }

  /**
   * Public: 更新
   */
  update(id, patch) {
    if (!id) return false;

    patch = patch || {};

    if (this.memoryMode) {
      if (!this.memory.records[id]) return false;
      const before = this.memory.records[id];
      const next = Object.assign({}, before, patch, { updatedAt: new Date() });
      this.memory.records[id] = next;
      this.rebuildIndex();
      return next;
    }

    const meta = this.getMeta();
    const chunkKeys = meta.chunkKeys || [];

    for (let i = 0; i < chunkKeys.length; i++) {
      const key = chunkKeys[i];
      const chunk = this.loadChunk(key);

      if (chunk.records && chunk.records[id]) {
        const before = chunk.records[id];
        const next = Object.assign({}, before, patch, { updatedAt: new Date() });
        chunk.records[id] = this.normalizeObservation(next);
        chunk.updatedAt = new Date();
        this.saveChunk(key, chunk);
        this.rebuildIndex();
        return chunk.records[id];
      }
    }

    return false;
  }

  /**
   * Public: 削除
   */
  remove(id) {
    if (!id) return false;

    if (this.memoryMode) {
      if (!this.memory.records[id]) return false;
      delete this.memory.records[id];
      this.memory.meta.count = Math.max(0, this.memory.meta.count - 1);
      this.rebuildIndex();
      return true;
    }

    const meta = this.getMeta();
    const chunkKeys = meta.chunkKeys || [];

    for (let i = 0; i < chunkKeys.length; i++) {
      const key = chunkKeys[i];
      const chunk = this.loadChunk(key);

      if (chunk.records && chunk.records[id]) {
        delete chunk.records[id];
        chunk.count = Math.max(0, Number(chunk.count || 0) - 1);
        chunk.updatedAt = new Date();
        this.saveChunk(key, chunk);

        meta.count = Math.max(0, Number(meta.count || 0) - 1);
        meta.updatedAt = new Date();
        this.saveMeta(meta);

        this.rebuildIndex();
        return true;
      }
    }

    return false;
  }

  /**
   * Public: 全件取得（ページング推奨）
   */
  all() {
    return this.find({});
  }

  /**
   * Public: ページング取得
   */
  page(offset, limit) {
    offset = Number(offset || 0);
    limit = Number(limit || 100);

    const all = this.all();

    return {
      offset: offset,
      limit: limit,
      total: all.length,
      records: all.slice(offset, offset + limit),
      hasNext: offset + limit < all.length
    };
  }

  /**
   * Public: 条件検索
   * filter例:
   * { raceId:"...", horseId:"...", dateFrom:"2020-01-01", dateTo:"2020-12-31" }
   */
  find(filter) {
    filter = filter || {};

    let candidates = null;
    const index = this.getIndex();

    candidates = this.resolveCandidateIds(filter, index);

    let records = candidates
      ? candidates.map(function(id) { return this.get(id); }, this).filter(Boolean)
      : this.scanAllRecords();

    records = records.filter(function(record) {
      return this.matchFilter(record, filter);
    }, this);

    if (filter.sortBy) {
      records = this.sortRecords(records, filter.sortBy, filter.sortDirection || "asc");
    }

    if (filter.limit) {
      records = records.slice(0, Number(filter.limit));
    }

    return records;
  }

  /**
   * Public: 任意条件検索
   */
  where(callback) {
    if (typeof callback !== "function") {
      return [];
    }

    return this.scanAllRecords().filter(callback);
  }

  /**
   * Public: Race単位取得
   */
  findByRace(raceId) {
    return this.find({ raceId: raceId, sortBy: "finish" });
  }

  /**
   * Public: Horse単位取得
   */
  findByHorse(horseId) {
    return this.find({ horseId: horseId, sortBy: "date" });
  }

  /**
   * Public: Profile対象取得
   */
  findByProfile(profileType, profileId) {
    const filter = {};

    if (profileType === "HORSE") filter.horseId = profileId;
    if (profileType === "JOCKEY") filter.jockeyId = profileId;
    if (profileType === "TRAINER") filter.trainerId = profileId;
    if (profileType === "BLOODLINE") filter.fatherId = profileId;
    if (profileType === "CROSS") filter.crossKey = profileId;

    return this.find(filter);
  }

  /**
   * Public: 日付範囲取得
   */
  findByDateRange(dateFrom, dateTo) {
    return this.find({ dateFrom: dateFrom, dateTo: dateTo, sortBy: "date" });
  }

  /**
   * Public: summary
   */
  getSummary() {
    const meta = this.getMeta();
    const index = this.getIndex();

    return {
      version: this.version,
      namespace: this.namespace,
      count: meta.count || 0,
      chunkCount: (meta.chunkKeys || []).length,
      lastObservationId: meta.lastObservationId || "",
      index: {
        raceCount: Object.keys(index.raceId || {}).length,
        horseCount: Object.keys(index.horseId || {}).length,
        jockeyCount: Object.keys(index.jockeyId || {}).length,
        trainerCount: Object.keys(index.trainerId || {}).length,
        dateCount: Object.keys(index.date || {}).length
      },
      updatedAt: meta.updatedAt || null
    };
  }

  /**
   * Public: index再構築
   */
  rebuildIndex() {
    const index = this.createEmptyIndex();
    const records = this.scanAllRecords();

    records.forEach(function(record) {
      this.indexObservation(index, record);
    }, this);

    this.saveIndex(index);
    return index;
  }

  /**
   * Public: 全削除
   */
  clear() {
    if (this.memoryMode) {
      this.memory = {
        records: {},
        index: this.createEmptyIndex(),
        meta: this.createDefaultMeta()
      };
      return this;
    }

    const props = this.getProperties();
    const meta = this.getMeta();
    const chunkKeys = meta.chunkKeys || [];

    chunkKeys.forEach(function(key) {
      props.deleteProperty(this.key("CHUNK_" + key));
    }, this);

    props.deleteProperty(this.key("META"));
    props.deleteProperty(this.key("INDEX"));

    this.touch();
    return this;
  }

  /**
   * Observation正規化
   */
  normalizeObservation(observation) {
    observation = observation || {};

    const normalized = Object.assign({}, observation);

    normalized.id = normalized.id || "";
    normalized.raceId = normalized.raceId || "";
    normalized.horseId = normalized.horseId || "";
    normalized.jockeyId = normalized.jockeyId || "";
    normalized.trainerId = normalized.trainerId || "";
    normalized.fatherId = normalized.fatherId || "";
    normalized.crossKey = normalized.crossKey || "";

    normalized.date = normalized.date || null;
    normalized.course = normalized.course || "";
    normalized.distance = Number(normalized.distance || 0);
    normalized.surface = normalized.surface || "";
    normalized.going = normalized.going || "";
    normalized.raceClass = normalized.raceClass || "";

    normalized.finish = Number(normalized.finish || 0);
    normalized.popularity = Number(normalized.popularity || 0);
    normalized.odds = Number(normalized.odds || 0);
    normalized.roi = Number(normalized.roi || 0);

    normalized.abilityIndex = Number(normalized.abilityIndex || 0);
    normalized.aceScore = Number(normalized.aceScore || 0);

    normalized.createdAt = normalized.createdAt || new Date();
    normalized.updatedAt = normalized.updatedAt || new Date();

    return normalized;
  }

  /**
   * ID作成
   */
  createId(observation) {
    const parts = [
      observation.raceId || "RACE",
      observation.horseId || "HORSE",
      observation.date || "DATE"
    ];

    return parts.join("_") + "_" + Utilities.getUuid();
  }

  /**
   * Chunk保存先決定
   */
  resolveAppendChunkKey(meta) {
    meta = meta || this.createDefaultMeta();

    let chunkKeys = meta.chunkKeys || [];

    if (!chunkKeys.length) {
      const firstKey = "000001";
      meta.chunkKeys = [firstKey];
      return firstKey;
    }

    const lastKey = chunkKeys[chunkKeys.length - 1];
    const lastChunk = this.loadChunk(lastKey);

    if (Number(lastChunk.count || 0) < this.chunkSize) {
      return lastKey;
    }

    const nextNumber = Number(lastKey) + 1;
    const nextKey = this.padNumber(nextNumber, 6);
    meta.chunkKeys.push(nextKey);
    return nextKey;
  }

  /**
   * 全Record走査
   */
  scanAllRecords() {
    if (this.memoryMode) {
      return Object.values(this.memory.records || {});
    }

    const meta = this.getMeta();
    const chunkKeys = meta.chunkKeys || [];
    let out = [];

    chunkKeys.forEach(function(key) {
      const chunk = this.loadChunk(key);
      out = out.concat(Object.values(chunk.records || {}));
    }, this);

    return out;
  }

  /**
   * index候補ID抽出
   */
  resolveCandidateIds(filter, index) {
    const sets = [];

    ["raceId", "horseId", "jockeyId", "trainerId", "fatherId", "crossKey"].forEach(function(key) {
      if (filter[key] && index[key] && index[key][filter[key]]) {
        sets.push(index[key][filter[key]]);
      }
    });

    if (filter.date && index.date && index.date[filter.date]) {
      sets.push(index.date[filter.date]);
    }

    if (!sets.length) {
      return null;
    }

    return this.intersectArrays(sets);
  }

  /**
   * filter判定
   */
  matchFilter(record, filter) {
    const exactKeys = [
      "id", "raceId", "horseId", "jockeyId", "trainerId",
      "fatherId", "crossKey", "course", "surface", "going", "raceClass"
    ];

    for (let i = 0; i < exactKeys.length; i++) {
      const key = exactKeys[i];
      if (filter[key] !== undefined && filter[key] !== null && filter[key] !== "") {
        if (record[key] !== filter[key]) return false;
      }
    }

    if (filter.dateFrom) {
      if (new Date(record.date || 0) < new Date(filter.dateFrom)) return false;
    }

    if (filter.dateTo) {
      if (new Date(record.date || 0) > new Date(filter.dateTo)) return false;
    }

    if (filter.minOdds !== undefined && Number(record.odds || 0) < Number(filter.minOdds)) return false;
    if (filter.maxOdds !== undefined && Number(record.odds || 0) > Number(filter.maxOdds)) return false;
    if (filter.minFinish !== undefined && Number(record.finish || 0) < Number(filter.minFinish)) return false;
    if (filter.maxFinish !== undefined && Number(record.finish || 0) > Number(filter.maxFinish)) return false;

    return true;
  }

  /**
   * sort
   */
  sortRecords(records, sortBy, direction) {
    direction = direction || "asc";

    return records.slice().sort(function(a, b) {
      let av = a[sortBy];
      let bv = b[sortBy];

      if (sortBy === "date" || sortBy === "createdAt" || sortBy === "updatedAt") {
        av = new Date(av || 0).getTime();
        bv = new Date(bv || 0).getTime();
      }

      if (av < bv) return direction === "desc" ? 1 : -1;
      if (av > bv) return direction === "desc" ? -1 : 1;
      return 0;
    });
  }

  /**
   * index登録
   */
  indexObservation(index, observation) {
    this.indexValue(index.raceId, observation.raceId, observation.id);
    this.indexValue(index.horseId, observation.horseId, observation.id);
    this.indexValue(index.jockeyId, observation.jockeyId, observation.id);
    this.indexValue(index.trainerId, observation.trainerId, observation.id);
    this.indexValue(index.fatherId, observation.fatherId, observation.id);
    this.indexValue(index.crossKey, observation.crossKey, observation.id);

    if (observation.date) {
      const dateKey = this.formatDateKey(observation.date);
      this.indexValue(index.date, dateKey, observation.id);
    }
  }

  indexValue(indexMap, value, id) {
    if (!value || !id) return;

    const key = String(value);

    if (!indexMap[key]) {
      indexMap[key] = [];
    }

    if (indexMap[key].indexOf(id) < 0) {
      indexMap[key].push(id);
    }

    if (indexMap[key].length > this.maxIndexIds) {
      indexMap[key] = indexMap[key].slice(indexMap[key].length - this.maxIndexIds);
    }
  }

  createEmptyIndex() {
    return {
      raceId: {},
      horseId: {},
      jockeyId: {},
      trainerId: {},
      fatherId: {},
      crossKey: {},
      date: {}
    };
  }

  createDefaultMeta() {
    return {
      version: this.version,
      count: 0,
      chunkKeys: [],
      lastObservationId: "",
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * storage helpers
   */
  getMeta() {
    if (this.memoryMode) return this.memory.meta;

    const raw = this.getProperties().getProperty(this.key("META"));
    return raw ? JSON.parse(raw) : this.createDefaultMeta();
  }

  saveMeta(meta) {
    if (this.memoryMode) {
      this.memory.meta = meta;
      return true;
    }

    this.getProperties().setProperty(this.key("META"), JSON.stringify(meta));
    return true;
  }

  getIndex() {
    if (this.memoryMode) return this.memory.index;

    const raw = this.getProperties().getProperty(this.key("INDEX"));
    return raw ? JSON.parse(raw) : this.createEmptyIndex();
  }

  saveIndex(index) {
    if (this.memoryMode) {
      this.memory.index = index;
      return true;
    }

    this.getProperties().setProperty(this.key("INDEX"), JSON.stringify(index));
    return true;
  }

  loadChunk(chunkKey) {
    if (this.memoryMode) {
      return {
        key: "MEMORY",
        count: Object.keys(this.memory.records || {}).length,
        records: this.memory.records,
        updatedAt: new Date()
      };
    }

    const raw = this.getProperties().getProperty(this.key("CHUNK_" + chunkKey));

    if (!raw) {
      return {
        key: chunkKey,
        count: 0,
        records: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    return JSON.parse(raw);
  }

  saveChunk(chunkKey, chunk) {
    if (this.memoryMode) {
      this.memory.records = chunk.records || {};
      return true;
    }

    this.getProperties().setProperty(this.key("CHUNK_" + chunkKey), JSON.stringify(chunk));
    return true;
  }

  getProperties() {
    return PropertiesService.getScriptProperties();
  }

  key(name) {
    return this.namespace + "_" + name;
  }

  /**
   * utilities
   */
  addUnique(list, value) {
    list = list || [];
    if (list.indexOf(value) < 0) list.push(value);
    return list;
  }

  intersectArrays(arrays) {
    if (!arrays || !arrays.length) return [];

    return arrays.reduce(function(prev, curr) {
      return prev.filter(function(x) {
        return curr.indexOf(x) >= 0;
      });
    });
  }

  padNumber(value, length) {
    let s = String(value);
    while (s.length < length) s = "0" + s;
    return s;
  }

  formatDateKey(dateValue) {
    const d = new Date(dateValue);
    const y = d.getFullYear();
    const m = this.padNumber(d.getMonth() + 1, 2);
    const day = this.padNumber(d.getDate(), 2);
    return y + "-" + m + "-" + day;
  }

  touch() {
    this.updatedAt = new Date();
    return this;
  }

  toJSON() {
    return {
      version: this.version,
      namespace: this.namespace,
      chunkSize: this.chunkSize,
      maxIndexIds: this.maxIndexIds,
      memoryMode: this.memoryMode,
      memory: this.memoryMode ? this.memory : null,
      summary: this.getSummary(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  load(json) {
    if (!json) return this;

    this.version = json.version || this.version;
    this.namespace = json.namespace || this.namespace;
    this.chunkSize = json.chunkSize || this.chunkSize;
    this.maxIndexIds = json.maxIndexIds || this.maxIndexIds;
    this.memoryMode = !!json.memoryMode;
    this.memory = json.memory || this.memory;
    this.createdAt = json.createdAt || new Date();
    this.updatedAt = json.updatedAt || new Date();

    return this;
  }

  static fromJSON(json) {
    return new ObservationStore().load(json || {});
  }
}
