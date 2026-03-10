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
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.myapplication.data.BalanceResponse
import com.example.myapplication.data.LockEntry
import com.example.myapplication.data.LockRequest
import com.example.myapplication.network.RetrofitClient
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class InvestPlan(
    val months: Int,
    val rate: Double,
    val color: Color,
    val gradient: List<Color>,
    val label: String = "",          // custom display name (empty = auto from months)
    val durationSeconds: Long = 0    // if > 0, overrides months-based unlock time
)

private val plans = listOf(
    // ── Demo plan (1 minute lock, 15% return) ──
    InvestPlan(
        months = 0,
        rate = 15.0,
        color = Color(0xFFEC4899),
        gradient = listOf(Color(0xFFBE185D), Color(0xFFEC4899)),
        label = "1-Min Demo",
        durationSeconds = 60L
    ),
    InvestPlan(3,  5.0, Color(0xFF22C55E), listOf(Color(0xFF16A34A), Color(0xFF22C55E))),
    InvestPlan(6,  7.5, Color(0xFF3B82F6), listOf(Color(0xFF2563EB), Color(0xFF3B82F6))),
    InvestPlan(12, 9.0, Color(0xFF8B5CF6), listOf(Color(0xFF7C3AED), Color(0xFF8B5CF6))),
)

@Composable
fun InvestmentScreen(userId: Int) {
    val scope = rememberCoroutineScope()
    var visible by remember { mutableStateOf(false) }
    var balance by remember { mutableStateOf(BalanceResponse()) }
    var locks by remember { mutableStateOf<List<LockEntry>>(emptyList()) }
    var selectedPlan by remember { mutableStateOf<InvestPlan?>(null) }
    var statusMsg by remember { mutableStateOf<String?>(null) }

    fun refresh() {
        scope.launch {
            try {
                val b = RetrofitClient.api.getBalance(userId)
                if (b.isSuccessful) balance = b.body() ?: BalanceResponse()
                val l = RetrofitClient.api.getLocks(userId)
                if (l.isSuccessful) locks = l.body()?.locks ?: emptyList()
            } catch (e: Exception) {
                Log.e("Investment", e.message ?: "error")
            }
        }
    }

    LaunchedEffect(userId) { refresh(); visible = true }

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
                .padding(top = 48.dp, bottom = 24.dp)
        ) {
            // ── Header ──
            AnimatedVisibility(visible = visible, enter = fadeIn(tween(400))) {
                Column {
                    Text("Investments", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("Lock e₹ to earn fixed returns", fontSize = 13.sp, color = Color.White.copy(0.55f))
                }
            }

            Spacer(Modifier.height(16.dp))

            // ── Balance Strip ──
            AnimatedVisibility(visible = visible, enter = fadeIn(tween(500))) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(0.07f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 20.dp, horizontal = 8.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        BalanceStat("Available", balance.available, Color(0xFF22C55E), modifier = Modifier.weight(1f))
                        Box(
                            modifier = Modifier
                                .width(1.dp)
                                .height(40.dp)
                                .background(Color.White.copy(0.12f))
                        )
                        BalanceStat("Locked", balance.locked, Color(0xFFF59E0B), modifier = Modifier.weight(1f))
                        Box(
                            modifier = Modifier
                                .width(1.dp)
                                .height(40.dp)
                                .background(Color.White.copy(0.12f))
                        )
                        BalanceStat("Total", balance.balance, Color.White, modifier = Modifier.weight(1f))
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            // ── Plans ──
            AnimatedVisibility(visible = visible, enter = slideInVertically(tween(600, 200, FastOutSlowInEasing)) + fadeIn(tween(600, 200))) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Investment Plans", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Spacer(Modifier.height(4.dp))
                    plans.forEach { plan ->
                        PlanCard(plan = plan) { selectedPlan = plan }
                    }
                }
            }

            Spacer(Modifier.height(28.dp))

            // ── My Investments ──
            AnimatedVisibility(visible = visible, enter = slideInVertically(tween(700, 400, FastOutSlowInEasing)) + fadeIn(tween(700, 400))) {
                Column {
                    Text("My Investments", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Spacer(Modifier.height(12.dp))
                    if (locks.isEmpty()) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White.copy(0.05f))
                        ) {
                            Column(
                                Modifier.fillMaxWidth().padding(32.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(Icons.Default.TrendingUp, contentDescription = null, tint = Color.White.copy(0.2f), modifier = Modifier.size(40.dp))
                                Spacer(Modifier.height(8.dp))
                                Text("No active investments", color = Color.White.copy(0.4f), fontSize = 14.sp)
                                Text("Choose a plan above to get started", color = Color.White.copy(0.25f), fontSize = 12.sp)
                            }
                        }
                    } else {
                        locks.forEachIndexed { i, lock ->
                            ActiveLockCard(lock = lock, index = i)
                            Spacer(Modifier.height(8.dp))
                        }
                    }
                }
            }
        }
    }

    // ── Invest Dialog ──
    selectedPlan?.let { plan ->
        InvestDialog(
            plan = plan,
            availableBalance = balance.available.toDoubleOrNull() ?: 0.0,
            onDismiss = { selectedPlan = null },
            onConfirm = { amount ->
                selectedPlan = null
                scope.launch {
                    try {
                        val durationSecs = if (plan.durationSeconds > 0)
                            plan.durationSeconds
                        else
                            plan.months.toLong() * 30 * 24 * 3600
                        val unlockTime = (System.currentTimeMillis() / 1000) + durationSecs
                        val resp = RetrofitClient.api.lockTokens(
                            LockRequest(
                                userId = userId,
                                amount = amount,
                                unlockTime = unlockTime,
                                interestRate = plan.rate   // e.g. 15.0 for demo, 5.0 for 3M plan
                            )
                        )
                        val durationLabel = if (plan.durationSeconds > 0)
                            "${plan.durationSeconds}s (demo)"
                        else
                            "${plan.months} months"
                        statusMsg = if (resp.isSuccessful)
                            "Locked e₹ $amount for $durationLabel ✅\nWait for it to expire, then Release on Home screen!"
                        else "Investment failed"
                        refresh()
                    } catch (e: Exception) {
                        statusMsg = "Error: ${e.message}"
                    }
                }
            }
        )
    }

    statusMsg?.let { msg ->
        AlertDialog(
            onDismissRequest = { statusMsg = null },
            confirmButton = { TextButton(onClick = { statusMsg = null }) { Text("OK", color = Color(0xFF3B82F6)) } },
            title = { Text("Investment", fontWeight = FontWeight.Bold, color = Color.White) },
            text = { Text(msg, color = Color.White.copy(0.85f)) },
            containerColor = Color(0xFF1E293B),
            shape = RoundedCornerShape(16.dp)
        )
    }
}

