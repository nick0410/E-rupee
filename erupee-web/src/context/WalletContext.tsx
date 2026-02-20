"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api, UserData, BalanceResponse, LockEntry, DbTransaction, NetworkInfo } from "@/lib/api";

interface WalletState {
  user: UserData | null;
  balance: BalanceResponse | null;
  locks: LockEntry[];
  transactions: DbTransaction[];
  networkInfo: NetworkInfo | null;
  loading: boolean;
  error: string | null;
  lastRefresh: number;
}

interface WalletContextType extends WalletState {
  refreshBalance: () => Promise<void>;
  refreshLocks: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshNetwork: () => Promise<void>;
  refreshAll: () => Promise<void>;
  setUser: (user: UserData | null) => void;
  logout: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    user: null,
    balance: null,
    locks: [],
    transactions: [],
    networkInfo: null,
    loading: true,
    error: null,
    lastRefresh: 0,
  });

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored) as UserData;
        setState(s => ({ ...s, user, loading: false }));
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  const setUser = useCallback((user: UserData | null) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userId", user.id.toString());
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
    }
    setState(s => ({ ...s, user }));
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setState({
      user: null, balance: null, locks: [], transactions: [],
      networkInfo: null, loading: false, error: null, lastRefresh: 0,
    });
    window.location.href = "/";
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!state.user) return;
    try {
      const balance = await api.getBalance(state.user.id);
      setState(s => ({ ...s, balance, error: null }));
    } catch (e: any) {
      setState(s => ({ ...s, error: e.message }));
    }
  }, [state.user]);

  const refreshLocks = useCallback(async () => {
    if (!state.user) return;
    try {
      const res = await api.getLocks(state.user.id);
      setState(s => ({ ...s, locks: res.locks, error: null }));
    } catch (e: any) {
      setState(s => ({ ...s, error: e.message }));
    }
  }, [state.user]);

  const refreshTransactions = useCallback(async () => {
    if (!state.user) return;
    try {
      const res = await api.getTransactions(state.user.id);
      setState(s => ({ ...s, transactions: res.transactions, error: null }));
    } catch (e: any) {
      setState(s => ({ ...s, error: e.message }));
    }
  }, [state.user]);

  const refreshNetwork = useCallback(async () => {
    try {
      const networkInfo = await api.getNetworkInfo();
      setState(s => ({ ...s, networkInfo, error: null }));
    } catch (e: any) {
      setState(s => ({ ...s, error: e.message }));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setState(s => ({ ...s, loading: true }));
    await Promise.allSettled([
      refreshBalance(),
      refreshLocks(),
      refreshTransactions(),
      refreshNetwork(),
    ]);
    setState(s => ({ ...s, loading: false, lastRefresh: Date.now() }));
  }, [refreshBalance, refreshLocks, refreshTransactions, refreshNetwork]);

  // Auto-fetch when user changes
  useEffect(() => {
    if (state.user) {
      refreshAll();
    }
  }, [state.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (!state.user) return;
    const interval = setInterval(refreshAll, 15000);
    return () => clearInterval(interval);
  }, [state.user?.id, refreshAll]);

  return (
    <WalletContext.Provider value={{
      ...state, refreshBalance, refreshLocks, refreshTransactions,
      refreshNetwork, refreshAll, setUser, logout,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
