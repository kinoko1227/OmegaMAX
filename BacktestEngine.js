/**
 * ==========================================================
 * ΩMAX Ver.1.0 RC1
 * BacktestEngine.js
 * ----------------------------------------------------------
 * AIBrain統合バックテスト版
 *
 * 役割:
 * - TicketEngine.buildFromAIBrain() の結果をそのまま検証
 * - 既存 TicketEngine.build() ルートも後方互換で維持
 * - AIBrain / Ticket / 的中判定 / 資金推移 / 回収率を一体で記録
 * - LearningEngine に渡せる history を生成
 *
 * GAS V8 compatible.
 * ==========================================================
 */

class BacktestEngine {

  /**
   * ----------------------------------------------------------
   * 通常バックテスト
   * ----------------------------------------------------------
   * OmegaPipeline.run() から呼ばれる想定。
   * races は当日または検証対象レース配列。
   */
  static run(races, bankroll) {

    const safeRaces =
      Array.isArray(races) ? races : [];

    const initialBankroll =
      this._safeBankroll(bankroll);

    const results =
      this._loadResults();

    let currentBankroll =
      initialBankroll;

    let maxBankroll =
      currentBankroll;

    let maxDrawdown =
      0;

    const history = [];

    safeRaces.forEach(race => {

      const raceId =
        race && race.id ? String(race.id) : "";

      const officialResult =
        results[raceId];

      if (!officialResult) {
        history.push({
          raceId,
          skipped: true,
          reason: "NO_RESULT",
          bankroll: currentBankroll,
          race
        });
        return;
      }

      const evaluated =
        this.evaluateRace(
          race,
          officialResult,
          currentBankroll
        );

      currentBankroll +=
        evaluated.settled.profit;

      maxBankroll =
        Math.max(maxBankroll, currentBankroll);

      const drawdown =
        maxBankroll > 0
          ? (maxBankroll - currentBankroll) / maxBankroll
          : 0;

      maxDrawdown =
        Math.max(maxDrawdown, drawdown);

      history.push(
        Object.assign({}, evaluated, {
          bankroll: currentBankroll,
          drawdown: Utils.round(drawdown, 4)
        })
      );

    });

    return this._summary(
      initialBankroll,
      currentBankroll,
      maxDrawdown,
      safeRaces,
      history
    );

  }


  /**
   * ----------------------------------------------------------
   * 1レース検証
   * ----------------------------------------------------------
   * AIBrainが使える場合は正式ルート。
   * 使えない場合はCore→TicketEngine.build()へフォールバック。
   */
  static evaluateRace(race, officialResult, bankroll) {

    const normalizedRace =
      this._buildRace(race);

    const featureSets =
      FeatureEngine.buildRace(normalizedRace);

    const coreResults =
      featureSets.map(feature =>
        CoreEngine.evaluate(
          normalizedRace,
          feature
        )
      );

    const aiBrainResult =
      this._runAIBrainForBacktest(
        normalizedRace,
        coreResults
      );

    const ticketResult =
      this._buildTicketForBacktest(
        normalizedRace,
        coreResults,
        aiBrainResult,
        bankroll
      );

    const settled =
      this.settleTickets(
        ticketResult && ticketResult.tickets
          ? ticketResult.tickets
          : [],
        officialResult
      );

    return {
      raceId:
        normalizedRace && normalizedRace.id
          ? normalizedRace.id
          : "",
      race: normalizedRace,
      result: officialResult,
      featureSets,
      coreResults,
      aiBrainResult,
      ticketResult,
      tickets:
        ticketResult && ticketResult.tickets
          ? ticketResult.tickets
          : [],
      settled,
      mode:
        ticketResult && ticketResult.mode
          ? ticketResult.mode
          : aiBrainResult
            ? "AIBRAIN"
            : "CORE"
    };

  }