@Composable
private fun PlanCard(plan: InvestPlan, onInvest: () -> Unit) {
    val isDemo = plan.durationSeconds > 0
    val cardTitle = if (plan.label.isNotEmpty()) plan.label else "${plan.months}-Month Fixed Deposit"
    val iconText  = if (isDemo) "⚡" else "${plan.months}M"
    val durationPill = if (isDemo) "Unlocks in 1 min ⏱" else "Returns in ${plan.months} months"
    val returnLabel = if (isDemo) "${plan.rate}% return • Test / Demo plan" else "${plan.rate}% annual returns • Lock e₹ tokens"

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.linearGradient(plan.gradient),
                    shape = RoundedCornerShape(20.dp)
                )
                .padding(20.dp)
        ) {
            // DEMO badge ribbon in top-right corner
            if (isDemo) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .background(Color.White.copy(0.25f), RoundedCornerShape(bottomStart = 10.dp))
                        .padding(horizontal = 10.dp, vertical = 3.dp)
                ) {
                    Text("DEMO", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(0.18f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = iconText,
                        fontSize = if (isDemo) 22.sp else 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
                Spacer(Modifier.width(16.dp))
                Column(Modifier.weight(1f)) {
                    Text(cardTitle, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text(returnLabel, fontSize = 12.sp, color = Color.White.copy(0.75f))
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = durationPill,
                        fontSize = 11.sp,
                        color = Color.White.copy(0.6f),
                        modifier = Modifier
                            .background(Color.White.copy(0.1f), RoundedCornerShape(6.dp))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
                Spacer(Modifier.width(8.dp))
                Button(
                    onClick = onInvest,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(0.2f))
                ) { Text("Invest", color = Color.White, fontWeight = FontWeight.SemiBold) }
            }
        }
    }
}

