/**
 * ==========================================================
 * ΩMAX Ver.1.0 RC1
 * TicketEngine.js
 * ----------------------------------------------------------
 * AIBrain完全対応版
 *
 * 役割:
 * - CoreEngine結果から従来買い目を生成
 * - AIBrain結果からRC1正式買い目を生成
 * - buildFromAIBrain() を正式ルートとして提供
 * - build() は後方互換として維持
 *
 * GAS V8 compatible.
 * ==========================================================
 */

class TicketEngine {

  /**
   * ----------------------------------------------------------
   * 後方互換ルート
   * CoreEngine結果のみで買い目生成
   * ----------------------------------------------------------
   */
  static build(race, coreResults, bankroll) {

    const safeBankroll =
      this._safeBankroll(bankroll);

    const candidates =
      this._normalizeCoreCandidates(coreResults)
        .filter(r => r.decision !== DECISION.PASS)
        .sort((a, b) => b.ev - a.ev);

    return this._buildTicketResult(
      race,
      candidates,
      safeBankroll,
      null,
      "CORE"
    );

  }


  /**
   * ----------------------------------------------------------
   * RC1正式ルート
   * AIBrain結果を利用して買い目生成
   * ----------------------------------------------------------
   */
  static buildFromAIBrain(race, aiBrainResult, bankroll) {

    const safeBankroll =
      this._safeBankroll(bankroll);

    if (!aiBrainResult) {
      Logger.warn("TicketEngine.buildFromAIBrain: aiBrainResult is empty. Fallback to PASS.");

      return {
        raceId: race && race.id ? race.id : "",
        mode: "AIBRAIN",
        ok: false,
        reason: "NO_AIBRAIN_RESULT",
        decision: {
          action: "SKIP",
          grade: CONFIDENCE_RANK.PASS,
          reason: "AIBrain結果なし"
        },
        tickets: [],
        totalAmount: 0,
        expectedEV: 0,
        confidence: CONFIDENCE_RANK.PASS,
        explanations: []
      };
    }

    const decision =
      this._normalizeAIBrainDecision(aiBrainResult.decision);

    if (decision.action === "SKIP") {
      return {
        raceId: race && race.id ? race.id : aiBrainResult.raceId || "",
        mode: "AIBRAIN",
        ok: true,
        reason: "AIBRAIN_SKIP",
        decision,
        tickets: [],
        totalAmount: 0,
        expectedEV: 0,
        confidence: decision.grade || CONFIDENCE_RANK.PASS,
        raceRisk: Utils.toNumber(aiBrainResult.raceRisk, 0),
        marketOpportunity: Utils.toNumber(aiBrainResult.marketOpportunity, 0),
        explanations: aiBrainResult.explanations || []
      };
    }

    const candidates =
      this._normalizeAIBrainCandidates(aiBrainResult)
        .filter(r => r.ev >= CONFIG.DECISION.WATCH)
        .sort((a, b) => {
          if (b.aceScore !== a.aceScore) return b.aceScore - a.aceScore;
          return b.ev - a.ev;
        });

    return this._buildTicketResult(
      race,
      candidates,
      safeBankroll,
      aiBrainResult,
      "AIBRAIN"
    );

  }


