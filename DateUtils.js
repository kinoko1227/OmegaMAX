/**
 * ==========================================================
 * ΩMAX Ultimate v9
 * 04_DateUtils.gs
 * ----------------------------------------------------------
 * 日付ユーティリティ
 * システム全体で使用する日付処理を統一
 * ==========================================================
 */

const DateUtils = (() => {

  /**
   * 現在日時
   */
  const now = () => new Date();

  /**
   * yyyyMMdd
   */
  const toDateId = (date = new Date()) => {

    return Utilities.formatDate(
      new Date(date),
      Session.getScriptTimeZone(),
      "yyyyMMdd"
    );

  };

  /**
   * yyyy/MM/dd
   */
  const formatDate = (date = new Date()) => {

    return Utilities.formatDate(
      new Date(date),
      Session.getScriptTimeZone(),
      DATE_FORMAT.DATE
    );

  };

  /**
   * HH:mm
   */
  const formatTime = (date = new Date()) => {

    return Utilities.formatDate(
      new Date(date),
      Session.getScriptTimeZone(),
      DATE_FORMAT.TIME
    );

  };

  /**
   * yyyy/MM/dd HH:mm:ss
   */
  const formatDateTime = (date = new Date()) => {

    return Utilities.formatDate(
      new Date(date),
      Session.getScriptTimeZone(),
      DATE_FORMAT.DATETIME
    );

  };

  /**
   * Dateへ変換
   */
  const toDate = (value) => {

    if (value instanceof Date) {
      return new Date(value);
    }

    if (typeof value === "string") {

      const s = value
        .replace(/-/g, "/")
        .replace(/\./g, "/");

      return new Date(s);

    }

    throw new Error("[DATE_ERROR] Invalid date");

  };

  /**
   * yyyyMMdd文字列 → Date
   */
  const fromDateId = (dateId) => {

    if (!/^\d{8}$/.test(dateId)) {
      throw new Error("[DATE_ERROR] Invalid dateId");
    }

    return new Date(
      Number(dateId.substring(0,4)),
      Number(dateId.substring(4,6))-1,
      Number(dateId.substring(6,8))
    );

  };

  /**
   * 日数加算
   */
  const addDays = (date, days) => {

    const d = toDate(date);

    d.setDate(d.getDate() + days);

    return d;

  };

  /**
   * 月加算
   */
  const addMonths = (date, months) => {

    const d = toDate(date);

    d.setMonth(d.getMonth() + months);

    return d;

  };

  /**
   * 日数差
   */
  const diffDays = (date1, date2) => {

    const a = toDate(date1);
    const b = toDate(date2);

    const diff = b.getTime() - a.getTime();

    return Math.floor(diff / 86400000);

  };

  /**
   * 今日か判定
   */
  const isToday = (date) => {

    return toDateId(date) === toDateId();

  };

  /**
   * 同日判定
   */
  const isSameDate = (a, b) => {

    return toDateId(a) === toDateId(b);

  };

  /**
   * 曜日取得
   */
  const getWeekday = (date) => {

    return [
      "日",
      "月",
      "火",
      "水",
      "木",
      "金",
      "土"
    ][toDate(date).getDay()];

  };

  /**
   * YYYYMMDD_HHMMSS
   * ファイル名・バックアップ用
   */
  const timestamp = () => {

    return Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyyMMdd_HHmmss"
    );

  };

  /**
   * レース開催日判定
   * （土日＋将来祝日対応）
   */
  const isRaceDay = (date) => {

    const d = toDate(date).getDay();

    return d === 0 || d === 6;

  };

  return {

    now,

    toDate,
    toDateId,
    fromDateId,

    formatDate,
    formatTime,
    formatDateTime,

    addDays,
    addMonths,
    diffDays,

    isToday,
    isSameDate,
    getWeekday,

    timestamp,

    isRaceDay

  };

})();
