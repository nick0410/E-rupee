import SwiftUI

// MARK: - Main Tab View (Bottom Navigation)
struct MainTabView: View {
    let userId: Int
    let navigate: (Route) -> Void

    @State private var selectedTab = 0

    private let tabs: [(String, String)] = [
        ("Home", "house.fill"),
        ("Invest", "chart.line.uptrend.xyaxis"),
        ("Analytics", "chart.bar.fill"),
        ("Profile", "person.fill"),
    ]

    var body: some View {
        VStack(spacing: 0) {
            // Content
            Group {
                switch selectedTab {
                case 0: HomeView(userId: userId, navigate: navigate)
                case 1: InvestmentView(userId: userId)
                case 2: AnalyticsView(userId: userId)
                case 3: ProfileView(userId: userId, onLogout: { navigate(.entry) })
                default: HomeView(userId: userId, navigate: navigate)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            // ── Bottom Navigation Bar ──
            HStack {
                ForEach(0..<tabs.count, id: \.self) { index in
                    let isSelected = selectedTab == index
                    Button {
                        selectedTab = index
                    } label: {
                        VStack(spacing: 4) {
                            Image(systemName: tabs[index].1)
                                .font(.system(size: 20))
                                .foregroundColor(isSelected ? AppColors.primaryBlue : .white.opacity(0.45))

                            Text(tabs[index].0)
                                .font(.system(size: 11, weight: isSelected ? .semibold : .regular))
                                .foregroundColor(isSelected ? AppColors.primaryBlue : .white.opacity(0.45))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                    }
                }
            }
            .padding(.horizontal, 4)
            .padding(.bottom, 4)
            .background(AppColors.backgroundSlate)
        }
    }
}
