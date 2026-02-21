/*
 * ═══════════════════════════════════════════════════════════════════
 *  eRupeeX — Mock Data Layer
 *  Simulates production data from PostgreSQL + Redis + Blockchain
 *  In production: fetched via API Gateway → Kafka → Service Mesh
 * ═══════════════════════════════════════════════════════════════════
 */

import {
  Wallet, Transaction, FraudAlert, AuditLog, Block, ValidatorNode,
  SubsidyScheme, SmartContract, ContractEvent, MerchantInfo, RefundRequest,
  AnalyticsMetric, ChartDataPoint, TimeSeriesPoint,
} from './types';

// ── Wallets ──

export const wallets: Wallet[] = [
  {
    id: 'W001', type: 'personal', name: 'Personal Wallet', address: '0x5Fb...aa3',
    balance: 125000, availableBalance: 98500, lockedBalance: 26500, currency: 'eINR',
    status: 'active', kycVerified: true, createdAt: '2025-08-15T10:30:00Z',
  },
  {
    id: 'W002', type: 'merchant', name: 'Merchant Wallet', address: '0x8Ac...b72',
    balance: 2450000, availableBalance: 2315000, lockedBalance: 135000, currency: 'eINR',
    status: 'active', kycVerified: true, createdAt: '2025-06-20T08:00:00Z',
  },
  {
    id: 'W003', type: 'government', name: 'Gov. Subsidy Pool', address: '0x3De...f91',
    balance: 50000000, availableBalance: 42000000, lockedBalance: 8000000, currency: 'eINR',
    status: 'active', kycVerified: true, createdAt: '2025-01-01T00:00:00Z',
  },
];

// ── Transactions ──

