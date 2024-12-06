import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type Message = {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
};

type PetChatInterfaceProps = {
  pet: {
    id: string;
    name: string;
    humans: { id: string; name: string; rolestring; role: string }[];
  };
};

export function PetChatInterface({ pet }: PetChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: "System", content: `Welcome to the chat for ${pet.name}!`, timestamp: new Date().toISOString() },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(pet.humans[0]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([
        ...messages,
        { 
          id: messages.length + 1, 
          sender: currentUser.name, 
          content: newMessage.trim(),
          timestamp: new Date().toISOString()
        },
      ]);
      setNewMessage("");
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      <ScrollArea className="flex-grow mb-4 pr-4">
        {messages.map((message) => (
          <div key={message.id} className="mb-4 flex items-start">
            <Avatar className="mr-2">
              <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
              <AvatarFallback>{message.sender[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between items-baseline">
                <p className="font-semibold">{message.sender}</p>
                <p className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleTimeString()}</p>
              </div>
              <p className="mt-1">{message.content}</p>
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
          value={currentUser.id}
          onChange={(e) => setCurrentUser(pet.humans.find(h => h.id === e.target.value) || pet.humans[0])}
          className="w-full p-2 border rounded"
        >
          {pet.humans.map((human) => (
            <option key={human.id} value={human.id}>
              {human.name} ({human.role})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

