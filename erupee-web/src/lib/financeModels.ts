export interface AnalyticTransaction {
  amount: number;
  type: string;
  createdAt: string;
}

export interface FinancialSignals {
  monthlyInflow: number;
  monthlySpend: number;
  monthlySavings: number;
  monthlySurplus: number;
  savingsRate: number;
  spendingRate: number;
  volatility: number;
  txPerMonth: number;
  activeMonths: number;
}

export interface ExpenseTrackerPlan {
  goalAmount: number;
  goalMonths: number;
  requiredMonthlySaving: number;
  projectedSavings: number;
  achievementProbability: number;
  monthlyGap: number;
  recommendedCuts: number;
  recommendedExtraIncome: number;
  actions: string[];
}

export interface InvestmentModelResult {
  profile: "Conservative" | "Balanced" | "Growth";
  score: number;
  monthlyInvestable: number;
  recommendedSip: number;
  allocation: {
    debt: number;
    hybrid: number;
    equity: number;
  };
  rationale: string[];
}

export interface LiveStockQuote {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  changePct: number;
  asOf: string;
}

export interface RankedStockSuggestion extends LiveStockQuote {
  confidence: number;
  signal: "Strong Buy" | "Accumulate" | "Watch";
}

const INFLOW_TYPES = new Set([
  "MINT",
  "DISBURSE",
  "TRANSFER_IN",
  "RECEIVE",
  "RELEASE",
  "INTEREST_CREDIT",
]);

const SPEND_TYPES = new Set([
  "TRANSFER_OUT",
  "TRANSFER",
  "MERCHANT_POS",
]);

const SAVINGS_TYPES = new Set(["LOCK"]);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function deriveFinancialSignals(transactions: AnalyticTransaction[]): FinancialSignals {
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  const recent = transactions.filter((tx) => {
    const timestamp = new Date(tx.createdAt).getTime();
    return Number.isFinite(timestamp) && now - timestamp <= ninetyDaysMs;
  });

  const scopedTx = recent.length > 0 ? recent : transactions;
  const monthKeys = new Set<string>();

  let inflow = 0;
  let spend = 0;
  let savings = 0;

  scopedTx.forEach((tx) => {
    const absAmount = Math.abs(Number(tx.amount) || 0);
    if (absAmount <= 0) return;

    const txType = (tx.type || "UNKNOWN").toUpperCase();
    const txDate = new Date(tx.createdAt);
    if (!Number.isNaN(txDate.getTime())) {
      monthKeys.add(`${txDate.getUTCFullYear()}-${txDate.getUTCMonth() + 1}`);
    }

    if (INFLOW_TYPES.has(txType)) inflow += absAmount;
    if (SPEND_TYPES.has(txType)) spend += absAmount;
    if (SAVINGS_TYPES.has(txType)) savings += absAmount;
  });

  const activeMonths = Math.max(1, monthKeys.size);
  const monthlyInflow = inflow / activeMonths;
  const monthlySpend = spend / activeMonths;
  const monthlySavings = savings / activeMonths;
  const monthlySurplus = Math.max(0, monthlyInflow - monthlySpend);

  const amountVector = scopedTx.map((tx) => Math.abs(Number(tx.amount) || 0)).filter((value) => value > 0);
  const averageAmount = amountVector.length > 0
    ? amountVector.reduce((sum, value) => sum + value, 0) / amountVector.length
    : 0;
  const volatility = averageAmount > 0 ? stdDev(amountVector) / averageAmount : 0;

  return {
    monthlyInflow,
    monthlySpend,
    monthlySavings,
    monthlySurplus,
    savingsRate: monthlyInflow > 0 ? monthlySurplus / monthlyInflow : 0,
    spendingRate: monthlyInflow > 0 ? monthlySpend / monthlyInflow : 0,
    volatility,
    txPerMonth: scopedTx.length / activeMonths,
    activeMonths,
  };
}

export function buildExpenseTrackerPlan(
  signals: FinancialSignals,
  goalAmountInput: number,
  goalMonthsInput: number,
  currentSavings: number,
): ExpenseTrackerPlan {
  const goalAmount = Math.max(0, goalAmountInput);
  const goalMonths = clamp(Math.round(goalMonthsInput || 1), 1, 120);
  const requiredMonthlySaving = goalMonths > 0 ? goalAmount / goalMonths : 0;

  const projectedSavings = Math.max(0, currentSavings) + (signals.monthlySurplus * goalMonths);
  const monthlyGap = Math.max(0, requiredMonthlySaving - signals.monthlySurplus);

  const stabilityScore = 1 - clamp(signals.volatility / 1.5, 0, 1);
  const sufficiencyScore = requiredMonthlySaving > 0
    ? clamp(signals.monthlySurplus / requiredMonthlySaving, 0, 1.5)
    : 1;

  const achievementProbability = Math.round(clamp((sufficiencyScore * 70) + (stabilityScore * 30), 5, 99));

  const recommendedCuts = Math.min(monthlyGap, signals.monthlySpend * 0.2);
  const recommendedExtraIncome = Math.max(0, monthlyGap - recommendedCuts);

  const actions: string[] = [];
  if (monthlyGap <= 0) {
    actions.push("Current monthly surplus is enough to hit this goal on time.");
    actions.push("Enable auto-transfer to a lock or SIP bucket right after salary credit.");
    actions.push("Keep emergency cash equal to at least one month of spend.");
  } else {
    actions.push(`Trim discretionary transfers/POS spends by about Rs ${Math.round(recommendedCuts).toLocaleString("en-IN")} per month.`);
    actions.push(`Add at least Rs ${Math.round(recommendedExtraIncome).toLocaleString("en-IN")} per month through side income or bonus allocation.`);
    actions.push("Split target into weekly mini-goals and review every 7 days.");
  }

  return {
    goalAmount,
    goalMonths,
    requiredMonthlySaving,
    projectedSavings,
    achievementProbability,
    monthlyGap,
    recommendedCuts,
    recommendedExtraIncome,
    actions,
  };
}

