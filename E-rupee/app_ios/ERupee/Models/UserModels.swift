import Foundation

// MARK: - Auth Request/Response

struct UserRequest: Codable {
    let name: String
    let email: String
    let phone: String
    let password: String
    let state: String
    let pan: String
}

struct UserResponse: Codable {
    let message: String
    let user: UserData?
}

struct LoginRequest: Codable {
    let identifier: String
    let password: String
}

struct LoginResponse: Codable {
    let message: String
    let user: UserData?
}

// MARK: - User Data

struct UserData: Codable, Identifiable {
    let id: Int
    let name: String
    let email: String
    let phone: String
    let state: String
    let walletAddress: String?

    enum CodingKeys: String, CodingKey {
        case id, name, email, phone, state, walletAddress
    }
}

struct UsersListResponse: Codable {
    let users: [UserData]
}
