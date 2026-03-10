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
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.example.myapplication.data.BalanceResponse
import com.example.myapplication.data.TransferRequest
import com.example.myapplication.network.RetrofitClient
import kotlinx.coroutines.launch

private enum class SendStatus { IDLE, CONFIRMING, PROCESSING, SUCCESS, ERROR }

@Composable
fun SendScreen(userId: Int, navController: NavController) {
    val scope = rememberCoroutineScope()
    val clipboard = LocalClipboardManager.current

    var toAddress by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    var status by remember { mutableStateOf(SendStatus.IDLE) }
    var txHash by remember { mutableStateOf("") }
    var errorMsg by remember { mutableStateOf("") }
    var balance by remember { mutableStateOf(BalanceResponse()) }
    var visible by remember { mutableStateOf(false) }
    var hashCopied by remember { mutableStateOf(false) }

    val parsedAmount = amount.toDoubleOrNull() ?: 0.0
    val availableBalance = balance.available.toDoubleOrNull() ?: 0.0
    val isAddressValid = toAddress.startsWith("0x") && toAddress.length >= 10
    val isAmountValid = parsedAmount > 0 && parsedAmount <= availableBalance
    val isFormValid = isAddressValid && isAmountValid

    LaunchedEffect(userId) {
        try {
            val resp = RetrofitClient.api.getBalance(userId)
            if (resp.isSuccessful) balance = resp.body() ?: BalanceResponse()
        } catch (e: Exception) {
            Log.e("SendScreen", "Balance fetch error: ${e.message}")
        }
        visible = true
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(Color(0xFF0F172A), Color(0xFF1E293B), Color(0xFF334155))
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp)
                .padding(top = 48.dp, bottom = 32.dp)
        ) {
            // ── Header ──
            AnimatedVisibility(visible = visible, enter = fadeIn(tween(400))) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = Color.White,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                    Spacer(Modifier.width(8.dp))
                    Column {
                        Text("Send e₹", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text("Real-time P2P transfer", fontSize = 13.sp, color = Color.White.copy(0.6f))
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            when (status) {
                // ── Success ──
                SendStatus.SUCCESS -> {
                    AnimatedVisibility(visible = true, enter = fadeIn(tween(500))) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(24.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.07f))
                        ) {
                            Column(
                                modifier = Modifier.padding(32.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(72.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF22C55E).copy(alpha = 0.15f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = null,
                                        tint = Color(0xFF22C55E),
                                        modifier = Modifier.size(36.dp)
                                    )
                                }
                                Spacer(Modifier.height(20.dp))
                                Text("Transfer Successful!", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                Spacer(Modifier.height(6.dp))
                                Text(
                                    text = "e₹ ${"%.2f".format(parsedAmount)} sent to ${toAddress.take(8)}...${toAddress.takeLast(6)}",
                                    fontSize = 14.sp,
                                    color = Color.White.copy(0.65f),
                                    textAlign = TextAlign.Center
                                )
                                Spacer(Modifier.height(20.dp))
                                // TX Hash box
                                Card(
                                    shape = RoundedCornerShape(12.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.06f)),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(Modifier.padding(16.dp)) {
                                        Text("Transaction Hash", fontSize = 11.sp, color = Color.White.copy(0.5f))
                                        Spacer(Modifier.height(6.dp))
                                        Text(
                                            text = txHash,
                                            fontSize = 12.sp,
                                            color = Color(0xFF60A5FA),
                                            maxLines = 2,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }
                                Spacer(Modifier.height(20.dp))
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Button(
                                        onClick = {
                                            toAddress = ""; amount = ""; note = ""
                                            status = SendStatus.IDLE; txHash = ""
                                        },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(12.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6))
                                    ) { Text("Send Again", color = Color.White) }
                                    Button(
                                        onClick = { navController.popBackStack() },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(12.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(0.1f))
                                    ) { Text("Done", color = Color.White) }
                                }
                            }
                        }
                    }
                }

                // ── Error ──
                SendStatus.ERROR -> {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF7F1D1D).copy(alpha = 0.3f))
                    ) {
                        Row(Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Warning, contentDescription = null, tint = Color(0xFFF87171), modifier = Modifier.size(24.dp))
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text("Transfer Failed", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFFF87171))
                                Text(errorMsg, fontSize = 13.sp, color = Color.White.copy(0.7f))
                            }
                        }
                    }
                    Spacer(Modifier.height(16.dp))
                    Button(
                        onClick = { status = SendStatus.IDLE },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(0.1f))
                    ) { Text("Try Again", color = Color.White) }
                }

                // ── Processing ──
                SendStatus.PROCESSING -> {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.07f))
                    ) {
                        Column(
                            modifier = Modifier.padding(48.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            CircularProgressIndicator(color = Color(0xFF3B82F6), modifier = Modifier.size(56.dp), strokeWidth = 4.dp)
                            Spacer(Modifier.height(20.dp))
                            Text("Processing Transfer...", fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                            Spacer(Modifier.height(6.dp))
                            Text("Submitting to network", fontSize = 13.sp, color = Color.White.copy(0.5f))
                        }
                    }
                }

                // ── Confirm ──
                SendStatus.CONFIRMING -> {
                    AnimatedVisibility(visible = true, enter = slideInVertically(tween(300)) + fadeIn(tween(300))) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(20.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.07f))
                        ) {
                            Column(Modifier.padding(24.dp)) {
                                Text("Confirm Transfer", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                Spacer(Modifier.height(20.dp))
                                ConfirmRow("To", "${toAddress.take(10)}...${toAddress.takeLast(6)}")
                                Divider(color = Color.White.copy(0.08f))
                                ConfirmRow("Amount", "e₹ ${"%.2f".format(parsedAmount)}", Color(0xFF22C55E))
                                if (note.isNotBlank()) {
                                    Divider(color = Color.White.copy(0.08f))
                                    ConfirmRow("Note", note)
                                }
                                Divider(color = Color.White.copy(0.08f))
                                ConfirmRow("Network Fee", "FREE (CBDC)", Color(0xFF22C55E))
                                Spacer(Modifier.height(24.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Button(
                                        onClick = { status = SendStatus.IDLE },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(12.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(0.08f))
                                    ) { Text("Cancel", color = Color.White) }

                                    Button(
                                        onClick = {
                                            status = SendStatus.PROCESSING
                                            scope.launch {
                                                try {
                                                    val resp = RetrofitClient.api.transferTokens(
                                                        TransferRequest(userId, toAddress, amount, note)
                                                    )
                                                    if (resp.isSuccessful) {
                                                        txHash = resp.body()?.tx ?: ""
                                                        // Refresh balance
                                                        val balResp = RetrofitClient.api.getBalance(userId)
                                                        if (balResp.isSuccessful) balance = balResp.body() ?: BalanceResponse()
                                                        status = SendStatus.SUCCESS
                                                    } else {
                                                        errorMsg = resp.errorBody()?.string() ?: "Transfer failed"
                                                        status = SendStatus.ERROR
                                                    }
                                                } catch (e: Exception) {
                                                    errorMsg = e.message ?: "Network error"
                                                    status = SendStatus.ERROR
                                                }
                                            }
                                        },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(12.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6))
                                    ) {
                                        Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(Modifier.width(6.dp))
                                        Text("Confirm & Send", color = Color.White)
                                    }
                                }
                            }
                        }
                    }
                }

                // ── Idle / Form ──
                SendStatus.IDLE -> {
                    AnimatedVisibility(
                        visible = visible,
                        enter = slideInVertically(tween(500, delayMillis = 100, easing = FastOutSlowInEasing)) + fadeIn(tween(500, 100))
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            // Available balance banner
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF22C55E).copy(alpha = 0.12f))
                            ) {
                                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Column(Modifier.weight(1f)) {
                                        Text("Available Balance", fontSize = 12.sp, color = Color.White.copy(0.6f))
                                        Text(
                                            "e₹ ${"%.2f".format(availableBalance)}",
                                            fontSize = 26.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF22C55E)
                                        )
                                    }
                                }
                            }

                            // Form card
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(20.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.07f))
                            ) {
                                Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {

                                    // Recipient address
                                    Column {
                                        Text("Recipient Wallet Address *", fontSize = 12.sp, color = Color.White.copy(0.55f))
                                        Spacer(Modifier.height(6.dp))
                                        OutlinedTextField(
                                            value = toAddress,
                                            onValueChange = { toAddress = it },
                                            placeholder = { Text("0x1234...abcd", color = Color.White.copy(0.3f), fontSize = 13.sp) },
                                            singleLine = true,
                                            modifier = Modifier.fillMaxWidth(),
                                            shape = RoundedCornerShape(12.dp),
                                            colors = OutlinedTextFieldDefaults.colors(
                                                focusedTextColor = Color.White,
                                                unfocusedTextColor = Color.White,
                                                focusedBorderColor = Color(0xFF3B82F6),
                                                unfocusedBorderColor = Color.White.copy(0.2f),
                                                cursorColor = Color(0xFF3B82F6)
                                            )
                                        )
                                        if (toAddress.isNotBlank() && !toAddress.startsWith("0x")) {
                                            Text("Address must start with 0x", fontSize = 11.sp, color = Color(0xFFF87171))
                                        }
                                    }

                                    // Amount
                                    Column {
                                        Text("Amount (e₹) *", fontSize = 12.sp, color = Color.White.copy(0.55f))
                                        Spacer(Modifier.height(6.dp))
                                        OutlinedTextField(
                                            value = amount,
                                            onValueChange = { if (it.matches(Regex("[0-9]*\\.?[0-9]*"))) amount = it },
                                            placeholder = { Text("0.00", color = Color.White.copy(0.3f), fontSize = 13.sp) },
                                            leadingIcon = { Text("₹", color = Color.White.copy(0.5f), fontSize = 16.sp, modifier = Modifier.padding(start = 4.dp)) },
                                            singleLine = true,
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                            modifier = Modifier.fillMaxWidth(),
                                            shape = RoundedCornerShape(12.dp),
                                            colors = OutlinedTextFieldDefaults.colors(
                                                focusedTextColor = Color.White,
                                                unfocusedTextColor = Color.White,
                                                focusedBorderColor = Color(0xFF3B82F6),
                                                unfocusedBorderColor = Color.White.copy(0.2f),
                                                cursorColor = Color(0xFF3B82F6)
                                            )
                                        )
                                        if (parsedAmount > availableBalance && amount.isNotBlank()) {
                                            Text("Exceeds available balance", fontSize = 11.sp, color = Color(0xFFF87171))
                                        }
                                        // Quick amounts
                                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            listOf(100, 500, 1000, 5000).forEach { quickAmt ->
                                                TextButton(
                                                    onClick = { amount = quickAmt.toString() },
                                                    shape = RoundedCornerShape(8.dp),
                                                    colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFF60A5FA))
                                                ) { Text("₹$quickAmt", fontSize = 12.sp) }
                                            }
                                        }
                                    }

                                    // Note
                                    Column {
                                        Text("Note (optional)", fontSize = 12.sp, color = Color.White.copy(0.55f))
                                        Spacer(Modifier.height(6.dp))
                                        OutlinedTextField(
                                            value = note,
                                            onValueChange = { note = it },
                                            placeholder = { Text("e.g. Rent Feb 2026", color = Color.White.copy(0.3f), fontSize = 13.sp) },
                                            singleLine = true,
                                            modifier = Modifier.fillMaxWidth(),
                                            shape = RoundedCornerShape(12.dp),
                                            colors = OutlinedTextFieldDefaults.colors(
                                                focusedTextColor = Color.White,
                                                unfocusedTextColor = Color.White,
                                                focusedBorderColor = Color(0xFF3B82F6),
                                                unfocusedBorderColor = Color.White.copy(0.2f),
                                                cursorColor = Color(0xFF3B82F6)
                                            )
                                        )
                                    }

                                    // Review button
                                    Button(
                                        onClick = { status = SendStatus.CONFIRMING },
                                        enabled = isFormValid,
                                        modifier = Modifier.fillMaxWidth().height(52.dp),
                                        shape = RoundedCornerShape(14.dp),
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = Color(0xFF3B82F6),
                                            disabledContainerColor = Color.White.copy(0.1f)
                                        )
                                    ) {
                                        Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Spacer(Modifier.width(8.dp))
                                        Text("Review Transfer", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ConfirmRow(label: String, value: String, valueColor: Color = Color.White) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, fontSize = 14.sp, color = Color.White.copy(0.5f))
        Text(value, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = valueColor, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}
