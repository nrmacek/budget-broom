import React, { useState, useEffect } from 'react';
import { Receipt, Tag, Settings, Plus, History, ChevronsLeft, ChevronsRight, Sparkles } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSidebar } from '@/components/ui/sidebar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/BRP_Logo_Only.png';

const menuItems = [
  { title: 'New Receipt', url: '/dashboard', icon: Plus },
  { title: 'History', url: '/history', icon: History },
  { title: 'Categories', url: '/categories', icon: Tag },
];

const bottomItems = [
  { title: 'Settings', url: '/settings', icon: Settings },
];

interface UsageData {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  tier: 'free' | 'plus' | 'pro';
}

interface AppSidebarProps {
  onNewReceipt: () => void;
}

export function AppSidebar({ onNewReceipt }: AppSidebarProps) {
  const { state, toggleSidebar } = useSidebar();
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isCollapsed = state === 'collapsed';
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  // Fetch usage data on mount
  // SILENT FAIL: If fetch fails, just don't show usage indicator - not critical
  useEffect(() => {
    const fetchUsage = async () => {
      if (!session) {
        setIsLoadingUsage(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('check-usage', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          // Silent fail - usage indicator is nice-to-have, not critical
          console.error('AppSidebar: check-usage failed (silent):', error);
          return;
        }

        if (data) {
          setUsageData(data as UsageData);
        }
      } catch (error) {
        // Silent fail - usage indicator is nice-to-have, not critical
        console.error('AppSidebar: check-usage exception (silent):', error);
      } finally {
        setIsLoadingUsage(false);
      }
    };

    fetchUsage();
  }, [session]);

  const handleMenuClick = (title: string, url: string) => {
    if (title === 'New Receipt') {
      onNewReceipt();
    } else {
      navigate(url);
    }
  };

  const isActiveRoute = (url: string) => {
    // Don't highlight "New Receipt" as active, only other routes
    if (url === '/dashboard') return false;
    return location.pathname === url;
  };

  // Calculate usage percentage and color
  const getUsagePercentage = () => {
    if (!usageData || usageData.limit === 0) return 0;
    return Math.min(100, (usageData.used / usageData.limit) * 100);
  };

  const getProgressColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-success';
  };

  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case 'free': return 'Free Plan';
      case 'plus': return 'Plus';
      case 'pro': return 'Pro';
      default: return 'Free Plan';
    }
  };

  const shouldShowUpgrade = usageData?.tier === 'free' && getUsagePercentage() > 50;

  return (
    <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__inner">
        {/* Header */}
        <div className="sidebar__header">
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="Best Receipt Parser Logo" 
              className="h-10 w-auto object-contain shrink-0 rounded-none"
            />
            <span className="nav-item__label font-bold text-sm overflow-hidden transition-all duration-200">
              <span className="text-primary">Best</span>{" "}
              <span className="text-muted-foreground">Receipt Parser</span>
            </span>
          </div>
          <button 
            onClick={toggleSidebar}
            className="collapse-toggle mt-3 p-2 hover:bg-accent/30 rounded-lg transition-colors w-full flex items-center justify-center"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="sidebar__nav">
          {menuItems.map((item) => (
            <button
              key={item.title}
              onClick={() => handleMenuClick(item.title, item.url)}
              className={`nav-item ${isActiveRoute(item.url) ? 'nav-item--active' : ''}`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="nav-item__label">{item.title}</span>
            </button>
          ))}
        </nav>

        {/* Usage Indicator - Loading State */}
        {isLoadingUsage && !isCollapsed && (
          <div className="px-3 py-2 mx-2 mt-auto mb-2 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center justify-between mb-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2.5 w-12" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        )}

        {/* Usage Indicator - Loaded */}
        {!isLoadingUsage && usageData && !isCollapsed && (
          <div className="px-3 py-2 mx-2 mt-auto mb-2 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>{usageData.used} / {usageData.limit} receipts</span>
              <span className="text-[10px] uppercase tracking-wide">{getTierDisplayName(usageData.tier)}</span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className={`h-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${getUsagePercentage()}%` }}
              />
            </div>
            {shouldShowUpgrade && (
              <Link 
                to="/#pricing" 
                className="flex items-center gap-1 text-[10px] text-primary hover:underline mt-1.5"
              >
                <Sparkles className="h-3 w-3" />
                Upgrade for more
              </Link>
            )}
          </div>
        )}

        {/* Collapsed Usage Indicator - Loading */}
        {isLoadingUsage && isCollapsed && (
          <div className="px-2 py-2 mx-1 mt-auto mb-2">
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        )}

        {/* Collapsed Usage Indicator - Loaded */}
        {!isLoadingUsage && usageData && isCollapsed && (
          <div className="px-2 py-2 mx-1 mt-auto mb-2">
            <div 
              className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted"
              title={`${usageData.used} / ${usageData.limit} receipts (${getTierDisplayName(usageData.tier)})`}
            >
              <div 
                className={`h-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${getUsagePercentage()}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="sidebar__footer">
          {bottomItems.map((item) => (
            <button
              key={item.title}
              onClick={() => navigate(item.url)}
              className="nav-item"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="nav-item__label">{item.title}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}