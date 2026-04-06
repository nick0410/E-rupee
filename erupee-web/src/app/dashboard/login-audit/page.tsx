"use client";

import { useCallback, useEffect, useState } from "react";
import { FiActivity, FiRefreshCw, FiSearch, FiUser } from "react-icons/fi";
import { api, type LoginAuditEvent, type LoginAuditResponse } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

const OUTCOME_OPTIONS = [
  "",
  "SUCCESS",
  "INVALID_PASSWORD",
  "USER_NOT_FOUND",
  "INVALID_REQUEST",
  "SERVER_ERROR",
  "UNKNOWN",
];

function outcomeBadgeClass(outcome: string): string {
  switch (outcome) {
    case "SUCCESS":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "INVALID_PASSWORD":
      return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    case "USER_NOT_FOUND":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case "INVALID_REQUEST":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "SERVER_ERROR":
      return "bg-violet-500/15 text-violet-400 border-violet-500/30";
    default:
      return "bg-slate-500/15 text-slate-400 border-slate-500/30";
  }
}

function prettyDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function LoginAuditPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [payload, setPayload] = useState<LoginAuditResponse | null>(null);
  const [events, setEvents] = useState<LoginAuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [draftIdentifier, setDraftIdentifier] = useState("");
  const [draftUserId, setDraftUserId] = useState("");
  const [draftOutcome, setDraftOutcome] = useState("");

  const [identifierFilter, setIdentifierFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState<number | undefined>(undefined);
  const [outcomeFilter, setOutcomeFilter] = useState("");

  const loadAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getLoginAudit({
        page,
        limit,
        identifier: identifierFilter || undefined,
        userId: userIdFilter,
        outcome: outcomeFilter || undefined,
      });
      setPayload(res);
      setEvents(res.events || []);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch login audit records");
    } finally {
      setLoading(false);
    }
  }, [page, limit, identifierFilter, userIdFilter, outcomeFilter]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  const applyFilters = () => {
    const parsedUserId = Number.parseInt(draftUserId.trim(), 10);
    setIdentifierFilter(draftIdentifier.trim());
    setUserIdFilter(Number.isInteger(parsedUserId) && parsedUserId > 0 ? parsedUserId : undefined);
    setOutcomeFilter(draftOutcome.trim());
    setPage(1);
  };

  const clearFilters = () => {
    setDraftIdentifier("");
    setDraftUserId("");
    setDraftOutcome("");
    setIdentifierFilter("");
    setUserIdFilter(undefined);
    setOutcomeFilter("");
    setPage(1);
  };

  const total = payload?.total || 0;
  const totalPages = payload?.totalPages || 1;
  const successCount = payload?.summary.successCount || 0;
  const failedCount = payload?.summary.failedCount || 0;
  const successRate = payload?.summary.successRate || 0;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Login Audit</h1>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Har login attempt ka record yahan store aur view hota hai.
          </p>
        </div>
        <button
          onClick={() => void loadAudit()}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${isDark ? "bg-slate-800/60 border-slate-700/40 text-slate-300 hover:border-blue-500/40" : "bg-white border-slate-200 text-slate-700 hover:border-blue-400/40"}`}
        >
          <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-hover p-4">
          <p className={`text-xs uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Total Attempts</p>
          <p className={`text-2xl font-bold mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>{total}</p>
        </div>
        <div className="card-hover p-4">
          <p className={`text-xs uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Success</p>
          <p className="text-2xl font-bold mt-1 text-emerald-500">{successCount}</p>
        </div>
        <div className="card-hover p-4">
          <p className={`text-xs uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Failed</p>
          <p className="text-2xl font-bold mt-1 text-red-500">{failedCount}</p>
        </div>
        <div className="card-hover p-4">
          <p className={`text-xs uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Success Rate</p>
          <p className="text-2xl font-bold mt-1 text-blue-500">{successRate.toFixed(2)}%</p>
        </div>
      </div>

      <div className="card-hover p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className={`text-xs mb-1 block ${isDark ? "text-slate-500" : "text-slate-500"}`}>Identifier Search</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                value={draftIdentifier}
                onChange={(e) => setDraftIdentifier(e.target.value)}
                placeholder="email/phone"
                className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm ${isDark ? "bg-slate-800/60 border-slate-700/40 text-white" : "bg-white border-slate-200 text-slate-900"}`}
              />
            </div>
          </div>
          <div>
            <label className={`text-xs mb-1 block ${isDark ? "text-slate-500" : "text-slate-500"}`}>User ID</label>
            <input
              value={draftUserId}
              onChange={(e) => setDraftUserId(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="all"
              className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? "bg-slate-800/60 border-slate-700/40 text-white" : "bg-white border-slate-200 text-slate-900"}`}
            />
          </div>
          <div>
            <label className={`text-xs mb-1 block ${isDark ? "text-slate-500" : "text-slate-500"}`}>Outcome</label>
            <select
              value={draftOutcome}
              onChange={(e) => setDraftOutcome(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? "bg-slate-800/60 border-slate-700/40 text-white" : "bg-white border-slate-200 text-slate-900"}`}
            >
              {OUTCOME_OPTIONS.map((option) => (
                <option key={option || "ALL"} value={option}>{option || "ALL"}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={applyFilters}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            className={`px-4 py-2 rounded-lg border text-sm ${isDark ? "border-slate-700/40 text-slate-300" : "border-slate-200 text-slate-700"}`}
          >
            Clear
          </button>
          <div className="ml-auto">
            <label className={`text-xs mr-2 ${isDark ? "text-slate-500" : "text-slate-500"}`}>Rows</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className={`px-2 py-1.5 rounded-lg border text-sm ${isDark ? "bg-slate-800/60 border-slate-700/40 text-white" : "bg-white border-slate-200 text-slate-900"}`}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="card-hover p-4 border-l-4 border-red-500 text-red-400 text-sm">{error}</div>
      )}

      <div className="space-y-3">
        {loading && events.length === 0 ? (
          <div className={`card-hover p-8 text-center text-sm ${isDark ? "text-slate-500" : "text-slate-500"}`}>Loading login events...</div>
        ) : events.length === 0 ? (
          <div className={`card-hover p-8 text-center text-sm ${isDark ? "text-slate-500" : "text-slate-500"}`}>No login records found for selected filters.</div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="card-hover p-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${outcomeBadgeClass(event.outcome)}`}>{event.outcome}</span>
                <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{prettyDateTime(event.createdAt)}</span>
                <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>#{event.id}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>Identifier</p>
                  <p className={isDark ? "text-white" : "text-slate-900"}>{event.identifier} ({event.identifierType})</p>
                </div>
                <div>
                  <p className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>User</p>
                  <p className={isDark ? "text-white" : "text-slate-900"}>{event.user ? `${event.user.name} (ID ${event.user.id})` : `Unknown (ID ${event.userId ?? "N/A"})`}</p>
                </div>
                <div>
                  <p className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>IP Address</p>
                  <p className={isDark ? "text-white" : "text-slate-900"}>{event.ipAddress || "N/A"}</p>
                </div>
                <div>
                  <p className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>Route</p>
                  <p className={isDark ? "text-white" : "text-slate-900"}>{event.requestMethod} {event.requestPath}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div className={`p-3 rounded-lg border ${isDark ? "bg-slate-800/40 border-slate-700/30" : "bg-slate-50 border-slate-200"}`}>
                  <p className={`text-[11px] mb-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}>User Agent</p>
                  <p className={`text-xs break-all ${isDark ? "text-slate-300" : "text-slate-700"}`}>{event.userAgent || "N/A"}</p>
                </div>
                <div className={`p-3 rounded-lg border ${isDark ? "bg-slate-800/40 border-slate-700/30" : "bg-slate-50 border-slate-200"}`}>
                  <p className={`text-[11px] mb-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}>Error / Extra</p>
                  <p className={`text-xs break-all ${event.errorMessage ? "text-red-400" : isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {event.errorMessage || "No error"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card-hover p-4 flex items-center justify-between">
        <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          Page {page} of {totalPages} ({total} records)
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={`px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 ${isDark ? "border-slate-700/40 text-slate-300" : "border-slate-200 text-slate-700"}`}
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className={`px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 ${isDark ? "border-slate-700/40 text-slate-300" : "border-slate-200 text-slate-700"}`}
          >
            Next
          </button>
        </div>
      </div>

      <div className={`card-hover p-4 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
        <p className="font-semibold mb-1 flex items-center gap-2"><FiActivity size={14} /> Captured login details</p>
        <p>Identifier, user mapping, outcome, IP, forwarded IP, user-agent, origin, referer, method, path aur metadata snapshot.</p>
        <p className="mt-1 flex items-center gap-2"><FiUser size={14} /> Ye page sab users ke login records dekhne ke liye hai.</p>
      </div>
    </div>
  );
}
