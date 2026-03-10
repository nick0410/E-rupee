package com.example.myapplication.ui

import android.util.Log
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.example.myapplication.data.BalanceResponse
import com.example.myapplication.data.LoginResponse
import com.example.myapplication.data.UserData
import com.example.myapplication.network.RetrofitClient
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun ProfileScreen(userId: Int, navController: NavController) {
    val scope = rememberCoroutineScope()
    val clipboard = LocalClipboardManager.current

    var visible by remember { mutableStateOf(false) }
    var balance by remember { mutableStateOf(BalanceResponse()) }
    var userData by remember { mutableStateOf<UserData?>(null) }
    var copied by remember { mutableStateOf(false) }
    var showLogoutDialog by remember { mutableStateOf(false) }
    var txCount by remember { mutableStateOf(0) }

    LaunchedEffect(userId) {
        try {
            val b = RetrofitClient.api.getBalance(userId)
            if (b.isSuccessful) balance = b.body() ?: BalanceResponse()
            val users = RetrofitClient.api.getUsers()
            if (users.isSuccessful) {
                userData = users.body()?.users?.find { it.id == userId }
            }
            val txs = RetrofitClient.api.getTransactions(userId)
            if (txs.isSuccessful) txCount = txs.body()?.transactions?.size ?: 0
        } catch (e: Exception) {
            Log.e("ProfileScreen", e.message ?: "error")
        }
        visible = true
    }

    val name = userData?.name ?: "User"
    val initials = name.trim().split(" ").mapNotNull { it.firstOrNull()?.uppercaseChar() }.take(2).joinToString("")
    val address = balance.address

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0F172A), Color(0xFF1E293B), Color(0xFF334155))))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .padding(top = 48.dp, bottom = 32.dp)
        ) {
            // ── Header ──
            AnimatedVisibility(visible = visible, enter = fadeIn(tween(400))) {
                Column {
                    Text("Profile", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("Account & wallet information", fontSize = 13.sp, color = Color.White.copy(0.55f))
                }
            }

            Spacer(Modifier.height(24.dp))

            // ── Avatar + Name Banner ──
            AnimatedVisibility(visible = visible, enter = slideInVertically(tween(500, 100, FastOutSlowInEasing)) + fadeIn(tween(500, 100))) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.Transparent)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                brush = Brush.linearGradient(listOf(Color(0xFF1D4ED8), Color(0xFF7C3AED))),
                                shape = RoundedCornerShape(24.dp)
                            )
                            .padding(24.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(70.dp)
                                    .clip(CircleShape)
                                    .background(Color.White.copy(0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(initials.ifBlank { "U" }, fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            }
                            Spacer(Modifier.width(16.dp))
                            Column {
                                Text(name, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                Text(userData?.email ?: "—", fontSize = 13.sp, color = Color.White.copy(0.7f))
                                Spacer(Modifier.height(6.dp))
                                Text(
                                    "ID #$userId",
                                    modifier = Modifier
                                        .background(Color.White.copy(0.15f), RoundedCornerShape(8.dp))
                                        .padding(horizontal = 8.dp, vertical = 3.dp),
                                    fontSize = 11.sp,
                                    color = Color.White,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // ── Stats pills row ──
            AnimatedVisibility(visible = visible, enter = fadeIn(tween(600, 150))) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    ProfileStat(Modifier.weight(1f), "Balance", "e₹ ${balance.balance.split(".")[0]}", Color(0xFF3B82F6))
                    ProfileStat(Modifier.weight(1f), "Available", "e₹ ${balance.available.split(".")[0]}", Color(0xFF22C55E))
                    ProfileStat(Modifier.weight(1f), "Transactions", txCount.toString(), Color(0xFF8B5CF6))
                }
            }

            Spacer(Modifier.height(16.dp))

            // ── Account Info ──
            AnimatedVisibility(visible = visible, enter = slideInVertically(tween(600, 200, FastOutSlowInEasing)) + fadeIn(tween(600, 200))) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(0.07f))
                ) {
                    Column(Modifier.padding(20.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Person, contentDescription = null, tint = Color(0xFF3B82F6), modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Account Information", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                        }
                        Spacer(Modifier.height(16.dp))
                        ProfileInfoRow("Full Name", name)
                        Divider(color = Color.White.copy(0.06f), modifier = Modifier.padding(vertical = 10.dp))
                        ProfileInfoRow("Email", userData?.email ?: "—")
                        Divider(color = Color.White.copy(0.06f), modifier = Modifier.padding(vertical = 10.dp))
                        ProfileInfoRow("Phone", userData?.phone ?: "—")
                        Divider(color = Color.White.copy(0.06f), modifier = Modifier.padding(vertical = 10.dp))
                        ProfileInfoRow("State", userData?.state ?: "—")
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            // ── Wallet Info ──
            AnimatedVisibility(visible = visible, enter = slideInVertically(tween(700, 300, FastOutSlowInEasing)) + fadeIn(tween(700, 300))) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(0.07f))
                ) {
                    Column(Modifier.padding(20.dp)) {
                        Text("Wallet", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                        Spacer(Modifier.height(14.dp))

                        // Address row with copy
                        Column {
                            Text("Wallet Address", fontSize = 11.sp, color = Color.White.copy(0.45f))
                            Spacer(Modifier.height(6.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    if (address.isNotBlank()) "${address.take(10)}...${address.takeLast(6)}" else "—",
                                    fontSize = 13.sp, color = Color(0xFF60A5FA),
                                    fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f)
                                )
                                if (address.isNotBlank()) {
                                    IconButton(
                                        onClick = {
                                            clipboard.setText(AnnotatedString(address))
                                            copied = true
                                            scope.launch { delay(2000); copied = false }
                                        },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(
                                            if (copied) Icons.Default.Check else Icons.Default.ContentCopy,
                                            contentDescription = "Copy",
                                            tint = if (copied) Color(0xFF22C55E) else Color(0xFF60A5FA),
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                }
                            }
                        }
                        Divider(color = Color.White.copy(0.06f), modifier = Modifier.padding(vertical = 12.dp))
                        WalletInfoRow("Total Balance", "e₹ ${balance.balance}", Color.White)
                        Spacer(Modifier.height(8.dp))
                        WalletInfoRow("Available", "e₹ ${balance.available}", Color(0xFF22C55E))
                        Spacer(Modifier.height(8.dp))
                        WalletInfoRow("Locked", "e₹ ${balance.locked}", Color(0xFFF59E0B))
                        Divider(color = Color.White.copy(0.06f), modifier = Modifier.padding(vertical = 12.dp))
                        WalletInfoRow("Network", "eRupee CBDC (Chain 1337)", Color.White)
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            // ── Security Status ──
            AnimatedVisibility(visible = visible, enter = slideInVertically(tween(800, 400, FastOutSlowInEasing)) + fadeIn(tween(800, 400))) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(0.07f))
                ) {
                    Column(Modifier.padding(20.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Shield, contentDescription = null, tint = Color(0xFF22C55E), modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Security Status", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                        }
                        Spacer(Modifier.height(14.dp))
                        listOf(
                            "Account Active"    to true,
                            "Email Verified"    to (userData?.email?.isNotBlank() == true),
                            "Wallet Linked"     to address.isNotBlank(),
                            "KYC Completed"     to true,
                        ).forEach { (label, status) ->
                            SecurityRow(label, status)
                            Spacer(Modifier.height(8.dp))
                        }
                    }
                }
            }

            Spacer(Modifier.height(20.dp))

            // ── Logout ──
            AnimatedVisibility(visible = visible, enter = fadeIn(tween(900, 500))) {
                Button(
                    onClick = { showLogoutDialog = true },
                    modifier = Modifier.fillMaxWidth().height(54.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7F1D1D).copy(0.6f))
                ) {
                    Icon(Icons.Default.ExitToApp, contentDescription = null, tint = Color(0xFFF87171), modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(10.dp))
                    Text("Log Out", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFFF87171))
                }
            }

            Spacer(Modifier.height(24.dp))
        }
    }

    // ── Logout Confirmation ──
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutDialog = false
                        navController.navigate("entry") {
                            popUpTo(0) { inclusive = true }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626))
                ) { Text("Log Out", color = Color.White) }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("Cancel", color = Color.White.copy(0.6f))
                }
            },
            title = { Text("Log Out?", fontWeight = FontWeight.Bold, color = Color.White) },
            text = { Text("You'll need to log in again to access your wallet.", color = Color.White.copy(0.7f)) },
            containerColor = Color(0xFF1E293B),
            shape = RoundedCornerShape(20.dp)
        )
    }
}

