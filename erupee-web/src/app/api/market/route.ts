import { NextResponse } from "next/server";
import type { LiveStockQuote } from "@/lib/financeModels";

type StockMeta = {
  name: string;
  sector: string;
};

const STOCK_CATALOG: Record<string, StockMeta> = {
  "AAPL.US": { name: "Apple", sector: "Technology" },
  "MSFT.US": { name: "Microsoft", sector: "Technology" },
  "NVDA.US": { name: "NVIDIA", sector: "Semiconductors" },
  "GOOG.US": { name: "Alphabet", sector: "Technology" },
  "AMZN.US": { name: "Amazon", sector: "Consumer" },
  "TSLA.US": { name: "Tesla", sector: "Automotive" },
};

const DEFAULT_SYMBOLS = Object.keys(STOCK_CATALOG);

function parseCsvLine(line: string): string[] {
  return line
    .split(",")
    .map((part) => part.trim())
    .filter((part, index) => index < 8);
}

function safeParseNumber(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function createIsoFromStooq(datePart: string, timePart: string): string {
  if (!/^\d{8}$/.test(datePart) || !/^\d{6}$/.test(timePart)) return new Date().toISOString();

  const yyyy = datePart.slice(0, 4);
  const mm = datePart.slice(4, 6);
  const dd = datePart.slice(6, 8);
  const hh = timePart.slice(0, 2);
  const mi = timePart.slice(2, 4);
  const ss = timePart.slice(4, 6);
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}Z`;
}

async function fetchLiveQuote(symbol: string): Promise<LiveStockQuote | null> {
  try {
    const response = await fetch(`https://stooq.com/q/l/?s=${symbol.toLowerCase()}&i=d`, {
      cache: "no-store",
      headers: {
        "User-Agent": "eRupee-Analytics/1.0",
      },
    });

    if (!response.ok) return null;
    const raw = (await response.text()).trim();
    const fields = parseCsvLine(raw);

    if (fields.length < 7) return null;
    const [rawSymbol, datePart, timePart, openRaw, , , closeRaw] = fields;
    const open = safeParseNumber(openRaw);
    const close = safeParseNumber(closeRaw);

    if (!rawSymbol || open === null || close === null || open <= 0) return null;

    const normalizedSymbol = rawSymbol.toUpperCase();
    const meta = STOCK_CATALOG[normalizedSymbol] ?? { name: normalizedSymbol, sector: "Market" };

    return {
      symbol: normalizedSymbol,
      name: meta.name,
      sector: meta.sector,
      price: Number(close.toFixed(2)),
      changePct: Number((((close - open) / open) * 100).toFixed(2)),
      asOf: createIsoFromStooq(datePart, timePart),
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");

  const requestedSymbols = symbolsParam
    ? symbolsParam.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean)
    : DEFAULT_SYMBOLS;

  const symbols = requestedSymbols.length > 0 ? requestedSymbols.slice(0, 12) : DEFAULT_SYMBOLS;
  const quoteResults = await Promise.all(symbols.map((symbol) => fetchLiveQuote(symbol)));
  const quotes = quoteResults.filter((quote): quote is LiveStockQuote => quote !== null);

  return NextResponse.json(
    {
      quotes,
      source: quotes.length > 0 ? "stooq" : "unavailable",
      error: quotes.length > 0 ? null : "Live market feed unavailable for requested symbols.",
      asOf: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
