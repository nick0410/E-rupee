import SwiftUI

// MARK: - Home Screen
struct HomeView: View {
    let userId: Int
    let navigate: (Route) -> Void

    @State private var balance = BalanceResponse()
    @State private var locks: [LockEntry] = []
    @State private var transactions: [TransactionItem] = []
    @State private var loading = true
    @State private var visible = false

    // Dialog states
    @State private var showMintDialog = false
    @State private var showLockDialog = false
    @State private var statusMessage: String?

    private let api = APIService()

    var body: some View {
        ZStack {
            AppColors.backgroundGradient.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    Spacer().frame(height: 48)

                    // ── Header ──
                    if visible {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("eRupeeX")
                                    .font(.system(size: 28, weight: .bold))
                                    .foregroundColor(.white)
                                Text("Digital Wallet")
                                    .font(.system(size: 14))
                                    .foregroundColor(.white.opacity(0.6))
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

                    Spacer().frame(height: 24)

                    // ── Balance Card ──
                    if visible {
                        VStack(alignment: .leading, spacing: 0) {
                            Text("Total Balance")
                                .font(.system(size: 14))
                                .foregroundColor(.white.opacity(0.8))

                            Spacer().frame(height: 8)

                            if loading {
                                ProgressView()
                                    .tint(.white)
                                    .frame(height: 32)
                            } else {
                                Text("e₹ \(balance.balance)")
                                    .font(.system(size: 36, weight: .bold))
                                    .foregroundColor(.white)
                            }

                            Spacer().frame(height: 16)
                            Divider().background(Color.white.opacity(0.3))
                            Spacer().frame(height: 12)

                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Available")
                                        .font(.system(size: 12))
                                        .foregroundColor(.white.opacity(0.7))
                                    Text("e₹ \(balance.available)")
                                        .font(.system(size: 18, weight: .semibold))
                                        .foregroundColor(.white)
                                }
                                Spacer()
                                VStack(alignment: .trailing, spacing: 2) {
                                    Text("Locked")
                                        .font(.system(size: 12))
                                        .foregroundColor(.white.opacity(0.7))
                                    Text("e₹ \(balance.locked)")
                                        .font(.system(size: 18, weight: .semibold))
                                        .foregroundColor(AppColors.amberLight)
                                }
                            }

                            Spacer().frame(height: 12)
                            let addr = balance.address
                            if !addr.isEmpty {
                                Text("\(addr.prefix(6))...\(addr.suffix(4))")
                                    .font(.system(size: 12))
                                    .foregroundColor(.white.opacity(0.5))
                                    .frame(maxWidth: .infinity, alignment: .center)
                            }
                        }
                        .padding(24)
                        .background(
                            LinearGradient(
                                colors: [AppColors.primaryBlue, AppColors.purple],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer().frame(height: 28)

                    // ── Action Buttons ──
                    if visible {
                        HStack(spacing: 0) {
                            actionButton(icon: "paperplane.fill", label: "Send", color: AppColors.primaryBlue) {
                                navigate(.send(userId: userId))
                            }
                            actionButton(icon: "arrow.down.circle.fill", label: "Receive", color: AppColors.purple) {
                                navigate(.receive(userId: userId))
                            }
                            actionButton(icon: "plus.circle.fill", label: "Mint", color: AppColors.green) {
                                showMintDialog = true
                            }
                            actionButton(icon: "lock.fill", label: "Lock", color: AppColors.amber) {
                                showLockDialog = true
                            }
                            actionButton(icon: "lock.open.fill", label: "Release", color: AppColors.slateLight) {
                                releaseTokens()
                            }
                        }
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer().frame(height: 28)

                    // ── Active Locks ──
                    if visible {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Active Locks")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundColor(.white)

                            if locks.isEmpty {
                                emptyCard("No active locks 🔓")
                            } else {
                                ForEach(Array(locks.enumerated()), id: \.offset) { index, lock in
                                    lockCard(lock: lock, index: index)
                                }
                            }
                        }
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer().frame(height: 28)

                    // ── Recent Transactions ──
                    if visible {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("Recent Transactions")
                                    .font(.system(size: 20, weight: .bold))
                                    .foregroundColor(.white)
                                Spacer()
                                if !transactions.isEmpty {
                                    Text("\(transactions.count) total")
                                        .font(.system(size: 13))
                                        .foregroundColor(.white.opacity(0.4))
                                }
                            }

                            if loading {
                                HStack {
                                    Spacer()
                                    ProgressView().tint(AppColors.primaryBlue)
                                    Spacer()
                                }
                                .frame(height: 80)
                            } else if transactions.isEmpty {
                                emptyCard("No transactions yet 💸")
                            } else {
                                ForEach(transactions.prefix(5)) { tx in
                                    transactionCard(tx: tx)
                                }
                            }
                        }
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer().frame(height: 24)
                }
                .padding(.horizontal, 24)
            }
        }
        .onAppear {
            refresh()
            withAnimation(.easeOut(duration: 0.6).delay(0.1)) {
                visible = true
            }
        }
        // ── Mint Dialog ──
        .alert("Mint e₹ Tokens", isPresented: $showMintDialog) {
            mintDialogContent()
        }
        // ── Lock Dialog ──
        .sheet(isPresented: $showLockDialog) {
            lockDialogSheet()
        }
        // ── Status Dialog ──
        .alert("Status", isPresented: Binding(
            get: { statusMessage != nil },
            set: { if !$0 { statusMessage = nil } }
        )) {
            Button("OK") { statusMessage = nil }
        } message: {
            Text(statusMessage ?? "")
        }
    }

