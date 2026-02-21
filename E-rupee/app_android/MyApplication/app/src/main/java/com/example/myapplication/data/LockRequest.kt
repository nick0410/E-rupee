package com.example.myapplication.data

data class LockRequest(
    val userId: Int,
    val amount: String,
    val unlockTime: Long,
    val documentCID: String? = null
)
