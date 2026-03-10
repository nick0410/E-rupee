import SwiftUI

// MARK: - Investment Plan Model
struct InvestPlan: Identifiable {
    let id = UUID()
    let months: Int
    let rate: Double
    let color: Color
    let gradient: [Color]
    let label: String
    let durationSeconds: Int64

    init(months: Int = 0, rate: Double, color: Color, gradient: [Color],
         label: String = "", durationSeconds: Int64 = 0) {
        self.months = months
        self.rate = rate
        self.color = color
        self.gradient = gradient
        self.label = label.isEmpty ? "\(months)-Month Fixed Deposit" : label
        self.durationSeconds = durationSeconds
    }
}

private let plans: [InvestPlan] = [
    InvestPlan(months: 0, rate: 15.0, color: AppColors.pink, gradient: [AppColors.pinkDark, AppColors.pink],
               label: "1-Min Demo", durationSeconds: 60),
    InvestPlan(months: 3, rate: 5.0, color: AppColors.green, gradient: [AppColors.greenDark, AppColors.green]),
    InvestPlan(months: 6, rate: 7.5, color: AppColors.primaryBlue, gradient: [AppColors.primaryBlueDark, AppColors.primaryBlue]),
    InvestPlan(months: 12, rate: 9.0, color: AppColors.purple, gradient: [AppColors.purpleDark, AppColors.purple]),
]

// MARK: - Investment Screen
struct InvestmentView: View {
    let userId: Int

    @State private var visible = false
    @State private var balance = BalanceResponse()
    @State private var locks: [LockEntry] = []
    @State private var selectedPlan: InvestPlan?
    @State private var statusMsg: String?

    private let api = APIService()

