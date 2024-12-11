import { Button } from "@/components/ui/button";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Search,
  Calendar,
  Heart,
  Home,
  MessageSquare,
  PieChart,
  Settings,
  LogOut,
  Loader2,
  Dog,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PUBLIC_ROUTES } from "@/constants/routes";

const sidebarItems = [
  { name: "Dashboard", icon: Home, href: "/dashboard" },
  { name: "Analytics", icon: PieChart, href: "/dashboard/analytics" },
  { name: "Pets", icon: Dog, href: "/dashboard/pets" },
  { name: "Messages", icon: MessageSquare, href: "/dashboard/messages" },
  { name: "Matches", icon: Heart, href: "/dashboard/matches" },
  { name: "Appointments", icon: Calendar, href: "/dashboard/appointments" },
  { name: "Settings", icon: Settings, href: "/dashboard/settings" },
];

function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full w-16 flex-col items-center space-y-8 bg-gray-900 py-8">
      {sidebarItems.map((item) => (
        <Link key={item.name} to={item.href}>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-12 w-12 p-0",
              location.pathname === item.href
                ? "bg-gray-800 text-white hover:bg-gray-800 hover:text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="sr-only">{item.name}</span>
          </Button>
        </Link>
      ))}
    </div>
  );
}

function Header() {
  const { userData, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      toast({
        title: "Logged out successfully",
        description: "Come back soon!",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      navigate(PUBLIC_ROUTES.LOGIN, { replace: true });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold mr-8">PawTalk Admin</h1>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input type="search" placeholder="Search..." className="pl-8 w-64" />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2"
            >
              <span>{userData?.name || "User"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => navigate("/dashboard/profile")}
              className="cursor-pointer"
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/dashboard/settings")}
              className="cursor-pointer"
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600 focus:text-red-600"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              {isLoggingOut ? "Logging out..." : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default function DashboardLayout() {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      toast({
        title: "Logged out successfully",
        description: "Come back soon!",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      navigate(PUBLIC_ROUTES.LOGIN, { replace: true });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <Outlet />
        </main>
        <footer className="bg-white border-t p-4 text-center">
          <Button
            variant="link"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-gray-600 hover:text-gray-900"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </>
            )}
          </Button>
        </footer>
      </div>
    </div>
  );
}
