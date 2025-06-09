//! # OSINT Studio Application Entry Point
//!
//! This is the main entry point for the OSINT Studio desktop application.
//! It handles platform-specific initialization and launches the Tauri application.
//!
//! ## Platform Support
//!
//! The application supports multiple platforms with specific optimizations:
//! - **Windows**: Prevents console window in release builds
//! - **Linux**: Configures display backend for maximum compatibility
//! - **macOS**: Standard Tauri configuration
//!
//! ## Linux Display Backend
//!
//! On Linux systems, the application defaults to X11 for maximum compatibility.
//! Users can override this behavior by setting the `GDK_BACKEND` environment variable.

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

/// Application entry point
///
/// Performs platform-specific initialization and launches the OSINT Studio application.
/// On Linux, it configures the display backend for optimal compatibility.
fn main() {
    // Set up display backend compatibility on Linux
    #[cfg(target_os = "linux")]
    {
        // Default to X11 for maximum compatibility
        // Users can override with environment variables if needed
        if std::env::var("GDK_BACKEND").is_err() {
            std::env::set_var("GDK_BACKEND", "x11");
        }
        
        // Disable problematic Wayland protocols that can cause crashes
        std::env::set_var("WAYLAND_DISPLAY", "");
    }
    
    osint_studio_lib::run()
}
