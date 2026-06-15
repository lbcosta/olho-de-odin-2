# 5. Window-Bound Watchlist Monitoring and Notifications

We decided that watchlist monitoring and automatic price updates will only execute while the main application window is open. If the user closes the application, monitoring stops. However, because the window can be minimized, the application will use the operating system's native notification system (via Electron's `Notification` API) in addition to in-app toast messages. This ensures the user is alerted even when the application is minimized or not in focus.
