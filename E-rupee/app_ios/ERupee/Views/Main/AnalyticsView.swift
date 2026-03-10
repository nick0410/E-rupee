import SwiftUI

// MARK: - Type Colors
private let typeColorMap: [String: Color] = [
    "MINT":         Color(hex: 0x22C55E),
    "TRANSFER_OUT": Color(hex: 0x3B82F6),
    "TRANSFER_IN":  Color(hex: 0x10B981),
    "LOCK":         Color(hex: 0xF59E0B),
    "RELEASE":      Color(hex: 0x8B5CF6),
]
private func typeColor(_ type: String) -> Color {
    typeColorMap[type] ?? Color(hex: 0x64748B)
}

// MARK: - Analytics Screen
struct AnalyticsView: View {
    let userId: Int

    @State private var visible = false
    @State private var transactions: [TransactionItem] = []
    @State private var balance = BalanceResponse()
    @State private var locks: [LockEntry] = []
    @State private var loading = false

    private let api = APIService()

    // Computed analytics
    private var totalVolume: Double { transactions.reduce(0) { $0 + $1.amount } }
    private var avgAmount: Double { transactions.isEmpty ? 0.0 : totalVolume / Double(transactions.count) }
    private var largestTx: Double { transactions.map(\.amount).max() ?? 0 }
    private var smallestTx: Double { transactions.isEmpty ? 0.0 : transactions.map(\.amount).min() ?? 0 }

    var body: some View {
        ZStack {
            AppColors.backgroundGradient.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Spacer().frame(height: 48)

                    // ── Header ──
                    if visible {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Analytics")
                                    .font(.system(size: 26, weight: .bold))
                                    .foregroundColor(.white)
                                Text("Real analytics from your transactions")
                                    .font(.system(size: 13))
                                    .foregroundColor(.white.opacity(0.55))
                            }
                            Spacer()
                            Button { refresh() } label: {
                                Image(systemName: "arrow.clockwise")
                                    .font(.system(size: 22))
                                    .foregroundColor(.white)
                            }
                        }
                        .transition(.opacity)
                    }

                    Spacer().frame(height: 20)

                    // ── Key Metrics ──
                    if visible {
                        VStack(spacing: 12) {
                            HStack(spacing: 12) {
                                statTile("Total Volume", "e₹ \(String(format: "%.0f", totalVolume))", AppColors.primaryBlue, "chart.bar.fill")
                                statTile("Transactions", "\(transactions.count)", AppColors.green, "chart.xyaxis.line")
                            }
                            HStack(spacing: 12) {
                                statTile("Avg Amount", "e₹ \(String(format: "%.0f", avgAmount))", AppColors.purple, "arrow.up.right")
                                statTile("Active Locks", "\(locks.count)", AppColors.amber, "lock.fill")
                            }
                        }
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer().frame(height: 16)

                    // ── Detailed Stats ──
                    if visible {
                        HStack(spacing: 10) {
                            miniStat("Largest", "e₹ \(String(format: "%.0f", largestTx))", AppColors.green)
                            miniStat("Smallest", "e₹ \(String(format: "%.0f", smallestTx))", AppColors.primaryBlue)
                            miniStat("Balance", "e₹ \(balance.balance.split(separator: ".").first.map(String.init) ?? balance.balance)", .white)
                            miniStat("Locked", "e₹ \(balance.locked.split(separator: ".").first.map(String.init) ?? balance.locked)", AppColors.amber)
                        }
                        .transition(.opacity)
                    }

                    Spacer().frame(height: 16)

                    // ── Volume Bar Chart ──
                    if visible {
                        volumeBarChart()
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer().frame(height: 16)

                    // ── Transaction Types Donut ──
                    if visible {
                        transactionTypesCard()
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer().frame(height: 16)

                    // ── Volume by Type ──
                    if visible {
                        volumeByTypeCard()
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer().frame(height: 16)

                    // ── Network Status ──
                    if visible {
                        networkStatusCard()
                            .transition(.opacity)
                    }

                    Spacer().frame(height: 24)
                }
                .padding(.horizontal, 20)
            }
        }
        .onAppear {
            refresh()
            withAnimation(.easeOut(duration: 0.6).delay(0.1)) { visible = true }
        }
    }

