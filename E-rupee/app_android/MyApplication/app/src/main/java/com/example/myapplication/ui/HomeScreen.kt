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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CallMade
import androidx.compose.material.icons.filled.CallReceived
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.example.myapplication.data.BalanceResponse
import com.example.myapplication.data.LockEntry
import com.example.myapplication.data.LockRequest
import com.example.myapplication.data.MintRequest
import com.example.myapplication.data.TransactionItem
import com.example.myapplication.network.RetrofitClient
import com.example.myapplication.ui.theme.MyApplicationTheme
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun HomeScreen(userId: Int = 0, navController: NavController = rememberNavController()) {
    val scope = rememberCoroutineScope()
    var balance by remember { mutableStateOf(BalanceResponse()) }
    var locks by remember { mutableStateOf<List<LockEntry>>(emptyList()) }
    var transactions by remember { mutableStateOf<List<TransactionItem>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var visible by remember { mutableStateOf(false) }

    // Dialog states
    var showMintDialog by remember { mutableStateOf(false) }
    var showLockDialog by remember { mutableStateOf(false) }
    var statusMessage by remember { mutableStateOf<String?>(null) }

    fun refresh() {
        scope.launch {
            loading = true
            try {
                val balResp = RetrofitClient.api.getBalance(userId)
                if (balResp.isSuccessful) {
                    balance = balResp.body() ?: BalanceResponse()
                }
                val locksResp = RetrofitClient.api.getLocks(userId)
                if (locksResp.isSuccessful) {
                    locks = locksResp.body()?.locks ?: emptyList()
                }
                val txResp = RetrofitClient.api.getTransactions(userId)
                if (txResp.isSuccessful) {
                    transactions = txResp.body()?.transactions ?: emptyList()
                }
            } catch (e: Exception) {
                Log.e("Home", "Refresh error: ${e.message}")
            }
            loading = false
        }
    }

    LaunchedEffect(userId) {
        refresh()
        visible = true
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF0F172A),
                        Color(0xFF1E293B),
                        Color(0xFF334155)
                    )
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp)
                .padding(top = 48.dp, bottom = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // ── Header ──
            AnimatedVisibility(
                visible = visible,
                enter = fadeIn(animationSpec = tween(600))
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "eRupeeX",
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "Digital Wallet",
                            fontSize = 14.sp,
                            color = Color.White.copy(alpha = 0.6f)
                        )
                    }
                    IconButton(onClick = { refresh() }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh",
                            tint = Color.White,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // ── Balance Card ──
            AnimatedVisibility(
                visible = visible,
                enter = slideInVertically(
                    initialOffsetY = { 60 },
                    animationSpec = tween(600, delayMillis = 200, easing = FastOutSlowInEasing)
                ) + fadeIn(animationSpec = tween(600, delayMillis = 200))
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.Transparent)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                brush = Brush.linearGradient(
                                    colors = listOf(Color(0xFF3B82F6), Color(0xFF8B5CF6))
                                ),
                                shape = RoundedCornerShape(20.dp)
                            )
                            .padding(24.dp)
                    ) {
                        Column {
                            Text(
                                text = "Total Balance",
                                fontSize = 14.sp,
                                color = Color.White.copy(alpha = 0.8f)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            if (loading) {
                                CircularProgressIndicator(
                                    color = Color.White,
                                    modifier = Modifier.size(32.dp)
                                )
                            } else {
                                Text(
                                    text = "e₹ ${balance.balance}",
                                    fontSize = 36.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                            Divider(color = Color.White.copy(alpha = 0.3f))
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text("Available", fontSize = 12.sp, color = Color.White.copy(0.7f))
                                    Text(
                                        "e₹ ${balance.available}",
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color.White
                                    )
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text("Locked", fontSize = 12.sp, color = Color.White.copy(0.7f))
                                    Text(
                                        "e₹ ${balance.locked}",
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color(0xFFFBBF24)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = balance.address.take(6) + "..." + balance.address.takeLast(4),
                                fontSize = 12.sp,
                                color = Color.White.copy(alpha = 0.5f),
                                modifier = Modifier.fillMaxWidth(),
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // ── Action Buttons Row ──
            AnimatedVisibility(
                visible = visible,
                enter = slideInVertically(
                    initialOffsetY = { 60 },
                    animationSpec = tween(600, delayMillis = 400, easing = FastOutSlowInEasing)
                ) + fadeIn(animationSpec = tween(600, delayMillis = 400))
            ) {
                // Send & Receive row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    ActionButton(
                        icon = Icons.Default.CallMade,
                        label = "Send",
                        color = Color(0xFF3B82F6)
                    ) { navController.navigate("send/$userId") }

                    ActionButton(
                        icon = Icons.Default.CallReceived,
                        label = "Receive",
                        color = Color(0xFF8B5CF6)
                    ) { navController.navigate("receive/$userId") }

                    ActionButton(
                        icon = Icons.Default.Add,
                        label = "Mint",
                        color = Color(0xFF22C55E)
                    ) { showMintDialog = true }

                    ActionButton(
                        icon = Icons.Default.Lock,
                        label = "Lock",
                        color = Color(0xFFF59E0B)
                    ) { showLockDialog = true }

                    ActionButton(
                        icon = Icons.Default.LockOpen,
                        label = "Release",
                        color = Color(0xFF94A3B8)
                    ) {
                        scope.launch {
                            try {
                                val resp = RetrofitClient.api.releaseTokens(
                                    MintRequest(userId, "0")
                                )
                                if (resp.isSuccessful) {
                                    val body = resp.body()
                                    val interest = body?.interest?.toDoubleOrNull() ?: 0.0
                                    val total    = body?.total?.toDoubleOrNull() ?: 0.0
                                    statusMessage = if (interest > 0)
                                        "Released ✅\nPrincipal: e₹ ${body?.principal}\nInterest earned: +e₹ ${"%.2f".format(interest)}\nTotal credited: e₹ ${"%.2f".format(total)} 🎉"
                                    else
                                        "Locks released ✅\nCredited: e₹ ${body?.total ?: body?.principal}"
                                } else {
                                    statusMessage = "Release failed"
                                }
                                refresh()
                            } catch (e: Exception) {
                                statusMessage = "Error: ${e.message}"
                            }
                        }

                    }
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // ── Active Locks Section ──
            AnimatedVisibility(
                visible = visible,
                enter = slideInVertically(
                    initialOffsetY = { 60 },
                    animationSpec = tween(600, delayMillis = 600, easing = FastOutSlowInEasing)
                ) + fadeIn(animationSpec = tween(600, delayMillis = 600))
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "Active Locks",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    if (locks.isEmpty()) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = Color.White.copy(alpha = 0.08f)
                            )
                        ) {
                            Text(
                                text = "No active locks 🔓",
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                textAlign = TextAlign.Center,
                                color = Color.White.copy(alpha = 0.5f),
                                fontSize = 16.sp
                            )
                        }
                    } else {
                        locks.forEachIndexed { index, lock ->
                            LockCard(lock = lock, index = index)
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // ── Recent Transactions Section ──
            AnimatedVisibility(
                visible = visible,
                enter = slideInVertically(
                    initialOffsetY = { 60 },
                    animationSpec = tween(600, delayMillis = 800, easing = FastOutSlowInEasing)
                ) + fadeIn(animationSpec = tween(600, delayMillis = 800))
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Recent Transactions",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        if (transactions.isNotEmpty()) {
                            Text(
                                text = "${transactions.size} total",
                                fontSize = 13.sp,
                                color = Color.White.copy(alpha = 0.4f)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))

                    if (loading) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(80.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator(
                                color = Color(0xFF3B82F6),
                                modifier = Modifier.size(28.dp)
                            )
                        }
                    } else if (transactions.isEmpty()) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = Color.White.copy(alpha = 0.08f)
                            )
                        ) {
                            Text(
                                text = "No transactions yet 💸",
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                textAlign = TextAlign.Center,
                                color = Color.White.copy(alpha = 0.5f),
                                fontSize = 16.sp
                            )
                        }
                    } else {
                        transactions.take(5).forEach { tx ->
                            RecentTransactionCard(tx = tx, currentUserId = userId)
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }

    // ── Mint Dialog ──
    if (showMintDialog) {
        AmountDialog(
            title = "Mint e₹ Tokens",
            buttonLabel = "Mint",
            buttonColor = Color(0xFF22C55E),
            onDismiss = { showMintDialog = false },
            onConfirm = { amount ->
                showMintDialog = false
                scope.launch {
                    try {
                        val resp = RetrofitClient.api.mintTokens(
                            MintRequest(userId, amount)
                        )
                        statusMessage = if (resp.isSuccessful)
                            "Minted e₹ $amount ✅"
                        else "Mint failed"
                        refresh()
                    } catch (e: Exception) {
                        statusMessage = "Error: ${e.message}"
                    }
                }
            }
        )
    }

    // ── Lock Dialog ──
    if (showLockDialog) {
        LockDialog(
            onDismiss = { showLockDialog = false },
            onConfirm = { amount, minutes ->
                showLockDialog = false
                scope.launch {
                    try {
                        val unlockTime = (System.currentTimeMillis() / 1000) + (minutes * 60)
                        val resp = RetrofitClient.api.lockTokens(
                            LockRequest(userId, amount, unlockTime)
                        )
                        statusMessage = if (resp.isSuccessful)
                            "Locked e₹ $amount for $minutes min 🔒"
                        else "Lock failed"
                        refresh()
                    } catch (e: Exception) {
                        statusMessage = "Error: ${e.message}"
                    }
                }
            }
        )
    }

    // ── Status Snackbar / Dialog ──
    if (statusMessage != null) {
        AlertDialog(
            onDismissRequest = { statusMessage = null },
            confirmButton = {
                TextButton(onClick = { statusMessage = null }) {
                    Text("OK", color = Color(0xFF3B82F6))
                }
            },
            title = { Text("Status", fontWeight = FontWeight.Bold) },
            text = { Text(statusMessage ?: "") },
            containerColor = Color(0xFF1E293B),
            titleContentColor = Color.White,
            textContentColor = Color.White.copy(alpha = 0.85f),
            shape = RoundedCornerShape(16.dp)
        )
    }
}

// ── Action Button Component ──
@Composable
private fun ActionButton(
    icon: ImageVector,
    label: String,
    color: Color,
    onClick: () -> Unit
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Button(
            onClick = onClick,
            modifier = Modifier.size(64.dp),
            shape = CircleShape,
            colors = ButtonDefaults.buttonColors(
                containerColor = color.copy(alpha = 0.15f)
            )
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = color,
                modifier = Modifier.size(28.dp)
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(label, fontSize = 13.sp, color = Color.White.copy(alpha = 0.8f))
    }
}

// ── Lock Card Component ──
@Composable
private fun LockCard(lock: LockEntry, index: Int) {
    val dateFormat = SimpleDateFormat("dd MMM yyyy HH:mm", Locale.getDefault())
    val unlockDate = dateFormat.format(Date(lock.unlockTime * 1000))
    val isExpired = System.currentTimeMillis() / 1000 > lock.unlockTime

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White.copy(alpha = 0.08f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(
                        if (isExpired) Color(0xFF22C55E).copy(alpha = 0.2f)
                        else Color(0xFFF59E0B).copy(alpha = 0.2f)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (isExpired) Icons.Default.LockOpen else Icons.Default.Lock,
                    contentDescription = null,
                    tint = if (isExpired) Color(0xFF22C55E) else Color(0xFFF59E0B),
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "e₹ ${lock.amount}",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White
                )
                Text(
                    text = if (isExpired) "Expired — ready to release" else "Unlocks: $unlockDate",
                    fontSize = 12.sp,
                    color = if (isExpired) Color(0xFF22C55E) else Color.White.copy(alpha = 0.5f)
                )
                if (lock.documentCID.isNotEmpty()) {
                    Text(
                        text = "📄 ${lock.documentCID.take(12)}...",
                        fontSize = 11.sp,
                        color = Color(0xFF60A5FA),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
            Text(
                text = "#${index + 1}",
                fontSize = 14.sp,
                color = Color.White.copy(alpha = 0.3f)
            )
        }
    }
}

// ── Mint / Amount Dialog ──
@Composable
private fun AmountDialog(
    title: String,
    buttonLabel: String,
    buttonColor: Color,
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
) {
    var amount by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(
                onClick = { if (amount.isNotEmpty()) onConfirm(amount) },
                colors = ButtonDefaults.buttonColors(containerColor = buttonColor)
            ) { Text(buttonLabel) }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = Color.White.copy(alpha = 0.7f))
            }
        },
        title = { Text(title, fontWeight = FontWeight.Bold, color = Color.White) },
        text = {
            OutlinedTextField(
                value = amount,
                onValueChange = { amount = it },
                label = { Text("Amount (eINR)") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = buttonColor,
                    unfocusedBorderColor = Color.White.copy(alpha = 0.3f),
                    focusedLabelColor = buttonColor,
                    unfocusedLabelColor = Color.White.copy(0.5f),
                    cursorColor = buttonColor
                )
            )
        },
        containerColor = Color(0xFF1E293B),
        shape = RoundedCornerShape(16.dp)
    )
}

