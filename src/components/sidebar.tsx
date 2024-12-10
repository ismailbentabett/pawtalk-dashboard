import { Link, useLocation } from "react-router-dom";
import { Home, PieChart, Users, MessageSquare, Settings, Calendar, Heart } from 'lucide-react';
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

const sidebarItems = [
  { name: "Dashboard", icon: Home, href: "/dashboard" },
  { name: "Analytics", icon: PieChart, href: "/dashboard/analytics" },
  { name: "Pets", icon: Users, href: "/dashboard/pets" },
  { name: "Messages", icon: MessageSquare, href: "/dashboard/messages" },
  { name: "Matches", icon: Heart, href: "/dashboard/matches" },
  { name: "Appointments", icon: Calendar, href: "/dashboard/appointments" },
  { name: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export default function Sidebar() {
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