  /**
   * ----------------------------------------------------------
   * 共通買い目構築
   * ----------------------------------------------------------
   */
  static _buildTicketResult(race, candidates, bankroll, aiBrainResult, mode) {

    const raceId =
      race && race.id
        ? race.id
        : aiBrainResult && aiBrainResult.raceId
          ? aiBrainResult.raceId
          : "";

    const decision =
      aiBrainResult
        ? this._normalizeAIBrainDecision(aiBrainResult.decision)
        : this._decisionFromCandidates(candidates);

    const adjustedBankroll =
      this._adjustBankrollByRaceRisk(
        bankroll,
        aiBrainResult ? aiBrainResult.raceRisk : 40
      );

    const tickets = [];

    tickets.push(...this._winTickets(candidates, adjustedBankroll, aiBrainResult));
    tickets.push(...this._wideTickets(candidates, adjustedBankroll, aiBrainResult));
    tickets.push(...this._quinellaTickets(candidates, adjustedBankroll, aiBrainResult));
    tickets.push(...this._exactaTickets(candidates, adjustedBankroll, aiBrainResult));
    tickets.push(...this._trioTickets(candidates, adjustedBankroll, aiBrainResult));
    tickets.push(...this._trifectaTickets(candidates, adjustedBankroll, aiBrainResult));

    const finalTickets =
      tickets
        .filter(t => t.amount >= CONFIG.BANKROLL.MIN_BET)
        .sort((a, b) => {
          if (b.priority !== a.priority) return b.priority - a.priority;
          return b.ev - a.ev;
        })
        .slice(0, CONFIG.TICKET.MAX_PER_RACE)
        .map((t, index) => Object.assign({}, t, {
          ticketId: raceId + "_T" + (index + 1),
          rank: index + 1
        }));

    const totalAmount =
      Utils.sum(finalTickets.map(t => t.amount));

    return {
      raceId,
      mode,
      ok: true,
      decision,
      tickets: finalTickets,
      totalAmount,
      expectedEV: this._expectedEV(finalTickets),
      confidence: this._ticketSetConfidence(finalTickets, decision),
      raceRisk: aiBrainResult ? Utils.toNumber(aiBrainResult.raceRisk, 0) : null,
      marketOpportunity: aiBrainResult ? Utils.toNumber(aiBrainResult.marketOpportunity, 0) : null,
      topHorse: aiBrainResult ? aiBrainResult.topHorse || null : null,
      explanations: aiBrainResult ? aiBrainResult.explanations || [] : [],
      createdAt: new Date()
    };

  }


  /**
   * ----------------------------------------------------------
   * 単勝
   * ----------------------------------------------------------
   */
  static _winTickets(list, bankroll, aiBrainResult) {

    return list
      .filter(r => r.decision === DECISION.BUY || r.ev >= CONFIG.DECISION.BUY)
      .slice(0, 2)
      .map(r => this._ticket({
        type: TICKET_TYPE.WIN,
        horses: [r.horseId],
        horseNames: [r.horseName],
        ev: r.ev,
        confidence: r.confidence,
        confidencePoint: r.confidencePoint,
        amount: this._candidateBetAmount(bankroll, r, 1.00),
        priority: this._priority(r, aiBrainResult, 1.20),
        source: r
      }));

  }


  /**
   * ----------------------------------------------------------
   * ワイド
   * ----------------------------------------------------------
   */
  static _wideTickets(list, bankroll, aiBrainResult) {

    return this._pairTickets(
      list.slice(0, 5),
      bankroll,
      TICKET_TYPE.WIDE,
      CONFIG.DECISION.WATCH,
      0.010,
      0.95,
      aiBrainResult
    );

  }


  /**
   * ----------------------------------------------------------
   * 馬連
   * ----------------------------------------------------------
   */
  static _quinellaTickets(list, bankroll, aiBrainResult) {

    return this._pairTickets(
      list.slice(0, 4),
      bankroll,
      TICKET_TYPE.QUINELLA,
      CONFIG.DECISION.BUY,
      0.008,
      1.00,
      aiBrainResult
    );

  }


  /**
   * ----------------------------------------------------------
   * 馬単
   * ----------------------------------------------------------
   */
  static _exactaTickets(list, bankroll, aiBrainResult) {

    const top = list.slice(0, 4);
    const tickets = [];

    for (let i = 0; i < top.length; i++) {
      for (let j = 0; j < top.length; j++) {
        if (i === j) continue;

        const pair = [top[i], top[j]];
        const ev =
          Utils.round(top[i].ev * 0.65 + top[j].ev * 0.35, 4);

        if (ev < CONFIG.DECISION.BUY) continue;

        tickets.push(this._ticket({
          type: TICKET_TYPE.EXACTA,
          horses: pair.map(x => x.horseId),
          horseNames: pair.map(x => x.horseName),
          ev,
          confidence: this._multiConfidence(pair),
          confidencePoint: this._multiConfidencePoint(pair),
          amount: this._confidenceFixedAmount(bankroll, pair, 0.006),
          priority: this._multiPriority(pair, aiBrainResult, 0.90),
          source: pair
        }));
      }
    }

    return tickets;

  }


