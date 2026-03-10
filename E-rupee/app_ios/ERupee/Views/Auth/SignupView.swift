import SwiftUI

// MARK: - Sign Up Screen
struct SignupView: View {
    let onSuccess: (Int) -> Void

    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var password = ""
    @State private var state = ""
    @State private var pan = ""
    @State private var passwordVisible = false
    @State private var visible = false
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showSuccessDialog = false
    @State private var registeredUserId = 0

    private let api = APIService()

    var body: some View {
        ZStack {
            AppColors.blueGradient.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    Spacer().frame(height: 40)

                    // ── Logo ──
                    if visible {
                        ZStack {
                            Circle()
                                .fill(RadialGradient(
                                    colors: [.white, Color(hex: 0xF0F9FF)],
                                    center: .center, startRadius: 5, endRadius: 40
                                ))
                                .frame(width: 80, height: 80)
                                .shadow(color: AppColors.primaryBlueLight.opacity(0.5), radius: 20, y: 8)

                            Text("e₹")
                                .font(.system(size: 40, weight: .bold))
                                .foregroundColor(AppColors.primaryBlueDarkest)
                        }
                        .transition(.scale.combined(with: .opacity))
                    }

                    Spacer().frame(height: 24)

                    // ── Title ──
                    if visible {
                        VStack(spacing: 8) {
                            Text("Create Account")
                                .font(.system(size: 32, weight: .bold))
                                .foregroundColor(.white)
                            Text("Sign up to get started")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.85))
                        }
                        .transition(.move(edge: .top).combined(with: .opacity))
                    }

                    Spacer().frame(height: 32)

                    // ── Form Fields ──
                    if visible {
                        VStack(spacing: 16) {
                            formField(icon: "person.fill", placeholder: "Full Name", text: $name)
                            formField(icon: "envelope.fill", placeholder: "Email", text: $email, keyboard: .emailAddress)
                            formField(icon: "phone.fill", placeholder: "Phone Number", text: $phone, keyboard: .phonePad)

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

                            formField(icon: "location.fill", placeholder: "State", text: $state)

                            // PAN
                            VStack(alignment: .leading, spacing: 4) {
                                formField(icon: "creditcard.fill", placeholder: "PAN Number", text: $pan)
                                Text("Format: ABCDE1234F")
                                    .font(.caption2)
                                    .foregroundColor(.white.opacity(0.7))
                                    .padding(.leading, 4)
                            }
                        }
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer().frame(height: 32)

                    // ── Error Message ──
                    if let error = errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(AppColors.redLight)
                            .padding(.bottom, 8)
                    }

                    // ── Sign Up Button ──
                    if visible {
                        Button { signup() } label: {
                            if isLoading {
                                ProgressView().tint(AppColors.primaryBlueDarkest)
                                    .frame(maxWidth: .infinity, minHeight: 56)
                            } else {
                                Text("Sign Up")
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

                    // ── Login Link ──
                    if visible {
                        HStack(spacing: 4) {
                            Text("Already have an account?")
                                .foregroundColor(.white.opacity(0.85))
                            Text("Login")
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                        }
                        .font(.subheadline)
                        .transition(.opacity)
                    }

                    Spacer().frame(height: 24)
                }
                .padding(.horizontal, 32)
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.7, dampingFraction: 0.7).delay(0.1)) {
                visible = true
            }
        }
        .alert("Verification Successful", isPresented: $showSuccessDialog) {
            Button("Continue") {
                onSuccess(registeredUserId)
            }
        } message: {
            Text("Your account has been successfully verified.")
        }
    }

    @ViewBuilder
    private func formField(icon: String, placeholder: String, text: Binding<String>, keyboard: UIKeyboardType = .default) -> some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(AppColors.primaryBlueDarkest)
                .frame(width: 24)
            TextField(placeholder, text: text)
                .keyboardType(keyboard)
                .autocapitalization(keyboard == .emailAddress ? .none : .words)
        }
        .padding()
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .white.opacity(0.3), radius: 8, y: 4)
    }

    private func isPanValid(_ pan: String) -> Bool {
        let regex = try! NSRegularExpression(pattern: "^[A-Z]{5}[0-9]{4}[A-Z]$")
        return regex.firstMatch(in: pan, range: NSRange(pan.startIndex..., in: pan)) != nil
    }

    private func signup() {
        guard !name.isEmpty, !email.isEmpty, !phone.isEmpty, !password.isEmpty, !state.isEmpty, !pan.isEmpty else {
            errorMessage = "Please fill in all fields"
            return
        }
        let panUpper = pan.uppercased()
        guard isPanValid(panUpper) else {
            errorMessage = "Invalid PAN format"
            return
        }
        isLoading = true
        errorMessage = nil

        Task {
            do {
                let response = try await api.registerUser(
                    UserRequest(name: name, email: email, phone: phone, password: password, state: state, pan: panUpper)
                )
                await MainActor.run {
                    registeredUserId = response.user?.id ?? 0
                    showSuccessDialog = true
                    isLoading = false
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
