package com.example.myapplication

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.myapplication.ui.EntryScreen
import com.example.myapplication.ui.HomeScreen
import com.example.myapplication.ui.LoginScreen
import com.example.myapplication.ui.SignupScreen
import com.example.myapplication.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
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

                    composable("home") {
                        HomeScreen()
                    }
                }

            }
        }
    }
}
