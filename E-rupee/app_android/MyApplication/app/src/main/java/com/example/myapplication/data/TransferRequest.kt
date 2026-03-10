package com.example.myapplication.data

data class TransferRequest(
    val fromUserId: Int,
    val toAddress: String,
    val amount: String,
    val note: String = ""
)
