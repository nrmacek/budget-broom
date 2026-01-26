import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, X, Shield, Zap, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, PRICING_CONFIG, getTierByProductId } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

const Billing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const { subscriptionData, createCheckout, refreshSubscription } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle checkout success/cancel feedback
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      refreshSubscription();
      toast({
        title: 'Welcome to your new plan!',
        description: 'Your subscription is now active.',
      });
      window.history.replaceState({}, '', '/billing');
    }

    if (canceled === 'true') {
      toast({
        title: 'Checkout canceled',
        description: 'You can upgrade anytime.',
      });
      window.history.replaceState({}, '', '/billing');
    }
  }, [searchParams, refreshSubscription, toast]);

  const handleUpgrade = async (plan: 'plus' | 'pro') => {
    setLoadingPlan(plan);
    try {
      const priceId = isYearly
        ? PRICING_CONFIG[plan].yearly_price_id
        : PRICING_CONFIG[plan].monthly_price_id;

      const url = await createCheckout(priceId);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create checkout session. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Determine current tier from subscription product_id
  const currentTier = getTierByProductId(subscriptionData.product_id);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      icon: Zap,
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        { text: '25 receipts per month', included: true },
        { text: 'Basic categorization', included: true },
        { text: 'Single receipt upload', included: true },
        { text: 'CSV export', included: false },
        { text: 'Receipt history', included: false },
        { text: 'Bulk upload', included: false },
        { text: 'Priority support', included: false },
      ],
      cta: currentTier === 'free' ? 'Current Plan' : 'Downgrade',
      disabled: currentTier === 'free',
      highlight: false,
    },
    {
      id: 'plus',
      name: 'Plus',
      icon: Zap,
      monthlyPrice: PRICING_CONFIG.plus.monthly_price,
      yearlyPrice: PRICING_CONFIG.plus.yearly_price,
      features: [
        { text: '500 receipts per month', included: true },
        { text: 'Advanced categorization', included: true },
        { text: 'Smart suggestions', included: true },
        { text: 'CSV export', included: true },
        { text: '90-day receipt history', included: true },
        { text: 'Bulk upload', included: false },
        { text: 'Priority support', included: false },
      ],
      cta: currentTier === 'plus' ? 'Current Plan' : currentTier === 'pro' ? 'Downgrade' : 'Upgrade to Plus',
      disabled: currentTier === 'plus',
      highlight: true,
    },
    {
      id: 'pro',
      name: 'Pro',
      icon: Crown,
      monthlyPrice: PRICING_CONFIG.pro.monthly_price,
      yearlyPrice: PRICING_CONFIG.pro.yearly_price,
      features: [
        { text: '2,500 receipts per month', included: true },
        { text: 'Everything in Plus', included: true },
        { text: 'Bulk upload (up to 20)', included: true },
        { text: 'Multi-format export', included: true },
        { text: 'Unlimited history', included: true },
        { text: 'Priority support', included: true },
        { text: 'Early access to features', included: true },
      ],
      cta: currentTier === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      disabled: currentTier === 'pro',
      highlight: false,
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar onNewReceipt={() => navigate('/dashboard')} />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-14 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-end px-4 sm:px-6">
            {user && (
              <UserProfileDropdown user={user} onSignOut={handleSignOut} />
            )}
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
              {/* Header Section */}
              <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold font-raleway text-foreground">
                  Choose Your Plan
                </h1>
                <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
                  Unlock more receipts and powerful features by upgrading your plan.
                </p>
              </div>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4 mb-10">
                <span
                  className={`text-sm font-medium transition-colors ${
                    !isYearly ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Monthly
                </span>
                <Switch
                  checked={isYearly}
                  onCheckedChange={setIsYearly}
                  className="data-[state=checked]:bg-primary"
                />
                <span
                  className={`text-sm font-medium transition-colors ${
                    isYearly ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Yearly
                </span>
              {isYearly && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Save 17%
                  </Badge>
                )}
              </div>

              {/* Plan Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`relative p-6 flex flex-col transition-all duration-200 ${
                      plan.highlight
                        ? 'border-primary shadow-lg md:scale-105 bg-gradient-to-b from-primary/5 to-transparent'
                        : 'border-border/50 hover:border-border'
                    } ${plan.disabled ? 'opacity-75' : ''}`}
                  >
                    {/* Badges */}
                    {plan.disabled && (
                      <Badge
                        variant="outline"
                        className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background"
                      >
                        Current Plan
                      </Badge>
                    )}
                    {plan.highlight && !plan.disabled && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    )}

                    {/* Plan Header */}
                    <div className="text-center mb-6 pt-2">
                      <plan.icon
                        className={`h-10 w-10 mx-auto mb-3 ${
                          plan.highlight ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      />
                      <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                      <div className="mt-3">
                        <span className="text-4xl font-bold text-foreground">
                          ${isYearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice}
                        </span>
                        <span className="text-muted-foreground">/mo</span>
                        {isYearly && plan.yearlyPrice > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            ${plan.yearlyPrice} billed yearly
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 flex-1 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" />
                          )}
                          <span
                            className={
                              feature.included
                                ? 'text-foreground text-sm'
                                : 'text-muted-foreground/60 text-sm'
                            }
                          >
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      className={`w-full ${
                        plan.highlight
                          ? 'bg-primary hover:bg-primary/90'
                          : plan.disabled
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : ''
                      }`}
                      variant={plan.highlight ? 'default' : 'outline'}
                      disabled={plan.disabled || loadingPlan === plan.id}
                      onClick={() => {
                        if (plan.id === 'plus' || plan.id === 'pro') {
                          handleUpgrade(plan.id);
                        }
                      }}
                    >
                      {loadingPlan === plan.id ? 'Loading...' : plan.cta}
                    </Button>
                  </Card>
                ))}
              </div>

              {/* Trust Signals */}
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground border-t border-border/40 pt-8">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Secure payment via Stripe
                </span>
                <span className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Cancel anytime
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  30-day money-back guarantee
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Billing;
