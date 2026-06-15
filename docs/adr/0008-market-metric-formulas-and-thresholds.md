# 8. Market Metric Formulas and Thresholds

We decided to implement dynamic market metric evaluations using the 10-day historical data array (`priceDetailDayList`) from Endpoint 3/4, combined with active store listings from Endpoint 1. This prevents false positive alerts caused by time-of-day or day-of-week fluctuations.

## 1. Hot Item (Alta Demanda)
An item is flagged as a "Hot Item" if:
1. **Critical Stock:** Current active store stock (Endpoint 1) is less than 30% of the 10-day historical daily average volume:
   $$ \text{LiveStock} < 0.30 \times V_{10} $$
   where $V_{10}$ is the mean daily `itemCnt` over the last 10 historical days.
2. **Stable/Rising Price:** The 3-day recent average price ($P_3$) is at least 95% of the 10-day historical average price ($P_{10}$):
   $$ P_3 \ge 0.95 \times P_{10} $$
   where $P_3$ is the mean of `avgItemPrice` over the last 3 days, and $P_{10}$ is the mean of `avgItemPrice` over the last 10 days.

## 2. Volatility (Volatilidade)
We classify the general stability of an item using its 10-day historical volatility. For each historical day $d$, the daily volatility is calculated as:
$$ \text{Vol}_d = \frac{\text{maxItemPrice}_d - \text{minItemPrice}_d}{\text{avgItemPrice}_d} $$
The historical volatility ($\text{Vol}_{\text{avg}}$) is the mean of $\text{Vol}_d$ over the 10 days.
- **Stable Market ("Dinheiro Certo"):** $\text{Vol}_{\text{avg}} < 15\%$
- **Unstable Market (Volatile):** $\text{Vol}_{\text{avg}} \ge 35\%$

## 3. Crash Alert (Quedas Bruscas)
A crash alert (alerting sudden inventory dump or price manipulation) is triggered if the most recent historical day (Day 1) shows a severe drop in both price and volume compared to the average of the 3 preceding days (Days 2, 3, and 4):
1. **Price Crash:** The price on Day 1 is more than 30% below the average price of Days 2–4.
2. **Volume Crash:** The volume (`itemCnt`) on Day 1 is more than 50% below the average volume of Days 2–4.
