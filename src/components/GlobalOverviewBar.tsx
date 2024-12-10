import { useState } from "react";
import {
  Search,
  Plus,
  TrendingUp,
  Users,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import QuickAddPetModal from "./QuickAddPetModal";

export function GlobalOverviewBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalState, setModalState] = useState(false);

  const openModal = () => {
    setModalState(true);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="flex items-center space-x-4">
        <div>
          <span className="text-sm text-gray-500">Total Pets</span>
          <p className="text-2xl font-bold">1,234</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Active Users</span>
          <p className="text-2xl font-bold">5,678</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div>
          <span className="text-sm text-gray-500">Today's Matches</span>
          <p className="text-2xl font-bold flex items-center">
            89 <TrendingUp className="ml-1 text-green-500" size={20} />
          </p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Appointments</span>
          <p className="text-2xl font-bold flex items-center">
            23 <Calendar className="ml-1 text-blue-500" size={20} />
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-blue-600">
          <MessageSquare className="mr-1" size={16} />
          42 Active Conversations
        </Badge>
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <h4 className="font-medium leading-none">Quick Add</h4>
                <div className="grid gap-2">
                  <Button className="w-full" onClick={() => openModal()}>
                    <Users className="mr-2 h-4 w-4" />
                    Add New Pet
                  </Button>
                  <Button className="w-full">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Appointment
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      <QuickAddPetModal
        isOpen={modalState}
        onClose={() => setModalState(false)}
      />
    </div>
  );
}
