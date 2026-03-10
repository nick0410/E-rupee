import SwiftUI

// MARK: - Profile Screen
struct ProfileView: View {
    let userId: Int
    let onLogout: () -> Void

    @State private var visible = false
    @State private var balance = BalanceResponse()
    @State private var userData: UserData?
    @State private var txCount = 0
    @State private var showLogout = false
    @State private var copied = false

    private let api = APIService()

    var body: some View {
        ZStack {
            AppColors.backgroundGradient.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    Spacer().frame(height: 48)

                    // ── Header ──
                    if visible {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Profile")
                                .font(.system(size: 26, weight: .bold))
                                .foregroundColor(.white)
                            Text("Account & wallet information")
                                .font(.system(size: 13))
                                .foregroundColor(.white.opacity(0.55))
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .transition(.opacity)
                    }

                    Spacer().frame(height: 24)

                    // ── Avatar + Name Banner ──
                    if visible {
                        let name = userData?.name ?? "User"
                        let initials = name.split(separator: " ")
                            .compactMap { $0.first?.uppercased() }
                            .prefix(2).joined()

                        HStack(spacing: 16) {
                            ZStack {
                                Circle()
                                    .fill(Color.white.opacity(0.2))
                                    .frame(width: 70, height: 70)
                                Text(initials.isEmpty ? "U" : initials)
                                    .font(.system(size: 28, weight: .bold))
                                    .foregroundColor(.white)
                            }

                            VStack(alignment: .leading, spacing: 4) {
                                Text(name)
                                    .font(.system(size: 22, weight: .bold))
                                    .foregroundColor(.white)
                                Text(userData?.email ?? "—")
                                    .font(.system(size: 13))
                                    .foregroundColor(.white.opacity(0.7))
                                Spacer().frame(height: 2)
                                Text("ID #\(userId)")
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(Color.white.opacity(0.15))
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(24)
                        .background(
                            LinearGradient(
                                colors: [AppColors.primaryBlueDeep, AppColors.purpleDark],
                                startPoint: .leading, endPoint: .trailing
                            )
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 24))
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer().frame(height: 16)

                    // ── Stats Pills ──
                    if visible {
                        HStack(spacing: 10) {
                            profileStat("Balance", "e₹ \(balance.balance.split(separator: ".").first.map(String.init) ?? balance.balance)", AppColors.primaryBlue)
                            profileStat("Available", "e₹ \(balance.available.split(separator: ".").first.map(String.init) ?? balance.available)", AppColors.green)
                            profileStat("Transactions", "\(txCount)", AppColors.purple)
                        }
                        .transition(.opacity)
                    }

                    Spacer().frame(height: 16)

                    // ── Account Info ──
                    if visible {
                        infoCard(title: "Account Information", icon: "person.fill", iconColor: AppColors.primaryBlue) {
                            infoRow("Full Name", userData?.name ?? "—")
                            Divider().background(Color.white.opacity(0.06))
                            infoRow("Email", userData?.email ?? "—")
                            Divider().background(Color.white.opacity(0.06))
                            infoRow("Phone", userData?.phone ?? "—")
                            Divider().background(Color.white.opacity(0.06))
                            infoRow("State", userData?.state ?? "—")
                        }
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer().frame(height: 14)

                    // ── Wallet Info ──
                    if visible {
                        walletCard()
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer().frame(height: 14)

                    // ── Security Status ──
                    if visible {
                        securityCard()
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer().frame(height: 20)

                    // ── Logout Button ──
                    if visible {
                        Button {
                            showLogout = true
                        } label: {
                            HStack(spacing: 10) {
                                Image(systemName: "rectangle.portrait.and.arrow.right")
                                    .foregroundColor(AppColors.redLight)
                                Text("Log Out")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(AppColors.redLight)
                            }
                            .frame(maxWidth: .infinity, minHeight: 54)
                        }
                        .background(AppColors.redDarkest.opacity(0.6))
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .transition(.opacity)
                    }

                    Spacer().frame(height: 24)
                }
                .padding(.horizontal, 20)
            }
        }
        .onAppear {
            loadProfile()
            withAnimation(.easeOut(duration: 0.6).delay(0.1)) { visible = true }
        }
        .alert("Log Out?", isPresented: $showLogout) {
            Button("Log Out", role: .destructive) { onLogout() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("You'll need to log in again to access your wallet.")
        }
    }

    // MARK: - Components

    @ViewBuilder
    private func profileStat(_ label: String, _ value: String, _ color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(color)
            Text(label)
                .font(.system(size: 10))
                .foregroundColor(.white.opacity(0.45))
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(Color.white.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    @ViewBuilder
    private func infoCard<Content: View>(title: String, icon: String, iconColor: Color, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .foregroundColor(iconColor)
                    .font(.system(size: 14))
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
            }
            content()
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    @ViewBuilder
    private func infoRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 13))
                .foregroundColor(.white.opacity(0.5))
            Spacer()
            Text(value)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.white)
        }
        .padding(.vertical, 4)
    }

    @ViewBuilder
    private func walletCard() -> some View {
        let address = balance.address
        let shortAddr = address.count > 16
            ? "\(address.prefix(10))...\(address.suffix(6))" : address

        VStack(alignment: .leading, spacing: 14) {
            Text("Wallet")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.white)

            VStack(alignment: .leading, spacing: 6) {
                Text("Wallet Address")
                    .font(.system(size: 11))
                    .foregroundColor(.white.opacity(0.45))
                HStack {
                    Text(address.isEmpty ? "—" : shortAddr)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(AppColors.primaryBlueLight)

                    Spacer()
                    if !address.isEmpty {
                        Button {
                            UIPasteboard.general.string = address
                            copied = true
                            DispatchQueue.main.asyncAfter(deadline: .now() + 2) { copied = false }
                        } label: {
                            Image(systemName: copied ? "checkmark" : "doc.on.doc")
                                .font(.system(size: 14))
                                .foregroundColor(copied ? AppColors.green : AppColors.primaryBlueLight)
                        }
                    }
                }
            }

            Divider().background(Color.white.opacity(0.06))

            walletInfoRow("Total Balance", "e₹ \(balance.balance)", .white)
            walletInfoRow("Available", "e₹ \(balance.available)", AppColors.green)
            walletInfoRow("Locked", "e₹ \(balance.locked)", AppColors.amber)

            Divider().background(Color.white.opacity(0.06))
            walletInfoRow("Network", "eRupee CBDC (Chain 1337)", .white)
        }
        .padding(20)
        .background(Color.white.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    @ViewBuilder
    private func walletInfoRow(_ label: String, _ value: String, _ color: Color) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 13))
                .foregroundColor(.white.opacity(0.5))
            Spacer()
            Text(value)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(color)
        }
    }

    @ViewBuilder
    private func securityCard() -> some View {
        let securityItems: [(String, Bool)] = [
            ("Account Active", true),
            ("Email Verified", userData?.email.isEmpty == false),
            ("Wallet Linked", !balance.address.isEmpty),
            ("KYC Completed", true),
        ]

        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 8) {
                Image(systemName: "shield.fill")
                    .foregroundColor(AppColors.green)
                    .font(.system(size: 14))
                Text("Security Status")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
            }

            ForEach(securityItems, id: \.0) { label, status in
                HStack {
                    Text(label)
                        .font(.system(size: 13))
                        .foregroundColor(.white.opacity(0.8))
                    Spacer()
                    Text(status ? "VERIFIED" : "PENDING")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(status ? AppColors.green : AppColors.redLight)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background((status ? AppColors.green : AppColors.redDark).opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color.white.opacity(0.04))
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }
        }
        .padding(20)
        .background(Color.white.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    // MARK: - API
    private func loadProfile() {
        Task {
            do {
                let b = try await api.getBalance(userId: userId)
                let users = try await api.getUsers()
                let txs = try await api.getTransactions(userId: userId)
                await MainActor.run {
                    balance = b
                    userData = users.users.first { $0.id == userId }
                    txCount = txs.transactions.count
                }
            } catch {
                print("Profile error: \(error)")
            }
        }
    }
}
