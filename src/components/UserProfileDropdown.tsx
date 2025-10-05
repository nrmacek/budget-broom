import React from 'react';
import { User, Settings, CreditCard, Bell, HelpCircle, LogOut, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface UserProfileDropdownProps {
  user: {
    email?: string;
    user_metadata?: {
      display_name?: string;
      avatar_url?: string;
    };
  };
  onSignOut: () => void;
}

export const UserProfileDropdown = ({ user, onSignOut }: UserProfileDropdownProps) => {
  // Guard clause for safety
  if (!user?.email) return null;
  
  // Extract display name or use email username
  const getDisplayName = () => {
    if (user.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }
    return user.email!.split('@')[0];
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    const name = getDisplayName();
    return name.charAt(0).toUpperCase();
  };

  const displayName = getDisplayName();
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 gap-2 px-3 text-sm font-normal hover:bg-muted/50 focus:bg-muted/50 rounded-full border border-border/50 bg-background/50 backdrop-blur-sm [&:hover>span]:text-foreground"
          aria-label={`User menu for ${displayName}`}
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate max-w-[120px] sm:max-w-[160px]">
            {displayName}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-56 z-50 bg-popover border shadow-md"
        sideOffset={8}
        aria-label="User account menu"
      >
        <DropdownMenuItem className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors hover:text-foreground focus:text-foreground">
          <Settings className="h-4 w-4 mr-3" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors hover:text-foreground focus:text-foreground">
          <CreditCard className="h-4 w-4 mr-3" />
          <span>Billing & Subscription</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors hover:text-foreground focus:text-foreground">
          <Bell className="h-4 w-4 mr-3" />
          <span>Notification Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors hover:text-foreground focus:text-foreground">
          <HelpCircle className="h-4 w-4 mr-3" />
          <span>Support</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onSignOut}
          className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors text-muted-foreground hover:text-foreground focus:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-3" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};