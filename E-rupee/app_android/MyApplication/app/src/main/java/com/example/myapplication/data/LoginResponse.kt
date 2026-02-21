package com.example.myapplication.data

data class LoginResponse(
    val message: String,
    val user: UserData? = null
)
