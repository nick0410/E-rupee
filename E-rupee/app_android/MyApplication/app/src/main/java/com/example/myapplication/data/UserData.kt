package com.example.myapplication.data

data class UserData(
    val id: Int,
    val name: String,
    val email: String,
    val phone: String,
    val state: String,
    val walletAddress: String = ""
)