type ForestFeatures = {
  savingsRate: number;
  spendingRate: number;
  lockDiscipline: number;
  volatility: number;
  txPerMonth: number;
  monthlySurplus: number;
  monthlyInflow: number;
  monthlySpend: number;
};

export function runRandomForestInvestmentModel(
  signals: FinancialSignals,
  totalBalance: number,
  lockedAmount: number,
): InvestmentModelResult {
  const lockDiscipline = totalBalance > 0 ? lockedAmount / totalBalance : 0;

  const features: ForestFeatures = {
    savingsRate: signals.savingsRate,
    spendingRate: signals.spendingRate,
    lockDiscipline,
    volatility: signals.volatility,
    txPerMonth: signals.txPerMonth,
    monthlySurplus: signals.monthlySurplus,
    monthlyInflow: signals.monthlyInflow,
    monthlySpend: signals.monthlySpend,
  };

  const trees: Array<(input: ForestFeatures) => number> = [
    (input) => (input.savingsRate > 0.32 && input.volatility < 0.9 ? 2 : input.savingsRate > 0.18 ? 1 : 0),
    (input) => (input.spendingRate < 0.58 ? 2 : input.spendingRate < 0.78 ? 1 : 0),
    (input) => (input.lockDiscipline > 0.24 ? 2 : input.lockDiscipline > 0.1 ? 1 : 0),
    (input) => (input.txPerMonth >= 10 ? 2 : input.txPerMonth >= 5 ? 1 : 0),
    (input) => (input.monthlySurplus >= 15000 ? 2 : input.monthlySurplus >= 6000 ? 1 : 0),
    (input) => (input.monthlyInflow > (input.monthlySpend * 1.35) ? 2 : input.monthlyInflow > (input.monthlySpend * 1.1) ? 1 : 0),
    (input) => (input.volatility > 1.4 ? 0 : input.volatility > 0.9 ? 1 : 2),
  ];

  const votes = trees.map((tree) => tree(features));
  const score = votes.reduce((sum, vote) => sum + vote, 0) / votes.length;

  let profile: InvestmentModelResult["profile"] = "Conservative";
  if (score >= 1.45) profile = "Growth";
  else if (score >= 0.9) profile = "Balanced";

  const allocationByProfile: Record<InvestmentModelResult["profile"], InvestmentModelResult["allocation"]> = {
    Conservative: { debt: 55, hybrid: 30, equity: 15 },
    Balanced: { debt: 30, hybrid: 30, equity: 40 },
    Growth: { debt: 15, hybrid: 20, equity: 65 },
  };

  const monthlyInvestable = Math.max(0, Math.round(Math.max(0, signals.monthlySurplus) * 0.55));
  const recommendedSip = Math.max(0, Math.round(monthlyInvestable * 0.65));

  const rationale = [
    `Savings rate signal: ${(signals.savingsRate * 100).toFixed(1)}%`,
    `Spend pressure signal: ${(signals.spendingRate * 100).toFixed(1)}%`,
    `Transaction volatility signal: ${(signals.volatility * 100).toFixed(1)}%`,
  ];

  return {
    profile,
    score,
    monthlyInvestable,
    recommendedSip,
    allocation: allocationByProfile[profile],
    rationale,
  };
}

export function rankStockSuggestions(
  quotes: LiveStockQuote[],
  investmentModel: InvestmentModelResult,
): RankedStockSuggestion[] {
  const userRiskScore = investmentModel.profile === "Growth"
    ? 2
    : investmentModel.profile === "Balanced"
      ? 1
      : 0;

  return quotes
    .map((quote) => {
      const affordability = investmentModel.monthlyInvestable / Math.max(quote.price, 1);
      const trees: Array<() => number> = [
        () => (quote.changePct > 0 ? 2 : quote.changePct > -1.2 ? 1 : 0),
        () => (Math.abs(quote.changePct) < 2.8 ? 2 : 1),
        () => (affordability >= 8 ? 2 : affordability >= 3 ? 1 : 0),
        () => (userRiskScore >= 1 ? 2 : quote.changePct >= -0.5 ? 1 : 0),
        () => (investmentModel.score >= 1.2 ? 2 : investmentModel.score >= 0.8 ? 1 : 0),
      ];

      const confidence = trees.reduce((sum, tree) => sum + tree(), 0) / trees.length;
      const signal: RankedStockSuggestion["signal"] = confidence >= 1.6
        ? "Strong Buy"
        : confidence >= 1.0
          ? "Accumulate"
          : "Watch";

      return {
        ...quote,
        confidence: Number((confidence * 50).toFixed(1)),
        signal,
      };
    })
    .sort((a, b) => b.confidence - a.confidence);
}
