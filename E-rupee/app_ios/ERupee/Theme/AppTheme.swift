import SwiftUI

// MARK: - App Color Palette (matching Android colors)
struct AppColors {
    // Backgrounds
    static let backgroundDark   = Color(hex: 0x0F172A)
    static let backgroundSlate  = Color(hex: 0x1E293B)
    static let backgroundLight  = Color(hex: 0x334155)

    // Primary Blue
    static let primaryBlue      = Color(hex: 0x3B82F6)
    static let primaryBlueDark  = Color(hex: 0x2563EB)
    static let primaryBlueDeep  = Color(hex: 0x1D4ED8)
    static let primaryBlueDarkest = Color(hex: 0x1E3A8A)
    static let primaryBlueLight = Color(hex: 0x60A5FA)

    // Purple
    static let purple           = Color(hex: 0x8B5CF6)
    static let purpleDark       = Color(hex: 0x7C3AED)

    // Green
    static let green            = Color(hex: 0x22C55E)
    static let greenDark        = Color(hex: 0x16A34A)
    static let greenTeal        = Color(hex: 0x10B981)

    // Yellow / Amber
    static let amber            = Color(hex: 0xF59E0B)
    static let amberLight       = Color(hex: 0xFBBF24)

    // Red
    static let red              = Color(hex: 0xEF4444)
    static let redDark          = Color(hex: 0xDC2626)
    static let redDarkest       = Color(hex: 0x7F1D1D)
    static let redLight         = Color(hex: 0xF87171)

    // Pink
    static let pink             = Color(hex: 0xEC4899)
    static let pinkDark         = Color(hex: 0xBE185D)

    // Slate
    static let slate            = Color(hex: 0x64748B)
    static let slateLight       = Color(hex: 0x94A3B8)

    // Gradients
    static let backgroundGradient = LinearGradient(
        colors: [backgroundDark, backgroundSlate, backgroundLight],
        startPoint: .top,
        endPoint: .bottom
    )

    static let blueGradient = LinearGradient(
        colors: [primaryBlueDarkest, primaryBlue, primaryBlueLight],
        startPoint: .top,
        endPoint: .bottom
    )

    static let balanceCardGradient = LinearGradient(
        colors: [primaryBlue, purple],
        startPoint: .leading,
        endPoint: .trailing
    )

    static let profileBannerGradient = LinearGradient(
        colors: [primaryBlueDeep, purpleDark],
        startPoint: .leading,
        endPoint: .trailing
    )
}

// MARK: - Color from Hex
extension Color {
    init(hex: UInt, alpha: Double = 1.0) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255.0,
            green: Double((hex >> 8) & 0xFF) / 255.0,
            blue: Double(hex & 0xFF) / 255.0,
            opacity: alpha
        )
    }
}
