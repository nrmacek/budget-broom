import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tier limits configuration
const TIER_LIMITS = {
  free: 25,
  plus: 500,
  pro: 2500,
};

// Product IDs from Stripe
const PRODUCT_IDS = {
  plus: "prod_T8yvk9SURXeAPl",
  pro: "prod_T8ywO3nikG5DRf",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate JWT and get user claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("JWT validation failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Checking usage for user: ${userId}`);

    // Get subscription status using service role client
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Get user's email for Stripe lookup
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !userData.user) {
      console.error("Failed to get user:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check Stripe subscription
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    let tier: "free" | "plus" | "pro" = "free";
    let productId: string | null = null;

    if (stripeSecretKey && userData.user.email) {
      try {
        // Find customer by email
        const customerResponse = await fetch(
          `https://api.stripe.com/v1/customers?email=${encodeURIComponent(userData.user.email)}&limit=1`,
          {
            headers: {
              Authorization: `Bearer ${stripeSecretKey}`,
            },
          }
        );
        const customerData = await customerResponse.json();

        if (customerData.data?.length > 0) {
          const customerId = customerData.data[0].id;

          // Get active subscriptions
          const subscriptionResponse = await fetch(
            `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active&limit=1`,
            {
              headers: {
                Authorization: `Bearer ${stripeSecretKey}`,
              },
            }
          );
          const subscriptionData = await subscriptionResponse.json();

          if (subscriptionData.data?.length > 0) {
            const subscription = subscriptionData.data[0];
            productId = subscription.items.data[0]?.price?.product || null;

            if (productId === PRODUCT_IDS.pro) {
              tier = "pro";
            } else if (productId === PRODUCT_IDS.plus) {
              tier = "plus";
            }
          }
        }
      } catch (stripeError) {
        console.error("Stripe lookup error:", stripeError);
        // Continue with free tier if Stripe fails
      }
    }

    console.log(`User tier: ${tier}, product_id: ${productId}`);

    // Calculate first day of current month
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthStartStr = monthStart.toISOString().split("T")[0];

    console.log(`Checking usage for month: ${monthStartStr}`);

    // Query monthly_usage for current month
    const { data: usageData, error: usageError } = await supabaseAdmin
      .from("monthly_usage")
      .select("receipts_processed")
      .eq("user_id", userId)
      .eq("month_start", monthStartStr)
      .maybeSingle();

    if (usageError) {
      console.error("Failed to query usage:", usageError);
      return new Response(
        JSON.stringify({ error: "Failed to check usage" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const used = usageData?.receipts_processed ?? 0;
    const limit = TIER_LIMITS[tier];
    const remaining = Math.max(0, limit - used);
    const allowed = used < limit;

    console.log(`Usage check result: used=${used}, limit=${limit}, remaining=${remaining}, allowed=${allowed}`);

    return new Response(
      JSON.stringify({
        allowed,
        used,
        limit,
        remaining,
        tier,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Unexpected error in check-usage:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
