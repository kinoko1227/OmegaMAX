/**
 * ==========================================================
 * ΩMAX AIOS
 * KnowledgeHistory.js
 * ----------------------------------------------------------
 * Production Knowledge History v1.0.0
 *
 * 学習による知識・重み・ルール変更の履歴を監査可能な形で保存。
 * GAS V8 compatible.
 * ==========================================================
 */

class KnowledgeHistory {

  constructor(params) {
    params = params || {};
    this.version = "1.0.0";
    this.keyPrefix = params.keyPrefix || "OMEGAMAX_KNOWLEDGE_HISTORY";
    this.lockWaitMs = Number(params.lockWaitMs || 30000);

    this.records = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();

    if (params.autoLoad !== false) this.loadFromStorage();
  }

  add(record) {
    record = record || {};
    return this.withLock(function () {
      const item = {
        id: this.createId("KH"),
        targetType: record.targetType || "",
        targetId: record.targetId || "",
        fieldKey: record.fieldKey || "",
        action: record.action || "",
        beforeValue: this.clone(record.beforeValue),
        afterValue: this.clone(record.afterValue),
        delta: this.calcDelta(record.beforeValue, record.afterValue),
        reason: record.reason || "",
        confidence: Number(record.confidence || 0),
        sample: Number(record.sample || 0),
        evidence: this.clone(record.evidence || {}),
        createdAt: new Date()
      };

      this.records.push(item);

      try {
        if (typeof AIJournal !== "undefined") {
          const j = new AIJournal();
          if (j.loadFromStorage) j.loadFromStorage();
          if (j.add) {
            j.add({
              type: AIJournal.TYPE.LEARNING,
              category: "KNOWLEDGE_HISTORY",
              title: "Knowledge updated",
              message: item.action,
              targetType: item.targetType,
              targetId: item.targetId,
              result: AIJournal.RESULT.RECORDED,
              evidence: item
            });
          }
          if (j.saveToStorage) j.saveToStorage();
        }
      } catch (e) {}

      this.touch();
      this.saveToStorage();
      return this.clone(item);
    });
  }

  latest(limit){
    limit = Number(limit || 50);
    return this.records.slice().sort(function(a,b){
      return new Date(b.createdAt)-new Date(a.createdAt);
    }).slice(0,limit);
  }

  find(targetType,targetId){
    return this.records.filter(function(r){
      return r.targetType===targetType && r.targetId===targetId;
    });
  }

  summary(){
    const s={total:this.records.length,actions:{},targets:{}};
    this.records.forEach(function(r){
      s.actions[r.action]=(s.actions[r.action]||0)+1;
      s.targets[r.targetType]=(s.targets[r.targetType]||0)+1;
    });
    return s;
  }

  storageKey(){return this.keyPrefix+"_STATE";}

  saveToStorage(){
    const props=PropertiesService.getScriptProperties();
    const key=this.storageKey();
    const json=JSON.stringify(this.toJSON());
    const size=8000;
    const chunks=[];
    for(let i=0;i<json.length;i+=size) chunks.push(json.substring(i,i+size));
    const old=Number(props.getProperty(key+"_COUNT")||0);
    for(let i=0;i<old;i++) props.deleteProperty(key+"_"+i);
    chunks.forEach(function(c,i){props.setProperty(key+"_"+i,c);});
    props.setProperty(key+"_COUNT",String(chunks.length));
    return true;
  }

  loadFromStorage(){
    try{
      const props=PropertiesService.getScriptProperties();
      const key=this.storageKey();
      const count=Number(props.getProperty(key+"_COUNT")||0);
      if(!count) return false;
      let json="";
      for(let i=0;i<count;i++) json+=props.getProperty(key+"_"+i)||"";
      this.load(JSON.parse(json));
      return true;
    }catch(e){return false;}
  }

  toJSON(){
    return {
      version:this.version,
      records:this.records,
      createdAt:this.createdAt,
      updatedAt:this.updatedAt
    };
  }

  load(json){
    if(!json) return this;
    this.version=json.version||this.version;
    this.records=json.records||[];
    this.createdAt=json.createdAt||new Date();
    this.updatedAt=json.updatedAt||new Date();
    return this;
  }

  withLock(cb){
    const lock=LockService.getScriptLock();
    lock.waitLock(this.lockWaitMs);
    try{return cb.call(this);}
    finally{lock.releaseLock();}
  }

  calcDelta(a,b){
    if(typeof a==="number"&&typeof b==="number") return b-a;
    return null;
  }

  createId(prefix){
    try{return prefix+"_"+Utilities.getUuid();}
    catch(e){return prefix+"_"+Date.now();}
  }

  clone(v){
    if(v===undefined||v===null) return v;
    return JSON.parse(JSON.stringify(v));
  }

  touch(){this.updatedAt=new Date();}
}

function testKnowledgeHistoryProduction(){
  const kh=new KnowledgeHistory({autoLoad:false});
  kh.add({
    targetType:"HORSE",
    targetId:"H001",
    fieldKey:"speedWeight",
    action:"UPDATE_WEIGHT",
    beforeValue:1.00,
    afterValue:1.03,
    reason:"Validation approved",
    confidence:82,
    sample:240
  });
  Logger.log(JSON.stringify(kh.summary(),null,2));
  return kh.toJSON();
}
