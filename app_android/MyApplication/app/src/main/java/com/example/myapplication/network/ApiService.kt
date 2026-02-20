package com.example.myapplication.network

import com.example.myapplication.data.LoginRequest
import com.example.myapplication.data.LoginResponse
import com.example.myapplication.data.UserRequest
import com.example.myapplication.data.UserResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface ApiService {

    @GET("/")
    suspend fun healthCheck(): Response<Map<String, String>>

    @POST("register")
    suspend fun registerUser(
        @Body user: UserRequest
    ): Response<UserResponse>

    @POST("login")
    suspend fun loginUser(
        @Body request: LoginRequest
    ): Response<LoginResponse>

}
