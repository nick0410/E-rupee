package com.example.myapplication.data

data class TransactionItem(
    val id: Int = 0,
    val amount: Double = 0.0,
    val status: String = "",
    val createdAt: String = "",
    val fromAddress: String = "",
    val toAddress: String = "",
    val type: String = "",
    val txHash: String = "",
    val note: String = "",
    val userId: Int = 0
)

data class TransactionsResponse(
    val transactions: List<TransactionItem> = emptyList()
)