export const transactions: Transaction[] = [
  { id: 'TX001', type: 'P2P', from: '0x5Fb...aa3', fromName: 'Aarav Sharma', to: '0x9Cd...e45', toName: 'Priya Patel', amount: 5000, currency: 'eINR', status: 'completed', txHash: '0xabc123def456789abcdef0123456789abcdef0123456789abcdef012345678', blockNumber: 1847, timestamp: '2026-02-18T09:15:00Z', description: 'Rent payment — Feb 2026', fee: 0 },
  { id: 'TX002', type: 'P2M', from: '0x5Fb...aa3', fromName: 'Aarav Sharma', to: '0x8Ac...b72', toName: 'Reliance Smart Store', amount: 2350, currency: 'eINR', status: 'completed', txHash: '0xdef789abc0123456789abcdef0123456789abcdef0123456789abcdef01234', blockNumber: 1846, timestamp: '2026-02-18T08:42:00Z', description: 'Grocery purchase', fee: 0, category: 'Groceries' },
  { id: 'TX003', type: 'SUBSIDY', from: '0x3De...f91', fromName: 'PM Kisan Yojana', to: '0x5Fb...aa3', toName: 'Aarav Sharma', amount: 6000, currency: 'eINR', status: 'completed', txHash: '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde', blockNumber: 1840, timestamp: '2026-02-17T14:00:00Z', description: 'PM-KISAN 16th installment', fee: 0, category: 'Agriculture' },
  { id: 'TX004', type: 'P2P', from: '0x7Bb...c34', fromName: 'Rohan Gupta', to: '0x5Fb...aa3', toName: 'Aarav Sharma', amount: 15000, currency: 'eINR', status: 'completed', txHash: '0x456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01', blockNumber: 1835, timestamp: '2026-02-17T11:20:00Z', description: 'Project payment', fee: 0 },
  { id: 'TX005', type: 'MINT', from: 'RBI_RESERVE', fromName: 'RBI Central Mint', to: '0x5Fb...aa3', toName: 'Aarav Sharma', amount: 50000, currency: 'eINR', status: 'completed', txHash: '0x789abcdef0123456789abcdef0123456789abcdef0123456789abcdef012345', blockNumber: 1830, timestamp: '2026-02-16T16:00:00Z', description: 'RBI authorized minting', fee: 0 },
  { id: 'TX006', type: 'LOCK', from: '0x5Fb...aa3', fromName: 'Aarav Sharma', to: 'ESCROW', toName: 'Time-Lock Vault', amount: 26500, currency: 'eINR', status: 'completed', txHash: '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567', blockNumber: 1828, timestamp: '2026-02-16T12:00:00Z', description: 'FD lock — 90 days', fee: 0 },
  { id: 'TX007', type: 'P2M', from: '0x5Fb...aa3', fromName: 'Aarav Sharma', to: '0x4Ef...a88', toName: 'BigBazaar', amount: 1875, currency: 'eINR', status: 'completed', txHash: '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba98765432', blockNumber: 1825, timestamp: '2026-02-16T09:30:00Z', description: 'Shopping', fee: 0, category: 'Shopping' },
  { id: 'TX008', type: 'QR', from: '0x5Fb...aa3', fromName: 'Aarav Sharma', to: '0x2Cc...d56', toName: 'Chai Point', amount: 120, currency: 'eINR', status: 'completed', txHash: '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeff', blockNumber: 1822, timestamp: '2026-02-15T18:45:00Z', description: 'QR scan payment', fee: 0, category: 'Food & Beverage' },
  { id: 'TX009', type: 'P2P', from: '0x5Fb...aa3', fromName: 'Aarav Sharma', to: '0x6Ff...g78', toName: 'Sneha Reddy', amount: 3200, currency: 'eINR', status: 'flagged', txHash: '0x9999888877776666555544443333222211110000ffffeeeeddddccccbbbbaa', blockNumber: 1820, timestamp: '2026-02-15T15:10:00Z', description: 'Suspicious pattern detected', fee: 0 },
  { id: 'TX010', type: 'REFUND', from: '0x8Ac...b72', fromName: 'Reliance Smart Store', to: '0x5Fb...aa3', toName: 'Aarav Sharma', amount: 450, currency: 'eINR', status: 'completed', txHash: '0xaaaa0000bbbb1111cccc2222dddd3333eeee4444ffff5555000066667777', blockNumber: 1818, timestamp: '2026-02-15T10:00:00Z', description: 'Product return refund', fee: 0 },
  { id: 'TX011', type: 'SUBSIDY', from: '0x3De...f91', fromName: 'LPG Subsidy DBT', to: '0x7Bb...c34', toName: 'Rohan Gupta', amount: 1850, currency: 'eINR', status: 'completed', txHash: '0xbbbb0000cccc1111dddd2222eeee3333ffff44440000555566667777aaaa', blockNumber: 1815, timestamp: '2026-02-14T09:00:00Z', description: 'LPG subsidy transfer', fee: 0, category: 'Energy' },
  { id: 'TX012', type: 'NFC', from: '0x5Fb...aa3', fromName: 'Aarav Sharma', to: '0x4Ef...a88', toName: 'Metro Card Top-up', amount: 500, currency: 'eINR', status: 'completed', txHash: '0xcccc0000dddd1111eeee2222ffff333300004444555566667777aaaa8888', blockNumber: 1812, timestamp: '2026-02-14T07:30:00Z', description: 'NFC tap payment', fee: 0, category: 'Transport' },
  { id: 'TX013', type: 'P2P', from: '0x5Fb...aa3', fromName: 'Aarav Sharma', to: '0x1Aa...b22', toName: 'Vikram Singh', amount: 75000, currency: 'eINR', status: 'failed', txHash: '0xdddd0000eeee1111ffff22220000333344445555666677778888aaaa9999', blockNumber: 0, timestamp: '2026-02-13T20:00:00Z', description: 'Insufficient balance', fee: 0 },
  { id: 'TX014', type: 'OFFLINE', from: '0x5Fb...aa3', fromName: 'Aarav Sharma', to: '0x2Cc...d56', toName: 'Kirana Store', amount: 340, currency: 'eINR', status: 'pending', txHash: '', blockNumber: 0, timestamp: '2026-02-13T16:00:00Z', description: 'Offline sync pending', fee: 0, category: 'Groceries' },
];