    // MARK: - Components

    @ViewBuilder
    private func actionButton(icon: String, label: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 6) {
                ZStack {
                    Circle()
                        .fill(color.opacity(0.15))
                        .frame(width: 56, height: 56)
                    Image(systemName: icon)
                        .font(.system(size: 22))
                        .foregroundColor(color)
                }
                Text(label)
                    .font(.system(size: 13))
                    .foregroundColor(.white.opacity(0.8))
            }
        }
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder
    private func lockCard(lock: LockEntry, index: Int) -> some View {
        let isExpired = Int64(Date().timeIntervalSince1970) > lock.unlockTime
        let unlockDate = Date(timeIntervalSince1970: TimeInterval(lock.unlockTime))
        let dateStr = unlockDate.formatted(date: .abbreviated, time: .shortened)

        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill((isExpired ? AppColors.green : AppColors.amber).opacity(0.2))
                    .frame(width: 42, height: 42)
                Image(systemName: isExpired ? "lock.open.fill" : "lock.fill")
                    .font(.system(size: 18))
                    .foregroundColor(isExpired ? AppColors.green : AppColors.amber)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text("e₹ \(lock.amount)")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white)
                Text(isExpired ? "Expired — ready to release" : "Unlocks: \(dateStr)")
                    .font(.system(size: 12))
                    .foregroundColor(isExpired ? AppColors.green : .white.opacity(0.5))
                if !lock.documentCID.isEmpty {
                    Text("📄 \(lock.documentCID.prefix(12))...")
                        .font(.system(size: 11))
                        .foregroundColor(AppColors.primaryBlueLight)
                        .lineLimit(1)
                }
            }

            Spacer()
            Text("#\(index + 1)")
                .font(.system(size: 14))
                .foregroundColor(.white.opacity(0.3))
        }
        .padding(16)
        .background(Color.white.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    @ViewBuilder
    private func transactionCard(tx: TransactionItem) -> some View {
        let isSent = tx.type.lowercased() == "send" || tx.type.lowercased() == "transfer"
                     || tx.type.lowercased() == "transfer_out"
        let accentColor = isSent ? AppColors.red : AppColors.green
        let icon = isSent ? "arrow.up.right" : "arrow.down.left"
        let label = isSent ? "Sent" : "Received"
        let counterparty = isSent ? tx.toAddress : tx.fromAddress
        let shortAddr = counterparty.count > 10
            ? "\(counterparty.prefix(6))...\(counterparty.suffix(4))" : counterparty

        let statusColor: Color = {
            switch tx.status.lowercased() {
            case "success", "confirmed": return AppColors.green
            case "pending": return AppColors.amberLight
            default: return AppColors.red
            }
        }()

        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(accentColor.opacity(0.18))
                    .frame(width: 44, height: 44)
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(accentColor)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.white)
                Text("\(isSent ? "To" : "From"): \(shortAddr)")
                    .font(.system(size: 12))
                    .foregroundColor(.white.opacity(0.5))
                    .lineLimit(1)
                if !tx.note.isEmpty {
                    Text(tx.note)
                        .font(.system(size: 11))
                        .foregroundColor(AppColors.primaryBlueLight)
                        .lineLimit(1)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text("\(isSent ? "-" : "+")e₹ \(String(format: "%.0f", tx.amount))")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(accentColor)

                Text(tx.status.capitalized)
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(statusColor)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(statusColor.opacity(0.18))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
        .padding(16)
        .background(Color.white.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    @ViewBuilder
    private func emptyCard(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 16))
            .foregroundColor(.white.opacity(0.5))
            .frame(maxWidth: .infinity)
            .padding(24)
            .background(Color.white.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Mint Dialog
    @State private var mintAmount = ""

    @ViewBuilder
    private func mintDialogContent() -> some View {
        TextField("Amount (eINR)", text: $mintAmount)
            .keyboardType(.decimalPad)
        Button("Mint") {
            guard !mintAmount.isEmpty else { return }
            mintTokens(amount: mintAmount)
            mintAmount = ""
        }
        Button("Cancel", role: .cancel) { mintAmount = "" }
    }

    // MARK: - Lock Dialog Sheet
    @ViewBuilder
    private func lockDialogSheet() -> some View {
        LockDialogView { amount, minutes in
            showLockDialog = false
            lockTokens(amount: amount, minutes: minutes)
        } onDismiss: {
            showLockDialog = false
        }
    }

    // MARK: - API Calls

    private func refresh() {
        Task {
            loading = true
            do {
                let b = try await api.getBalance(userId: userId)
                await MainActor.run { balance = b }
                let l = try await api.getLocks(userId: userId)
                await MainActor.run { locks = l.locks }
                let t = try await api.getTransactions(userId: userId)
                await MainActor.run { transactions = t.transactions }
            } catch {
                print("Home refresh error: \(error)")
            }
            await MainActor.run { loading = false }
        }
    }

    private func mintTokens(amount: String) {
        Task {
            do {
                _ = try await api.mintTokens(MintRequest(userId: userId, amount: amount))
                await MainActor.run { statusMessage = "Minted e₹ \(amount) ✅" }
                refresh()
            } catch {
                await MainActor.run { statusMessage = "Error: \(error.localizedDescription)" }
            }
        }
    }

    private func lockTokens(amount: String, minutes: Int64) {
        Task {
            do {
                let unlockTime = Int64(Date().timeIntervalSince1970) + (minutes * 60)
                _ = try await api.lockTokens(LockRequest(userId: userId, amount: amount, unlockTime: unlockTime))
                await MainActor.run { statusMessage = "Locked e₹ \(amount) for \(minutes) min 🔒" }
                refresh()
            } catch {
                await MainActor.run { statusMessage = "Error: \(error.localizedDescription)" }
            }
        }
    }

    private func releaseTokens() {
        Task {
            do {
                let resp = try await api.releaseTokens(MintRequest(userId: userId, amount: "0"))
                let interest = Double(resp.interest ?? "0") ?? 0
                let total = Double(resp.total ?? "0") ?? 0
                if interest > 0 {
                    await MainActor.run {
                        statusMessage = "Released ✅\nPrincipal: e₹ \(resp.principal ?? "0")\nInterest earned: +e₹ \(String(format: "%.2f", interest))\nTotal credited: e₹ \(String(format: "%.2f", total)) 🎉"
                    }
                } else {
                    await MainActor.run {
                        statusMessage = "Locks released ✅\nCredited: e₹ \(resp.total ?? resp.principal ?? "0")"
                    }
                }
                refresh()
            } catch {
                await MainActor.run { statusMessage = "Error: \(error.localizedDescription)" }
            }
        }
    }
}

// MARK: - Lock Dialog View (Sheet)
struct LockDialogView: View {
    let onConfirm: (String, Int64) -> Void
    let onDismiss: () -> Void

    @State private var amount = ""
    @State private var minutes = ""

    var body: some View {
        ZStack {
            AppColors.backgroundSlate.ignoresSafeArea()
            VStack(spacing: 20) {
                Text("Lock e₹ Tokens")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.white)

                VStack(spacing: 12) {
                    TextField("Amount (eINR)", text: $amount)
                        .keyboardType(.decimalPad)
                        .padding()
                        .background(Color.white.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .foregroundColor(.white)

                    TextField("Duration (minutes)", text: $minutes)
                        .keyboardType(.numberPad)
                        .padding()
                        .background(Color.white.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .foregroundColor(.white)
                }

                HStack(spacing: 12) {
                    Button {
                        onDismiss()
                    } label: {
                        Text("Cancel")
                            .frame(maxWidth: .infinity, minHeight: 44)
                    }
                    .foregroundColor(.white.opacity(0.7))
                    .background(Color.white.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                    Button {
                        if !amount.isEmpty, let m = Int64(minutes), m > 0 {
                            onConfirm(amount, m)
                        }
                    } label: {
                        Text("Lock")
                            .fontWeight(.bold)
                            .frame(maxWidth: .infinity, minHeight: 44)
                    }
                    .foregroundColor(.black)
                    .background(AppColors.amber)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
            .padding(24)
        }
        .presentationDetents([.height(300)])
    }
}
