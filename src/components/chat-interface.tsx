
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Message = {
  id: number
  sender: string
  content: string
}

type ChatInterfaceProps = {
  pet: {
    id: string
    name: string
    humans: string[]
  }
}

export function ChatInterface({ pet }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: "System", content: `Welcome to the chat for ${pet.name}!` },
  ])
  const [newMessage, setNewMessage] = useState("")
  const [currentUser, setCurrentUser] = useState(pet.humans[0])

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([
        ...messages,
        { id: messages.length + 1, sender: currentUser, content: newMessage.trim() },
      ])
      setNewMessage("")
    }
  }

  return (
    <div className="flex flex-col h-[400px]">
      <ScrollArea className="flex-grow mb-4">
        {messages.map((message) => (
          <div key={message.id} className="mb-4 flex items-start">
            <Avatar className="mr-2">
              <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
              <AvatarFallback>{message.sender[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{message.sender}</p>
              <p>{message.content}</p>
            </div>
          </div>
        ))}
      </ScrollArea>
      <div className="flex items-center">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          className="flex-grow mr-2"
        />
        <Button onClick={handleSendMessage}>Send</Button>
      </div>
      <div className="mt-2">
        <select
          value={currentUser}
          onChange={(e) => setCurrentUser(e.target.value)}
          className="w-full p-2 border rounded"
        >
          {pet.humans.map((human) => (
            <option key={human} value={human}>
              {human}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

