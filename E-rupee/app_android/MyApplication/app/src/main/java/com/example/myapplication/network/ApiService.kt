package com.example.myapplication.network

import com.example.myapplication.data.LoginRequest
import com.example.myapplication.data.LoginResponse
import com.example.myapplication.data.UserRequest
import com.example.myapplication.data.UserResponse
import com.example.myapplication.data.UsersListResponse
import com.example.myapplication.data.BalanceResponse
import com.example.myapplication.data.LockEntry
import com.example.myapplication.data.LockRequest
import com.example.myapplication.data.LocksResponse
import com.example.myapplication.data.MintRequest
import com.example.myapplication.data.TransactionItem
import com.example.myapplication.data.TransactionsResponse
import com.example.myapplication.data.TransferRequest
import com.example.myapplication.data.TxResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

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

    // ── Blockchain endpoints ──

    @GET("blockchain/balance/{userId}")
    suspend fun getBalance(
        @Path("userId") userId: Int
    ): Response<BalanceResponse>

    @POST("blockchain/mint")
    suspend fun mintTokens(
        @Body request: MintRequest
    ): Response<TxResponse>

    @POST("blockchain/lock")
    suspend fun lockTokens(
        @Body request: LockRequest
    ): Response<TxResponse>

    @POST("blockchain/release")
    suspend fun releaseTokens(
        @Body request: MintRequest   // reuses userId + amount (amount ignored server-side)
    ): Response<TxResponse>

    @GET("blockchain/locks/{userId}")
    suspend fun getLocks(
        @Path("userId") userId: Int
    ): Response<LocksResponse>

    @POST("blockchain/transfer")
    suspend fun transferTokens(
        @Body request: TransferRequest
    ): Response<TxResponse>

    @GET("blockchain/transactions/{userId}")
    suspend fun getTransactions(
        @Path("userId") userId: Int
    ): Response<TransactionsResponse>

    @GET("users")
    suspend fun getUsers(): Response<UsersListResponse>
}