  /**
   * ----------------------------------------------------------
   * AIBrain実行
   * ----------------------------------------------------------
   * OmegaPipeline.runAIBrain() がある場合はそれを利用し、
   * ない場合はBacktestEngine内で最小実行する。
   */
  static _runAIBrainForBacktest(race, coreResults) {

    if (typeof AIBrain === "undefined") {
      Logger.warn("BacktestEngine: AIBrain is not defined. Use CORE mode.");
      return null;
    }

    if (
      typeof OmegaPipeline !== "undefined" &&
      typeof OmegaPipeline.runAIBrain === "function"
    ) {
      return OmegaPipeline.runAIBrain(
        race,
        coreResults
      );
    }

    const runners =
      this._buildAIBrainRunners(
        race,
        coreResults
      );

    const iterations =
      CONFIG.AIBRAIN && CONFIG.AIBRAIN.ITERATIONS
        ? CONFIG.AIBRAIN.ITERATIONS
        : 3000;

    const brain =
      new AIBrain({ iterations });

    if (typeof brain.analyzeRace !== "function") {
      Logger.warn("BacktestEngine: AIBrain.analyzeRace is not available. Use CORE mode.");
      return null;
    }

    return brain.analyzeRace({
      race: {
        id: race.id,
        date: race.date,
        course: race.course,
        surface: race.surface,
        distance: race.distance,
        going: race.going,
        raceClass: race.raceClass || race.className || race.grade || "",
        fieldSize: runners.length,
        weather: race.weather || "",
        cushionValue: race.cushionValue || 0,
        moisture: race.moisture || 0,
        trackBias: race.trackBias || "",
        pace: race.pace || ""
      },
      runners,
      iterations
    });

  }


  /**
   * ----------------------------------------------------------
   * TicketEngine呼び出し
   * ----------------------------------------------------------
   */
  static _buildTicketForBacktest(race, coreResults, aiBrainResult, bankroll) {

    if (
      aiBrainResult &&
      typeof TicketEngine !== "undefined" &&
      typeof TicketEngine.buildFromAIBrain === "function"
    ) {
      return TicketEngine.buildFromAIBrain(
        race,
        aiBrainResult,
        bankroll
      );
    }

    return TicketEngine.build(
      race,
      coreResults,
      bankroll
    );

  }


  /**
   * ----------------------------------------------------------
   * 的中判定
   * ----------------------------------------------------------
   */
  static settleTickets(tickets, result) {

    const safeTickets =
      Array.isArray(tickets) ? tickets : [];

    let totalBet = 0;
    let totalReturn = 0;

    const details = [];

    safeTickets.forEach(ticket => {

      const amount =
        Utils.toNumber(ticket.amount, 0);

      totalBet += amount;

      const hit =
        this.isHit(ticket, result);

      const payoutRate =
        hit
          ? this.estimatePayoutRate(ticket, result)
          : 0;

      const returnAmount =
        hit ? amount * payoutRate : 0;

      totalReturn += returnAmount;

      details.push({
        ticket,
        hit,
        amount,
        payoutRate,
        returnAmount,
        profit: returnAmount - amount
      });

    });

    return {
      totalBet,
      totalReturn,
      profit: totalReturn - totalBet,
      hitCount:
        details.filter(d => d.hit).length,
      ticketCount:
        safeTickets.length,
      details
    };

  }


  /**
   * ----------------------------------------------------------
   * 券種別的中判定
   * ----------------------------------------------------------
   */
  static isHit(ticket, result) {

    if (!ticket || !result) return false;

    const places =
      this._normalizePlaces(result);

    if (places.length === 0) return false;

    const winner =
      places[0];

    const horses =
      this._ticketHorses(ticket);

    if (ticket.type === TICKET_TYPE.WIN) {
      const horseId =
        ticket.horseId || horses[0];
      return String(horseId) === winner;
    }

    if (ticket.type === TICKET_TYPE.WIDE) {
      return horses.length >= 2 &&
        horses.every(h => places.slice(0, 3).indexOf(String(h)) >= 0);
    }

    if (ticket.type === TICKET_TYPE.QUINELLA) {
      return horses.length >= 2 &&
        horses.every(h => places.slice(0, 2).indexOf(String(h)) >= 0);
    }

    if (ticket.type === TICKET_TYPE.EXACTA) {
      return horses.length >= 2 &&
        places.length >= 2 &&
        String(horses[0]) === places[0] &&
        String(horses[1]) === places[1];
    }

    if (ticket.type === TICKET_TYPE.TRIO) {
      return horses.length >= 3 &&
        horses.every(h => places.slice(0, 3).indexOf(String(h)) >= 0);
    }

    if (ticket.type === TICKET_TYPE.TRIFECTA) {
      return horses.length >= 3 &&
        places.length >= 3 &&
        String(horses[0]) === places[0] &&
        String(horses[1]) === places[1] &&
        String(horses[2]) === places[2];
    }

    return false;

  }


