# 6. CSV Import Format and Cost Behavior

We decided that the bulk import feature will accept a simple text file containing a list of item names (one per line) rather than a complex multi-column CSV. For each name, the application will query the market search API to find the corresponding `itemId`. 
