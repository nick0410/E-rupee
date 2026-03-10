import Foundation

struct TransferRequest: Codable {
    let fromUserId: Int
    let toAddress: String
    let amount: String
    let note: String

    init(fromUserId: Int, toAddress: String, amount: String, note: String = "") {
        self.fromUserId = fromUserId
        self.toAddress = toAddress
        self.amount = amount
        self.note = note
    }
}

struct TransactionItem: Codable, Identifiable {
    let id: Int
    let amount: Double
    let status: String
    let createdAt: String
    let fromAddress: String
    let toAddress: String
    let type: String
    let txHash: String
    let note: String
    let userId: Int

    init(
        id: Int = 0, amount: Double = 0.0, status: String = "",
        createdAt: String = "", fromAddress: String = "", toAddress: String = "",
        type: String = "", txHash: String = "", note: String = "", userId: Int = 0
    ) {
        self.id = id; self.amount = amount; self.status = status
        self.createdAt = createdAt; self.fromAddress = fromAddress
        self.toAddress = toAddress; self.type = type; self.txHash = txHash
        self.note = note; self.userId = userId
    }
}

struct TransactionsResponse: Codable {
    let transactions: [TransactionItem]
}
