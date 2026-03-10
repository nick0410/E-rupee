import Foundation

// MARK: - API Service (mirrors Android ApiService.kt)

struct APIService {
    private let client = NetworkClient.shared

    // MARK: - Health Check
    func healthCheck() async throws -> [String: String] {
        try await client.get("")
    }

    // MARK: - Auth
    func registerUser(_ request: UserRequest) async throws -> UserResponse {
        try await client.post("register", body: request)
    }

    func loginUser(_ request: LoginRequest) async throws -> LoginResponse {
        try await client.post("login", body: request)
    }

    // MARK: - Blockchain
    func getBalance(userId: Int) async throws -> BalanceResponse {
        try await client.get("blockchain/balance/\(userId)")
    }

    func mintTokens(_ request: MintRequest) async throws -> TxResponse {
        try await client.post("blockchain/mint", body: request)
    }

    func lockTokens(_ request: LockRequest) async throws -> TxResponse {
        try await client.post("blockchain/lock", body: request)
    }

    func releaseTokens(_ request: MintRequest) async throws -> TxResponse {
        try await client.post("blockchain/release", body: request)
    }

    func getLocks(userId: Int) async throws -> LocksResponse {
        try await client.get("blockchain/locks/\(userId)")
    }

    func transferTokens(_ request: TransferRequest) async throws -> TxResponse {
        try await client.post("blockchain/transfer", body: request)
    }

    func getTransactions(userId: Int) async throws -> TransactionsResponse {
        try await client.get("blockchain/transactions/\(userId)")
    }

    // MARK: - Users
    func getUsers() async throws -> UsersListResponse {
        try await client.get("users")
    }
}
