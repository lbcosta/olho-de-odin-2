# AI Agent Development Specification - Olho de Odin 2

This document details the architectural, database, API, and computational requirements for Olho de Odin 2. It is designed to allow any AI software engineer agent to start and implement this application with zero ambiguity.

---

## 1. Architectural Overview & Stack

- **Framework:** Electron (HTML/CSS/JS frontend + Node.js main process backend).
- **Target OS:** Windows (builds to a standalone `.exe` installer or portable executable).
- **Database:** SQLite (single file database named `olhodeodin.db` located in the application's local app data folder).
- **Glossary & Terminology:** All developers must adhere to the terms defined in [CONTEXT.md](file:///home/leonardo/github/lbcosta/olho-de-odin-2/CONTEXT.md).

---

## 2. Database Schema (SQLite)

The database must use a single-file structure with multi-profile support. Below is the proposed SQL schema:

```sql
-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    character_name TEXT DEFAULT NULL, -- Registered in-game character name for shop monitoring
    watchlist_interval_minutes INTEGER DEFAULT 15,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Items monitored in profiles
CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL, -- Universal Ragnarok Item ID
    item_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    UNIQUE(profile_id, item_id)
);

-- Watchlist table (associates items with monitoring state)
CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1, -- Boolean (0 or 1)
    is_own_shop INTEGER DEFAULT 0, -- Boolean (0 or 1) indicating if being sold by the user currently
    last_known_quantity INTEGER DEFAULT NULL, -- Tracks itemCnt to monitor sales vs disconnects
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id, item_id) REFERENCES items(profile_id, item_id) ON DELETE CASCADE,
    UNIQUE(profile_id, item_id)
);

-- Cache table for API Responses
CREATE TABLE IF NOT EXISTS api_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    endpoint_type TEXT NOT NULL, -- 'search_trading', 'price_history', 'market_price_search'
    response_payload TEXT NOT NULL, -- JSON-serialized parsed payload
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_id, endpoint_type)
);

-- Store Coordinate Details Cache (Linked to temporary Shop Sale ID - ssi)
CREATE TABLE IF NOT EXISTS store_coordinate_cache (
    ssi TEXT PRIMARY KEY,
    map_name TEXT NOT NULL,
    xpos TEXT NOT NULL,
    ypos TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. External API Client & RSC Parsing

All outbound requests to `https://ro.gnjoylatam.com` must route through a central `RequestQueueManager` in the Electron main process.

### Rate Limiting & Queue Rules
- **Strict Interval:** Minimum 3 seconds between any two outgoing HTTP requests.
- **Priority Queuing:** 
  1. **High Priority (Immediate):** Manual user-triggered updates (e.g., clicking "Update" in the UI, or clicking the `/navi` coordinate retrieval).
  2. **Medium Priority:** Watchlist background observations.
  3. **Low Priority:** Bulk CSV imports.

### RSC Parsing Strategy
Next.js React Server Component (RSC) text responses must be parsed line-by-line:
1. Locate the line starting with the target index (e.g., `10:` for searches, `1:` for detail POST requests).
2. Find the first colon (`:`) of that line and extract the substring immediately following it.
3. Parse the remaining substring using standard `JSON.parse`.
4. Traverse the resulting JavaScript object/array to retrieve data fields. **Never use custom regex or split strings on commas to parse fields**, to prevent crashes if shop, player, or item names contain special characters (commas, backticks, quotes).

---

## 4. Analytical Metrics & Strategies Formulas

The application must compute the following metrics on the dashboard using a combination of active listings (Endpoint 1) and 10-day history details (`priceDetailDayList` from Endpoint 3/4):

### Metrics
1. **Weighted Average Price (Média Ponderada Real - $P_{avg}$):**
   $$ P_{avg} = \frac{\sum_{i=1}^{n} (\text{avgItemPrice}_{i} \times \text{itemCnt}_{i})}{\sum_{i=1}^{n} \text{itemCnt}_{i}} $$
   where $i$ iterates through the days in `priceDetailDayList` (typically 10 days).
2. **Current Spread (Spread Atual):**
   $$ \text{Spread} = \text{maxItemPrice}_{\text{active}} - \text{minItemPrice}_{\text{active}} $$
   where prices are obtained from the current active stores list (Endpoint 1).
3. **Competition Pressure (Pressão da Concorrência - $CP$):**
   $$ CP = \frac{\sum \text{itemCnt}_{\text{active}}}{\text{Mean}(\text{itemCnt}_{10\text{-day}})} $$
   If $CP > 1.0$, the market is flagged as **Saturated**.

### Alerta de Status
- **Alta Demanda (Hot Item):** Triggered if active stock is critically low and prices are stable/rising:
  $$ \sum \text{itemCnt}_{\text{active}} < 0.30 \times \text{Mean}(\text{itemCnt}_{10\text{-day}}) \quad \text{AND} \quad P_{3\text{-day}} \ge 0.95 \times P_{10\text{-day}} $$
- **Volatilidade (Unstable Market):** Computes daily volatility: $\text{Vol}_d = \frac{\text{maxItemPrice}_d - \text{minItemPrice}_d}{\text{avgItemPrice}_d}$. 
  - **Stable ("Dinheiro Certo"):** Historical mean $\text{Vol}_{\text{avg}} < 15\%$
  - **Volatile (Unstable):** Historical mean $\text{Vol}_{\text{avg}} \ge 35\%$
- **Crash Alert (Quedas Bruscas):** Triggered if Day 1 (most recent historical day) shows both a price and volume crash compared to the average of Days 2, 3, and 4:
  $$ \text{Price}_{\text{Day1}} < 0.70 \times \text{Price}_{\text{Days2-4}} \quad \text{AND} \quad \text{Volume}_{\text{Day1}} < 0.50 \times \text{Volume}_{\text{Days2-4}} $$

### Sale Strategies
- **Undercutting:** Recommend price as $P_{\text{lowest}} - 1 \text{ Zeny}$, ignoring active stores that only have a stock of 1 unit.
- **Premium Positioning:** If the cheapest active competitor has low stock ($\text{itemCnt} < 5\% \times \text{Mean}(\text{itemCnt}_{10\text{-day}})$), recommend matching the price of the 2nd or 3rd cheapest competitor.
- **Flipping (Troll Protection):** If the minimum active price is $> 30\%$ below the 3-day historical average price ($P_{3\text{-day}}$), recommend **not selling** or **buying out the cheap competitor** (Flipping).

---

## 5. Watchlist Observation Engine

- **Execution:** Monitoring runs only when the Electron window is open.
- **Interval Control:** The update interval $T$ is profile-configurable but dynamically bounded to prevent request overlaps:
  $$ T \ge N \times 3 \text{ seconds} $$
  where $N$ is the number of active watchlist items.
- **Spacing:** Updates are spaced evenly across the interval. An update is scheduled every $S = T / N$ seconds.
- **Notifications:** Dispatched as in-app notifications and native OS alerts (via Electron's `Notification` API) when a sale strategy criterion is met.

---

## 6. Functional Requirements & UX Flow

1. **Profile Management:**
   - On startup, prompt user to select a profile or create one.
   - Export: Dumps all sqlite rows for `profile_id` to a JSON file.
   - Import: Reads the JSON file and inserts/merges records under a new or existing profile name.
2. **Bulk Import:**
   - Accepts a text file with a list of item names (one per line).
   - Enqueues search requests to resolve `itemId` for each name using the `RequestQueueManager`.
3. **Item Dashboard:**
   - Displays watchlist items with color-coded status badges (Hot, Volatile, Saturated, Crash).
   - Detailed panel shows current sellers list (Endpoint 1) and a historical chart of prices/volumes.
4. **On-Demand Coordinates:**
   - Display a "Copiar /navi" button next to each active store.
   - Clicking it queries Endpoint 2 (if not already cached for that `ssi`), copies the command `/navi {mapName} {xpos}/{ypos}` to the clipboard, and shows a temporary success toast.
5. **API Request Monitoring Footer:**
   - A very discreet, minimal footer displayed at the bottom of the interface.
   - When an API request is running (from the `RequestQueueManager` queue), show a loading spinner and the request endpoint path (e.g., `/shop-search/trading` or `/shop-search/market-price`) on the left side.
   - When the request completes or fails, display a colored status label (e.g., green "OK" or red "FAIL") on the right side.
   - Clicking on the footer expands a panel showing the historical log of all recent API requests (with fields like timestamp, endpoint path, query parameters, latency/duration, and response status).
6. **Own Shop & Disconnect (DC) Monitoring:**
   - In the Watchlist UI, allow the user to check a toggle/box indicating: "Esta na minha loja agora" (`is_own_shop = 1`).
   - The user must register their character name (`character_name`) in their Profile settings.
   - For all items flagged with `is_own_shop = 1`, the background update engine will:
     - Query Endpoint 1 (Search Trading) for the item.
     - Search the active stores list for an entry where `itemSellerCharName` matches the profile's `character_name`.
     - **Venda Parcial (Partial Sale):** If the character is found but the current `itemCnt` is less than `last_known_quantity`, trigger a native notification: *"Você vendeu [diferença] unidades de [item_name]!"* and update `last_known_quantity` to the new value.
     - **Venda Completa ou DC (Full Sale or Disconnect):** If the character name is no longer found in the active listings:
       - Trigger a native notification: *"[item_name] não está mais anunciado. Possível venda completa ou desconexão (DC) detectada."*
       - Set `is_own_shop = 0` and reset `last_known_quantity = NULL` in the database.
     - **Initial Setup / Increase:** If `last_known_quantity` is `NULL` when the item is first found, set it to the current `itemCnt` without triggering a notification.


