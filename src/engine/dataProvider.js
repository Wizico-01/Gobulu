// Orchestrates a full cascade analysis for a symbol + trading style.

import { CASCADES, basePriceFor, psychLevelsNear, psychLevelsInDirection, countLevelRetests, decimalsFor, fmtPrice, TIER_MINUTES } from "./symbols.js";
import { detectSwingPoints, labelSwingPointsFromCandles, deriveTrend, evaluateBOSFromCandles, detectSupplyDemandZones } from "./structure.js";
import { detectPattern } from "./patterns.js";
import { buildGobulu } from "./gobulu.js";
import { buildFibonacci } from "./fibonacci.js";

const MIN_RETESTS = 2; // a level must be touched at least twice to count as proven/strong

/*
 * Turns a confirmed setup into an actual trade plan: entry price, stop
 * loss, take profit, and whether price is currently at, approaching, or
 * has moved past the entry zone. When the market is ranging (no trend to
 * follow), returns range-boundary guidance instead of a null trade plan —
 * the trader should never be left with no direction at all.
 */
function buildTradePlan(entryTier, pattern, fib, keyLevels, livePrice, symbol, base, score, zones, tierName) {
  const isRanging = entryTier.trend === "range";
  let direction;

  if (isRanging) {
    // Ranging markets don't have a trend to follow — instead, trade the
    // range itself: buy at strong retested support, sell at strong
    // retested resistance. Decide direction by whichever range boundary
    // price is genuinely closest to right now.
    const tolerance0 = base * 0.0012;
    const candles0 = entryTier.candles ?? [];
    const strongLevels = candles0.length
      ? entryTier.labeled
          .map((p) => ({ price: p.price, type: p.type, retests: countLevelRetests(candles0, p.price, tolerance0) }))
          .filter((l) => l.retests >= MIN_RETESTS)
      : [];
    const strongHighs = strongLevels.filter((l) => l.type === "high");
    const strongLows = strongLevels.filter((l) => l.type === "low");

    if (!strongHighs.length && !strongLows.length) {
      return {
        direction: null, entrySource: null, zoneStatus: "ranging",
        zoneMessage: `${tierName} is ranging with no strongly retested support or resistance yet. Wait for a level to be tested at least twice before anticipating a trade here.`,
      };
    }

    const nearestHigh = strongHighs.reduce((c, l) => !c || Math.abs(l.price - livePrice) < Math.abs(c.price - livePrice) ? l : c, null);
    const nearestLow = strongLows.reduce((c, l) => !c || Math.abs(l.price - livePrice) < Math.abs(c.price - livePrice) ? l : c, null);
    const distToHigh = nearestHigh ? Math.abs(nearestHigh.price - livePrice) : Infinity;
    const distToLow = nearestLow ? Math.abs(nearestLow.price - livePrice) : Infinity;

    // Closer to support → buy the bounce. Closer to resistance → sell the rejection.
    direction = distToLow <= distToHigh ? "buy" : "sell";
  } else if (entryTier.trend === "uptrend") {
    direction = "buy";
  } else if (entryTier.trend === "downtrend") {
    direction = "sell";
  } else {
    return null;
  }

  const confirmed = !!pattern && pattern.direction !== "neutral" &&
    ((direction === "buy" && pattern.direction === "bullish") || (direction === "sell" && pattern.direction === "bearish"));

  const tolerance = base * 0.0012;
  const zoneTolerance = tolerance * 0.5;
  const candles = entryTier.candles ?? [];

  const strongSwingLevels = candles.length
    ? entryTier.labeled
        .map((p) => ({ price: p.price, retests: countLevelRetests(candles, p.price, tolerance) }))
        .filter((l) => l.retests >= MIN_RETESTS)
    : [];

  const zoneCandidates = (zones ?? []).map((z) => ({
    price: direction === "buy" ? z.high : z.low, // enter from the near edge of the zone
    zoneType: z.type,
    zoneLow: z.low,
    zoneHigh: z.high,
  }));

  const swingCandidatesRanked = strongSwingLevels
    .map((l) => ({ ...l, dist: Math.abs(l.price - livePrice) }))
    .sort((a, b) => a.dist - b.dist);
  const zoneCandidatesRanked = zoneCandidates
    .map((z) => ({ ...z, dist: Math.abs(z.price - livePrice) }))
    .sort((a, b) => a.dist - b.dist);
  const psychCandidatesRanked = keyLevels
    .map((k) => ({ price: k.price, dist: Math.abs(k.price - livePrice) }))
    .sort((a, b) => a.dist - b.dist);

  const bestSwing = swingCandidatesRanked[0];
  const bestZone = zoneCandidatesRanked[0];
  const bestPsych = psychCandidatesRanked[0];

  const contenders = [
    bestSwing && { ...bestSwing, source: "structure" },
    bestZone && { ...bestZone, source: "supply_demand" },
    bestPsych && { ...bestPsych, source: "psychological" },
  ].filter(Boolean);

  if (!contenders.length) {
    return {
      direction, entrySource: null, zoneStatus: "no_level",
      zoneMessage: `Trend is ${entryTier.trend} on ${tierName}, but no strong support/resistance, supply/demand zone, or psychological level is nearby yet. Wait for price to approach a proven level before anticipating a trade.`,
    };
  }

  contenders.sort((a, b) => a.dist - b.dist);
  const chosen = contenders[0];
  const entryPrice = chosen.price;
  const entrySource = chosen.source;
  const entryZone = entrySource === "supply_demand" ? chosen : undefined;

  const entryIsPsychBonus = entrySource !== "psychological" && !!bestPsych && Math.abs(bestPsych.price - entryPrice) < tolerance;

  const fibTolerance = base * 0.0015;
  const fibAligns = fib?.priceAtKeyRetracement && Math.abs(fib.atKeyLevel.price - entryPrice) < fibTolerance;

  const swingBuffer = base * 0.0015;
  let stopLoss;
  if (direction === "buy") {
    const swingLow = [...entryTier.labeled].reverse().find((p) => p.type === "low");
    stopLoss = (swingLow ? swingLow.price : entryPrice - base * 0.004) - swingBuffer;
  } else {
    const swingHigh = [...entryTier.labeled].reverse().find((p) => p.type === "high");
    stopLoss = (swingHigh ? swingHigh.price : entryPrice + base * 0.004) + swingBuffer;
  }

    const risk = Math.abs(entryPrice - stopLoss);
  let takeProfit;
  if (isRanging) {
    // In a range, target the opposite boundary of the range — not an
    // arbitrary psych level far beyond it, since price is expected to
    // reverse at the range edges, not break out.
    const oppositeType = direction === "buy" ? "high" : "low";
    const oppositeLevels = entryTier.labeled.filter((p) => p.type === oppositeType).map((p) => p.price);
    takeProfit = direction === "buy"
      ? (oppositeLevels.length ? Math.min(...oppositeLevels.filter((p) => p > entryPrice)) : null)
      : (oppositeLevels.length ? Math.max(...oppositeLevels.filter((p) => p < entryPrice)) : null);
    if (takeProfit == null || !isFinite(takeProfit)) {
      const tpCandidates = psychLevelsInDirection(symbol, entryPrice, direction, 6);
      takeProfit = tpCandidates.find((lvl) => Math.abs(lvl - entryPrice) >= risk * 1.5) ?? tpCandidates[tpCandidates.length - 1] ?? null;
    }
  } else {
    const tpCandidates = psychLevelsInDirection(symbol, entryPrice, direction, 6);
    takeProfit = tpCandidates.find((lvl) => Math.abs(lvl - entryPrice) >= risk * 1.5) ?? tpCandidates[tpCandidates.length - 1] ?? null;
  }

    // Specific, never generic: buy = support, sell = resistance.
  const entryLabel = entrySource === "supply_demand"
    ? `${entryZone.zoneType} zone (${fmtPrice(symbol, entryZone.zoneLow)}–${fmtPrice(symbol, entryZone.zoneHigh)})`
    : entrySource === "psychological"
      ? `${fmtPrice(symbol, entryPrice)} psychological level`
      : `${fmtPrice(symbol, entryPrice)} ${direction === "buy" ? "support" : "resistance"} level${isRanging ? " (ranging market)" : ""}`;

  const distancePastEntry = direction === "buy" ? livePrice - entryPrice : entryPrice - livePrice;
  let zoneStatus, zoneMessage, missedInfo = null;

  if (distancePastEntry > zoneTolerance) {
    zoneStatus = "missed";

    let candlesAgo = null;
    for (let i = candles.length - 1; i >= 0; i--) {
      const c = candles[i];
      if (c.low <= entryPrice + zoneTolerance && c.high >= entryPrice - zoneTolerance) {
        candlesAgo = candles.length - 1 - i;
        break;
      }
    }
    const minutesPerCandle = TIER_MINUTES[tierName] ?? 60;
    const elapsedMinutes = candlesAgo != null ? candlesAgo * minutesPerCandle : null;
    const elapsedLabel = elapsedMinutes == null ? "a while ago"
      : elapsedMinutes < 60 ? `~${elapsedMinutes}m ago`
      : elapsedMinutes < 1440 ? `~${(elapsedMinutes / 60).toFixed(1)}h ago`
      : `~${(elapsedMinutes / 1440).toFixed(1)}d ago`;

    const stillClose = distancePastEntry <= risk * 0.6;
    missedInfo = { candlesAgo, elapsedLabel, stillClose };
    zoneMessage = stillClose
      ? `Price left the ${entryLabel} ${elapsedLabel} and hasn't moved far. Anticipate a pullback back to ${fmtPrice(symbol, entryPrice)}, do not chase the current price without it.`
      : `Price left the ${entryLabel} ${elapsedLabel} and has moved too far to chase. Watch for a pullback to ${fmtPrice(symbol, entryPrice)}, or wait for the next key level to form, this exact entry is gone otherwise.`;
  } else if (Math.abs(livePrice - entryPrice) <= zoneTolerance) {
    if (score >= 5 && confirmed) {
      zoneStatus = "at_zone";
      zoneMessage = fibAligns
        ? `Price is at the ${entryLabel}, reinforced by the ${fib.atKeyLevel.label}% Fibonacci level lining up here — with strong Gobulu, in line with the trend. Valid entry.`
        : `Price is at the ${entryLabel} with strong Confluence in line with the trend, valid entry.`;
    } else {
      zoneStatus = "insufficient";
      if (score < 5 && !confirmed) {
        zoneMessage = `Price is at the ${entryLabel}, but Confluenceis still below Strong and no reversal candle has confirmed yet. Watch this exact level for both to line up before entering.`;
      } else if (score < 5) {
        zoneMessage = `Price is at the ${entryLabel} with a confirmed reversal candle, but Confluence isn't Strong enough yet (need 5+). Watch this level, if it strengthens on the next update, this becomes valid.`;
      } else {
        zoneMessage = `Price is at the ${entryLabel} with strong Confluence (${score}/9), but no reversal candlestick has confirmed yet. Watch this exact level for a confirming candle before entering.`;
      }
    }
  } else {
    zoneStatus = "approaching";
    zoneMessage = `Price hasn't reached the ${entryLabel} yet. Anticipate a pullback to ${fmtPrice(symbol, entryPrice)}, that's the key level to watch before considering entry.`;
  }

  const reward = takeProfit != null ? Math.abs(takeProfit - entryPrice) : null;
  const riskReward = reward != null && risk > 0 ? +(reward / risk).toFixed(2) : null;

  return {
    direction, entryPrice, entrySource, stopLoss, takeProfit, riskReward,
    zoneStatus, zoneMessage, confirmed, fibAligns, entryIsPsychBonus, missedInfo,
  };
}

