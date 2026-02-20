/*
 * ═══════════════════════════════════════════════════════════════════
 *  eRupeeX — Enterprise CBDC Wallet Management System
 *  Type Definitions (Banking-Grade)
 *
 *  Architecture: Microservice-oriented (wallet-service, transaction-service,
 *  compliance-service, blockchain-service, analytics-service)
 *
 *  Database: PostgreSQL + Redis Cache + Blockchain Ledger
 *  Pipeline: Kafka event-driven transaction processing
 * ═══════════════════════════════════════════════════════════════════
 */

// ── Wallet Types ──

export type WalletType = 'personal' | 'merchant' | 'government';
export type WalletStatus = 'active' | 'frozen' | 'suspended' | 'pending_kyc';

export interface Wallet {
  id: string;
  type: WalletType;
  name: string;
  address: string;
  balance: number;
  availableBalance: number;
  lockedBalance: number;
  currency: string;
  status: WalletStatus;
  kycVerified: boolean;
  createdAt: string;
}

// ── Transaction Types ──

export type TxType = 'P2P' | 'P2M' | 'SUBSIDY' | 'REFUND' | 'MINT' | 'LOCK' | 'RELEASE' | 'BURN' | 'QR' | 'NFC' | 'OFFLINE';
export type TxStatus = 'completed' | 'pending' | 'failed' | 'flagged' | 'processing';

export interface Transaction {
  id: string;
  type: TxType;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
  currency: string;
  status: TxStatus;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  description: string;
  fee: number;
  category?: string;
}

// ── Fraud & Compliance ──

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'open' | 'investigating' | 'resolved' | 'false_positive';

export interface FraudAlert {
  id: string;
  severity: AlertSeverity;
  type: string;
  description: string;
  transactionId: string;
  riskScore: number;
  timestamp: string;
  status: AlertStatus;
  aiConfidence: number;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  details: string;
  ipAddress: string;
  result: 'success' | 'failure';
  service: string;
}

// ── Blockchain ──

export interface Block {
  number: number;
  hash: string;
  previousHash: string;
  timestamp: string;
  transactions: number;
  validator: string;
  gasUsed: number;
  size: number;
}

export interface ValidatorNode {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'syncing';
  stake: number;
  blocksValidated: number;
  uptime: number;
  location: string;
  region: string;
  lastSeen: string;
}

// ── Government / Subsidy ──

export interface SubsidyScheme {
  id: string;
  name: string;
  ministry: string;
  totalBudget: number;
  disbursed: number;
  beneficiaries: number;
  activeBeneficiaries: number;
  status: 'active' | 'completed' | 'paused';
  restrictions: TokenRestriction[];
  startDate: string;
  endDate: string;
}

export interface TokenRestriction {
  type: 'time-lock' | 'geo-fence' | 'usage-restrict' | 'expiry';
  label: string;
  params: Record<string, string | number | boolean>;
  description: string;
}

// ── Smart Contracts ──

export interface SmartContract {
  address: string;
  name: string;
  type: string;
  status: 'deployed' | 'paused' | 'deprecated';
  deployedAt: string;
  interactions: number;
  balance: number;
  version: string;
}

export interface ContractEvent {
  id: string;
  contractAddress: string;
  event: string;
  args: Record<string, string>;
  blockNumber: number;
  txHash: string;
  timestamp: string;
}

// ── Merchant ──

export interface MerchantInfo {
  id: string;
  name: string;
  category: string;
  mcc: string;
  revenue: number;
  transactions: number;
  avgTicketSize: number;
  rating: number;
  status: 'active' | 'suspended';
  settlementAccount: string;
}

export interface RefundRequest {
  id: string;
  transactionId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  createdAt: string;
  processedAt?: string;
}

// ── Analytics ──

export interface AnalyticsMetric {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}
