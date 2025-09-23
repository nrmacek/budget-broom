import React, { useState } from 'react';
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
      className={`${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 border-r bg-gradient-card/70 backdrop-blur-md shadow-medium`}
      collapsible="icon"
    >
      {/* Header with Logo */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'}`}>
        <div className="flex items-center gap-3">
          <div className={`${isCollapsed ? 'p-1.5' : 'p-2'} rounded-xl bg-gradient-hero shadow-glow shrink-0`}>
            <Receipt className={`${isCollapsed ? 'h-4 w-4' : 'h-5 w-5'} text-white`} />
          </div>
          {!isCollapsed && (
            <div>
              <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">ReceiptParser</span>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="py-4">
        {/* Main Navigation */}
        <SidebarGroup>
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
                      className="flex items-center gap-3 w-full p-2 rounded-lg transition-all duration-200"
                      onClick={() => handleMenuClick(item.title, item.url)}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span className="truncate font-medium">{item.title}</span>}
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
                      <button className="flex items-center gap-3 w-full p-2 rounded-lg transition-all duration-200 hover:bg-accent/30">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!isCollapsed && <span className="truncate font-medium">{item.title}</span>}
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
      <div className="p-2 border-t border-border/50 bg-gradient-subtle/30">
        <SidebarTrigger className="w-full justify-center hover:bg-accent/30 transition-all duration-200 rounded-lg" />
      </div>
    </Sidebar>
  );
}