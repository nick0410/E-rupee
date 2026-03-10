import SwiftUI

// MARK: - Root Navigation
struct ContentView: View {
    @State private var path = NavigationPath()
    @State private var loggedInUserId: Int? = nil

    var body: some View {
        NavigationStack(path: $path) {
            EntryView(
                onLogin: { path.append(Route.login) },
                onSignup: { path.append(Route.signup) }
            )
            .navigationBarHidden(true)
            .navigationDestination(for: Route.self) { route in
                switch route {
                case .login:
                    LoginView { userId in
                        loggedInUserId = userId
                        // Pop to root then push main
                        path = NavigationPath()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                            path.append(Route.main(userId: userId))
                        }
                    }
                    .navigationBarHidden(true)

                case .signup:
                    SignupView { userId in
                        loggedInUserId = userId
                        path = NavigationPath()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                            path.append(Route.main(userId: userId))
                        }
                    }
                    .navigationBarHidden(true)

                case .main(let userId):
                    MainTabView(userId: userId) { route in
                        path.append(route)
                    }
                    .navigationBarHidden(true)

                case .send(let userId):
                    SendView(userId: userId, onBack: { path.removeLast() })
                        .navigationBarHidden(true)

                case .receive(let userId):
                    ReceiveView(userId: userId, onBack: { path.removeLast() })
                        .navigationBarHidden(true)

                case .entry:
                    EntryView(
                        onLogin: { path.append(Route.login) },
                        onSignup: { path.append(Route.signup) }
                    )
                    .navigationBarHidden(true)
                }
            }
        }
    }
}

// MARK: - Routes
enum Route: Hashable {
    case entry
    case login
    case signup
    case main(userId: Int)
    case send(userId: Int)
    case receive(userId: Int)
}
