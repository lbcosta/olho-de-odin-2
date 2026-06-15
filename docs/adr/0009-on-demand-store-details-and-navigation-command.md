# 9. On-Demand Store Details and Navigation Command

We decided to fetch detailed store coordinates (`mapName`, `xpos`, `ypos`) on-demand rather than pre-fetching them during general item search. When the user clicks the navigation button for a specific store in the UI, the application will queue a request to Endpoint 2 (Store Info) using the store's unique `ssi` (Shop Sale ID). 

Once retrieved, the coordinate details are copied to the clipboard as a standard Ragnarok navigation command (`/navi {mapName} {xpos}/{ypos}`) and cached locally in SQLite. The cache entry is keyed by the unique `ssi` and is valid as long as that store session remains active in the current market search results, preventing redundant API requests if the user copies the command multiple times.