  /**
   * ----------------------------------------------------------
   * 3連複
   * ----------------------------------------------------------
   */
  static _trioTickets(list, bankroll, aiBrainResult) {

    const top = list.slice(0, 5);
    const tickets = [];

    for (let i = 0; i < top.length; i++) {
      for (let j = i + 1; j < top.length; j++) {
        for (let k = j + 1; k < top.length; k++) {

          const trio = [top[i], top[j], top[k]];
          const ev =
            Utils.round(Utils.average(trio.map(x => x.ev)), 4);

          if (ev < CONFIG.DECISION.BUY) continue;

          tickets.push(this._ticket({
            type: TICKET_TYPE.TRIO,
            horses: trio.map(x => x.horseId),
            horseNames: trio.map(x => x.horseName),
            ev,
            confidence: this._multiConfidence(trio),
            confidencePoint: this._multiConfidencePoint(trio),
            amount: this._confidenceFixedAmount(bankroll, trio, 0.005),
            priority: this._multiPriority(trio, aiBrainResult, 0.80),
            source: trio
          }));

        }
      }
    }

    return tickets;

  }


  /**
   * ----------------------------------------------------------
   * 3連単
   * ----------------------------------------------------------
   */
  static _trifectaTickets(list, bankroll, aiBrainResult) {

    const top = list.slice(0, 4);
    const tickets = [];

    for (let i = 0; i < top.length; i++) {
      for (let j = 0; j < top.length; j++) {
        for (let k = 0; k < top.length; k++) {
          if (i === j || j === k || i === k) continue;

          const trio = [top[i], top[j], top[k]];
          const ev =
            Utils.round(top[i].ev * 0.50 + top[j].ev * 0.30 + top[k].ev * 0.20, 4);

          if (ev < CONFIG.EV.TARGET) continue;

          tickets.push(this._ticket({
            type: TICKET_TYPE.TRIFECTA,
            horses: trio.map(x => x.horseId),
            horseNames: trio.map(x => x.horseName),
            ev,
            confidence: this._multiConfidence(trio),
            confidencePoint: this._multiConfidencePoint(trio),
            amount: this._confidenceFixedAmount(bankroll, trio, 0.003),
            priority: this._multiPriority(trio, aiBrainResult, 0.65),
            source: trio
          }));

        }
      }
    }

    return tickets;

  }


  /**
   * ----------------------------------------------------------
   * ペア券種共通
   * ----------------------------------------------------------
   */
  static _pairTickets(list, bankroll, type, minEv, rate, priorityBase, aiBrainResult) {

    const tickets = [];

    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {

        const pair = [list[i], list[j]];
        const ev =
          Utils.round(Utils.average(pair.map(x => x.ev)), 4);

        if (ev < minEv) continue;

        tickets.push(this._ticket({
          type,
          horses: pair.map(x => x.horseId),
          horseNames: pair.map(x => x.horseName),
          ev,
          confidence: this._multiConfidence(pair),
          confidencePoint: this._multiConfidencePoint(pair),
          amount: this._confidenceFixedAmount(bankroll, pair, rate),
          priority: this._multiPriority(pair, aiBrainResult, priorityBase),
          source: pair
        }));

      }
    }

