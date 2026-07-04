const EventId = (() => {

  /**
   * トラックコード変換
   */
  const normalizeTrack = (track) => {

    if (!track) {
      throw new Error("[EVENT_ID] Track required");
    }

    // ★ここが正しい場所
    if (typeof TRACK_CODES !== "undefined" && TRACK_CODES[track]) {
      return TRACK_CODES[track];
    }

    if (/^[A-Z]{2}$/.test(track)) {
      return track;
    }

    return track.substring(0, 2).toUpperCase();
  };


  const create = (date, track, raceNumber) => {

    const dateId = DateUtils.toDateId(date);
    const trackCode = normalizeTrack(track);
    const race = normalizeRace(raceNumber);

    return `${dateId}_${trackCode}_${race}`;
  };


  const parse = (eventId) => {

    validate(eventId);

    const [date, track, race] = eventId.split("_");

    return {
      date,
      track,
      race,
      raceNumber: Number(race.replace("R", ""))
    };
  };


  const normalizeRace = (race) => {

    const n = Number(race);

    if (!Number.isInteger(n) || n <= 0) {
      throw new Error("[EVENT_ID] Invalid race");
    }

    return `${n}R`;
  };


  const validate = (eventId) => {

    if (typeof eventId !== "string") {
      throw new Error("[EVENT_ID] Invalid type");
    }

    if (!/^\d{8}_[A-Z]{2}_\d{1,2}R$/.test(eventId)) {
      throw new Error("[EVENT_ID] Invalid format : " + eventId);
    }

    return true;
  };


  const equals = (id1, id2) => id1 === id2;


  const sortKey = (eventId) => {

    const p = parse(eventId);

    return [
      p.date,
      p.track,
      ("00" + p.raceNumber).slice(-2)
    ].join("_");
  };


  const compare = (a, b) => {
    return sortKey(a).localeCompare(sortKey(b));
  };


  const today = (track, race) => {
    return create(new Date(), track, race);
  };


  return {
    create,
    parse,
    validate,
    equals,
    compare,
    today,
    sortKey
  };

})();
