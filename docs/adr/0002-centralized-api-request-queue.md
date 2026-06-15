# 2. Centralized API Request Queue

We decided to implement a centralized request queue (`RequestQueueManager`) in the Electron main process to throttle all outgoing external requests to the GNJOY API. This queue enforces a strict rate limit of one request every 3 seconds to prevent IP bans. It supports priority-based queuing, allowing manual updates (triggered by user action) to jump ahead of bulk imports or periodic watchlist observations.