    var body: some View {
        ZStack {
            AppColors.backgroundGradient.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Spacer().frame(height: 48)

                    // ── Header ──
                    if visible {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Investments")
                                .font(.system(size: 26, weight: .bold))
                                .foregroundColor(.white)
                            Text("Lock e₹ to earn fixed returns")
                                .font(.system(size: 13))
                                .foregroundColor(.white.opacity(0.55))
                        }
                        .transition(.opacity)
                    }

                    Spacer().frame(height: 16)

                    // ── Balance Strip ──
                    if visible {
                        HStack(spacing: 0) {
                            balanceStat("Available", balance.available, AppColors.green)
                            dividerLine()
                            balanceStat("Locked", balance.locked, AppColors.amber)
                            dividerLine()
                            balanceStat("Total", balance.balance, .white)
                        }
                        .padding(.vertical, 20)
                        .padding(.horizontal, 8)
                        .background(Color.white.opacity(0.07))
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .transition(.opacity)
                    }

                    Spacer().frame(height: 24)

                    // ── Plans ──
                    if visible {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Investment Plans")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.white)

                            ForEach(plans) { plan in
                                planCard(plan: plan) {
                                    selectedPlan = plan
                                }
                            }
                        }
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer().frame(height: 28)

                    // ── My Investments ──
                    if visible {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("My Investments")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.white)

                            if locks.isEmpty {
                                VStack(spacing: 8) {
                                    Image(systemName: "chart.line.uptrend.xyaxis")
                                        .font(.system(size: 40))
                                        .foregroundColor(.white.opacity(0.2))
                                    Text("No active investments")
                                        .font(.system(size: 14))
                                        .foregroundColor(.white.opacity(0.4))
                                    Text("Choose a plan above to get started")
                                        .font(.system(size: 12))
                                        .foregroundColor(.white.opacity(0.25))
                                }
                                .frame(maxWidth: .infinity)
                                .padding(32)
                                .background(Color.white.opacity(0.05))
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                            } else {
                                ForEach(Array(locks.enumerated()), id: \.offset) { index, lock in
                                    activeLockCard(lock: lock, index: index)
                                }
                            }
                        }
                        .transition(.move(edge: .bottom).combined(with: .opacity))
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
        .sheet(item: $selectedPlan) { plan in
            investDialogSheet(plan: plan)
        }
        .alert("Investment", isPresented: Binding(
            get: { statusMsg != nil },
            set: { if !$0 { statusMsg = nil } }
        )) {
            Button("OK") { statusMsg = nil }
        } message: {
            Text(statusMsg ?? "")
        }
    }

    // MARK: - Components

    @ViewBuilder
    private func balanceStat(_ label: String, _ value: String, _ color: Color) -> some View {
        VStack(spacing: 6) {
            Text(label)
                .font(.system(size: 11))
                .foregroundColor(.white.opacity(0.5))
            Text("e₹ \(value)")
                .font(.system(size: 15, weight: .bold))
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder
    private func dividerLine() -> some View {
        Rectangle()
            .fill(Color.white.opacity(0.12))
            .frame(width: 1, height: 40)
    }

    @ViewBuilder
    private func planCard(plan: InvestPlan, onInvest: @escaping () -> Void) -> some View {
        let isDemo = plan.durationSeconds > 0
        let iconText = isDemo ? "⚡" : "\(plan.months)M"
        let durationPill = isDemo ? "Unlocks in 1 min ⏱" : "Returns in \(plan.months) months"
        let returnLabel = isDemo ? "\(plan.rate)% return • Test / Demo plan" : "\(plan.rate)% annual returns • Lock e₹ tokens"

        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(Color.white.opacity(0.18))
                    .frame(width: 52, height: 52)
                Text(iconText)
                    .font(.system(size: isDemo ? 22 : 16, weight: .bold))
                    .foregroundColor(.white)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(plan.label)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                Text(returnLabel)
                    .font(.system(size: 12))
                    .foregroundColor(.white.opacity(0.75))

                Spacer().frame(height: 4)
                Text(durationPill)
                    .font(.system(size: 11))
                    .foregroundColor(.white.opacity(0.6))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.white.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 6))
            }

            Spacer()

            Button("Invest") { onInvest() }
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Color.white.opacity(0.2))
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .padding(20)
        .background(
            LinearGradient(colors: plan.gradient, startPoint: .leading, endPoint: .trailing)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(alignment: .topTrailing) {
            if isDemo {
                Text("DEMO")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 3)
                    .background(Color.white.opacity(0.25))
                    .clipShape(RoundedRectangle(cornerRadius: 0))
                    .clipShape(.rect(bottomLeadingRadius: 10))
            }
        }
    }

    @ViewBuilder
    private func activeLockCard(lock: LockEntry, index: Int) -> some View {
        let isExpired = Int64(Date().timeIntervalSince1970) > lock.unlockTime
        let dateStr = Date(timeIntervalSince1970: TimeInterval(lock.unlockTime))
            .formatted(date: .abbreviated, time: .shortened)

        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill((isExpired ? AppColors.green : AppColors.amber).opacity(0.15))
                    .frame(width: 44, height: 44)
                Image(systemName: isExpired ? "lock.open.fill" : "lock.fill")
                    .foregroundColor(isExpired ? AppColors.green : AppColors.amber)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text("e₹ \(lock.amount)")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.white)
                Text(isExpired ? "✅ Ready to release" : "Unlocks: \(dateStr)")
                    .font(.system(size: 12))
                    .foregroundColor(isExpired ? AppColors.green : .white.opacity(0.5))
            }

            Spacer()
            Text("#\(index + 1)")
                .font(.system(size: 13))
                .foregroundColor(.white.opacity(0.25))
        }
        .padding(16)
        .background(Color.white.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Invest Dialog Sheet
    @ViewBuilder
    private func investDialogSheet(plan: InvestPlan) -> some View {
        InvestDialogView(plan: plan, availableBalance: Double(balance.available) ?? 0) { amount in
            selectedPlan = nil
            invest(plan: plan, amount: amount)
        } onDismiss: {
            selectedPlan = nil
        }
    }

    // MARK: - API

    private func refresh() {
        Task {
            do {
                let b = try await api.getBalance(userId: userId)
                await MainActor.run { balance = b }
                let l = try await api.getLocks(userId: userId)
                await MainActor.run { locks = l.locks }
            } catch {
                print("Investment refresh error: \(error)")
            }
        }
    }

    private func invest(plan: InvestPlan, amount: String) {
        Task {
            do {
                let durationSecs = plan.durationSeconds > 0
                    ? plan.durationSeconds
                    : Int64(plan.months) * 30 * 24 * 3600
                let unlockTime = Int64(Date().timeIntervalSince1970) + durationSecs
                _ = try await api.lockTokens(LockRequest(
                    userId: userId, amount: amount, unlockTime: unlockTime, interestRate: plan.rate
                ))
                let durationLabel = plan.durationSeconds > 0
                    ? "\(plan.durationSeconds)s (demo)" : "\(plan.months) months"
                await MainActor.run {
                    statusMsg = "Locked e₹ \(amount) for \(durationLabel) ✅\nWait for it to expire, then Release on Home screen!"
                }
                refresh()
            } catch {
                await MainActor.run { statusMsg = "Error: \(error.localizedDescription)" }
            }
        }
    }
}

