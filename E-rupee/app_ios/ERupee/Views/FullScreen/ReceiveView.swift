import SwiftUI

// MARK: - Receive Screen
struct ReceiveView: View {
    let userId: Int
    let onBack: () -> Void

    @State private var balance = BalanceResponse()
    @State private var visible = false
    @State private var copied = false

    private let api = APIService()
    private var address: String { balance.address }
    private var qrData: String { "erupee://pay?to=\(address)&amount=0" }

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
                                Text("Receive e₹")
                                    .font(.system(size: 24, weight: .bold))
                                    .foregroundColor(.white)
                                Text("Share your wallet address or QR code")
                                    .font(.system(size: 13))
                                    .foregroundColor(.white.opacity(0.6))
                            }
                            Spacer()
                        }
                        .transition(.opacity)
                    }

                    Spacer().frame(height: 24)

                    // ── Wallet Address Card ──
                    if visible {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Your Wallet Address")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)

                            Text(address.isEmpty ? "Loading address..." : address)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(AppColors.primaryBlueLight)
                                .lineSpacing(6)
                                .padding(16)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color.white.opacity(0.06))
                                .clipShape(RoundedRectangle(cornerRadius: 12))

                            Button {
                                if !address.isEmpty {
                                    UIPasteboard.general.string = address
                                    copied = true
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) { copied = false }
                                }
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: copied ? "checkmark" : "doc.on.doc")
                                        .font(.system(size: 16))
                                    Text(copied ? "Copied!" : "Copy Address")
                                        .font(.system(size: 15, weight: .semibold))
                                }
                                .frame(maxWidth: .infinity, minHeight: 50)
                                .foregroundColor(.white)
                            }
                            .background(address.isEmpty ? Color.white.opacity(0.1) : AppColors.primaryBlue)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .disabled(address.isEmpty)
                        }
                        .padding(20)
                        .background(Color.white.opacity(0.07))
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer().frame(height: 16)

                    // ── QR Code Card ──
                    if visible {
                        VStack(spacing: 16) {
                            Text("QR Code")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)

                            // QR-like pattern
                            ZStack {
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(.white)
                                    .frame(width: 200, height: 200)

                                qrPatternView()
                                    .frame(width: 176, height: 176)
                            }

                            Text("Scan to send e₹ to this wallet")
                                .font(.system(size: 12))
                                .foregroundColor(.white.opacity(0.5))
                        }
                        .padding(20)
                        .frame(maxWidth: .infinity)
                        .background(Color.white.opacity(0.07))
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer().frame(height: 16)

                    // ── Deep Link Card ──
                    if visible {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("Payment Deep Link")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.white)
                                Spacer()
                                Button {
                                    UIPasteboard.general.string = qrData
                                    copied = true
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) { copied = false }
                                } label: {
                                    Image(systemName: copied ? "checkmark" : "doc.on.doc")
                                        .font(.system(size: 16))
                                        .foregroundColor(AppColors.primaryBlueLight)
                                }
                            }

                            Text(qrData)
                                .font(.system(size: 11))
                                .foregroundColor(.white.opacity(0.4))
                                .lineSpacing(4)
                        }
                        .padding(20)
                        .background(Color.white.opacity(0.07))
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .transition(.move(edge: .bottom).combined(with: .opacity))
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

    // MARK: - QR Pattern (deterministic from address)
    @ViewBuilder
    private func qrPatternView() -> some View {
        Canvas { context, size in
            let cellSize = size.width / 12.0
            for row in 0..<12 {
                for col in 0..<12 {
                    let idx = row * 12 + col
                    let charCode: Int
                    if !address.isEmpty {
                        let safeIdx = address.index(address.startIndex, offsetBy: idx % address.count)
                        charCode = Int(address[safeIdx].asciiValue ?? 0)
                    } else {
                        charCode = 0
                    }
                    let isFilled = charCode % 3 != 0
                    let isCorner = (row < 3 && col < 3) ||
                                   (row < 3 && col > 8) ||
                                   (row > 8 && col < 3)

                    if isFilled || isCorner {
                        let rect = CGRect(
                            x: CGFloat(col) * cellSize + 1,
                            y: CGFloat(row) * cellSize + 1,
                            width: cellSize - 2,
                            height: cellSize - 2
                        )
                        context.fill(Path(rect), with: .color(AppColors.backgroundDark))
                    }
                }
            }
        }
    }

    // MARK: - API
    private func fetchBalance() {
        Task {
            do {
                let b = try await api.getBalance(userId: userId)
                await MainActor.run { balance = b }
            } catch {
                print("ReceiveScreen balance error: \(error)")
            }
        }
    }
}
