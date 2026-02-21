package com.example.myapplication.data

data class BalanceResponse(
    val address: String = "",
    val balance: String = "0",
    val locked: String = "0",
    val available: String = "0"
)
