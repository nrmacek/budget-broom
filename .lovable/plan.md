
## Fix Stripe Product Config Mismatch

### Problem Identified
The Stripe account has **4 different product IDs** for what should be 2 tiers:

| Price | Current Product ID | Expected Tier |
|-------|-------------------|---------------|
| Plus Monthly ($12/mo) | `prod_T8yvk9SURXeAPl` | Plus |
| Plus Yearly ($120/yr) | `prod_T8ywUzjReAIeog` | Plus (but different product!) |
| Pro Monthly ($39/mo) | `prod_T8yw9XDaHv2RIv` | Pro (but different product!) |
| Pro Yearly ($390/yr) | `prod_T8ywO3nikG5DRf` | Pro |

The `check-subscription` edge function determines the tier by matching the `product_id` from the subscription. With 4 different product IDs, tier detection will be inconsistent.

---

### Solution: Support Multiple Product IDs Per Tier

Update `PRICING_CONFIG` to include arrays of product IDs per tier, and modify the tier detection logic to check against all valid product IDs.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useSubscription.tsx` | Update `PRICING_CONFIG` to include all product IDs per tier; add helper function `getTierByProductId` |
| `src/pages/Billing.tsx` | Update tier detection to use the new helper function |
| Any component using tier detection | Use the centralized helper function |

---

### Updated PRICING_CONFIG Structure

```typescript
export const PRICING_CONFIG = {
  plus: {
    monthly_price_id: 'price_1SCgy7Acgun5IiHBgXyrMu86',
    yearly_price_id: 'price_1SCgyZAcgun5IiHBswBIGO2F',
    // All product IDs that correspond to Plus tier
    product_ids: ['prod_T8yvk9SURXeAPl', 'prod_T8ywUzjReAIeog'],
    name: 'Plus',
    monthly_price: 12,
    yearly_price: 120,
  },
  pro: {
    monthly_price_id: 'price_1SCgyMAcgun5IiHBebAxrygY',
    yearly_price_id: 'price_1SCgykAcgun5IiHBWjp9meQq',
    // All product IDs that correspond to Pro tier
    product_ids: ['prod_T8yw9XDaHv2RIv', 'prod_T8ywO3nikG5DRf'],
    name: 'Pro',
    monthly_price: 39,
    yearly_price: 390,
  }
};
```

---

### Add Helper Function for Tier Detection

```typescript
export function getTierByProductId(productId: string | undefined): 'free' | 'plus' | 'pro' {
  if (!productId) return 'free';
  
  if (PRICING_CONFIG.plus.product_ids.includes(productId)) {
    return 'plus';
  }
  if (PRICING_CONFIG.pro.product_ids.includes(productId)) {
    return 'pro';
  }
  
  return 'free';
}
```

---

### Update Billing.tsx Tier Detection

Replace the current tier detection logic that checks single product IDs:

```typescript
// Before
const isCurrentPlan = subscriptionData.product_id === PRICING_CONFIG.plus.product_id;

// After
const currentTier = getTierByProductId(subscriptionData.product_id);
const isCurrentPlan = currentTier === 'plus';
```

---

### Implementation Steps

1. **Update `src/hooks/useSubscription.tsx`:**
   - Change `product_id` to `product_ids` (array) in `PRICING_CONFIG`
   - Add `getTierByProductId()` helper function
   - Export the helper function for use in other components

2. **Update `src/pages/Billing.tsx`:**
   - Import `getTierByProductId` from `useSubscription`
   - Use it to determine current tier and show appropriate badges/states

3. **Verify edge function compatibility:**
   - The `check-subscription` edge function returns `product_id` from Stripe
   - The frontend helper function handles mapping to tier

---

### Technical Details

**File: `src/hooks/useSubscription.tsx`**
- Lines 24-41: Update `PRICING_CONFIG` to use `product_ids` arrays
- Add new export `getTierByProductId()` function after the config

**File: `src/pages/Billing.tsx`**
- Import the `getTierByProductId` helper
- Update the plan card rendering logic to use tier detection

---

### Outcome

After this fix:
- Plus Monthly subscribers will be correctly identified as "Plus" tier
- Plus Yearly subscribers will be correctly identified as "Plus" tier
- Pro Monthly subscribers will be correctly identified as "Pro" tier
- Pro Yearly subscribers will be correctly identified as "Pro" tier
- Feature gating (bulk upload, export limits, etc.) will work correctly regardless of billing cycle

