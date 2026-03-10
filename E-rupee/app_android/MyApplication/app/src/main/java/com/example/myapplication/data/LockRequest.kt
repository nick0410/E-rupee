package com.example.myapplication.data

data class LockRequest(
    val userId: Int,
    val amount: String,
    val unlockTime: Long,
    val documentCID: String? = null,
    val interestRate: Double? = null   // percentage, e.g. 15.0 for 15%
)
