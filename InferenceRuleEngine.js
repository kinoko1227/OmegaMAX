x/**
 * ==========================================================
 * ΩMAX AIOS
 * InferenceRuleEngine.js
 * ----------------------------------------------------------
 * 推論ルール実行エンジン
 *
 * Analyzer結果にRuleを適用し、
 * performanceRate / risk / volatility などを補正する。
 * ==========================================================
 */

class InferenceRuleEngine {

  /**
   * ルール適用
   *
   * @param {Object} analyzerResults
   * @param {string} domain
   * @returns {Object}
   */
  static run(analyzerResults = {}, domain = "HORSE") {

    const rules = RuleManager.active(domain);

    const result = {
      performanceRate: 1.0,
      risk: 0,
      volatility: 0,
      appliedRules: [],
      reasons: []
    };

    rules.forEach(rule => {

      if (this.match(rule, analyzerResults)) {

        this.apply(rule, result);

        result.appliedRules.push(rule.id);

        if (rule.description) {
          result.reasons.push(rule.description);
        }

      }

    });

    return result;
  }

  /**
   * 条件一致判定
   */
  static match(rule, data) {

    const conditions = rule.conditions || [];

    return conditions.every(condition => {

      const actual = this.getValue(
        data,
        condition.key
      );

      return this.compare(
        actual,
        condition.operator,
        condition.value
      );

    });

  }

  /**
   * 効果適用
   */
  static apply(rule, result) {

    const effects = rule.effects || {};

    Object.keys(effects).forEach(key => {

      const value = Number(effects[key]) || 0;

      if (key === "performanceRate") {
        result.performanceRate += value;
        return;
      }

      if (key === "risk") {
        result.risk += value;
        return;
      }

      if (key === "volatility") {
        result.volatility += value;
        return;
      }

      result[key] =
        (Number(result[key]) || 0) + value;

    });

    result.performanceRate =
      Utils.clamp(
        result.performanceRate,
        0,
        2
      );

    result.risk =
      Utils.clamp(
        result.risk,
        0,
        1
      );

    result.volatility =
      Utils.clamp(
        result.volatility,
        0,
        1
      );

  }

  /**
   * ネスト値取得
   *
   * key = "training.score"
   */
  static getValue(data, path) {

    if (!path) return null;

    return String(path)
      .split(".")
      .reduce((obj, key) => {

        if (
          obj === null ||
          obj === undefined
        ) {
          return null;
        }

        return obj[key];

      }, data);

  }

  /**
   * 比較
   */
  static compare(actual, operator, expected) {

    switch (operator) {

      case ">":
        return actual > expected;

      case ">=":
        return actual >= expected;

      case "<":
        return actual < expected;

      case "<=":
        return actual <= expected;

      case "==":
        return actual == expected;

      case "===":
        return actual === expected;

      case "!=":
        return actual != expected;

      case "!==":
        return actual !== expected;

      default:
        return false;

    }

  }

}