// ── Fraud Alerts ──

export const fraudAlerts: FraudAlert[] = [
  { id: 'FA001', severity: 'critical', type: 'Velocity Anomaly', description: 'Unusual burst of 12 transactions in 3 minutes from wallet 0x5Fb...aa3', transactionId: 'TX009', riskScore: 92, timestamp: '2026-02-18T09:00:00Z', status: 'open', aiConfidence: 0.96 },
  { id: 'FA002', severity: 'high', type: 'Large Value Transfer', description: 'Transfer of ₹75,000 exceeds daily P2P limit threshold', transactionId: 'TX013', riskScore: 78, timestamp: '2026-02-13T20:00:00Z', status: 'investigating', aiConfidence: 0.88 },
  { id: 'FA003', severity: 'medium', type: 'Geo-Anomaly', description: 'Login from Mumbai, transaction initiated from Chennai within 10 minutes', transactionId: 'TX007', riskScore: 65, timestamp: '2026-02-16T09:30:00Z', status: 'resolved', aiConfidence: 0.72 },
  { id: 'FA004', severity: 'low', type: 'New Device', description: 'First transaction from unrecognized device fingerprint', transactionId: 'TX008', riskScore: 35, timestamp: '2026-02-15T18:45:00Z', status: 'false_positive', aiConfidence: 0.55 },
  { id: 'FA005', severity: 'high', type: 'Structuring', description: 'Multiple sub-₹10k transactions to avoid reporting threshold', transactionId: 'TX004', riskScore: 82, timestamp: '2026-02-17T11:20:00Z', status: 'open', aiConfidence: 0.91 },
];

// ── Audit Logs ──

export const auditLogs: AuditLog[] = [
  { id: 'AL001', action: 'WALLET_CREATE', actor: 'system@erupee.rbi.in', timestamp: '2026-02-18T09:00:00Z', details: 'New personal wallet created for user ID 101', ipAddress: '10.0.1.15', result: 'success', service: 'wallet-service' },
  { id: 'AL002', action: 'TOKEN_MINT', actor: 'admin@rbi.gov.in', timestamp: '2026-02-16T16:00:00Z', details: 'Minted 50,000 eINR to wallet 0x5Fb...aa3', ipAddress: '172.16.0.1', result: 'success', service: 'blockchain-service' },
  { id: 'AL003', action: 'FRAUD_FLAG', actor: 'ai-engine@compliance', timestamp: '2026-02-18T09:00:00Z', details: 'Transaction TX009 flagged by ML model (confidence: 0.96)', ipAddress: '10.0.2.50', result: 'success', service: 'compliance-service' },
  { id: 'AL004', action: 'KYC_VERIFY', actor: 'kyc-bot@erupee.rbi.in', timestamp: '2026-02-15T14:00:00Z', details: 'eKYC verified via Aadhaar OTP for user ID 101', ipAddress: '10.0.3.20', result: 'success', service: 'wallet-service' },
  { id: 'AL005', action: 'LOGIN_FAILED', actor: 'unknown', timestamp: '2026-02-17T03:15:00Z', details: 'Failed login attempt — brute force detected (5 attempts)', ipAddress: '203.0.113.42', result: 'failure', service: 'auth-service' },
  { id: 'AL006', action: 'SUBSIDY_DISBURSE', actor: 'admin@pmkisan.gov.in', timestamp: '2026-02-17T14:00:00Z', details: 'Disbursed PM-KISAN installment to 150 beneficiaries', ipAddress: '172.16.1.10', result: 'success', service: 'transaction-service' },
  { id: 'AL007', action: 'CONTRACT_DEPLOY', actor: 'deployer@blockchain', timestamp: '2026-02-01T10:00:00Z', details: 'Deployed eRupeeToken v2.1 at 0x5Fb...aa3', ipAddress: '10.0.4.5', result: 'success', service: 'blockchain-service' },
  { id: 'AL008', action: 'REFUND_APPROVE', actor: 'ops@merchant.rbi.in', timestamp: '2026-02-15T10:00:00Z', details: 'Refund of ₹450 approved for TX002', ipAddress: '10.0.1.30', result: 'success', service: 'transaction-service' },
];

