<!-- 
Sync Impact Report
- Version change: none -> v1.0.0
- Modified principles: Initial Draft
- Added sections: Local-First Architecture, API Request Discipline, Data Integrity & Safe Parsing, Data-Driven Market Strategies, Passive Monitoring, Governance
- Removed sections: none
- Templates requiring updates: none (✅ updated)
-->
# Constitution - Olho de Odin 2

**Version**: 1.0.0
**Ratification Date**: 2026-06-15
**Last Amended**: 2026-06-15

## 1. Local-First Architecture
The application MUST operate entirely locally without relying on custom external backends (other than the official game API). It MUST use a single-file SQLite database for storage and ensure user data portability via JSON export/import of Profiles.
*Rationale: To protect user privacy, guarantee offline functionality (viewing cached data), and ensure long-term usability without ongoing server costs.*

## 2. API Request Discipline
All outbound requests to the official game API (`ro.gnjoylatam.com`) MUST route through a centralized `RequestQueueManager` enforcing a strict minimum interval of 3 seconds between requests. Requests MUST utilize a priority system (High for user actions, Medium for Watchlist, Low for bulk imports).
*Rationale: To respect the rate limits of the external service, prevent temporary or permanent IP bans, and ensure stability of the application.*

## 3. Data Integrity & Safe Parsing
The application MUST parse React Server Component (RSC) responses safely. Developers MUST locate the target index, extract the JSON substring after the first colon, and use standard `JSON.parse`. The use of custom regex or comma-splitting for data field extraction is explicitly forbidden.
*Rationale: To prevent runtime crashes and data corruption when parsing shop, player, or item names that contain unpredictable special characters (like commas, backticks, quotes).*

## 4. Data-Driven Market Strategies
Sales recommendations MUST be strictly algorithmic, utilizing established formulas for Weighted Average Price ($P_{avg}$), Current Spread, and Competition Pressure ($CP$). The system MUST prioritize volume-weighted averages over simple arithmetic averages to avoid extreme price distortions.
*Rationale: To provide accurate, reliable, and mathematically sound market strategies (Undercutting, Premium Positioning, Flipping) that maximize user profit.*

## 5. Passive Monitoring & Notification Efficiency
The Watchlist Engine MUST dynamically scale its update intervals based on the number of active items ($T \ge N \times 3$ seconds) to avoid request overlapping. It MUST only run while the application is open and notify the user natively when a strategy criterion is met, or a disconnect/sale is detected (`is_own_shop`).
*Rationale: To maintain a smooth UX without monopolizing network resources, and to provide timely alerts without requiring constant user attention.*

## Governance
- **Amendments**: Changes to this constitution require a version bump in this file.
- **Versioning**: MAJOR version for removing/redefining principles; MINOR for new principles; PATCH for clarifications.
- **Compliance**: All future features, pull requests, and bug fixes MUST be reviewed against these principles before implementation.
