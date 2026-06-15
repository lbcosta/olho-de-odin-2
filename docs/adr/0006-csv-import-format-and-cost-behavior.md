# 6. CSV Import Format and Cost Behavior

We decided that the bulk import feature will accept a simple text file containing a list of item names (one per line) rather than a complex multi-column CSV. For each name, the application will query the market search API to find the corresponding `itemId`. 

Additionally, since many items are farmed/obtained without direct purchase cost, the `Profitability Floor` (Piso de Lucratividade) is entirely optional. If not set, the application will disable price floor checks for that item, permitting sales recommendations at any market price.
