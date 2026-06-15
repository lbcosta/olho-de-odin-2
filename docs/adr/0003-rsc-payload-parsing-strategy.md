# 3. RSC Payload Parsing Strategy

We decided to implement a line-by-line parser for Next.js React Server Component (RSC) API responses. For each endpoint, the parser identifies the line starting with the relevant prefix index (e.g., `10:` for search results, `1:` for detail payloads). It strips the prefix index (everything up to the first colon) and parses the remainder of the line using standard `JSON.parse`. 

To support special characters (such as commas, backticks, and parentheses) in shop names, item names, and character names, the parser must never attempt custom regex or string splitting on commas/brackets to find fields. Instead, it must parse the entire remainder of the line as a JSON structure (either an array or an object) and traverse the resulting JavaScript object to extract target data fields.