    return tickets;

  }


  /**
   * ----------------------------------------------------------
   * AIBrain候補正規化
   * ----------------------------------------------------------
   */
  static _normalizeAIBrainCandidates(aiBrainResult) {

    const aceRunners =
      aiBrainResult && aiBrainResult.ace && Array.isArray(aiBrainResult.ace.runners)
        ? aiBrainResult.ace.runners
        : [];

    const evaluatedRunners =
      aiBrainResult && Array.isArray(aiBrainResult.evaluatedRunners)
        ? aiBrainResult.evaluatedRunners
        : [];

    const evalMap = {};

    evaluatedRunners.forEach(r => {
      const id = String(r.runnerId || r.horseId || r.id || "");
      if (id) evalMap[id] = r;
    });

    return aceRunners.map((r, index) => {

      const id =
        String(r.runnerId || r.horseId || r.id || "");

      const base =
        evalMap[id] || {};

      const ev =
        Utils.round(Utils.toNumber(r.ev, 0), 4);

      const aceScore =
        Utils.toNumber(r.aceScore, r.finalScore || base.finalScore || 0);

      const confidencePoint =
        Utils.clamp(
          Utils.average([
            Utils.toNumber(r.confidence, 0),
            Utils.toNumber(base.confidence, 0),
            Utils.toNumber(aceScore, 0)
          ].filter(v => v > 0)),
          0,
          100
        );

      return {
        raceId: aiBrainResult.raceId || "",
        horseId: id,
        horseName: r.name || r.horseName || base.name || base.horseName || "",
        number: r.number || r.horseNumber || base.number || base.horseNumber || index + 1,
        odds: Utils.toNumber(r.odds || base.odds, 0),
        score: Utils.round(aceScore / 100, 4),
        winProb: Utils.round(Utils.toNumber(r.winRate || r.predictedProbability, 0), 4),
        ev,
        kelly: this._calcKellyFromCandidate(r),
        confidencePoint: Utils.round(confidencePoint, 2),
        confidence: CoreEngine.confidenceRank(confidencePoint),
        decision: this._decisionFromEV(ev, confidencePoint),
        aceScore: Utils.round(aceScore, 4),
        marketGap: Utils.round(Utils.toNumber(r.marketGap, 0), 4),
        riskScore: Utils.toNumber(r.riskScore || base.riskScore, 0),
        winRate: Utils.toNumber(r.winRate, 0),
        quinellaRate: Utils.toNumber(r.quinellaRate, 0),
        placeRate: Utils.toNumber(r.placeRate, 0),
        averageFinish: Utils.toNumber(r.averageFinish, 0),
        reasons: r.aceRankReason || r.reasons || base.reasons || [],
        raw: r
      };

    });

  }


  /**
   * ----------------------------------------------------------
   * Core候補正規化
   * ----------------------------------------------------------
   */
  static _normalizeCoreCandidates(coreResults) {

    return (coreResults || []).map(r => ({
      raceId: r.raceId || "",
      horseId: r.horseId || "",
      horseName: r.horseName || "",
      number: r.number || r.horseNumber || 0,
      odds: Utils.toNumber(r.odds, 0),
      score: Utils.toNumber(r.score, 0),
      winProb: Utils.toNumber(r.winProb, 0),
      ev: Utils.round(Utils.toNumber(r.ev, 0), 4),
      kelly: Utils.toNumber(r.kelly, 0),
      confidencePoint: Utils.toNumber(r.confidencePoint, 0),
      confidence: r.confidence || CoreEngine.confidenceRank(r.confidencePoint),
      decision: r.decision || this._decisionFromEV(r.ev, r.confidencePoint),
      aceScore: Utils.round(Utils.toNumber(r.score, 0) * 100, 4),
      marketGap: 0,
      riskScore: 0,
      reasons: [],
      raw: r
    }));

  }


  /**
   * ----------------------------------------------------------
   * Ticket共通整形
   * ----------------------------------------------------------
   */
  static _ticket(params) {

    const horses =
      params.horses || [];

    const horseNames =
      params.horseNames || [];

    const ticket = {
      type: params.type,
      horses,
      horseNames,
      horseId: horses.length === 1 ? horses[0] : undefined,
      horseName: horseNames.length === 1 ? horseNames[0] : undefined,
      ev: Utils.round(params.ev, 4),
      confidence: params.confidence || CONFIDENCE_RANK.PASS,
      confidencePoint: Utils.round(params.confidencePoint || 0, 2),
      amount: this._roundBet(params.amount || 0),
      priority: Utils.round(params.priority || 0, 4),
      reasons: this._ticketReasons(params.source),
      createdAt: new Date()
    };

    return ticket;

  }


  /**
   * ----------------------------------------------------------
   * 資金配分
   * ----------------------------------------------------------
   */
  static _candidateBetAmount(bankroll, result, rateMultiplier) {

    const kelly =
      Utils.toNumber(result.kelly, 0);

    const base =
      kelly > 0
        ? bankroll * kelly
        : bankroll * 0.006;

    const confidenceAdjusted =
      base * this._confidenceMultiplier(result.confidence);

    const riskAdjusted =
      confidenceAdjusted * this._riskMultiplier(result.riskScore);

    const amount =
      riskAdjusted * Utils.toNumber(rateMultiplier, 1);

    return this._roundBet(
      Math.min(amount, bankroll * CONFIG.BANKROLL.MAX_BET_RATE)
    );

  }


  static _confidenceFixedAmount(bankroll, list, rate) {

    const confidence =
      this._multiConfidence(list);

    const riskAvg =
      Utils.average(list.map(x => Utils.toNumber(x.riskScore, 0)));

    const base =
      bankroll * rate;

    const adjusted =
      base *
      this._confidenceMultiplier(confidence) *
      this._riskMultiplier(riskAvg);

    return this._roundBet(
      Math.min(adjusted, bankroll * CONFIG.BANKROLL.MAX_BET_RATE)
    );

  }


  static _confidenceMultiplier(confidence) {

    if (confidence === CONFIDENCE_RANK.S) return 1.20;
    if (confidence === CONFIDENCE_RANK.A) return 1.00;
    if (confidence === CONFIDENCE_RANK.B) return 0.80;
    if (confidence === CONFIDENCE_RANK.C) return 0.60;
    if (confidence === CONFIDENCE_RANK.D) return 0.40;

    return 0;

  }


  static _riskMultiplier(riskScore) {

    const r =
      Utils.toNumber(riskScore, 0);

    if (r >= 80) return 0.45;
    if (r >= 65) return 0.65;
    if (r >= 50) return 0.85;

    return 1.00;

  }


  static _adjustBankrollByRaceRisk(bankroll, raceRisk) {

    const risk =
      Utils.toNumber(raceRisk, 40);

    if (risk >= 80) return bankroll * 0.35;
    if (risk >= 70) return bankroll * 0.50;
    if (risk >= 60) return bankroll * 0.70;

    return bankroll;

  }


  static _roundBet(amount) {

    const minBet =
      CONFIG.BANKROLL.MIN_BET || 100;

    const a =
      Math.max(minBet, Utils.toNumber(amount, 0));

    return Math.floor(a / 100) * 100;

  }


  /**
   * ----------------------------------------------------------
   * 評価系
   * ----------------------------------------------------------
   */
  static _multiConfidence(list) {

    const avg =
      this._multiConfidencePoint(list);

    return CoreEngine.confidenceRank(avg);

  }


  static _multiConfidencePoint(list) {

    return Utils.round(
      Utils.average(
        (list || []).map(x => Utils.toNumber(x.confidencePoint, 0))
      ),
      2
    );

  }


  static _priority(result, aiBrainResult, multiplier) {

    const gradeBoost =
      this._gradeBoost(aiBrainResult);

    const score =
      Utils.toNumber(result.aceScore, 0) * 0.45 +
      Utils.toNumber(result.ev, 0) * 30 +
      Utils.toNumber(result.confidencePoint, 0) * 0.25 +
      Utils.toNumber(result.marketGap, 0) * 100;

    return Utils.round(score * gradeBoost * Utils.toNumber(multiplier, 1), 4);

  }


  static _multiPriority(list, aiBrainResult, multiplier) {

    const avg =
      Utils.average(
        (list || []).map(x => this._priority(x, aiBrainResult, 1))
      );

    return Utils.round(avg * Utils.toNumber(multiplier, 1), 4);

  }


  static _gradeBoost(aiBrainResult) {

    if (!aiBrainResult || !aiBrainResult.decision) return 1;

    const grade =
      aiBrainResult.decision.grade;

    if (grade === "S") return 1.15;
    if (grade === "A") return 1.05;
    if (grade === "B") return 0.90;

    return 0.70;

  }


  static _expectedEV(tickets) {

    if (!Array.isArray(tickets) || tickets.length === 0) return 0;

    const amountTotal =
      Utils.sum(tickets.map(t => t.amount));

    if (amountTotal <= 0) return 0;

    const weighted =
      Utils.sum(tickets.map(t => Utils.toNumber(t.ev, 0) * Utils.toNumber(t.amount, 0)));

    return Utils.round(weighted / amountTotal, 4);

  }


  static _ticketSetConfidence(tickets, decision) {

    if (decision && decision.grade && decision.grade !== CONFIDENCE_RANK.PASS) {
      return decision.grade;
    }

    if (!tickets || !tickets.length) return CONFIDENCE_RANK.PASS;

    return CoreEngine.confidenceRank(
      Utils.average(tickets.map(t => Utils.toNumber(t.confidencePoint, 0)))
    );

  }


  static _ticketReasons(source) {

    if (Array.isArray(source)) {
      const reasons = [];

      source.forEach(item => {
        (item.reasons || []).forEach(reason => {
          if (reasons.indexOf(reason) < 0) reasons.push(reason);
        });
      });

      return reasons.slice(0, 5);
    }

    if (source && Array.isArray(source.reasons)) {
      return source.reasons.slice(0, 5);
    }

    return [];

  }


  /**
   * ----------------------------------------------------------
   * Decision / Kelly
   * ----------------------------------------------------------
   */
  static _decisionFromEV(ev, confidencePoint) {

    const e =
      Utils.toNumber(ev, 0);

    const c =
      Utils.toNumber(confidencePoint, 0);

    if (e >= CONFIG.DECISION.BUY && c >= CONFIG.CONFIDENCE.B) {
      return DECISION.BUY;
    }

    if (e >= CONFIG.DECISION.WATCH) {
      return DECISION.WATCH;
    }

    return DECISION.PASS;

  }


  static _decisionFromCandidates(candidates) {

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return {
        action: "SKIP",
        grade: CONFIDENCE_RANK.PASS,
        reason: "投資候補なし"
      };
    }

    const top =
      candidates[0];

    if (top.ev >= 1.25 && top.confidencePoint >= CONFIG.CONFIDENCE.A) {
      return {
        action: "BET",
        grade: "A",
        reason: "Core評価で期待値あり"
      };
    }

    if (top.ev >= CONFIG.DECISION.BUY) {
      return {
        action: "LIGHT_BET",
        grade: "B",
        reason: "Core評価で軽勝負候補"
      };
    }

    return {
      action: "SKIP",
      grade: CONFIDENCE_RANK.PASS,
      reason: "期待値不足"
    };

  }


  static _normalizeAIBrainDecision(decision) {

    if (!decision) {
      return {
        action: "SKIP",
        grade: CONFIDENCE_RANK.PASS,
        reason: "AIBrain decisionなし"
      };
    }

    return {
      action: decision.action || "SKIP",
      grade: decision.grade || CONFIDENCE_RANK.PASS,
      reason: decision.reason || ""
    };

  }


  static _calcKellyFromCandidate(candidate) {

    const p =
      Utils.toNumber(candidate.winRate || candidate.predictedProbability, 0);

    const odds =
      Utils.toNumber(candidate.odds, 0);

    if (p <= 0 || odds <= 1) return 0;

    const b = odds - 1;
    const q = 1 - p;
    const raw = (b * p - q) / b;
    const adjusted = raw * CONFIG.BANKROLL.KELLY_RATE;

    return Utils.round(
      Utils.clamp(adjusted, 0, CONFIG.BANKROLL.MAX_BET_RATE),
      4
    );

  }


  static _safeBankroll(bankroll) {

    return Utils.toNumber(
      bankroll,
      CONFIG.BANKROLL.INITIAL
    );

  }

}


/**
 * ==========================================================
 * GAS Test Helper
 * ==========================================================
 */
function testTicketEngineAIBrainIntegration() {

  const races =
    OmegaDataLayer.loadToday();

  if (!Array.isArray(races) || races.length === 0) {
    Logger.warn("No race data for TicketEngine AIBrain test.");
    return null;
  }

  const pipelineResult =
    OmegaPipeline.analyzeRace(races[0]);

  const ticket =
    TicketEngine.buildFromAIBrain(
      pipelineResult.race,
      pipelineResult.aiBrainResult,
      CONFIG.BANKROLL.INITIAL
    );

  Logger.info("TicketEngine AIBrain Integration Test Result", {
    raceId: ticket.raceId,
    mode: ticket.mode,
    decision: ticket.decision,
    ticketCount: ticket.tickets.length,
    totalAmount: ticket.totalAmount,
    expectedEV: ticket.expectedEV,
    confidence: ticket.confidence
  });

  return ticket;

}
