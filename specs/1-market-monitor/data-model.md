# Data Model: Market Monitor

## Entities

### Profile
- `id` (INTEGER, PK)
- `name` (TEXT, UNIQUE)
- `character_name` (TEXT, NULLABLE) - Used for tracking "is_own_shop" sales.
- `watchlist_interval_minutes` (INTEGER) - Target refresh rate (subject to engine throttling).

### Item
- `id` (INTEGER, PK)
- `profile_id` (INTEGER, FK)
- `item_id` (INTEGER) - Universal Ragnarok ID.
- `item_name` (TEXT)

### Watchlist
- `id` (INTEGER, PK)
- `profile_id` (INTEGER, FK)
- `item_id` (INTEGER, FK)
- `is_active` (INTEGER/BOOLEAN) - 1 or 0
- `is_own_shop` (INTEGER/BOOLEAN) - 1 or 0
- `last_known_quantity` (INTEGER, NULLABLE) - Tracks item count to monitor partial/total sales.

### API Cache
- `id` (INTEGER, PK)
- `item_id` (INTEGER)
- `endpoint_type` (TEXT)
- `response_payload` (TEXT) - Stored safely parsed JSON to allow offline viewing.

### Store Coordinate Cache
- `ssi` (TEXT, PK) - Shop Sale ID
- `map_name` (TEXT)
- `xpos` (TEXT)
- `ypos` (TEXT)

## Core Relationships
- A Profile has many Items.
- A Profile has many Watchlist entries.
- An Item corresponds to one Watchlist entry (One-to-One contextually within a Profile).