    // MARK: - Components

    @ViewBuilder
    private func statTile(_ label: String, _ value: String, _ color: Color, _ icon: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(color.opacity(0.15))
                        .frame(width: 32, height: 32)
                    Image(systemName: icon)
                        .font(.system(size: 14))
                        .foregroundColor(color)
                }
                Text(label)
                    .font(.system(size: 11))
                    .foregroundColor(.white.opacity(0.5))
            }
            Text(value)
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.white)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    @ViewBuilder
    private func miniStat(_ label: String, _ value: String, _ color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(color)
            Text(label)
                .font(.system(size: 9))
                .foregroundColor(.white.opacity(0.4))
        }
        .frame(maxWidth: .infinity)
        .padding(10)
        .background(Color.white.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var dateEntries: [(String, Double)] {
        let inputFormatter = DateFormatter()
        inputFormatter.dateFormat = "yyyy-MM-dd"
        let outputFormatter = DateFormatter()
        outputFormatter.dateFormat = "dd MMM"
        var dict: [(key: String, value: Double)] = []
        var seen: [String: Int] = [:]
        for tx in transactions {
            let dateStr = String(tx.createdAt.prefix(10))
            if let date = inputFormatter.date(from: dateStr) {
                let label = outputFormatter.string(from: date)
                if let idx = seen[label] {
                    dict[idx].value += tx.amount
                } else {
                    seen[label] = dict.count
                    dict.append((label, tx.amount))
                }
            }
        }
        return Array(dict.suffix(7))
    }

    @ViewBuilder
    private func volumeBarChart() -> some View {
        let byDate = dateEntries

        let maxVol = byDate.map(\.1).max() ?? 1

        VStack(alignment: .leading, spacing: 16) {
            Text("Volume by Date")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.white)

            if byDate.isEmpty {
                Text("No transaction data yet")
                    .font(.system(size: 13))
                    .foregroundColor(.white.opacity(0.3))
                    .frame(maxWidth: .infinity)
                    .frame(height: 120)
            } else {
                HStack(alignment: .bottom, spacing: 6) {
                    ForEach(byDate, id: \.0) { date, vol in
                        let frac = CGFloat(max(0.05, min(1, vol / maxVol)))
                        VStack(spacing: 4) {
                            RoundedRectangle(cornerRadius: 6)
                                .fill(
                                    LinearGradient(
                                        colors: [AppColors.primaryBlueLight, AppColors.primaryBlue],
                                        startPoint: .top, endPoint: .bottom
                                    )
                                )
                                .frame(height: 120 * frac)
                            Text(date)
                                .font(.system(size: 9))
                                .foregroundColor(.white.opacity(0.4))
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
                .frame(height: 140)
            }
        }
        .padding(20)
        .background(Color.white.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    @ViewBuilder
    private func transactionTypesCard() -> some View {
        let typeCounts = Dictionary(grouping: transactions, by: \.type).mapValues(\.count)
        let totalCount = max(transactions.count, 1)

        VStack(alignment: .leading, spacing: 16) {
            Text("Transaction Types")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.white)

            if typeCounts.isEmpty {
                Text("No data yet")
                    .font(.system(size: 13))
                    .foregroundColor(.white.opacity(0.3))
                    .frame(maxWidth: .infinity)
                    .frame(height: 80)
            } else {
                HStack(alignment: .center, spacing: 20) {
                    // Simple donut representation
                    ZStack {
                        Circle()
                            .stroke(Color.white.opacity(0.08), lineWidth: 18)
                            .frame(width: 100, height: 100)

                        // Draw arcs for each type
                        ForEach(Array(donutSegments(typeCounts: typeCounts, total: totalCount).enumerated()), id: \.offset) { _, segment in
                            Circle()
                                .trim(from: segment.start, to: segment.end - 0.01)
                                .stroke(segment.color, style: StrokeStyle(lineWidth: 18, lineCap: .round))
                                .frame(width: 100, height: 100)
                                .rotationEffect(.degrees(-90))
                        }

                        VStack(spacing: 0) {
                            Text("\(transactions.count)")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundColor(.white)
                            Text("Total")
                                .font(.system(size: 10))
                                .foregroundColor(.white.opacity(0.4))
                        }
                    }

                    // Legend
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(Array(typeCounts.keys.sorted()), id: \.self) { type in
                            let count = typeCounts[type] ?? 0
                            HStack(spacing: 8) {
                                Circle()
                                    .fill(typeColor(type))
                                    .frame(width: 10, height: 10)
                                Text(type)
                                    .font(.system(size: 12))
                                    .foregroundColor(.white.opacity(0.7))
                                Spacer()
                                Text("\(count)")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.white)
                                Text("(\(count * 100 / totalCount)%)")
                                    .font(.system(size: 10))
                                    .foregroundColor(.white.opacity(0.4))
                            }
                        }
                    }
                }
            }
        }
        .padding(20)
        .background(Color.white.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    private struct DonutSegment {
        let start: CGFloat
        let end: CGFloat
        let color: Color
    }

    private func donutSegments(typeCounts: [String: Int], total: Int) -> [DonutSegment] {
        var segments: [DonutSegment] = []
        var current: CGFloat = 0
        for type in typeCounts.keys.sorted() {
            let count = typeCounts[type] ?? 0
            let fraction = CGFloat(count) / CGFloat(total)
            segments.append(DonutSegment(start: current, end: current + fraction, color: typeColor(type)))
            current += fraction
        }
        return segments
    }

    @ViewBuilder
    private func volumeByTypeCard() -> some View {
        let totalVolume = transactions.reduce(0) { $0 + $1.amount }
        let typeVolumes = Dictionary(grouping: transactions, by: \.type)
            .mapValues { txs in txs.reduce(0) { $0 + $1.amount } }

        if !typeVolumes.isEmpty {
            VStack(alignment: .leading, spacing: 16) {
                Text("Volume by Transaction Type")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)

                ForEach(Array(typeVolumes.keys.sorted()), id: \.self) { type in
                    let vol = typeVolumes[type] ?? 0
                    let pct = totalVolume > 0 ? Float(vol / totalVolume) : 0

                    VStack(spacing: 6) {
                        HStack {
                            HStack(spacing: 6) {
                                Circle()
                                    .fill(typeColor(type))
                                    .frame(width: 8, height: 8)
                                Text(type)
                                    .font(.system(size: 12))
                                    .foregroundColor(.white.opacity(0.7))
                            }
                            Spacer()
                            Text("e₹ \(String(format: "%.0f", vol)) (\(String(format: "%.0f", pct * 100))%)")
                                .font(.system(size: 12))
                                .foregroundColor(.white)
                        }

                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(Color.white.opacity(0.08))
                                    .frame(height: 6)
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(typeColor(type))
                                    .frame(width: geo.size.width * CGFloat(pct), height: 6)
                            }
                        }
                        .frame(height: 6)
                    }
                }
            }
            .padding(20)
            .background(Color.white.opacity(0.07))
            .clipShape(RoundedRectangle(cornerRadius: 20))
        }
    }

    @ViewBuilder
    private func networkStatusCard() -> some View {
        VStack(spacing: 12) {
            HStack(spacing: 8) {
                Circle()
                    .fill(AppColors.green)
                    .frame(width: 8, height: 8)
                Text("Network Status")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                Text("LIVE")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(AppColors.green)
                Spacer()
            }

            HStack(spacing: 0) {
                networkStat("Network", "eRupee CBDC")
                networkStat("Chain ID", "1337")
                networkStat("Gas Price", "0 Gwei")
                networkStat("Status", "● Online")
            }
        }
        .padding(20)
        .background(Color.white.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    @ViewBuilder
    private func networkStat(_ label: String, _ value: String) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
            Text(label)
                .font(.system(size: 10))
                .foregroundColor(.white.opacity(0.4))
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - API

    private func refresh() {
        Task {
            do {
                loading = true
                let tx = try await api.getTransactions(userId: userId)
                let b = try await api.getBalance(userId: userId)
                let l = try await api.getLocks(userId: userId)
                await MainActor.run {
                    transactions = tx.transactions
                    balance = b
                    locks = l.locks
                    loading = false
                }
            } catch {
                print("Analytics error: \(error)")
                await MainActor.run { loading = false }
            }
        }
    }
}
