import SwiftUI

// MARK: - Entry Screen (Splash / Welcome)
struct EntryView: View {
    let onLogin: () -> Void
    let onSignup: () -> Void

    @State private var visible = false

    var body: some View {
        ZStack {
            AppColors.backgroundGradient
                .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // ── Logo ──
                if visible {
                    ZStack {
                        Circle()
                            .fill(
                                RadialGradient(
                                    colors: [AppColors.primaryBlue, AppColors.primaryBlueDark, AppColors.primaryBlueDeep],
                                    center: .center,
                                    startRadius: 10,
                                    endRadius: 60
                                )
                            )
                            .frame(width: 120, height: 120)
                            .shadow(color: AppColors.primaryBlue.opacity(0.5), radius: 24, y: 8)

                        Text("e₹")
                            .font(.system(size: 56, weight: .bold))
                            .foregroundColor(.white)
                    }
                    .transition(.scale.combined(with: .opacity))
                }

                Spacer().frame(height: 40)

                // ── Title ──
                if visible {
                    VStack(spacing: 8) {
                        Text("Welcome to")
                            .font(.title3)
                            .foregroundColor(.white.opacity(0.7))
                            .tracking(1)

                        Text("eRupeeX")
                            .font(.system(size: 48, weight: .bold))
                            .foregroundColor(.white)

                        Text("Your Digital Currency Platform")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.6))
                    }
                    .transition(.move(edge: .top).combined(with: .opacity))
                }

                Spacer().frame(height: 80)

                // ── Buttons ──
                if visible {
                    VStack(spacing: 16) {
                        Button(action: onLogin) {
                            Text("Login")
                                .font(.system(size: 18, weight: .bold))
                                .tracking(0.5)
                                .frame(maxWidth: .infinity, minHeight: 58)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(AppColors.primaryBlue)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .shadow(color: AppColors.primaryBlue.opacity(0.4), radius: 12, y: 4)

                        Button(action: onSignup) {
                            Text("Sign Up")
                                .font(.system(size: 18, weight: .semibold))
                                .tracking(0.5)
                                .frame(maxWidth: .infinity, minHeight: 58)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16)
                                        .stroke(Color.white.opacity(0.4), lineWidth: 2)
                                )
                        }
                        .foregroundColor(.white)
                    }
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }

                Spacer().frame(height: 40)

                // ── Footer ──
                if visible {
                    Text("Secure • Fast • Reliable")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.5))
                        .tracking(2)
                        .transition(.opacity)
                }

                Spacer()
            }
            .padding(.horizontal, 32)
        }
        .onAppear {
            withAnimation(.spring(response: 0.7, dampingFraction: 0.7).delay(0.1)) {
                visible = true
            }
        }
    }
}
