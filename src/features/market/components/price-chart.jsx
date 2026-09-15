"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CandlestickSeries, ColorType, CrosshairMode, HistogramSeries, createChart } from "lightweight-charts";
import { PageLoader } from "@/components/ui/page-loader";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { priceDecimals } from "@/lib/format";
import { subscribeStream } from "@/lib/market/binance-socket";
import { klinesQuery } from "@/lib/market/market-queries";
import { cn } from "@/lib/utils";
import { chartIntervals, usePreferencesStore } from "@/store/use-preferences-store";

const intervals = chartIntervals.map((value) => ({ value, label: value }));

const intervalSeconds = { "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "1d": 86400 };

const RETRY_DELAY = 5000;

const cssColor = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const toRgba = (hex, alpha) => {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
};

const readPalette = () => {
  const up = cssColor("--up");
  const down = cssColor("--down");
  return { up, down, upVolume: toRgba(up, 0.35), downVolume: toRgba(down, 0.35), crosshair: toRgba(cssColor("--brand"), 0.5), crosshairLabel: cssColor("--brand-dark") };
};

const toLocalTime = (utcSeconds) => utcSeconds - new Date(utcSeconds * 1000).getTimezoneOffset() * 60;

const toCandle = (kline) => ({
  time: toLocalTime(kline.time),
  open: kline.open,
  high: kline.high,
  low: kline.low,
  close: kline.close,
});

const toVolume = (kline, palette) => ({
  time: toLocalTime(kline.time),
  value: kline.volume,
  color: kline.close >= kline.open ? palette.upVolume : palette.downVolume,
});

const fromStream = ({ k }) => ({ time: Math.floor(k.t / 1000), open: +k.o, high: +k.h, low: +k.l, close: +k.c, volume: +k.v });

const chartOptions = {
  autoSize: true,
  layout: {
    background: { type: ColorType.Solid, color: "transparent" },
    textColor: "#8a8a8a",
    fontSize: 11,
    attributionLogo: true,
  },
  grid: {
    vertLines: { color: "rgba(255,255,255,0.04)" },
    horzLines: { color: "rgba(255,255,255,0.04)" },
  },
  rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
  timeScale: { borderColor: "rgba(255,255,255,0.08)", timeVisible: true, secondsVisible: false },
};

export const PriceChart = ({ symbol, className }) => {
  const containerRef = useRef(null);
  const queryClient = useQueryClient();
  const interval = usePreferencesStore((state) => state.chartInterval);
  const setChartInterval = usePreferencesStore((state) => state.setChartInterval);
  const hydrated = usePreferencesStore((state) => state.hydrated);
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!hydrated || !containerRef.current) return;
    const fontFamily = getComputedStyle(document.body).fontFamily;
    const palette = readPalette();
    const crosshairLine = { color: palette.crosshair, labelBackgroundColor: palette.crosshairLabel };
    const chart = createChart(containerRef.current, {
      ...chartOptions,
      layout: { ...chartOptions.layout, fontFamily },
      crosshair: { mode: CrosshairMode.Normal, vertLine: crosshairLine, horzLine: crosshairLine },
    });
    const candles = chart.addSeries(CandlestickSeries, {
      upColor: palette.up,
      downColor: palette.down,
      borderVisible: false,
      wickUpColor: palette.up,
      wickDownColor: palette.down,
    });
    const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "" });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    candles.priceScale().applyOptions({ scaleMargins: { top: 0.08, bottom: 0.22 } });

    const step = intervalSeconds[interval];
    let active = true;
    let loading = true;
    let lastTime = 0;
    let buffered = [];
    let retryTimer;

    const applyKline = (kline) => {
      if (kline.time < lastTime) return;
      candles.update(toCandle(kline));
      volume.update(toVolume(kline, palette));
      lastTime = kline.time;
    };

    const loadHistory = () => {
      loading = true;
      buffered = [];
      return queryClient
        .fetchQuery({ ...klinesQuery(symbol, interval), staleTime: 0 })
        .then((klines) => {
          if (!active) return;
          const last = klines.at(-1);
          if (last) {
            const precision = priceDecimals(last.close);
            candles.applyOptions({ priceFormat: { type: "price", precision, minMove: 1 / 10 ** precision } });
          }
          candles.setData(klines.map(toCandle));
          volume.setData(klines.map((kline) => toVolume(kline, palette)));
          lastTime = last?.time ?? 0;
          loading = false;
          buffered.forEach(applyKline);
          buffered = [];
          setStatus("ready");
        })
        .catch(() => {
          if (!active) return;
          setStatus("error");
          retryTimer = setTimeout(() => setAttempt((value) => value + 1), RETRY_DELAY);
        });
    };

    const unsubscribe = subscribeStream(`${symbol.toLowerCase()}@kline_${interval}`, (message) => {
      if (!active) return;
      const kline = fromStream(message);
      if (loading) {
        buffered.push(kline);
        return;
      }
      if (lastTime && kline.time - lastTime > step) {
        loadHistory();
        return;
      }
      applyKline(kline);
    });

    setStatus("loading");
    loadHistory().then(() => active && chart.timeScale().scrollToRealTime());

    return () => {
      active = false;
      clearTimeout(retryTimer);
      unsubscribe();
      chart.remove();
    };
  }, [symbol, interval, queryClient, attempt, hydrated]);

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
        <SegmentedTabs items={intervals} value={interval} onChange={setChartInterval} variant="pill" label="Chart interval" />
        <span className="hidden text-2xs text-neutral-500 sm:block">Binance · {symbol}</span>
      </div>
      <div className="relative min-h-0 flex-1">
        <div ref={containerRef} className="absolute inset-0" />
        {status === "loading" && <PageLoader label="Loading chart" className="absolute inset-0 min-h-0" />}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-500">Chart data unavailable. Retrying in a few seconds…</div>
        )}
      </div>
    </div>
  );
};
