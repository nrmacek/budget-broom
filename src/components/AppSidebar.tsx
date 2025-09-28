import React from 'react';
import { Tag, Settings, Plus, History, ChevronsLeft, ChevronsRight } from 'lucide-react';
import BRPLogo from '@/assets/BRP_Logo.svg';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '@/components/ui/sidebar';

const menuItems = [
  { title: 'New Receipt', url: '/dashboard', icon: Plus },
  { title: 'History', url: '/history', icon: History },
  { title: 'Categories', url: '/categories', icon: Tag },
];

const bottomItems = [
  { title: 'Settings', url: '/settings', icon: Settings },
];

interface AppSidebarProps {
  onNewReceipt: () => void;
}

export function AppSidebar({ onNewReceipt }: AppSidebarProps) {
  const { state, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const isCollapsed = state === 'collapsed';

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

  return (
    <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__inner">
        {/* Header */}
        <div className="sidebar__header">
          <div className="flex items-center gap-3">
            <img src={BRPLogo} alt="BRP Logo" className="h-6 shrink-0" />
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