// ── Blockchain Blocks ──

export const blocks: Block[] = [
  { number: 1847, hash: '0xabc12...f456', previousHash: '0x9de78...1234', timestamp: '2026-02-18T09:15:00Z', transactions: 4, validator: 'RBI-Node-Mumbai', gasUsed: 284000, size: 2340 },
  { number: 1846, hash: '0x9de78...1234', previousHash: '0x7bc56...9012', timestamp: '2026-02-18T08:42:00Z', transactions: 7, validator: 'SBI-Node-Delhi', gasUsed: 512000, size: 4120 },
  { number: 1845, hash: '0x7bc56...9012', previousHash: '0x5ab34...7890', timestamp: '2026-02-18T08:10:00Z', transactions: 3, validator: 'BOB-Node-Bangalore', gasUsed: 198000, size: 1890 },
  { number: 1844, hash: '0x5ab34...7890', previousHash: '0x3cd12...5678', timestamp: '2026-02-18T07:38:00Z', transactions: 5, validator: 'PNB-Node-Chennai', gasUsed: 356000, size: 3200 },
  { number: 1843, hash: '0x3cd12...5678', previousHash: '0x1ef90...3456', timestamp: '2026-02-18T07:05:00Z', transactions: 2, validator: 'RBI-Node-Mumbai', gasUsed: 142000, size: 1240 },
  { number: 1842, hash: '0x1ef90...3456', previousHash: '0xfab78...1234', timestamp: '2026-02-18T06:32:00Z', transactions: 6, validator: 'HDFC-Node-Hyderabad', gasUsed: 445000, size: 3780 },
];

// ── Validator Nodes ──

export const validatorNodes: ValidatorNode[] = [
  { id: 'V001', name: 'RBI-Node-Mumbai', status: 'active', stake: 10000000, blocksValidated: 4820, uptime: 99.97, location: 'Mumbai', region: 'West', lastSeen: '2026-02-18T09:15:00Z' },
  { id: 'V002', name: 'SBI-Node-Delhi', status: 'active', stake: 8000000, blocksValidated: 4215, uptime: 99.92, location: 'New Delhi', region: 'North', lastSeen: '2026-02-18T09:14:00Z' },
  { id: 'V003', name: 'BOB-Node-Bangalore', status: 'active', stake: 5000000, blocksValidated: 3180, uptime: 99.88, location: 'Bangalore', region: 'South', lastSeen: '2026-02-18T09:13:00Z' },
  { id: 'V004', name: 'PNB-Node-Chennai', status: 'syncing', stake: 4000000, blocksValidated: 2750, uptime: 98.45, location: 'Chennai', region: 'South', lastSeen: '2026-02-18T09:10:00Z' },
  { id: 'V005', name: 'HDFC-Node-Hyderabad', status: 'active', stake: 6000000, blocksValidated: 3650, uptime: 99.95, location: 'Hyderabad', region: 'South', lastSeen: '2026-02-18T09:14:30Z' },
  { id: 'V006', name: 'ICICI-Node-Kolkata', status: 'inactive', stake: 3000000, blocksValidated: 1890, uptime: 94.20, location: 'Kolkata', region: 'East', lastSeen: '2026-02-18T06:00:00Z' },
];

// ── Subsidy Schemes ──

