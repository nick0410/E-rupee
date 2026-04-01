"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiPieChart, FiRefreshCw, FiZap } from "react-icons/fi";
import { useWallet } from "@/context/WalletContext";
import { useTheme } from "@/context/ThemeContext";
import {
  deriveFinancialSignals,
  rankStockSuggestions,
  runRandomForestInvestmentModel,
  type LiveStockQuote,
} from "@/lib/financeModels";

const MAX_ANALYTICS_TX_AMOUNT = 100000000;
const LIVE_STOCK_SYMBOLS = ["AAPL.US", "MSFT.US", "NVDA.US", "GOOG.US", "AMZN.US", "TSLA.US"];

type MarketApiResponse = {
  quotes: LiveStockQuote[];
  source: "stooq" | "unavailable";
  error: string | null;
  asOf: string;
};

export default function InvestmentsPage() {
  const { transactions, balance, refreshAll, loading } = useWallet();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const availableAmount = parseFloat(String(balance?.available ?? 0)) || 0;
  const lockedAmount = parseFloat(String(balance?.locked ?? 0)) || 0;
  const totalBalance = availableAmount + lockedAmount;

  const [marketQuotes, setMarketQuotes] = useState<LiveStockQuote[]>([]);
  const [marketSource, setMarketSource] = useState<"stooq" | "unavailable" | "">("");
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState("");
  const [sipPercentInput, setSipPercentInput] = useState("65");

  const normalizeType = (type?: string) => {
    const normalized = (type || "UNKNOWN").toUpperCase();
    if (normalized === "TRANSFER") return "TRANSFER_OUT";
    if (normalized === "RECEIVE") return "TRANSFER_IN";
    if (normalized === "SUBSIDY") return "DISBURSE";
    return normalized;
  };

  const normalizedTxs = useMemo(
    () => transactions
      .map((tx) => ({
        ...tx,
        amount: Number(tx.amount) || 0,
        type: normalizeType(tx.type),
      }))
      .filter((tx) => Number.isFinite(tx.amount) && Math.abs(tx.amount) <= MAX_ANALYTICS_TX_AMOUNT),
    [transactions],
  );

  const financialSignals = useMemo(
    () => deriveFinancialSignals(normalizedTxs),
    [normalizedTxs],
  );

  const investmentModel = useMemo(
    () => runRandomForestInvestmentModel(financialSignals, totalBalance, lockedAmount),
    [financialSignals, totalBalance, lockedAmount],
  );

  const parsedBudgetInput = Number(monthlyBudgetInput);
  const hasBudgetOverride = monthlyBudgetInput.trim() !== "" && Number.isFinite(parsedBudgetInput) && parsedBudgetInput >= 0;
  const effectiveMonthlyBudget = hasBudgetOverride
    ? Math.round(parsedBudgetInput)
    : investmentModel.monthlyInvestable;
  const sipPercent = Math.min(100, Math.max(0, Number(sipPercentInput) || 0));
  const effectiveSipAmount = Math.round(effectiveMonthlyBudget * (sipPercent / 100));

  const investmentOptions = useMemo(() => {
    const sip = effectiveSipAmount;
    return [
      {
        name: "Index Mutual Fund SIP",
        tag: "Core Equity",
        allocation: Math.round(investmentModel.allocation.equity * 0.45),
        amount: Math.round(sip * 0.45),
      },
      {
        name: "Flexi-Cap Mutual Fund",
        tag: "Growth",
        allocation: Math.round(investmentModel.allocation.equity * 0.25),
        amount: Math.round(sip * 0.25),
      },
      {
        name: "Hybrid Aggressive Fund",
        tag: "Balanced",
        allocation: investmentModel.allocation.hybrid,
        amount: Math.round(effectiveMonthlyBudget * (investmentModel.allocation.hybrid / 100)),
      },
      {
        name: "Short Duration Debt Fund",
        tag: "Stability",
        allocation: Math.round(investmentModel.allocation.debt * 0.6),
        amount: Math.round(effectiveMonthlyBudget * (investmentModel.allocation.debt / 100) * 0.6),
      },
      {
        name: "Liquid Emergency Fund",
        tag: "Safety",
        allocation: Math.round(investmentModel.allocation.debt * 0.4),
        amount: Math.round(effectiveMonthlyBudget * (investmentModel.allocation.debt / 100) * 0.4),
      },
      {
        name: "Smart Direct Stocks Basket",
        tag: "Satellite",
        allocation: Math.round(investmentModel.allocation.equity * 0.2),
        amount: Math.round(effectiveMonthlyBudget * 0.2),
      },
    ];
  }, [effectiveMonthlyBudget, effectiveSipAmount, investmentModel]);

  const fetchMarketQuotes = useCallback(async () => {
    setMarketLoading(true);
    try {
      const response = await fetch(`/api/market?symbols=${LIVE_STOCK_SYMBOLS.join(",")}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json() as MarketApiResponse;
      setMarketQuotes(data.quotes ?? []);
      setMarketSource(data.source ?? "");
      setMarketError(data.error ?? null);
    } catch {
      setMarketError("Live market feed temporarily unavailable.");
      setMarketQuotes([]);
      setMarketSource("");
    } finally {
      setMarketLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMarketQuotes();
    const timer = setInterval(() => {
      void fetchMarketQuotes();
    }, 60_000);

    return () => clearInterval(timer);
  }, [fetchMarketQuotes]);

  const rankedStocks = useMemo(
    () => rankStockSuggestions(marketQuotes, investmentModel),
    [marketQuotes, investmentModel],
  );

  const latestMarketTimestamp = rankedStocks.length > 0
    ? new Date(rankedStocks[0].asOf).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--:--:--";

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Investments</h1>
          <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Mutual funds, SIP planning, and model-ranked stock signals outside analytics.
          </p>
        </div>
        <button
          onClick={() => refreshAll()}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${isDark ? "bg-slate-800/60 border-slate-700/40 text-slate-300 hover:border-blue-500/40" : "bg-white border-slate-200 text-slate-600 hover:border-blue-400/40 shadow-sm"}`}
        >
          <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card-hover p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-semibold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                <FiPieChart className="text-violet-500" /> Mutual Funds, SIP and Investments
              </h3>
              <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Random-forest model recommends allocation based on your analytics behavior.
              </p>
            </div>
            <div className={`min-w-[150px] rounded-xl border px-3 py-2 ${isDark ? "border-slate-700/60 bg-slate-900/40" : "border-slate-200 bg-slate-50"}`}>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Model Profile</p>
              <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{investmentModel.profile}</p>
              <p className="text-[11px] text-violet-500">Score: {Math.round(investmentModel.score * 50)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <label className="space-y-1">
              <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Monthly Budget Input (Optional)</span>
              <input
                type="number"
                min={0}
                step={100}
                value={monthlyBudgetInput}
                onChange={(event) => setMonthlyBudgetInput(event.target.value)}
                placeholder={investmentModel.monthlyInvestable.toString()}
                className={`w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:border-blue-500/60 ${isDark ? "bg-slate-800/60 border-slate-700/40 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"}`}
              />
            </label>
            <label className="space-y-1">
              <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>SIP % Input</span>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={sipPercentInput}
                onChange={(event) => setSipPercentInput(event.target.value)}
                className={`w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:border-blue-500/60 ${isDark ? "bg-slate-800/60 border-slate-700/40 text-white" : "bg-white border-slate-200 text-slate-900"}`}
              />
            </label>
            <div className={`rounded-xl border px-3 py-2 ${isDark ? "border-slate-700/40 bg-slate-800/30" : "border-slate-200 bg-slate-50"}`}>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Applied Data Source</p>
              <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                {hasBudgetOverride ? "Your Input + Model Allocation" : "Analytics Model"}
              </p>
              <p className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Baseline: ₹{investmentModel.monthlyInvestable.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className={`rounded-xl p-3 border ${isDark ? "bg-slate-800/30 border-slate-700/30" : "bg-slate-50 border-slate-200"}`}>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Monthly Investable</p>
              <p className="text-lg font-bold text-violet-500">₹{effectiveMonthlyBudget.toLocaleString("en-IN")}</p>
            </div>
            <div className={`rounded-xl p-3 border ${isDark ? "bg-slate-800/30 border-slate-700/30" : "bg-slate-50 border-slate-200"}`}>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Applied SIP ({sipPercent.toFixed(0)}%)</p>
              <p className="text-lg font-bold text-emerald-500">₹{effectiveSipAmount.toLocaleString("en-IN")}</p>
            </div>
            <div className={`rounded-xl p-3 border ${isDark ? "bg-slate-800/30 border-slate-700/30" : "bg-slate-50 border-slate-200"}`}>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Data Window</p>
              <p className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{financialSignals.activeMonths} month(s)</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {[
              { label: "Debt", value: investmentModel.allocation.debt, color: "bg-blue-500" },
              { label: "Hybrid", value: investmentModel.allocation.hybrid, color: "bg-amber-500" },
              { label: "Equity", value: investmentModel.allocation.equity, color: "bg-emerald-500" },
            ].map((allocation) => (
              <div key={allocation.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{allocation.label}</span>
                  <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{allocation.value}%</span>
                </div>
                <div className={`w-full h-2 rounded-full ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
                  <div className={`h-full rounded-full ${allocation.color}`} style={{ width: `${allocation.value}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {investmentOptions.map((option) => (
              <div key={option.name} className={`rounded-xl p-3 border ${isDark ? "border-slate-700/40 bg-slate-900/30" : "border-slate-200 bg-slate-50"}`}>
                <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{option.name}</p>
                <p className={`text-[11px] mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{option.tag}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-blue-500 text-xs font-medium">{option.allocation}% alloc.</span>
                  <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>₹{Math.max(0, option.amount).toLocaleString("en-IN")}/mo</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-hover p-5">
          <h3 className={`font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>Random Forest Signals</h3>
          <div className="space-y-2 mb-4">
            {investmentModel.rationale.map((line, index) => (
              <div key={index} className={`p-2.5 rounded-lg border text-xs ${isDark ? "border-slate-700/40 bg-slate-900/30 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                {line}
              </div>
            ))}
          </div>
          <div className={`p-3 rounded-lg border ${isDark ? "border-violet-500/30 bg-violet-500/10" : "border-violet-200 bg-violet-50"}`}>
            <p className="text-violet-500 text-xs font-semibold">Model Confidence</p>
            <p className={`text-lg font-bold mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>{Math.round(investmentModel.score * 50)}%</p>
            <p className={`text-[11px] mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              This score uses a lightweight random-forest vote over savings rate, spend pressure, volatility, and consistency.
            </p>
          </div>
        </div>
      </div>

      <div className="card-hover p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`font-semibold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              <FiZap className="text-emerald-500" /> Real-Time Stocks (Model Ranked)
            </h3>
            <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Updated every 60s. Source: {marketSource || "loading"}. Last tick: {latestMarketTimestamp}
            </p>
          </div>
          <button
            onClick={() => fetchMarketQuotes()}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all ${isDark ? "bg-slate-800/60 border-slate-700/40 text-slate-300" : "bg-white border-slate-200 text-slate-600"}`}
          >
            <FiRefreshCw className={marketLoading ? "animate-spin" : ""} /> Refresh Stocks
          </button>
        </div>

        {marketError && (
          <p className="text-xs text-amber-500 mb-3">{marketError}</p>
        )}

        {marketLoading && rankedStocks.length === 0 ? (
          <p className={`text-sm py-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Loading live stocks...</p>
        ) : rankedStocks.length === 0 ? (
          <p className={`text-sm py-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>No stock feed available right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {rankedStocks.map((stock) => {
              const signalClass = stock.signal === "Strong Buy"
                ? "text-emerald-500"
                : stock.signal === "Accumulate"
                  ? "text-blue-500"
                  : "text-amber-500";

              return (
                <div key={stock.symbol} className={`rounded-xl p-3 border ${isDark ? "border-slate-700/40 bg-slate-900/30" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{stock.symbol.replace(".US", "")}</p>
                      <p className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{stock.name} • {stock.sector}</p>
                    </div>
                    <span className={`text-xs font-semibold ${signalClass}`}>{stock.signal}</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <p className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>${stock.price.toLocaleString("en-US")}</p>
                    <p className={`text-sm font-semibold ${stock.changePct >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {stock.changePct >= 0 ? "+" : ""}{stock.changePct.toFixed(2)}%
                    </p>
                  </div>
                  <p className={`text-[11px] mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Confidence: {stock.confidence.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
