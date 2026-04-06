const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";


export interface UserData {
  id: number;
  name: string;
  email: string;
  phone: string;
  state: string;
  walletAddress: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  state: string;
  pan: string;
}

export interface AuthResponse {
  message: string;
  user?: UserData;
}

export interface BalanceResponse {
  address: string;
  balance: string;
  locked: string;
  available: string;
}

export interface TxResponse {
  tx: string;
  from?: string;
  to?: string;
  amount?: string;
  status?: string;
  timestamp?: string;
  error?: string;
}

export interface LockEntry {
  amount: string;
  unlockTime: number;
  documentCID: string;
}

export interface LocksResponse {
  locks: LockEntry[];
}

export interface DbTransaction {
  id: number;
  amount: number;
  status: string;
  createdAt: string;
  fromAddress: string;
  toAddress: string;
  type: string;
  txHash: string;
  note: string;
  userId: number;
}

export interface TransactionsResponse {
  transactions: DbTransaction[];
}

export interface NetworkInfo {
  blockNumber: number;
  chainId: number;
  networkName: string;
  timestamp: number;
  gasPrice: string;
  contractAddress: string;
}

export interface UsersListResponse {
  users: UserData[];
}

export interface LoginAuditUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  state: string;
  walletAddress: string | null;
}

export interface LoginAuditEvent {
  id: number;
  createdAt: string;
  userId: number | null;
  identifier: string;
  identifierType: string;
  outcome: string;
  errorMessage: string | null;
  ipAddress: string | null;
  forwardedFor: string | null;
  userAgent: string | null;
  referer: string | null;
  origin: string | null;
  requestMethod: string;
  requestPath: string;
  metadata: Record<string, unknown> | null;
  user: LoginAuditUser | null;
}

export interface LoginAuditResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  summary: {
    successCount: number;
    failedCount: number;
    successRate: number;
    byOutcome: Record<string, number>;
  };
  events: LoginAuditEvent[];
}

// ── API Functions ──

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  // Auth
  login: (identifier: string, password: string) =>
    apiFetch<AuthResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }),

  register: (data: RegisterRequest) =>
    apiFetch<AuthResponse>("/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Blockchain
  getBalance: (userId: number) =>
    apiFetch<BalanceResponse>(`/blockchain/balance/${userId}`),

  mint: (userId: number, amount: string, source?: "DISBURSE" | "MERCHANT_POS") =>
    apiFetch<TxResponse>("/blockchain/mint", {
      method: "POST",
      body: JSON.stringify({ userId, amount, source }),
    }),

  lock: (userId: number, amount: string, unlockTime: number, documentCID?: string) =>
    apiFetch<TxResponse>("/blockchain/lock", {
      method: "POST",
      body: JSON.stringify({ userId, amount, unlockTime, documentCID }),
    }),

  release: (userId: number) =>
    apiFetch<TxResponse>("/blockchain/release", {
      method: "POST",
      body: JSON.stringify({ userId, amount: "0" }),
    }),

  getLocks: (userId: number) =>
    apiFetch<LocksResponse>(`/blockchain/locks/${userId}`),

  // Transfer (P2P)
  transfer: (fromUserId: number, toAddress: string, amount: string, note?: string) =>
    apiFetch<TxResponse>("/blockchain/transfer", {
      method: "POST",
      body: JSON.stringify({ fromUserId, toAddress, amount, note }),
    }),

  // Transaction History
  getTransactions: (userId: number) =>
    apiFetch<TransactionsResponse>(`/blockchain/transactions/${userId}`),

  // Network Info
  getNetworkInfo: () =>
    apiFetch<NetworkInfo>("/blockchain/info"),

  // Users
  getUsers: () =>
    apiFetch<UsersListResponse>("/users"),

  // Login audit
  getLoginAudit: (params?: {
    page?: number;
    limit?: number;
    userId?: number;
    identifier?: string;
    outcome?: string;
  }) => {
    const search = new URLSearchParams();
    if (params?.page) search.set("page", String(params.page));
    if (params?.limit) search.set("limit", String(params.limit));
    if (params?.userId) search.set("userId", String(params.userId));
    if (params?.identifier) search.set("identifier", params.identifier);
    if (params?.outcome) search.set("outcome", params.outcome);

    const query = search.toString();
    return apiFetch<LoginAuditResponse>(`/audit/login-events${query ? `?${query}` : ""}`);
  },

  // Update Profile
  updateProfile: (userId: number, data: { name?: string; email?: string; phone?: string; state?: string; pan?: string }) =>
    apiFetch<{ message: string; user: UserData & { pan?: string } }>(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Health
  health: () =>
    apiFetch<{ status: string }>("/health"),
};
