package com.example.myapplication.ui

import android.util.Log
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.example.myapplication.data.BalanceResponse
import com.example.myapplication.network.RetrofitClient
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun ReceiveScreen(userId: Int, navController: NavController) {
    val scope = rememberCoroutineScope()
    val clipboard = LocalClipboardManager.current

    var balance by remember { mutableStateOf(BalanceResponse()) }
    var visible by remember { mutableStateOf(false) }
    var copied by remember { mutableStateOf(false) }

    val address = balance.address
    val qrData = "erupee://pay?to=$address&amount=0"

    LaunchedEffect(userId) {
        try {
            val resp = RetrofitClient.api.getBalance(userId)
            if (resp.isSuccessful) balance = resp.body() ?: BalanceResponse()
        } catch (e: Exception) {
            Log.e("ReceiveScreen", "Balance fetch error: ${e.message}")
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
                        Text("Receive e₹", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text("Share your wallet address or QR code", fontSize = 13.sp, color = Color.White.copy(0.6f))
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            // ── Wallet Address Card ──
            AnimatedVisibility(
                visible = visible,
                enter = slideInVertically(tween(500, 100, FastOutSlowInEasing)) + fadeIn(tween(500, 100))
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.07f))
                ) {
                    Column(Modifier.padding(20.dp)) {
                        Text("Your Wallet Address", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                        Spacer(Modifier.height(12.dp))
                        Card(
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White.copy(0.06f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = if (address.isNotBlank()) address else "Loading address...",
                                modifier = Modifier.padding(16.dp),
                                fontSize = 13.sp,
                                color = Color(0xFF60A5FA),
                                fontWeight = FontWeight.Medium,
                                lineHeight = 20.sp
                            )
                        }
                        Spacer(Modifier.height(12.dp))
                        Button(
                            onClick = {
                                if (address.isNotBlank()) {
                                    clipboard.setText(AnnotatedString(address))
                                    copied = true
                                    scope.launch {
                                        delay(2000)
                                        copied = false
                                    }
                                }
                            },
                            enabled = address.isNotBlank(),
                            modifier = Modifier.fillMaxWidth().height(50.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF3B82F6),
                                disabledContainerColor = Color.White.copy(0.1f)
                            )
                        ) {
                            Icon(
                                imageVector = if (copied) Icons.Default.Check else Icons.Default.ContentCopy,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp),
                                tint = Color.White
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(
                                if (copied) "Copied!" else "Copy Address",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color.White
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // ── QR Code Card ──
            AnimatedVisibility(
                visible = visible,
                enter = slideInVertically(tween(600, 200, FastOutSlowInEasing)) + fadeIn(tween(600, 200))
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.07f))
                ) {
                    Column(
                        Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("QR Code", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                        Spacer(Modifier.height(16.dp))

                        // QR-like canvas pattern based on address
                        Box(
                            modifier = Modifier
                                .size(200.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color.White)
                                .padding(12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Canvas(modifier = Modifier.fillMaxSize()) {
                                val cellSize = size.width / 12f
                                for (row in 0 until 12) {
                                    for (col in 0 until 12) {
                                        val idx = row * 12 + col
                                        val charCode = if (address.isNotBlank()) {
                                            address[idx % address.length].code
                                        } else 0
                                        val isFilled = charCode % 3 != 0
                                        // Corner finder patterns
                                        val isCorner = (row < 3 && col < 3) ||
                                                (row < 3 && col > 8) ||
                                                (row > 8 && col < 3)
                                        if (isFilled || isCorner) {
                                            drawRect(
                                                color = Color(0xFF0F172A),
                                                topLeft = Offset(col * cellSize + 1f, row * cellSize + 1f),
                                                size = Size(cellSize - 2f, cellSize - 2f)
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        Spacer(Modifier.height(10.dp))
                        Text(
                            "Scan to send e₹ to this wallet",
                            fontSize = 12.sp,
                            color = Color.White.copy(0.5f),
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // ── Deep Link Card ──
            AnimatedVisibility(
                visible = visible,
                enter = slideInVertically(tween(700, 300, FastOutSlowInEasing)) + fadeIn(tween(700, 300))
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.07f))
                ) {
                    Column(Modifier.padding(20.dp)) {
                        Row(
                            Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Payment Deep Link", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                            IconButton(
                                onClick = {
                                    clipboard.setText(AnnotatedString(qrData))
                                    copied = true
                                    scope.launch { delay(2000); copied = false }
                                }
                            ) {
                                Icon(
                                    imageVector = if (copied) Icons.Default.Check else Icons.Default.ContentCopy,
                                    contentDescription = "Copy link",
                                    tint = Color(0xFF60A5FA),
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                        Spacer(Modifier.height(8.dp))
                        Text(
                            qrData,
                            fontSize = 11.sp,
                            color = Color.White.copy(0.4f),
                            lineHeight = 16.sp
                        )
                    }
                }
            }

            Spacer(Modifier.height(24.dp))
        }
    }
}
