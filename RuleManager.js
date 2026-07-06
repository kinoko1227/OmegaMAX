/**
 * ==========================================================
 * ΩMAX AIOS
 * RuleManager.js
 * ----------------------------------------------------------
 * 推論ルール管理
 *
 * RuleModelを保存・取得・更新する。
 * ==========================================================
 */

class RuleManager {

  static get KEY() {
    return "OMEGA_RULES";
  }

  /**
   * 全ルール取得
   */
  static all() {

    const raw = OmegaState.get(
      this.KEY,
      []
    );

    return (raw || []).map(r =>
      RuleModel.fromJSON(r)
    );

  }

  /**
   * ACTIVEルール取得
   */
  static active(domain = null) {

    return this.all().filter(rule => {

      if (!rule.isActive()) return false;

      if (
        domain &&
        rule.domain !== domain
      ) {
        return false;
      }

      return true;

    });

  }

  /**
   * ルール保存
   */
  static save(rule) {

    const rules = this.all();

    const model =
      rule instanceof RuleModel
        ? rule
        : RuleModel.fromJSON(rule);

    const index = rules.findIndex(
      r => r.id === model.id
    );

    if (index >= 0) {
      rules[index] = model;
    } else {
      rules.push(model);
    }

    return this.saveAll(rules);

  }

  /**
   * 全保存
   */
  static saveAll(rules) {

    const json = (rules || []).map(rule =>
      rule instanceof RuleModel
        ? rule.toJSON()
        : rule
    );

    return OmegaState.set(
      this.KEY,
      json
    );

  }

  /**
   * ID検索
   */
  static find(id) {

    return this.all().find(
      rule => rule.id === id
    ) || null;

  }

  /**
   * 無効化
   */
  static sleep(id) {

    const rule = this.find(id);

    if (!rule) return false;

    rule.sleep();

    return this.save(rule);

  }

  /**
   * 有効化
   */
  static activate(id) {

    const rule = this.find(id);

    if (!rule) return false;

    rule.activate();

    return this.save(rule);

  }

  /**
   * アーカイブ
   */
  static archive(id) {

    const rule = this.find(id);

    if (!rule) return false;

    rule.archive();

    return this.save(rule);

  }

  /**
   * 初期ルール投入
   */
  static seedDefaultRules() {

    const defaults = this.defaultRules();

    defaults.forEach(rule => {
      if (!this.find(rule.id)) {
        this.save(rule);
      }
    });

    Logger.info(
      "RuleManager seeded",
      { count: defaults.length }
    );

    return defaults.length;

  }

  /**
   * 初期ルール定義
   */
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
      }),

      new RuleModel({
        id: "HORSE_FATIGUE_TRANSPORT_RISK",
        name: "疲労 × 輸送負荷",
        category: "RISK",
        domain: "HORSE",
        status: "ACTIVE",
        conditions: [
          {
            key: "fatigue.score",
            operator: ">=",
            value: 75
          },
          {
            key: "transportation.score",
            operator: "<=",
            value: 60
          }
        ],
        effects: {
          performanceRate: -0.05,
          risk: 0.10
        },
        confidence: 50,
        sample: 0,
        description:
          "疲労が高く、輸送負荷も重い場合はパフォーマンス低下リスクを上げる。"
      })

    ];

  }

}
