import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const chatThreads = [
  {
    id: 1,
    name: "John Doe",
    lastMessage: "Hello, how are you?",
    status: "active",
    priority: "high",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 2,
    name: "Jane Smith",
    lastMessage: "When is the next appointment?",
    status: "pending",
    priority: "medium",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 3,
    name: "Bob Johnson",
    lastMessage: "Thanks for your help!",
    status: "closed",
    priority: "low",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 4,
    name: "Alice Brown",
    lastMessage: "Can you recommend a good vet?",
    status: "active",
    priority: "medium",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 5,
    name: "Charlie Davis",
    lastMessage: "My dog isn't eating well",
    status: "active",
    priority: "high",
    avatar: "/placeholder.svg?height=40&width=40",
  },
];

const mockMessages = [
  {
    id: 1,
    sender: "user",
    content: "Hi, I have a question about my pet's diet.",
  },
  {
    id: 2,
    sender: "admin",
    content:
      "Hello! I'd be happy to help. What specific concerns do you have about your pet's diet?",
  },
  {
    id: 3,
    sender: "user",
    content: "My dog seems to be losing interest in his food. Is this normal?",
  },
  {
    id: 4,
    sender: "admin",
    content:
      "It's not uncommon for dogs to occasionally lose interest in their food, but persistent loss of appetite can be a concern. How long has this been going on?",
  },
  { id: 5, sender: "user", content: "It's been about a week now." },
  {
    id: 6,
    sender: "admin",
    content:
      "I see. There could be several reasons for this. Has there been any change in your dog's routine or environment recently? Also, have you noticed any other symptoms like lethargy or changes in water consumption?",
  },
];

export function CommunicationCenter() {
  const [selectedThread, setSelectedThread] = useState<
    (typeof chatThreads)[0] | null
  >(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(mockMessages);

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([
        ...messages,
        { id: messages.length + 1, sender: "admin", content: message },
      ]);
      setMessage("");
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Communication Center</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex overflow-hidden">
        <div className="w-1/3 border-r pr-4">
          <ScrollArea className="h-[500px]">
            {chatThreads.map((thread) => (
              <div
                key={thread.id}
                className={`p-2 cursor-pointer hover:bg-gray-100 ${
                  selectedThread?.id === thread.id ? "bg-gray-200" : ""
                }`}
                onClick={() => setSelectedThread(thread)}
              >
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarImage src={thread.avatar} alt={thread.name} />
                    <AvatarFallback>{thread.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{thread.name}</div>
                    <div className="text-sm text-gray-500">
                      {thread.lastMessage}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-1">
                  <Badge
                    variant={
                      thread.status === "active" ? "default" : "secondary"
                    }
                  >
                    {thread.status}
                  </Badge>
                  <Badge
                    variant={
                      thread.priority === "high"
                        ? "destructive"
                        : thread.priority === "medium"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {thread.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
        <div className="flex-1 pl-4 flex flex-col">
          {selectedThread ? (
            <>
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender === "admin" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] p-2 rounded-lg ${
                          msg.sender === "admin"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-4 flex">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 mr-2"
                />
                <Button onClick={handleSendMessage}>Send</Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a chat to start messaging
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
