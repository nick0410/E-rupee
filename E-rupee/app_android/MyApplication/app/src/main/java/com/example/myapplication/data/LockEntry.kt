package com.example.myapplication.data

data class LockEntry(
    val amount: String = "0",
    val unlockTime: Long = 0,
    val documentCID: String = ""
)

data class LocksResponse(
    val locks: List<LockEntry> = emptyList()
)