// ── Lock Dialog (amount + duration) ──
@Composable
private fun LockDialog(
    onDismiss: () -> Unit,
    onConfirm: (String, Long) -> Unit
) {
    var amount by remember { mutableStateOf("") }
    var minutes by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(
                onClick = {
                    if (amount.isNotEmpty() && minutes.isNotEmpty()) {
                        onConfirm(amount, minutes.toLongOrNull() ?: 1)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B))
            ) { Text("Lock", color = Color.Black) }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = Color.White.copy(alpha = 0.7f))
            }
        },
        title = { Text("Lock e₹ Tokens", fontWeight = FontWeight.Bold, color = Color.White) },
        text = {
            Column {
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Amount (eINR)") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0xFFF59E0B),
                        unfocusedBorderColor = Color.White.copy(alpha = 0.3f),
                        focusedLabelColor = Color(0xFFF59E0B),
                        unfocusedLabelColor = Color.White.copy(0.5f),
                        cursorColor = Color(0xFFF59E0B)
                    )
                )
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = minutes,
                    onValueChange = { minutes = it },
                    label = { Text("Duration (minutes)") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0xFFF59E0B),
                        unfocusedBorderColor = Color.White.copy(alpha = 0.3f),
                        focusedLabelColor = Color(0xFFF59E0B),
                        unfocusedLabelColor = Color.White.copy(0.5f),
                        cursorColor = Color(0xFFF59E0B)
                    )
                )
            }
        },
        containerColor = Color(0xFF1E293B),
        shape = RoundedCornerShape(16.dp)
    )
}