// MARK: - Invest Dialog View
struct InvestDialogView: View {
    let plan: InvestPlan
    let availableBalance: Double
    let onConfirm: (String) -> Void
    let onDismiss: () -> Void

    @State private var amount = ""

    private var parsed: Double { Double(amount) ?? 0 }
    private var isDemo: Bool { plan.durationSeconds > 0 }
    private var projectedReturn: Double {
        isDemo
            ? parsed * (1 + plan.rate / 100)
            : parsed * (1 + plan.rate / 100 * Double(plan.months) / 12)
    }

    var body: some View {
        ZStack {
            AppColors.backgroundSlate.ignoresSafeArea()

            VStack(spacing: 20) {
                Text(isDemo ? "1-Min Demo • \(String(format: "%.0f", plan.rate))%"
                     : "\(plan.months)-Month Plan • \(String(format: "%.1f", plan.rate))%")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.white)

                TextField("Amount (e₹)", text: $amount)
                    .keyboardType(.decimalPad)
                    .padding()
                    .background(Color.white.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .foregroundColor(.white)

                if parsed > availableBalance && !amount.isEmpty {
                    Text("Exceeds available balance")
                        .font(.caption)
                        .foregroundColor(AppColors.redLight)
                }

                if parsed > 0 {
                    Divider().background(Color.white.opacity(0.08))
                    HStack {
                        Text("Projected return")
                            .font(.system(size: 12))
                            .foregroundColor(.white.opacity(0.5))
                        Spacer()
                        Text("e₹ \(String(format: "%.2f", projectedReturn))")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(plan.color)
                    }
                    HStack {
                        Text("Lock duration")
                            .font(.system(size: 12))
                            .foregroundColor(.white.opacity(0.5))
                        Spacer()
                        Text(isDemo ? "1 minute" : "\(plan.months) months")
                            .font(.system(size: 12))
                            .foregroundColor(.white)
                    }
                }

                HStack(spacing: 12) {
                    Button { onDismiss() } label: {
                        Text("Cancel")
                            .frame(maxWidth: .infinity, minHeight: 44)
                    }
                    .foregroundColor(.white.opacity(0.6))
                    .background(Color.white.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                    Button {
                        if parsed > 0 && parsed <= availableBalance {
                            onConfirm(amount)
                        }
                    } label: {
                        Text("Invest")
                            .fontWeight(.bold)
                            .frame(maxWidth: .infinity, minHeight: 44)
                    }
                    .foregroundColor(.white)
                    .background(plan.color)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .disabled(parsed <= 0 || parsed > availableBalance)
                }
            }
            .padding(24)
        }
        .presentationDetents([.height(380)])
    }
}
