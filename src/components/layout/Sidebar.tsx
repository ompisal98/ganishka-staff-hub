import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Receipt,
  Award,
  Settings,
  Building2,
  UserCog,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['admin', 'branch_manager', 'trainer', 'accounts', 'reception'] },
  { icon: Users, label: 'Students', href: '/students', roles: ['admin', 'branch_manager', 'reception'] },
  { icon: BookOpen, label: 'Courses', href: '/courses', roles: ['admin', 'branch_manager'] },
  { icon: Calendar, label: 'Batches', href: '/batches', roles: ['admin', 'branch_manager', 'trainer'] },
  { icon: GraduationCap, label: 'Enrollments', href: '/enrollments', roles: ['admin', 'branch_manager', 'reception'] },
  { icon: ClipboardCheck, label: 'Attendance', href: '/attendance', roles: ['admin', 'branch_manager', 'trainer'] },
  { icon: Receipt, label: 'Receipts', href: '/receipts', roles: ['admin', 'branch_manager', 'accounts', 'reception'] },
  { icon: Award, label: 'Certificates', href: '/certificates', roles: ['admin', 'branch_manager'] },
  { icon: BarChart3, label: 'Reports', href: '/reports', roles: ['admin', 'branch_manager'] },
];

const adminItems = [
  { icon: UserCog, label: 'Staff', href: '/staff', roles: ['admin'] },
  { icon: Building2, label: 'Branches', href: '/branches', roles: ['admin'] },
  { icon: Settings, label: 'Settings', href: '/settings', roles: ['admin'] },
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { profile, roles, signOut, hasRole } = useAuth();

  const isActive = (href: string) => location.pathname === href;

  const canAccess = (itemRoles: string[]) => {
    if (roles.length === 0) return true; // Allow all if no roles assigned yet
    return itemRoles.some(role => hasRole(role));
  };

  const filteredMenuItems = menuItems.filter(item => canAccess(item.roles));
  const filteredAdminItems = adminItems.filter(item => canAccess(item.roles));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col bg-sidebar transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-sidebar-border',
        isCollapsed ? 'justify-center' : 'justify-between'
      )}>
        {!isCollapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-sidebar-foreground" />
            </div>
            <span className="font-display font-bold text-sidebar-foreground">Ganishka</span>
          </Link>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-sidebar-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-2 space-y-1">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'hover:bg-sidebar-accent',
                isActive(item.href)
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/80 hover:text-sidebar-foreground',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          ))}

          {filteredAdminItems.length > 0 && (
            <>
              <Separator className="my-4 bg-sidebar-border" />
              {!isCollapsed && (
                <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                  Administration
                </p>
              )}
              {filteredAdminItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    'hover:bg-sidebar-accent',
                    isActive(item.href)
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground/80 hover:text-sidebar-foreground',
                    isCollapsed && 'justify-center'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="text-sm">{item.label}</span>}
                </Link>
              ))}
            </>
          )}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        {!isCollapsed && profile && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{profile.full_name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{profile.email}</p>
          </div>
        )}
        <div className={cn('flex gap-2', isCollapsed ? 'flex-col' : 'flex-row')}>
          <Button
            variant="ghost"
            size={isCollapsed ? 'icon' : 'sm'}
            onClick={signOut}
            className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent flex-1"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sign out</span>}
          </Button>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </aside>
  );
}