// ── Recent Transaction Card ──
@Composable
private fun RecentTransactionCard(tx: TransactionItem, currentUserId: Int) {
    val isSent = tx.type.lowercase() == "send" || tx.type.lowercase() == "transfer"
    val accentColor = if (isSent) Color(0xFFEF4444) else Color(0xFF22C55E)
    val icon = if (isSent) Icons.Default.CallMade else Icons.Default.CallReceived
    val label = if (isSent) "Sent" else "Received"
    val counterpartyLabel = if (isSent) "To" else "From"
    val counterpartyAddress = if (isSent) tx.toAddress else tx.fromAddress
    val shortAddress = if (counterpartyAddress.length > 10)
        counterpartyAddress.take(6) + "..." + counterpartyAddress.takeLast(4)
    else counterpartyAddress

    val statusColor = when (tx.status.lowercase()) {
        "success", "confirmed" -> Color(0xFF22C55E)
        "pending" -> Color(0xFFFBBF24)
        else -> Color(0xFFEF4444)
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White.copy(alpha = 0.08f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon circle
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(accentColor.copy(alpha = 0.18f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = label,
                    tint = accentColor,
                    modifier = Modifier.size(22.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            // Details
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = label,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White
                )
                Text(
                    text = "$counterpartyLabel: $shortAddress",
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.5f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                if (tx.note.isNotEmpty()) {
                    Text(
                        text = tx.note,
                        fontSize = 11.sp,
                        color = Color(0xFF60A5FA),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
            Spacer(modifier = Modifier.width(8.dp))
            // Amount + status
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "${if (isSent) "-" else "+"}e₹ ${tx.amount}",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = accentColor
                )
                Spacer(modifier = Modifier.height(4.dp))
                Box(
                    modifier = Modifier
                        .background(
                            color = statusColor.copy(alpha = 0.18f),
                            shape = RoundedCornerShape(8.dp)
                        )
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = tx.status.replaceFirstChar { it.uppercase() },
                        fontSize = 10.sp,
                        color = statusColor,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}

@Preview
@Composable
fun HomeScreenPreview() {
    MyApplicationTheme {
        HomeScreen(userId = 1, navController = rememberNavController())
    }
}
