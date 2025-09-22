import { useState } from 'react';
import { Receipt, Search, FileText, Settings, Plus, History } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'New Receipt', url: '/dashboard', icon: Plus },
  { title: 'Receipt History', url: '/history', icon: History },
  { title: 'Search Receipts', url: '/search', icon: Search },
  { title: 'Categories', url: '/categories', icon: FileText },
];

const bottomItems = [
  { title: 'Settings', url: '/settings', icon: Settings },
];

interface AppSidebarProps {
  onNewReceipt: () => void;
}

export function AppSidebar({ onNewReceipt }: AppSidebarProps) {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const isCollapsed = state === 'collapsed';

  const handleMenuClick = (title: string, url: string) => {
    console.log('Menu item clicked:', title);
    if (title === 'New Receipt') {
      console.log('Calling onNewReceipt function');
      onNewReceipt();
    } else {
      navigate(url);
    }
  };

  const isActiveRoute = (url: string) => {
    return location.pathname === url;
  };

  return (
    <Sidebar
      className={`${isCollapsed ? 'w-14' : 'w-64'} transition-all duration-300 border-r bg-card/50 backdrop-blur-sm`}
      collapsible="icon"
    >
      {/* Header with Logo */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-hero shrink-0">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg truncate">ReceiptParser</span>
          )}
        </div>
      </div>

      <SidebarContent className="py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs text-muted-foreground px-3 mb-2">
              Main
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className={`hover:bg-accent/50 transition-colors ${
                      isActiveRoute(item.url) ? 'bg-accent text-accent-foreground' : ''
                    }`}
                  >
                    <button 
                      className="flex items-center gap-3 w-full"
                      onClick={() => handleMenuClick(item.title, item.url)}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.title}</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom Navigation */}
        <div className="mt-auto">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {bottomItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      className="hover:bg-accent/50 transition-colors"
                    >
                      <button className="flex items-center gap-3 w-full">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!isCollapsed && <span className="truncate">{item.title}</span>}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>

      {/* Collapse Toggle */}
      <div className="p-2 border-t">
        <SidebarTrigger className="w-full justify-center hover:bg-accent/50 transition-colors" />
      </div>
    </Sidebar>
  );
}