@Composable
private fun ProfileInfoRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, fontSize = 13.sp, color = Color.White.copy(0.5f))
        Text(value, fontSize = 13.sp, color = Color.White, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun WalletInfoRow(label: String, value: String, valueColor: Color) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, fontSize = 13.sp, color = Color.White.copy(0.5f))
        Text(value, fontSize = 13.sp, color = valueColor, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun SecurityRow(label: String, status: Boolean) {
    Row(
        Modifier.fillMaxWidth().background(Color.White.copy(0.04f), RoundedCornerShape(10.dp)).padding(horizontal = 14.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, fontSize = 13.sp, color = Color.White.copy(0.8f))
        Box(
            modifier = Modifier
                .background(if (status) Color(0xFF22C55E).copy(0.15f) else Color(0xFFDC2626).copy(0.15f), RoundedCornerShape(8.dp))
                .padding(horizontal = 10.dp, vertical = 4.dp)
        ) {
            Text(
                if (status) "VERIFIED" else "PENDING",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = if (status) Color(0xFF22C55E) else Color(0xFFF87171)
            )
        }
    }
}

@Composable
private fun ProfileStat(modifier: Modifier, label: String, value: String, color: Color) {
    Card(modifier = modifier, shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White.copy(0.07f))) {
        Column(Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = color)
            Text(label, fontSize = 10.sp, color = Color.White.copy(0.45f))
        }
    }
}
