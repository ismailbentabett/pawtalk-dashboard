import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

const chatSummary = [
  { id: 1, pet: "Buddy", lastMessage: "Appointment confirmed for next week", unread: 2 },
  { id: 2, pet: "Luna", lastMessage: "How is she adjusting to the new food?", unread: 0 },
  { id: 3, pet: "Max", lastMessage: "Vaccination reminder: Due in 2 weeks", unread: 1 },
  { id: 4, pet: "Bella", lastMessage: "Playdate arranged with Charlie", unread: 3 },
  { id: 5, pet: "Rocky", lastMessage: "Training session feedback", unread: 0 },
]

export function ChatSummary() {
  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-4">
        {chatSummary.map((chat) => (
          <div key={chat.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{chat.pet}</p>
              <p className="text-sm text-muted-foreground truncate w-60">{chat.lastMessage}</p>
            </div>
            {chat.unread > 0 && (
              <Badge variant="secondary">{chat.unread}</Badge>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

