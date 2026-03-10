import SwiftUI

// MARK: - Login Screen
struct LoginView: View {
    let onSuccess: (Int) -> Void

    @State private var email = ""
    @State private var password = ""
    @State private var passwordVisible = false
    @State private var visible = false
    @State private var isLoading = false
    @State private var errorMessage: String?

    private let api = APIService()

    var body: some View {
        ZStack {
            AppColors.blueGradient.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    Spacer().frame(height: 60)

                    // ── Logo ──
                    if visible {
                        ZStack {
                            Circle()
                                .fill(
                                    RadialGradient(
                                        colors: [.white, Color(hex: 0xF0F9FF)],
                                        center: .center,
                                        startRadius: 5,
                                        endRadius: 40
                                    )
                                )
                                .frame(width: 80, height: 80)
                                .shadow(color: AppColors.primaryBlueLight.opacity(0.5), radius: 20, y: 8)

                            Text("e₹")
                                .font(.system(size: 40, weight: .bold))
                                .foregroundColor(AppColors.primaryBlueDarkest)
                        }
                        .transition(.scale.combined(with: .opacity))
                    }

                    Spacer().frame(height: 32)

                    // ── Title ──
                    if visible {
                        VStack(spacing: 8) {
                            Text("Welcome Back")
                                .font(.system(size: 32, weight: .bold))
                                .foregroundColor(.white)

                            Text("Sign in to your eRupeeX wallet")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.85))
                        }
                        .transition(.move(edge: .top).combined(with: .opacity))
                    }

                    Spacer().frame(height: 48)

                    // ── Form Fields ──
                    if visible {
                        VStack(spacing: 16) {
                            // Email
                            HStack {
                                Image(systemName: "envelope.fill")
                                    .foregroundColor(AppColors.primaryBlueDarkest)
                                    .frame(width: 24)
                                TextField("Email", text: $email)
                                    .textContentType(.emailAddress)
                                    .autocapitalization(.none)
                                    .keyboardType(.emailAddress)
                            }
                            .padding()
                            .background(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .shadow(color: .white.opacity(0.3), radius: 8, y: 4)

                            // Password
                            HStack {
                                Image(systemName: "lock.fill")
                                    .foregroundColor(AppColors.primaryBlueDarkest)
                                    .frame(width: 24)
                                if passwordVisible {
                                    TextField("Password", text: $password)
                                } else {
                                    SecureField("Password", text: $password)
                                }
                                Button {
                                    passwordVisible.toggle()
                                } label: {
                                    Image(systemName: passwordVisible ? "eye.fill" : "eye.slash.fill")
                                        .foregroundColor(AppColors.slate)
                                }
                            }
                            .padding()
                            .background(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .shadow(color: .white.opacity(0.3), radius: 8, y: 4)
                        }
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer().frame(height: 24)

                    // ── Forgot Password ──
                    if visible {
                        HStack {
                            Spacer()
                            Text("Forgot password?")
                                .font(.callout.weight(.semibold))
                                .foregroundColor(.white)
                        }
                        .transition(.opacity)
                    }

                    Spacer().frame(height: 32)

                    // ── Error Message ──
                    if let error = errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(AppColors.redLight)
                            .padding(.bottom, 8)
                    }

                    // ── Login Button ──
                    if visible {
                        Button {
                            login()
                        } label: {
                            if isLoading {
                                ProgressView()
                                    .tint(.white)
                                    .frame(maxWidth: .infinity, minHeight: 56)
                            } else {
                                Text("Login")
                                    .font(.system(size: 18, weight: .bold))
                                    .tracking(0.5)
                                    .frame(maxWidth: .infinity, minHeight: 56)
                            }
                        }
                        .background(.white)
                        .foregroundColor(AppColors.primaryBlueDarkest)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .shadow(color: .white.opacity(0.5), radius: 12, y: 4)
                        .disabled(isLoading)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer().frame(height: 24)

                    // ── Sign Up Link ──
                    if visible {
                        HStack(spacing: 4) {
                            Text("Don't have an account?")
                                .foregroundColor(.white.opacity(0.85))
                            Text("Sign Up")
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                        }
                        .font(.subheadline)
                        .transition(.opacity)
                    }

                    Spacer()
                }
                .padding(.horizontal, 32)
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.7, dampingFraction: 0.7).delay(0.1)) {
                visible = true
            }
        }
    }

    private func login() {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Please fill in all fields"
            return
        }
        isLoading = true
        errorMessage = nil

        Task {
            do {
                let response = try await api.loginUser(LoginRequest(identifier: email, password: password))
                if let userId = response.user?.id {
                    await MainActor.run {
                        onSuccess(userId)
                    }
                } else {
                    await MainActor.run {
                        errorMessage = "Invalid credentials"
                        isLoading = false
                    }
                }
            } catch {
                await MainActor.run {
                    errorMessage = "Error: \(error.localizedDescription)"
                    isLoading = false
                }
            }
        }
    }
}
