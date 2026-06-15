# 7. Proportional Watchlist Update Interval

We decided to distribute watchlist updates evenly across the configured update interval $T$, rather than executing updates in a single burst. To guarantee that the 3-second rate limit is never violated, the minimum allowed update interval is dynamically calculated and enforced based on the number of items $N$ in the watchlist:

$$ T_{min} = N \times 3 \text{ seconds} $$

The spacing between individual item updates is defined as:

$$ S = \frac{T}{N} \text{ seconds} $$

Since $T \ge T_{min}$, the spacing $S$ will always be greater than or equal to 3 seconds. When a user adds a new item to the watchlist, if the current interval $T$ becomes less than the new $T_{min}$, the application will automatically scale the interval up to the new $T_{min}$ (or alert the user) to prevent request overlaps and rate-limit violations.
