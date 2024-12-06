import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const activities = [
  { id: 1, user: "John Doe", action: "added a new pet", pet: "Max", time: "2 hours ago" },
  { id: 2, user: "Jane Smith", action: "updated profile for", pet: "Luna", time: "4 hours ago" },
  { id: 3, user: "Bob Johnson", action: "scheduled an appointment for", pet: "Buddy", time: "Yesterday" },
  { id: 4, user: "Alice Brown", action: "matched", pet: "Charlie with Daisy", time: "2 days ago" },
  { id: 5, user: "Eva White", action: "sent a message about", pet: "Bella", time: "3 days ago" },
]

export function RecentActivityFeed() {
  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
              <AvatarFallback>{activity.user[0]}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{activity.user}</p>
              <p className="text-sm text-muted-foreground">
                {activity.action} {activity.pet}
              </p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

