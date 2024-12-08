import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { Pet } from "@/types/pet";

export const columns: ColumnDef<Pet>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="whitespace-nowrap"
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <span className="font-medium">{row.getValue("name") || "Unnamed"}</span>
        {row.original.profileComplete && (
          <Badge variant="outline" className="ml-2">
            Verified
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "species",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Species
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <span className="capitalize">{row.getValue("species") || "Unknown"}</span>
        {row.original.vaccinated && (
          <Badge variant="secondary" className="ml-2">
            Vaccinated
          </Badge>
        )}
      </div>
    ),
    filterFn: "includesString",
  },
  {
    accessorKey: "age",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Age
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const age = row.getValue("age");
      return (
        <div className="text-right font-medium">
          {age != null ? `${age} years` : "Unknown"}
        </div>
      );
    },
  },
  {
    accessorKey: "owner",
    header: "Owner",
    cell: ({ row }) => {
      const pet = row.original;
      const humans = pet.humans || [];
      return (
        <div className="flex items-center space-x-2">
          <span>{pet.owner || "No owner"}</span>
          {humans.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  +{humans.length - 1} more
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {humans.slice(1).map((human, index) => (
                  <DropdownMenuItem key={index}>{human}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={status === "Active" ? "success" : "secondary"}
          className={
            status === "Active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }
        >
          {status || "Unknown"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "matchRate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Match Rate
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const matchRate = parseFloat(row.getValue("matchRate") || "0");
      return (
        <div className="flex items-center">
          <div
            className="h-2 w-16 rounded-full bg-gray-200 mr-2"
            role="progressbar"
            aria-valuenow={matchRate}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${matchRate}%` }}
            />
          </div>
          <span>{matchRate}%</span>
        </div>
      );
    },
  },
  {
    accessorKey: "matches",
    header: "Matches",
    cell: ({ row }) => {
      const matches = (row.getValue("matches") as string[]) || [];
      return (
        <div className="flex flex-wrap gap-1">
          {matches.slice(0, 2).map((match, index) => (
            <Badge key={index} variant="outline">
              {match}
            </Badge>
          ))}
          {matches.length > 2 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  +{matches.length - 2} more
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {matches.slice(2).map((match, index) => (
                  <DropdownMenuItem key={index}>{match}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "lastActivity",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Last Activity
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const lastActivity = row.getValue("lastActivity");
      if (!lastActivity) return <div>No activity</div>;
      
      try {
        const date = new Date(lastActivity);
        const timeAgo = getTimeAgo(date);
        return (
          <div className="flex items-center">
            <span title={date.toLocaleString()}>{timeAgo}</span>
          </div>
        );
      } catch (error) {
        return <div>Invalid date</div>;
      }
    },
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = (row.getValue("tags") as string[]) || [];
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: "chat",
    cell: ({ row }) => {
      const pet = row.original;
      return pet.id ? (
        <Link to={`/dashboard/pets/${pet.id}/chat`}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MessageCircle className="h-4 w-4" />
            <span className="sr-only">Open chat</span>
          </Button>
        </Link>
      ) : null;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const pet = row.original;
      if (!pet.id) return null;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(pet.id || '')}
            >
              Copy pet ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Link to={`/dashboard/pets/${pet.id}`}>
              <DropdownMenuItem>View details</DropdownMenuItem>
            </Link>
            <Link to={`/dashboard/pets/${pet.id}/edit`}>
              <DropdownMenuItem>Edit profile</DropdownMenuItem>
            </Link>
            <DropdownMenuItem onClick={() => handleStatusToggle(pet)}>
              Toggle status
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDelete(pet.id)}
              className="text-red-600"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Utility function for time ago
const getTimeAgo = (date: Date) => {
  try {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? "" : "s"} ago`;
      }
    }
    return "Just now";
  } catch (error) {
    return "Invalid date";
  }
};