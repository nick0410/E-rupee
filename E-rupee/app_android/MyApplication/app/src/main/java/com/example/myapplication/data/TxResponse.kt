package com.example.myapplication.data

data class TxResponse(
    val tx: String = "",
    val from: String? = null,
    val to: String? = null,
    val amount: String? = null,
    val status: String? = null,
    val timestamp: String? = null,
    val error: String? = null,
    // Release-specific fields
    val principal: String? = null,
    val interest: String? = null,
    val total: String? = null
)
