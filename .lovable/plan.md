
# Fix Plan: Stripe Checkout Return Issues

## Problems Identified

### Problem 1: "Invalid time value" Error
The `check-subscription` edge function crashes when processing an active subscription because `subscription.current_period_end` is either:
- A Stripe Timestamp object (not a raw number) in the newer API version
- Potentially undefined for certain subscription states

**Error location:** Line 74 in `supabase/functions/check-subscription/index.ts`
```typescript
subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
```

### Problem 2: Redirect to Sign Up After Checkout
After Stripe checkout success, returning to `/dashboard?success=true` triggers:
1. Auth state rehydration (brief loading state)
2. `check-subscription` call that fails with 500 error
3. `ProtectedRoute` may see `user = null` briefly and redirect to `/auth`

---

## Solution

### Fix 1: Robust Date Handling in check-subscription Edge Function

Update the edge function to safely handle the `current_period_end` field:

```typescript
if (hasActiveSub) {
  const subscription = subscriptions.data[0];
  
  // Safely handle current_period_end - it could be a number, 
  // a Stripe Timestamp, or undefined
  try {
    const periodEnd = subscription.current_period_end;
    if (periodEnd && typeof periodEnd === 'number') {
      subscriptionEnd = new Date(periodEnd * 1000).toISOString();
    } else if (periodEnd) {
      // Handle case where it might be a different format
      subscriptionEnd = new Date(periodEnd).toISOString();
    }
  } catch (dateError) {
    logStep("Warning: Could not parse subscription end date", { 
      periodEnd: subscription.current_period_end 
    });
    // Continue without the end date - subscription is still valid
    subscriptionEnd = null;
  }
  
  logStep("Active subscription found", { 
    subscriptionId: subscription.id, 
    endDate: subscriptionEnd 
  });
  
  productId = subscription.items.data[0].price.product;
  priceId = subscription.items.data[0].price.id;
  logStep("Determined subscription tier", { productId, priceId });
}
```

**Key changes:**
- Wrap date parsing in try-catch to prevent crashes
- Check type of `current_period_end` before multiplying
- Log warning instead of crashing if date parsing fails
- Return valid response even without `subscription_end`

### Fix 2: No Frontend Changes Needed

The frontend already handles errors gracefully:
- `useSubscription` sets `subscribed: false` on error (line 80, 86)
- `ProtectedRoute` only checks `loading` and `user` from `useAuth`, not subscription
- The auth state listener properly rehydrates session from storage

The real issue is the edge function crash returning 500, not the frontend handling.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/check-subscription/index.ts` | Add robust date parsing with try-catch |

---

## Implementation Details

**File: `supabase/functions/check-subscription/index.ts`**

Replace lines 72-82 with safer date handling:

```typescript
if (hasActiveSub) {
  const subscription = subscriptions.data[0];
  
  // Safely parse subscription end date
  try {
    const periodEnd = subscription.current_period_end;
    if (periodEnd != null) {
      // Stripe returns Unix timestamp in seconds
      const timestamp = typeof periodEnd === 'number' ? periodEnd : Number(periodEnd);
      if (!isNaN(timestamp)) {
        subscriptionEnd = new Date(timestamp * 1000).toISOString();
      }
    }
  } catch (dateError) {
    logStep("Warning: Could not parse subscription end date", { 
      raw: subscription.current_period_end,
      error: String(dateError)
    });
  }
  
  logStep("Active subscription found", { 
    subscriptionId: subscription.id, 
    endDate: subscriptionEnd 
  });
  
  // Get product and price IDs from subscription items
  productId = subscription.items.data[0].price.product;
  priceId = subscription.items.data[0].price.id;
  logStep("Determined subscription tier", { productId, priceId });
}
```

---

## Testing Plan

After the fix is deployed:

1. **Navigate to /billing** and click "Upgrade" on Plus plan
2. **Complete Stripe checkout** with test card `4242 4242 4242 4242`
3. **Verify redirect** goes to `/dashboard?success=true` (not `/auth`)
4. **Verify success toast** shows "Welcome to Plus!"
5. **Verify subscription status** - check-subscription should return `subscribed: true`
6. **Verify billing page** shows "Current Plan" badge on Plus

---

## Expected Outcome

After this fix:
- The `check-subscription` function will handle any date format without crashing
- Users returning from Stripe checkout will stay logged in
- Subscription status will correctly show as active
- The success toast will display with the correct plan name
