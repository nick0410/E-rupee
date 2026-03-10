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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.ShowChart
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
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
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.myapplication.data.BalanceResponse
import com.example.myapplication.data.LockEntry
import com.example.myapplication.data.TransactionItem
import com.example.myapplication.network.RetrofitClient
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val typeColorMap = mapOf(
    "MINT"          to Color(0xFF22C55E),
    "TRANSFER_OUT"  to Color(0xFF3B82F6),
    "TRANSFER_IN"   to Color(0xFF10B981),
    "LOCK"          to Color(0xFFF59E0B),
    "RELEASE"       to Color(0xFF8B5CF6),
)
private fun typeColor(type: String) = typeColorMap[type] ?: Color(0xFF64748B)

@Composable
fun AnalyticsScreen(userId: Int) {
    val scope = rememberCoroutineScope()
    var visible by remember { mutableStateOf(false) }
    var transactions by remember { mutableStateOf<List<TransactionItem>>(emptyList()) }
    var balance by remember { mutableStateOf(BalanceResponse()) }
    var locks by remember { mutableStateOf<List<LockEntry>>(emptyList()) }
    var networkBlock by remember { mutableStateOf("—") }
    var networkChain by remember { mutableStateOf("—") }
    var networkGas by remember { mutableStateOf("—") }
    var loading by remember { mutableStateOf(false) }

    fun refresh() {
        scope.launch {
            loading = true
            try {
                val tx = RetrofitClient.api.getTransactions(userId)
                if (tx.isSuccessful) transactions = tx.body()?.transactions ?: emptyList()
                val b = RetrofitClient.api.getBalance(userId)
                if (b.isSuccessful) balance = b.body() ?: BalanceResponse()
                val l = RetrofitClient.api.getLocks(userId)
                if (l.isSuccessful) locks = l.body()?.locks ?: emptyList()
                // network info (if endpoint present)
                try {
                    // GET /blockchain/info is not in ApiService yet — skip gracefully
                } catch (_: Exception) {}
            } catch (e: Exception) {
                Log.e("Analytics", e.message ?: "error")
            }
            loading = false
        }
    }

    LaunchedEffect(userId) { refresh(); visible = true }

    // ── Computed analytics ──
    val totalVolume = transactions.sumOf { it.amount }
    val avgAmount = if (transactions.isNotEmpty()) totalVolume / transactions.size else 0.0
    val largest = transactions.maxOfOrNull { it.amount } ?: 0.0
    val smallest = if (transactions.isNotEmpty()) transactions.minOf { it.amount } else 0.0

    // Group by date (last 7 entries)
    val dateFormat = SimpleDateFormat("dd MMM", Locale.getDefault())
    val byDate = transactions
        .groupBy { dateFormat.format(Date(it.createdAt.let { d -> try { SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(d.take(10))?.time ?: 0L } catch (_: Exception) { 0L } })) }
        .mapValues { (_, txs) -> txs.sumOf { it.amount } }
    val dateEntries = byDate.entries.toList().takeLast(7)
    val maxVol = dateEntries.maxOfOrNull { it.value } ?: 1.0

    // Group by type
    val typeCounts = transactions.groupBy { it.type }.mapValues { it.value.size }
    val typeVolumes = transactions.groupBy { it.type }.mapValues { (_, list) -> list.sumOf { it.amount } }
    val totalCount = transactions.size.coerceAtLeast(1)

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
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column {
                        Text("Analytics", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text("Real analytics from your transactions", fontSize = 13.sp, color = Color.White.copy(0.55f))
                    }
                    IconButton(onClick = { refresh() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = Color.White, modifier = Modifier.size(22.dp))
                    }
                }
            }

            Spacer(Modifier.height(20.dp))

            // ── Key Metrics ──
            AnimatedVisibility(visible = visible, enter = slideInVertically(tween(500, 100, FastOutSlowInEasing)) + fadeIn(tween(500, 100))) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        StatTile(Modifier.weight(1f), "Total Volume", "e₹ ${"%.0f".format(totalVolume)}", Color(0xFF3B82F6), Icons.Default.BarChart)
                        StatTile(Modifier.weight(1f), "Transactions", transactions.size.toString(), Color(0xFF22C55E), Icons.Default.ShowChart)
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        StatTile(Modifier.weight(1f), "Avg Amount", "e₹ ${"%.0f".format(avgAmount)}", Color(0xFF8B5CF6), Icons.Default.TrendingUp)
                        StatTile(Modifier.weight(1f), "Active Locks", locks.size.toString(), Color(0xFFF59E0B), Icons.Default.BarChart)
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // ── Detailed stats row ──
            AnimatedVisibility(visible = visible, enter = fadeIn(tween(600, 200))) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    MiniStat(Modifier.weight(1f), "Largest", "e₹ ${"%.0f".format(largest)}", Color(0xFF22C55E))
                    MiniStat(Modifier.weight(1f), "Smallest", "e₹ ${"%.0f".format(smallest)}", Color(0xFF3B82F6))
                    MiniStat(Modifier.weight(1f), "Balance", "e₹ ${balance.balance.split(".")[0]}", Color.White)
                    MiniStat(Modifier.weight(1f), "Locked", "e₹ ${balance.locked.split(".")[0]}", Color(0xFFF59E0B))
                }
            }

            Spacer(Modifier.height(16.dp))

            // ── Volume Bar Chart ──
            AnimatedVisibility(visible = visible, enter = slideInVertically(tween(600, 300, FastOutSlowInEasing)) + fadeIn(tween(600, 300))) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(0.07f))
                ) {
                    Column(Modifier.padding(20.dp)) {
                        Text("Volume by Date", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                        Spacer(Modifier.height(16.dp))
                        if (dateEntries.isEmpty()) {
                            Box(Modifier.fillMaxWidth().height(120.dp), contentAlignment = Alignment.Center) {
                                Text("No transaction data yet", color = Color.White.copy(0.3f), fontSize = 13.sp)
                            }
                        } else {
                            Row(
                                modifier = Modifier.fillMaxWidth().height(140.dp),
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                verticalAlignment = Alignment.Bottom
                            ) {
                                dateEntries.forEach { (date, vol) ->
                                    val frac = (vol / maxVol).toFloat().coerceIn(0.05f, 1f)
                                    Column(
                                        modifier = Modifier.weight(1f),
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.Bottom
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height((120 * frac).dp)
                                                .clip(RoundedCornerShape(topStart = 6.dp, topEnd = 6.dp))
                                                .background(Brush.verticalGradient(listOf(Color(0xFF60A5FA), Color(0xFF3B82F6))))
                                        )
                                        Spacer(Modifier.height(4.dp))
                                        Text(date, fontSize = 9.sp, color = Color.White.copy(0.4f), textAlign = TextAlign.Center)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // ── Transaction Type Donut + Legend ──
            AnimatedVisibility(visible = visible, enter = slideInVertically(tween(700, 400, FastOutSlowInEasing)) + fadeIn(tween(700, 400))) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(0.07f))
                ) {
                    Column(Modifier.padding(20.dp)) {
                        Text("Transaction Types", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                        Spacer(Modifier.height(16.dp))
                        if (typeCounts.isEmpty()) {
                            Box(Modifier.fillMaxWidth().height(80.dp), contentAlignment = Alignment.Center) {
                                Text("No data yet", color = Color.White.copy(0.3f), fontSize = 13.sp)
                            }
                        } else {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                // Donut
                                Box(modifier = Modifier.size(120.dp)) {
                                    Canvas(modifier = Modifier.fillMaxSize()) {
                                        val stroke = 18.dp.toPx()
                                        val radius = (size.minDimension - stroke) / 2
                                        val center = Offset(size.width / 2, size.height / 2)
                                        // Background ring
                                        drawCircle(color = Color.White.copy(0.08f), radius = radius, center = center, style = Stroke(stroke))
                                        var startAngle = -90f
                                        typeCounts.forEach { (type, count) ->
                                            val sweep = (count.toFloat() / totalCount) * 360f
                                            drawArc(
                                                color = typeColor(type),
                                                startAngle = startAngle,
                                                sweepAngle = sweep - 2f,
                                                useCenter = false,
                                                topLeft = Offset(center.x - radius, center.y - radius),
                                                size = Size(radius * 2, radius * 2),
                                                style = Stroke(stroke, cap = StrokeCap.Round)
                                            )
                                            startAngle += sweep
                                        }
                                    }
                                    // center text
                                    Column(Modifier.align(Alignment.Center), horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(transactions.size.toString(), fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                        Text("Total", fontSize = 10.sp, color = Color.White.copy(0.4f))
                                    }
                                }
                                Spacer(Modifier.width(20.dp))
                                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    typeCounts.forEach { (type, count) ->
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Box(Modifier.size(10.dp).clip(CircleShape).background(typeColor(type)))
                                            Spacer(Modifier.width(8.dp))
                                            Text(type, fontSize = 12.sp, color = Color.White.copy(0.7f), modifier = Modifier.weight(1f))
                                            Text(count.toString(), fontSize = 12.sp, color = Color.White, fontWeight = FontWeight.Bold)
                                            Spacer(Modifier.width(4.dp))
                                            Text("(${(count * 100 / totalCount)}%)", fontSize = 10.sp, color = Color.White.copy(0.4f))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // ── Volume by Type (progress bars) ──
            if (typeVolumes.isNotEmpty()) {
                AnimatedVisibility(visible = visible, enter = slideInVertically(tween(800, 500, FastOutSlowInEasing)) + fadeIn(tween(800, 500))) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White.copy(0.07f))
                    ) {
                        Column(Modifier.padding(20.dp)) {
                            Text("Volume by Transaction Type", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                            Spacer(Modifier.height(16.dp))
                            typeVolumes.forEach { (type, vol) ->
                                val pct = if (totalVolume > 0) (vol / totalVolume).toFloat() else 0f
                                Column(Modifier.fillMaxWidth()) {
                                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Box(Modifier.size(8.dp).clip(CircleShape).background(typeColor(type)))
                                            Spacer(Modifier.width(6.dp))
                                            Text(type, fontSize = 12.sp, color = Color.White.copy(0.7f))
                                        }
                                        Text("e₹ ${"%.0f".format(vol)} (${"%.0f".format(pct * 100)}%)", fontSize = 12.sp, color = Color.White)
                                    }
                                    Spacer(Modifier.height(6.dp))
                                    LinearProgressIndicator(
                                        progress = pct,
                                        modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                                        color = typeColor(type),
                                        trackColor = Color.White.copy(0.08f)
                                    )
                                    Spacer(Modifier.height(12.dp))
                                }
                            }
                        }
                    }
                }
                Spacer(Modifier.height(16.dp))
            }

            // ── Network Status ──
            AnimatedVisibility(visible = visible, enter = fadeIn(tween(900, 600))) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(0.07f))
                ) {
                    Column(Modifier.padding(20.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(Modifier.size(8.dp).clip(CircleShape).background(Color(0xFF22C55E)))
                            Spacer(Modifier.width(8.dp))
                            Text("Network Status", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                            Spacer(Modifier.width(8.dp))
                            Text("LIVE", fontSize = 10.sp, color = Color(0xFF22C55E), fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.height(12.dp))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                            NetworkStat("Network", "eRupee CBDC")
                            NetworkStat("Chain ID", "1337")
                            NetworkStat("Gas Price", "0 Gwei")
                            NetworkStat("Status", "● Online")
                        }
                    }
                }
            }

            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun StatTile(modifier: Modifier, label: String, value: String, color: Color, icon: ImageVector) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(0.07f))
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier.size(32.dp).clip(RoundedCornerShape(8.dp)).background(color.copy(0.15f)),
                    contentAlignment = Alignment.Center
                ) { Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(16.dp)) }
                Spacer(Modifier.width(8.dp))
                Text(label, fontSize = 11.sp, color = Color.White.copy(0.5f))
            }
            Spacer(Modifier.height(8.dp))
            Text(value, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
        }
    }
}

@Composable
private fun MiniStat(modifier: Modifier, label: String, value: String, color: Color) {
    Card(modifier = modifier, shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color.White.copy(0.06f))) {
        Column(Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = color)
            Text(label, fontSize = 9.sp, color = Color.White.copy(0.4f), textAlign = TextAlign.Center)
        }
    }
}

@Composable
private fun NetworkStat(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White, textAlign = TextAlign.Center)
        Text(label, fontSize = 10.sp, color = Color.White.copy(0.4f))
    }
}