export const subsidySchemes: SubsidyScheme[] = [
  {
    id: 'SS001', name: 'PM-KISAN Samman Nidhi', ministry: 'Ministry of Agriculture', totalBudget: 750000000, disbursed: 520000000, beneficiaries: 110000000, activeBeneficiaries: 95000000, status: 'active',
    restrictions: [
      { type: 'usage-restrict', label: 'Agri Only', params: { categories: 'seeds,fertilizer,equipment' }, description: 'Can only be used for agricultural purchases' },
      { type: 'expiry', label: '90-Day Expiry', params: { days: 90 }, description: 'Tokens expire after 90 days if unused' },
    ],
    startDate: '2025-04-01', endDate: '2026-03-31',
  },
  {
    id: 'SS002', name: 'LPG Subsidy DBT', ministry: 'Ministry of Petroleum', totalBudget: 120000000, disbursed: 89000000, beneficiaries: 28000000, activeBeneficiaries: 25000000, status: 'active',
    restrictions: [
      { type: 'usage-restrict', label: 'LPG Only', params: { categories: 'lpg_refill' }, description: 'Restricted to LPG cylinder purchases only' },
      { type: 'geo-fence', label: 'State Locked', params: { states: 'registered_state' }, description: 'Usable only in beneficiary registered state' },
    ],
    startDate: '2025-06-01', endDate: '2026-05-31',
  },
  {
    id: 'SS003', name: 'PM Awas Yojana Digital', ministry: 'Ministry of Housing', totalBudget: 2000000000, disbursed: 1200000000, beneficiaries: 5000000, activeBeneficiaries: 3200000, status: 'active',
    restrictions: [
      { type: 'time-lock', label: 'Phase Release', params: { phases: 4, intervalDays: 90 }, description: 'Funds released in 4 phases over construction milestones' },
      { type: 'usage-restrict', label: 'Construction', params: { categories: 'cement,steel,labour,construction' }, description: 'Only for construction-related expenses' },
    ],
    startDate: '2025-01-01', endDate: '2027-12-31',
  },
  {
    id: 'SS004', name: 'Digital India Scholarship', ministry: 'Ministry of Education', totalBudget: 50000000, disbursed: 12000000, beneficiaries: 500000, activeBeneficiaries: 480000, status: 'active',
    restrictions: [
      { type: 'usage-restrict', label: 'Education', params: { categories: 'tuition,books,laptop,courses' }, description: 'For educational expenses only' },
      { type: 'expiry', label: 'Semester Lock', params: { days: 180 }, description: 'Tokens valid for one semester (180 days)' },
      { type: 'geo-fence', label: 'Institution', params: { locations: 'registered_institution' }, description: 'Spendable at registered educational institutions only' },
    ],
    startDate: '2025-08-01', endDate: '2026-07-31',
  },
];

// ── Smart Contracts ──

