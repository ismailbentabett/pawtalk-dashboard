import { Button } from "@/components/ui/button";
import { Link, Outlet } from "react-router-dom";

import { Bell, Search } from "lucide-react";

import {
  Calendar,
  Heart,
  Home,
  MessageSquare,
  PieChart,
  Settings,
  Users,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { Input } from "@/components/ui/input";

const sidebarItems = [
  { name: "Dashboard", icon: Home, href: "/dashboard" },
  { name: "Analytics", icon: PieChart, href: "/dashboard/analytics" },
  { name: "Pets", icon: Users, href: "/dashboard/pets" },
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
        <Button variant="ghost" size="sm">
          John Doe
        </Button>
      </div>
    </header>
  );
}

export default function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <Outlet />
        </main>
        <footer className="bg-white border-t p-4 text-center">
          <Link to="/login">
            <Button variant="link">Logout</Button>
          </Link>
        </footer>
      </div>
    </div>
  );
}
