// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

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
