#!/bin/bash

# OSINT Studio Startup Script
# Handles Wayland/X11 compatibility and graphics issues

echo "🔍 OSINT Studio - Starting..."
echo "🐧 Detected: $(uname -a | cut -d' ' -f1-2)"

# Graphics compatibility environment variables
export WEBKIT_DISABLE_COMPOSITING_MODE=1
export WEBKIT_DISABLE_DMABUF_RENDERER=1
export GDK_BACKEND=x11
export QT_QPA_PLATFORM=xcb
export LIBGL_ALWAYS_SOFTWARE=1
export GALLIUM_DRIVER=llvmpipe

# Additional graphics debugging (optional)
# export WEBKIT_INSPECTOR_SERVER=127.0.0.1:9222
# export G_MESSAGES_DEBUG=all

echo "🎮 Using software rendering for compatibility"
echo "🚀 Starting application..."

# Start the app
npm run tauri dev