  /**
   * ----------------------------------------------------------
   * 払戻倍率推定
   * ----------------------------------------------------------
   * 実払戻データがあれば優先。
   * なければticket.ev / 券種別基準倍率を使う。
   */
  static estimatePayoutRate(ticket, result) {

    const actual =
      this._actualPayoutRate(ticket, result);

    if (actual > 0) {
      return actual;
    }

    const ev =
      Utils.toNumber(ticket.ev, 0);

    if (ev > 1) {
      return ev;
    }

    if (ticket.type === TICKET_TYPE.WIN) return 2.0;
    if (ticket.type === TICKET_TYPE.WIDE) return 2.5;
    if (ticket.type === TICKET_TYPE.QUINELLA) return 6.0;
    if (ticket.type === TICKET_TYPE.EXACTA) return 12.0;
    if (ticket.type === TICKET_TYPE.TRIO) return 18.0;
    if (ticket.type === TICKET_TYPE.TRIFECTA) return 60.0;

    return 0;

  }


  /**
   * ----------------------------------------------------------
   * 結果サマリー
   * ----------------------------------------------------------
   */
  static _summary(initialBankroll, finalBankroll, maxDrawdown, races, history) {

    const totalBet =
      Utils.sum(
        history.map(h =>
          h.settled ? h.settled.totalBet : 0
        )
      );

    const totalReturn =
      Utils.sum(
        history.map(h =>
          h.settled ? h.settled.totalReturn : 0
        )
      );

    const evaluatedHistory =
      history.filter(h => h.settled);

    const hitRaces =
      evaluatedHistory.filter(h =>
        h.settled.hitCount > 0
      ).length;

    const ticketCount =
      Utils.sum(
        evaluatedHistory.map(h => h.settled.ticketCount || 0)
      );

    const hitTicketCount =
      Utils.sum(
        evaluatedHistory.map(h => h.settled.hitCount || 0)
      );

    return {
      ok: true,
      initialBankroll,
      finalBankroll,
      profit:
        finalBankroll - initialBankroll,
      returnRate:
        totalBet > 0
          ? Utils.round(totalReturn / totalBet, 4)
          : 1,
      recoveryRate:
        totalBet > 0
          ? Utils.round(totalReturn / totalBet * 100, 2)
          : 100,
      totalBet,
      totalReturn,
      maxDrawdown:
        Utils.round(maxDrawdown, 4),
      races:
        races.length,
      evaluatedRaces:
        evaluatedHistory.length,
      skippedRaces:
        history.filter(h => h.skipped).length,
      hitRaces,
      raceHitRate:
        evaluatedHistory.length > 0
          ? Utils.round(hitRaces / evaluatedHistory.length, 4)
          : 0,
      ticketCount,
      hitTicketCount,
      ticketHitRate:
        ticketCount > 0
          ? Utils.round(hitTicketCount / ticketCount, 4)
          : 0,
      history
    };

  }


  /**
   * ----------------------------------------------------------
   * AIBrain Runner生成
   * ----------------------------------------------------------
   * OmegaPipeline.buildAIBrainRunners() があればそれを利用。
   */
  static _buildAIBrainRunners(race, coreResults) {

    if (
      typeof OmegaPipeline !== "undefined" &&
      typeof OmegaPipeline.buildAIBrainRunners === "function"
    ) {
      return OmegaPipeline.buildAIBrainRunners(
        race,
        coreResults
      );
    }

    const horses =
      Array.isArray(race.horses) ? race.horses : [];

    const coreMap = {};

    (coreResults || []).forEach(result => {
      coreMap[String(result.horseId)] = result;
    });

    return horses.map((horse, index) => {

      const h =
        typeof Race !== "undefined" &&
        typeof Race.normalizeHorse === "function"
          ? Race.normalizeHorse(horse)
          : horse;

      const horseId =
        h.id || h.horseId || "RUNNER_" + (index + 1);

      const core =
        coreMap[String(horseId)] || {};

      return {
        runnerId: horseId,
        horseId,
        id: horseId,
        name: h.name || core.horseName || "",
        horseName: h.name || core.horseName || "",
        number: h.number || h.horseNumber || index + 1,
        horseNumber: h.number || h.horseNumber || index + 1,
        frameNumber: h.frameNumber || h.frame || 0,
        runningStyle: h.runningStyle || h.style || "",
        style: h.runningStyle || h.style || "",
        odds: core.odds || h.odds || 0,
        popularity: h.popularity || 0,
        predictedProbability: core.winProb || 0,
        abilityIndex: this._scoreToPercent(core.score),
        coreResult: core,
        market: {
          odds: core.odds || h.odds || 0,
          popularity: h.popularity || 0,
          predictedProbability: core.winProb || 0
        },
        profile: h.profile || h.horseProfile || {}
      };

    });

  }


