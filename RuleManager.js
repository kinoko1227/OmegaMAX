/**
 * ==========================================================
 * ΩMAX AIOS
 * RuleManager.js
 * ----------------------------------------------------------
 * 推論ルール管理 v2
 * ==========================================================
 */

class RuleManager {

  static get KEY() {
    return "OMEGA_RULES";
  }

  static get VERSION_KEY() {
    return "OMEGA_RULE_VERSION";
  }

  static get CURRENT_VERSION() {
    return 3;
  }

  static all() {
    const raw = OmegaState.get(this.KEY, []);
    return (raw || []).map(function(r) {
      return RuleModel.fromJSON(r);
    });
  }

  static active(domain) {
    return this.all().filter(function(rule) {
      if (!rule.isActive()) return false;
      if (domain && rule.domain !== domain) return false;
      return true;
    });
  }

  static find(id) {
    return this.all().find(function(rule) {
      return rule.id === id;
    }) || null;
  }

  static save(rule) {
    const rules = this.all();

    const model =
      rule instanceof RuleModel
        ? rule
        : RuleModel.fromJSON(rule);

    const index = rules.findIndex(function(r) {
      return r.id === model.id;
    });

    if (index >= 0) {
      rules[index] = model;
    } else {
      rules.push(model);
    }

    return this.saveAll(rules);
  }

  static saveAll(rules) {
    const json = (rules || []).map(function(rule) {
      return rule instanceof RuleModel
        ? rule.toJSON()
        : rule;
    });

    OmegaState.set(this.KEY, json);
    OmegaState.set(this.VERSION_KEY, this.CURRENT_VERSION);

    return true;
  }

  static resetRules() {
    OmegaState.set(this.KEY, []);
    OmegaState.set(this.VERSION_KEY, this.CURRENT_VERSION);
    return this.seedDefaultRules(true);
  }

  static migrateIfNeeded() {
    const version = Number(
      OmegaState.get(this.VERSION_KEY, 0)
    );

    if (version >= this.CURRENT_VERSION) {
      return false;
    }

    this.resetRules();

    return true;
  }

  static seedDefaultRules(forceUpdate) {
    const defaults = this.defaultRules();
    const rules = this.all();

    defaults.forEach(function(defaultRule) {
      const index = rules.findIndex(function(r) {
        return r.id === defaultRule.id;
      });

      if (index < 0) {
        rules.push(defaultRule);
        return;
      }

      if (forceUpdate) {
        const existing = rules[index];

        defaultRule.confidence =
          existing.confidence || defaultRule.confidence;

        defaultRule.sample =
          existing.sample || defaultRule.sample;

        rules[index] = defaultRule;
      }
    });

    this.saveAll(rules);

    Logger.info("RuleManager seeded", {
      count: defaults.length,
      forceUpdate: !!forceUpdate
    });

    return defaults.length;
  }

  static updateStatistics(id, params) {
    const rule = this.find(id);

    if (!rule) return false;

    if (params.confidence != null) {
      rule.setConfidence(params.confidence);
    }

    if (params.sample != null) {
      rule.setSample(params.sample);
    }

    if (params.effects) {
      rule.updateEffects(params.effects);
    }

    return this.save(rule);
  }

  static sleep(id) {
    const rule = this.find(id);
    if (!rule) return false;
    rule.sleep();
    return this.save(rule);
  }

  static activate(id) {
    const rule = this.find(id);
    if (!rule) return false;
    rule.activate();
    return this.save(rule);
  }

  static archive(id) {
    const rule = this.find(id);
    if (!rule) return false;
    rule.archive();
    return this.save(rule);
  }

  static defaultRules() {
    return [

      new RuleModel({
        id: "HORSE_TRAINING_BODYWEIGHT_GOOD",
        name: "調教良好 × 馬体重良好",
        category: "CONDITION",
        domain: "HORSE",
        status: "ACTIVE",
        conditions: [
          {
            key: "training.score",
            operator: ">=",
            value: 85
          },
          {
            key: "bodyWeight.score",
            operator: ">=",
            value: 85
          }
        ],
        effects: {
          performanceRate: 0.03
        },
        confidence: 50,
        sample: 0,
        description:
          "調教状態と馬体重状態がともに良好な場合、能力発揮率を上げる。"
      }),

      new RuleModel({
        id: "HORSE_GROWTH_HIGH_MATURITY_LOW",
        name: "成長上昇 × 成熟不足",
        category: "GROWTH",
        domain: "HORSE",
        status: "ACTIVE",
        conditions: [
          {
            key: "growth.score",
            operator: ">=",
            value: 85
          },
          {
            key: "maturity.score",
            operator: "<",
            value: 70
          }
        ],
        effects: {
          performanceRate: -0.04,
          volatility: 0.08
        },
        confidence: 50,
        sample: 0,
        description:
          "成長力は高いが成熟度が低い馬は、能力を安定して発揮できない可能性がある。"
      })

    ];
  }

}