export async function buildLiveAnalysis(symbol, style, getTierCandles, visionByTier = {}) {
  const cascade = CASCADES[style];
  const base = basePriceFor(symbol);
  const tolerance = base * 0.0012;

  const candleResults = await Promise.all(cascade.tiers.map((t) => getTierCandles(t)));

  const tiers = cascade.tiers.map((tierName, idx) => {
    const role = cascade.roles[idx];
    const candles = candleResults[idx];

    if (candles && candles.length >= 12) {
      const points = detectSwingPoints(candles, 2);
      const labeled = labelSwingPointsFromCandles(points);
      const trend = deriveTrend(labeled);
      const currentPrice = candles[candles.length - 1].close;
      const bos = evaluateBOSFromCandles(labeled, trend, candles, tolerance);
      return { name: tierName, role, trend, labeled, currentPrice, bos, source: "live", candles };
    } else if (visionByTier[tierName]) {
      const v = visionByTier[tierName];
      return {
        name: tierName, role, trend: v.trend ?? "range",
        labeled: [], currentPrice: null, bos: { occurred: false },
        source: "photo", visionNotes: v,
      };
    } else {
      return { name: tierName, role, trend: "range", labeled: [], currentPrice: null, bos: { occurred: false }, source: "missing" };
    }
  });

  const entryTier = tiers[tiers.length - 1];
  const livePrice = entryTier.currentPrice ?? base;

  let pattern = null;
  if (entryTier.source === "live") {
    pattern = detectPattern(entryTier.candles.slice(-3));
  } else if (entryTier.source === "photo" && entryTier.visionNotes?.visible_pattern) {
    const name = entryTier.visionNotes.visible_pattern;
    const direction = /Bullish|Hammer|Morning/.test(name) ? "bullish" : /Bearish|Shooting|Evening/.test(name) ? "bearish" : "neutral";
    pattern = { name, direction };
  }

  const psych = psychLevelsNear(symbol, livePrice);
  const swingLevels = entryTier.labeled.map((p) => p.price);
  const keyLevels = psych
    .map((pl) => {
      const match = swingLevels.find((sl) => Math.abs(sl - pl) < tolerance);
      const retests = entryTier.candles ? countLevelRetests(entryTier.candles, pl, tolerance) : 0;
      return { price: pl, merged: !!match, retests };
    })
    .filter((k) => k.retests >= MIN_RETESTS || k.merged);

  const nearestLevel = keyLevels.reduce((closest, k) =>
    !closest || Math.abs(k.price - livePrice) < Math.abs(closest.price - livePrice) ? k : closest, null);
  const priceNearKeyLevel = !!nearestLevel && Math.abs(nearestLevel.price - livePrice) < tolerance * 1.4;
  const mergedLevel = keyLevels.find((k) => k.merged && Math.abs(k.price - livePrice) < tolerance * 1.6);
  const priceNearMergedLevel = !!mergedLevel;

  const fib = entryTier.source === "live"
    ? buildFibonacci(entryTier.labeled, entryTier.trend, livePrice, tolerance * 1.4)
    : { valid: false };

  const zones = entryTier.candles ? detectSupplyDemandZones(entryTier.candles) : [];
  const inZone = zones.find((z) => livePrice >= z.low && livePrice <= z.high) ?? null;

  const { checklist, score, strength, alarmActive, total } = buildGobulu({
    tiers, entryTier, pattern, priceNearKeyLevel, priceNearMergedLevel, fib, symbol, nearestLevel, mergedLevel, inZone,
  });

  const tradePlan = buildTradePlan(entryTier, pattern, fib, keyLevels, livePrice, symbol, base, score, zones, entryTier.name);
  const finalAlarmActive = alarmActive && tradePlan?.zoneStatus === "at_zone";

  return {
    symbol, tiers, livePrice, pattern, keyLevels, fib, checklist, score, strength,
    alarmActive: finalAlarmActive, total, tradePlan,
    entryTierName: entryTier.name, decimals: decimalsFor(symbol),
  };
}