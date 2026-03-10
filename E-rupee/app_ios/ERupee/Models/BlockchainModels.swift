import Foundation

// MARK: - Balance

struct BalanceResponse: Codable {
    let address: String
    let balance: String
    let locked: String
    let available: String

    init(address: String = "", balance: String = "0", locked: String = "0", available: String = "0") {
        self.address = address
        self.balance = balance
        self.locked = locked
        self.available = available
    }
}

// MARK: - Mint / Release

struct MintRequest: Codable {
    let userId: Int
    let amount: String
}

// MARK: - Lock

struct LockRequest: Codable {
    let userId: Int
    let amount: String
    let unlockTime: Int64
    let documentCID: String?
    let interestRate: Double?

    init(userId: Int, amount: String, unlockTime: Int64, documentCID: String? = nil, interestRate: Double? = nil) {
        self.userId = userId
        self.amount = amount
        self.unlockTime = unlockTime
        self.documentCID = documentCID
        self.interestRate = interestRate
    }
}

struct LockEntry: Codable, Identifiable {
    let amount: String
    let unlockTime: Int64
    let documentCID: String

    var id: Int64 { unlockTime }

    init(amount: String = "0", unlockTime: Int64 = 0, documentCID: String = "") {
        self.amount = amount
        self.unlockTime = unlockTime
        self.documentCID = documentCID
    }
}

struct LocksResponse: Codable {
    let locks: [LockEntry]
}

// MARK: - Transaction Response

struct TxResponse: Codable {
    let tx: String?
    let from: String?
    let to: String?
    let amount: String?
    let status: String?
    let timestamp: String?
    let error: String?
    // Release-specific fields
    let principal: String?
    let interest: String?
    let total: String?

    init(
        tx: String? = nil, from: String? = nil, to: String? = nil,
        amount: String? = nil, status: String? = nil, timestamp: String? = nil,
        error: String? = nil, principal: String? = nil, interest: String? = nil, total: String? = nil
    ) {
        self.tx = tx; self.from = from; self.to = to
        self.amount = amount; self.status = status; self.timestamp = timestamp
        self.error = error; self.principal = principal; self.interest = interest; self.total = total
    }
}
