import React, { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { CategoryOverview } from '@/components/CategoryOverview';
import { ReviewQueue } from '@/components/ReviewQueue';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { CategoryList } from '@/components/CategoryList';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, PieChart, ListChecks, Settings } from 'lucide-react';

export type DateRange = 'week' | 'month' | '3months' | 'year' | 'all';

const Categories = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [activeTab, setActiveTab] = useState('overview');

  const handleNewReceipt = () => {
    navigate('/dashboard');
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: error.message,
      });
    } else {
      navigate('/');
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar onNewReceipt={handleNewReceipt} />
        <div className="flex-1 bg-gradient-background">
          {/* Header */}
          <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50 shadow-soft">
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-raleway">
                  Categories
                </h1>
                <p className="text-muted-foreground">
                  Manage your spending categories and review uncategorized items
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <DateRangeFilter value={dateRange} onChange={setDateRange} />
                {user && (
                  <UserProfileDropdown user={user} onSignOut={handleSignOut} />
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Tabs Navigation */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="review" className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4" />
                    Review Queue
                  </TabsTrigger>
                  <TabsTrigger value="categories" className="flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    All Categories
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  <CategoryOverview dateRange={dateRange} />
                </TabsContent>

                {/* Review Queue Tab */}
                <TabsContent value="review" className="space-y-6">
                  <Card className="p-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold mb-2">Items Needing Review</h2>
                      <p className="text-muted-foreground">
                        Review and categorize items with low confidence or that are uncategorized
                      </p>
                    </div>
                    <ReviewQueue dateRange={dateRange} />
                  </Card>
                </TabsContent>

                {/* All Categories Tab */}
                <TabsContent value="categories" className="space-y-6">
                  <CategoryList dateRange={dateRange} />
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-6">
                  <Card className="p-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold mb-2">Category Settings</h2>
                      <p className="text-muted-foreground">
                        Configure category rules and automation settings (Coming in Phase 3)
                      </p>
                    </div>
                    <div className="text-center py-12 text-muted-foreground">
                      <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Category rules and smart learning features coming soon!</p>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Categories;