export const smartContracts: SmartContract[] = [
  { address: '0x5FbDB2315678afecb367f032d93F642f64180aa3', name: 'eRupeeToken', type: 'ERC20 + Programmable Locks', status: 'deployed', deployedAt: '2026-02-01T10:00:00Z', interactions: 18472, balance: 52450000, version: '2.1.0' },
  { address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', name: 'SubsidyDistributor', type: 'Government Token Router', status: 'deployed', deployedAt: '2026-01-15T08:00:00Z', interactions: 9834, balance: 8000000, version: '1.3.0' },
  { address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', name: 'EscrowVault', type: 'Time-Lock Escrow', status: 'deployed', deployedAt: '2026-01-20T12:00:00Z', interactions: 3421, balance: 26500, version: '1.1.0' },
  { address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', name: 'ComplianceOracle', type: 'AML/KYC Verifier', status: 'deployed', deployedAt: '2025-12-01T09:00:00Z', interactions: 45890, balance: 0, version: '3.0.1' },
];

// ── Contract Events ──

export const contractEvents: ContractEvent[] = [
  { id: 'CE001', contractAddress: '0x5Fb...aa3', event: 'Transfer', args: { from: '0x5Fb...aa3', to: '0x9Cd...e45', value: '5000' }, blockNumber: 1847, txHash: '0xabc123...', timestamp: '2026-02-18T09:15:00Z' },
  { id: 'CE002', contractAddress: '0x5Fb...aa3', event: 'TokensLocked', args: { holder: '0x5Fb...aa3', amount: '26500', unlockTime: '1716422400' }, blockNumber: 1828, txHash: '0xabcdef...', timestamp: '2026-02-16T12:00:00Z' },
  { id: 'CE003', contractAddress: '0x9fE...6e0', event: 'SubsidyDisbursed', args: { scheme: 'PM-KISAN', beneficiary: '0x5Fb...aa3', amount: '6000' }, blockNumber: 1840, txHash: '0x123456...', timestamp: '2026-02-17T14:00:00Z' },
  { id: 'CE004', contractAddress: '0xCf7...Fc9', event: 'KYCVerified', args: { user: '0x5Fb...aa3', level: 'FULL' }, blockNumber: 1800, txHash: '0xfedcba...', timestamp: '2026-02-15T14:00:00Z' },
  { id: 'CE005', contractAddress: '0xe7f...512', event: 'EscrowCreated', args: { id: 'ESC001', amount: '26500', releaseDate: '1718928000' }, blockNumber: 1828, txHash: '0xabcdef...', timestamp: '2026-02-16T12:00:00Z' },
];

// ── Merchant Info ──

export const merchantInfo: MerchantInfo = {
  id: 'M001', name: 'Reliance Smart Store', category: 'Retail & Groceries', mcc: '5411',
  revenue: 2450000, transactions: 12450, avgTicketSize: 1875,
  rating: 4.7, status: 'active', settlementAccount: '0x8Ac...b72',
};

export const refundRequests: RefundRequest[] = [
  { id: 'RF001', transactionId: 'TX002', amount: 450, reason: 'Defective product returned', status: 'processed', createdAt: '2026-02-15T08:00:00Z', processedAt: '2026-02-15T10:00:00Z' },
  { id: 'RF002', transactionId: 'TX007', amount: 1200, reason: 'Wrong item delivered', status: 'pending', createdAt: '2026-02-17T14:00:00Z' },
  { id: 'RF003', transactionId: 'TX008', amount: 120, reason: 'Double charge', status: 'approved', createdAt: '2026-02-16T11:00:00Z' },
];

// ── Analytics Data ──

export const analyticsMetrics: AnalyticsMetric[] = [
  { label: 'Total Transaction Volume', value: 185000000, change: 12.5, trend: 'up', period: '24h' },
  { label: 'Active Wallets', value: 8742531, change: 3.2, trend: 'up', period: '7d' },
  { label: 'Avg. Transaction Size', value: 2150, change: -1.8, trend: 'down', period: '24h' },
  { label: 'Failed Transactions', value: 0.12, change: -15.0, trend: 'down', period: '24h' },
  { label: 'Compliance Score', value: 98.7, change: 0.3, trend: 'up', period: '30d' },
  { label: 'Network TPS', value: 4500, change: 8.1, trend: 'up', period: 'real-time' },
];

export const volumeChart: ChartDataPoint[] = [
  { label: 'Mon', value: 24500000 },
  { label: 'Tue', value: 28900000 },
  { label: 'Wed', value: 22100000 },
  { label: 'Thu', value: 31200000 },
  { label: 'Fri', value: 35800000 },
  { label: 'Sat', value: 19500000 },
  { label: 'Sun', value: 23000000 },
];

export const txTypeDistribution: ChartDataPoint[] = [
  { label: 'P2P', value: 42, color: '#3B82F6' },
  { label: 'P2M', value: 28, color: '#8B5CF6' },
  { label: 'Subsidy', value: 15, color: '#10B981' },
  { label: 'QR/NFC', value: 10, color: '#F59E0B' },
  { label: 'Other', value: 5, color: '#6B7280' },
];

export const monthlyTrend: TimeSeriesPoint[] = [
  { date: 'Sep', value: 120000000 }, { date: 'Oct', value: 145000000 },
  { date: 'Nov', value: 138000000 }, { date: 'Dec', value: 175000000 },
  { date: 'Jan', value: 192000000 }, { date: 'Feb', value: 185000000 },
];
