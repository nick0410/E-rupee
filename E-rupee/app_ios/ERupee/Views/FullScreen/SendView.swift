import SwiftUI

// MARK: - Send Status
private enum SendStatus {
    case idle, confirming, processing, success, error
}

// MARK: - Send Screen
struct SendView: View {
    let userId: Int
    let onBack: () -> Void

    @State private var toAddress = ""
    @State private var amount = ""
    @State private var note = ""
    @State private var status: SendStatus = .idle
    @State private var txHash = ""
    @State private var errorMsg = ""
    @State private var balance = BalanceResponse()
    @State private var visible = false

    private let api = APIService()

    private var parsedAmount: Double { Double(amount) ?? 0 }
    private var availableBalance: Double { Double(balance.available) ?? 0 }
    private var isAddressValid: Bool { toAddress.hasPrefix("0x") && toAddress.count >= 10 }
    private var isAmountValid: Bool { parsedAmount > 0 && parsedAmount <= availableBalance }
    private var isFormValid: Bool { isAddressValid && isAmountValid }

    var body: some View {
        ZStack {
            AppColors.backgroundGradient.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    Spacer().frame(height: 48)

                    // ── Header ──
                    if visible {
                        HStack(spacing: 8) {
                            Button(action: onBack) {
                                Image(systemName: "arrow.left")
                                    .font(.system(size: 22))
                                    .foregroundColor(.white)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Send e₹")
                                    .font(.system(size: 24, weight: .bold))
                                    .foregroundColor(.white)
                                Text("Real-time P2P transfer")
                                    .font(.system(size: 13))
                                    .foregroundColor(.white.opacity(0.6))
                            }
                            Spacer()
                        }
                        .transition(.opacity)
                    }

                    Spacer().frame(height: 24)

                    Group {
                        switch status {
                        case .success:
                            successView()
                        case .error:
                            errorView()
                        case .processing:
                            processingView()
                        case .confirming:
                            confirmView()
                        case .idle:
                            if visible { formView() }
                        }
                    }

                    Spacer().frame(height: 24)
                }
                .padding(.horizontal, 24)
            }
        }
        .onAppear {
            fetchBalance()
            withAnimation(.easeOut(duration: 0.5).delay(0.1)) { visible = true }
        }
    }

    // MARK: - Success View
    @ViewBuilder
    private func successView() -> some View {
        VStack(spacing: 20) {
            ZStack {
                Circle()
                    .fill(AppColors.green.opacity(0.15))
                    .frame(width: 72, height: 72)
                Image(systemName: "checkmark")
                    .font(.system(size: 36))
                    .foregroundColor(AppColors.green)
            }

            Text("Transfer Successful!")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(.white)

            Text("e₹ \(String(format: "%.2f", parsedAmount)) sent to \(toAddress.prefix(8))...\(toAddress.suffix(6))")
                .font(.system(size: 14))
                .foregroundColor(.white.opacity(0.65))
                .multilineTextAlignment(.center)

            // TX Hash
            VStack(alignment: .leading, spacing: 6) {
                Text("Transaction Hash")
                    .font(.system(size: 11))
                    .foregroundColor(.white.opacity(0.5))
                Text(txHash)
                    .font(.system(size: 12))
                    .foregroundColor(AppColors.primaryBlueLight)
                    .lineLimit(2)
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white.opacity(0.06))
            .clipShape(RoundedRectangle(cornerRadius: 12))

            HStack(spacing: 12) {
                Button {
                    toAddress = ""; amount = ""; note = ""
                    status = .idle; txHash = ""
                } label: {
                    Text("Send Again")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity, minHeight: 44)
                }
                .background(AppColors.primaryBlue)
                .foregroundColor(.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))

                Button(action: onBack) {
                    Text("Done")
                        .frame(maxWidth: .infinity, minHeight: 44)
                }
                .background(Color.white.opacity(0.1))
                .foregroundColor(.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding(32)
        .background(Color.white.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }

    // MARK: - Error View
    @ViewBuilder
    private func errorView() -> some View {
        VStack(spacing: 16) {
            HStack(spacing: 12) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(AppColors.redLight)
                VStack(alignment: .leading) {
                    Text("Transfer Failed")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(AppColors.redLight)
                    Text(errorMsg)
                        .font(.system(size: 13))
                        .foregroundColor(.white.opacity(0.7))
                }
            }
            .padding(20)
            .background(AppColors.redDarkest.opacity(0.3))
            .clipShape(RoundedRectangle(cornerRadius: 16))

            Button { status = .idle } label: {
                Text("Try Again")
                    .frame(maxWidth: .infinity, minHeight: 44)
            }
            .background(Color.white.opacity(0.1))
            .foregroundColor(.white)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    // MARK: - Processing View
    @ViewBuilder
    private func processingView() -> some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)
                .tint(AppColors.primaryBlue)
            Text("Processing Transfer...")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(.white)
            Text("Submitting to network")
                .font(.system(size: 13))
                .foregroundColor(.white.opacity(0.5))
        }
        .padding(48)
        .frame(maxWidth: .infinity)
        .background(Color.white.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }

    // MARK: - Confirm View
    @ViewBuilder
    private func confirmView() -> some View {
        VStack(spacing: 20) {
            Text("Confirm Transfer")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.white)

            confirmRow("To", "\(toAddress.prefix(10))...\(toAddress.suffix(6))")
            Divider().background(Color.white.opacity(0.08))
            confirmRow("Amount", "e₹ \(String(format: "%.2f", parsedAmount))", AppColors.green)
            if !note.isEmpty {
                Divider().background(Color.white.opacity(0.08))
                confirmRow("Note", note)
            }
            Divider().background(Color.white.opacity(0.08))
            confirmRow("Network Fee", "FREE (CBDC)", AppColors.green)

            Spacer().frame(height: 4)

            HStack(spacing: 12) {
                Button { status = .idle } label: {
                    Text("Cancel")
                        .frame(maxWidth: .infinity, minHeight: 44)
                }
                .background(Color.white.opacity(0.08))
                .foregroundColor(.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))

                Button { sendTransfer() } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "paperplane.fill")
                            .font(.system(size: 14))
                        Text("Confirm & Send")
                    }
                    .frame(maxWidth: .infinity, minHeight: 44)
                }
                .background(AppColors.primaryBlue)
                .foregroundColor(.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding(24)
        .background(Color.white.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    @ViewBuilder
    private func confirmRow(_ label: String, _ value: String, _ valueColor: Color = .white) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 14))
                .foregroundColor(.white.opacity(0.5))
            Spacer()
            Text(value)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(valueColor)
                .lineLimit(1)
        }
        .padding(.vertical, 4)
    }

    // MARK: - Form View
    @ViewBuilder
    private func formView() -> some View {
        VStack(spacing: 16) {
            // Available balance banner
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Available Balance")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.6))
                    Text("e₹ \(String(format: "%.2f", availableBalance))")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(AppColors.green)
                }
                Spacer()
            }
            .padding(16)
            .background(AppColors.green.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 16))

            // Form card
            VStack(spacing: 16) {
                // Recipient
                VStack(alignment: .leading, spacing: 6) {
                    Text("Recipient Wallet Address *")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.55))

                    TextField("0x1234...abcd", text: $toAddress)
                        .padding()
                        .background(Color.white.opacity(0.06))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.white.opacity(0.2), lineWidth: 1)
                        )
                        .foregroundColor(.white)
                        .autocapitalization(.none)

                    if !toAddress.isEmpty && !toAddress.hasPrefix("0x") {
                        Text("Address must start with 0x")
                            .font(.system(size: 11))
                            .foregroundColor(AppColors.redLight)
                    }
                }

                // Amount
                VStack(alignment: .leading, spacing: 6) {
                    Text("Amount (e₹) *")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.55))

                    TextField("0.00", text: $amount)
                        .keyboardType(.decimalPad)
                        .padding()
                        .background(Color.white.opacity(0.06))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.white.opacity(0.2), lineWidth: 1)
                        )
                        .foregroundColor(.white)

                    if parsedAmount > availableBalance && !amount.isEmpty {
                        Text("Exceeds available balance")
                            .font(.system(size: 11))
                            .foregroundColor(AppColors.redLight)
                    }

                    // Quick amounts
                    HStack(spacing: 8) {
                        ForEach([100, 500, 1000, 5000], id: \.self) { quickAmt in
                            Button { amount = "\(quickAmt)" } label: {
                                Text("₹\(quickAmt)")
                                    .font(.system(size: 12))
                                    .foregroundColor(AppColors.primaryBlueLight)
                            }
                        }
                    }
                }

                // Note
                VStack(alignment: .leading, spacing: 6) {
                    Text("Note (optional)")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.55))

                    TextField("e.g. Rent Feb 2026", text: $note)
                        .padding()
                        .background(Color.white.opacity(0.06))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.white.opacity(0.2), lineWidth: 1)
                        )
                        .foregroundColor(.white)
                }

                // Review button
                Button { status = .confirming } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "paperplane.fill")
                        Text("Review Transfer")
                            .font(.system(size: 16, weight: .semibold))
                    }
                    .frame(maxWidth: .infinity, minHeight: 52)
                }
                .background(isFormValid ? AppColors.primaryBlue : Color.white.opacity(0.1))
                .foregroundColor(.white)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .disabled(!isFormValid)
            }
            .padding(20)
            .background(Color.white.opacity(0.07))
            .clipShape(RoundedRectangle(cornerRadius: 20))
        }
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }

    // MARK: - API

    private func fetchBalance() {
        Task {
            do {
                let b = try await api.getBalance(userId: userId)
                await MainActor.run { balance = b }
            } catch {
                print("SendScreen balance error: \(error)")
            }
        }
    }

    private func sendTransfer() {
        status = .processing
        Task {
            do {
                let resp = try await api.transferTokens(
                    TransferRequest(fromUserId: userId, toAddress: toAddress, amount: amount, note: note)
                )
                let balResp = try await api.getBalance(userId: userId)
                await MainActor.run {
                    txHash = resp.tx ?? ""
                    balance = balResp
                    status = .success
                }
            } catch {
                await MainActor.run {
                    errorMsg = error.localizedDescription
                    status = .error
                }
            }
        }
    }
}
