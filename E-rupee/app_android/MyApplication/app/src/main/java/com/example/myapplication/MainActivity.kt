package com.example.myapplication

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.myapplication.ui.EntryScreen
import com.example.myapplication.ui.LoginScreen
import com.example.myapplication.ui.SignupScreen
import com.example.myapplication.ui.MainScreen
import com.example.myapplication.ui.ReceiveScreen
import com.example.myapplication.ui.SendScreen
import com.example.myapplication.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Block screenshots and screen recordings across the entire app
        window.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )
        enableEdgeToEdge()

        setContent {
            MyApplicationTheme {

                val navController = rememberNavController()

                NavHost(
                    navController = navController,
                    startDestination = "entry"
                ) {

                    composable("entry") {
                        EntryScreen(navController)
                    }

                    composable("login") {
                        LoginScreen(navController = navController)
                    }

                    composable("signup") {
                        SignupScreen(navController)
                    }

                    // Main app shell (with bottom navbar)
                    composable(
                        route = "main/{userId}",
                        arguments = listOf(navArgument("userId") { type = NavType.IntType })
                    ) { backStackEntry ->
                        val userId = backStackEntry.arguments?.getInt("userId") ?: 0
                        MainScreen(userId = userId, navController = navController)
                    }

                    // Full-screen destinations (push on top of MainScreen)
                    composable(
                        route = "send/{userId}",
                        arguments = listOf(navArgument("userId") { type = NavType.IntType })
                    ) { backStackEntry ->
                        val userId = backStackEntry.arguments?.getInt("userId") ?: 0
                        SendScreen(userId = userId, navController = navController)
                    }

                    composable(
                        route = "receive/{userId}",
                        arguments = listOf(navArgument("userId") { type = NavType.IntType })
                    ) { backStackEntry ->
                        val userId = backStackEntry.arguments?.getInt("userId") ?: 0
                        ReceiveScreen(userId = userId, navController = navController)
                    }
                }

            }
        }
    }
}