  /**
   * ----------------------------------------------------------
   * 結果データ取得
   * ----------------------------------------------------------
   */
  static _loadResults() {

    if (
      typeof DataSource !== "undefined" &&
      typeof DataSource.getResults === "function"
    ) {
      return DataSource.getResults() || {};
    }

    if (
      typeof ResultLoader !== "undefined" &&
      typeof ResultLoader.getResults === "function"
    ) {
      return ResultLoader.getResults() || {};
    }

    Logger.warn("BacktestEngine: result source is not available.");
    return {};

  }


  /**
   * ----------------------------------------------------------
   * Race標準化
   * ----------------------------------------------------------
   */
  static _buildRace(race) {

    if (
      typeof Race !== "undefined" &&
      typeof Race.build === "function"
    ) {
      return Race.build(race);
    }

    return race;

  }


  /**
   * ----------------------------------------------------------
   * 着順配列正規化
   * ----------------------------------------------------------
   */
  static _normalizePlaces(result) {

    if (!result) return [];

    if (Array.isArray(result.places)) {
      return result.places.map(x => String(x));
    }

    if (Array.isArray(result.place)) {
      return result.place.map(x => String(x));
    }

    if (Array.isArray(result.order)) {
      return result.order.map(x => String(x));
    }

    if (Array.isArray(result.finishOrder)) {
      return result.finishOrder.map(x => String(x));
    }

    const winner =
      result.winner || result.first || result.win || "";

    const second =
      result.second || "";

    const third =
      result.third || "";

    return [winner, second, third]
      .filter(x => x !== "")
      .map(x => String(x));

  }


  /**
   * ----------------------------------------------------------
   * Ticket馬ID配列
   * ----------------------------------------------------------
   */
  static _ticketHorses(ticket) {

    if (Array.isArray(ticket.horses)) {
      return ticket.horses.map(x => String(x));
    }

    if (ticket.horseId) {
      return [String(ticket.horseId)];
    }

    return [];

  }


  /**
   * ----------------------------------------------------------
   * 実払戻倍率取得
   * ----------------------------------------------------------
   */
  static _actualPayoutRate(ticket, result) {

    if (!ticket || !result) return 0;

    const payouts =
      result.payouts || result.payoffs || result.dividends || null;

    if (!payouts) return 0;

    const type =
      ticket.type;

    const horses =
      this._ticketHorses(ticket);

    const keys = [
      horses.join("-"),
      horses.join(","),
      horses.slice().sort().join("-"),
      horses.slice().sort().join(",")
    ];

    const typePayouts =
      payouts[type] || payouts[String(type).toLowerCase()] || null;

    if (!typePayouts) return 0;

    for (let i = 0; i < keys.length; i++) {
      const value =
        typePayouts[keys[i]];

      const n =
        Utils.toNumber(value, 0);

      if (n > 0) {
        return n;
      }
    }

    return 0;

  }


  /**
   * ----------------------------------------------------------
   * 安全Bankroll
   * ----------------------------------------------------------
   */
  static _safeBankroll(bankroll) {

    const fallback =
      CONFIG && CONFIG.BANKROLL && CONFIG.BANKROLL.INITIAL
        ? CONFIG.BANKROLL.INITIAL
        : 100000;

    const n =
      Utils.toNumber(bankroll, fallback);

    return n > 0 ? n : fallback;

  }


  /**
   * ----------------------------------------------------------
   * Score 0-100化
   * ----------------------------------------------------------
   */
  static _scoreToPercent(score) {

    const s =
      Utils.toNumber(score, 0);

    if (s <= 1) {
      return Utils.round(s * 100, 4);
    }

    return Utils.round(
      Utils.clamp(s, 0, 100),
      4
    );

  }

}


/**
 * ==========================================================
 * GAS Test Helper
 * ==========================================================
 */

function testBacktestEngineAIBrainIntegration() {

  const races =
    OmegaDataLayer.loadToday();

  if (!Array.isArray(races) || races.length === 0) {
    Logger.warn("No race data for BacktestEngine integration test.");
    return null;
  }

  const result =
    BacktestEngine.run(
      races,
      CONFIG.BANKROLL.INITIAL
    );

  Logger.info("BacktestEngine AIBrain Integration Test Result", {
    races: result.races,
    evaluatedRaces: result.evaluatedRaces,
    skippedRaces: result.skippedRaces,
    totalBet: result.totalBet,
    totalReturn: result.totalReturn,
    returnRate: result.returnRate,
    finalBankroll: result.finalBankroll
  });

  return result;

}