@Composable
private fun ActiveLockCard(lock: LockEntry, index: Int) {
    val fmt = SimpleDateFormat("dd MMM yyyy HH:mm", Locale.getDefault())
    val unlockDate = fmt.format(Date(lock.unlockTime * 1000))
    val isExpired = System.currentTimeMillis() / 1000 > lock.unlockTime

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(0.07f))
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier.size(44.dp).clip(CircleShape)
                    .background(if (isExpired) Color(0xFF22C55E).copy(0.15f) else Color(0xFFF59E0B).copy(0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    if (isExpired) Icons.Default.LockOpen else Icons.Default.Lock,
                    contentDescription = null,
                    tint = if (isExpired) Color(0xFF22C55E) else Color(0xFFF59E0B),
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text("e₹ ${lock.amount}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Text(
                    if (isExpired) "✅ Ready to release" else "Unlocks: $unlockDate",
                    fontSize = 12.sp,
                    color = if (isExpired) Color(0xFF22C55E) else Color.White.copy(0.5f)
                )
            }
            Text("#${index + 1}", fontSize = 13.sp, color = Color.White.copy(0.25f))
        }
    }
}

@Composable
private fun BalanceStat(
    label: String,
    value: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            color = Color.White.copy(0.5f)
        )
        Spacer(Modifier.height(6.dp))
        Text(
            text = "e₹ $value",
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            color = color,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun InvestDialog(
    plan: InvestPlan,
    availableBalance: Double,
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
) {
    var amount by remember { mutableStateOf("") }
    val parsed = amount.toDoubleOrNull() ?: 0.0
    val isDemo = plan.durationSeconds > 0
    // For demo: 15% flat. For monthly plans: rate * months / 12
    val projectedReturn = if (isDemo)
        parsed * (1 + plan.rate / 100)
    else
        parsed * (1 + plan.rate / 100 * plan.months / 12)

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(
                onClick = { if (amount.isNotBlank() && parsed > 0) onConfirm(amount) },
                colors = ButtonDefaults.buttonColors(containerColor = plan.color),
                enabled = parsed > 0 && parsed <= availableBalance
            ) { Text("Invest", color = Color.White) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel", color = Color.White.copy(0.6f)) } },
        title = {
            Text(
                if (isDemo) "1-Min Demo • ${plan.rate}%"
                else "${plan.months}-Month Plan • ${plan.rate}%",
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        },
        text = {
            Column {
                OutlinedTextField(
                    value = amount,
                    onValueChange = { if (it.matches(Regex("[0-9]*\\.?[0-9]*"))) amount = it },
                    label = { Text("Amount (e₹)") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White, unfocusedTextColor = Color.White,
                        focusedBorderColor = plan.color, unfocusedBorderColor = Color.White.copy(0.3f),
                        focusedLabelColor = plan.color, unfocusedLabelColor = Color.White.copy(0.5f),
                        cursorColor = plan.color
                    )
                )
                if (parsed > availableBalance && amount.isNotBlank()) {
                    Text("Exceeds available balance", fontSize = 11.sp, color = Color(0xFFF87171))
                }
                if (parsed > 0) {
                    Spacer(Modifier.height(12.dp))
                    Divider(color = Color.White.copy(0.08f))
                    Spacer(Modifier.height(10.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Projected return", fontSize = 12.sp, color = Color.White.copy(0.5f))
                        Text("e₹ ${"%.2f".format(projectedReturn)}", fontSize = 12.sp, color = plan.color, fontWeight = FontWeight.Bold)
                    }
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Lock duration", fontSize = 12.sp, color = Color.White.copy(0.5f))
                        Text(
                            if (isDemo) "1 minute" else "${plan.months} months",
                            fontSize = 12.sp,
                            color = Color.White
                        )
                    }
                }
            }
        },
        containerColor = Color(0xFF1E293B),
        shape = RoundedCornerShape(20.dp)
    )
}
