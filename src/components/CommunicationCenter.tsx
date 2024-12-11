'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2 } from 'lucide-react'

interface Conversation {
  id: string
  userId: string
  petId: string
  createdAt: Timestamp
  lastMessageAt: Timestamp
  status: "active" | "archived"
  typing: Record<string, boolean>
}

interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: Timestamp
}

interface User {
  id: string
  displayName: string
  email: string
  role: string
  createdAt: Timestamp
  lastLoginAt: Timestamp
  updatedAt: Timestamp
  settings: {
    lastMatch: Timestamp
  }
}

export function CommunicationCenter() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<{ [key: string]: User }>({})
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    // Fetch all active conversations
    const conversationsQuery = query(
      collection(db, "conversations"),
      where("status", "==", "active"),
      orderBy("lastMessageAt", "desc")
    )

    const unsubscribe = onSnapshot(
      conversationsQuery,
      (snapshot) => {
        const fetchedConversations: Conversation[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Conversation))
        setConversations(fetchedConversations)

        // Fetch user details for all users in conversations
        fetchedConversations.forEach((conv) => {
          fetchUserDetails(conv.userId)
        })

        setLoading(false)
      },
      (err) => {
        console.error("Error fetching conversations:", err)
        setError("Failed to load conversations. Please try again.")
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      // Fetch messages for the selected conversation
      const messagesQuery = query(
        collection(db, "messages"),
        where("conversationId", "==", selectedConversation.id),
        orderBy("createdAt", "asc")
      )

      const unsubscribe = onSnapshot(
        messagesQuery,
        (snapshot) => {
          const fetchedMessages: Message[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as Message))
          setMessages(fetchedMessages)
        },
        (err) => {
          console.error("Error fetching messages:", err)
          setError("Failed to load messages. Please try again.")
        }
      )

      return () => unsubscribe()
    }
  }, [selectedConversation])

  useEffect(() => {
    // Scroll to bottom when new messages are loaded
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchUserDetails = async (userId: string) => {
    if (users[userId]) return // Don't fetch if we already have the user details

    try {
      const userDoc = await getDoc(doc(db, "users", userId))
      if (userDoc.exists()) {
        const userData = userDoc.data() as User
        setUsers((prevUsers) => ({ ...prevUsers, [userId]: userData }))
      } else {
        console.error(`User ${userId} not found`)
        // Set a placeholder user to avoid repeated fetching attempts
        setUsers((prevUsers) => ({
          ...prevUsers,
          [userId]: { id: userId, displayName: "Unknown User", email: "", role: "", createdAt: Timestamp.now(), lastLoginAt: Timestamp.now(), updatedAt: Timestamp.now(), settings: { lastMatch: Timestamp.now() } }
        }))
      }
    } catch (error) {
      console.error("Error fetching user details:", error)
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setError(null) // Clear any previous errors when selecting a new conversation
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    const messageData = {
      conversationId: selectedConversation.id,
      senderId: selectedConversation.petId, // The pet is sending the message
      content: newMessage.trim(),
      createdAt: serverTimestamp(),
    }

    try {
      await addDoc(collection(db, "messages"), messageData)
      await updateDoc(doc(db, "conversations", selectedConversation.id), {
        lastMessageAt: serverTimestamp(),
      })
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      setError("Failed to send message. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-6xl mx-auto h-[calc(100vh-2rem)]">
      <CardHeader>
        <CardTitle>Pet Dashboard - Conversations</CardTitle>
      </CardHeader>
      <CardContent className="flex h-[calc(100%-5rem)]">
        <div className="w-1/3 border-r pr-4 overflow-auto">
          {conversations.map((conversation) => {
            const user = users[conversation.userId]
            return (
              <div
                key={conversation.id}
                className={`p-4 cursor-pointer hover:bg-gray-100 ${
                  selectedConversation?.id === conversation.id ? "bg-gray-200" : ""
                }`}
                onClick={() => handleSelectConversation(conversation)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>{user?.displayName?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{user?.displayName || "Unknown User"}</p>
                    <p className="text-sm text-gray-500">
                      {conversation.lastMessageAt
                        ? format(conversation.lastMessageAt.toDate(), "MMM d, HH:mm")
                        : "No messages"}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex-1 pl-4 flex flex-col">
          {selectedConversation ? (
            <>
              <ScrollArea className="flex-grow mb-4" ref={scrollRef}>
                {messages.map((message) => {
                  const isFromPet = message.senderId === selectedConversation.petId
                  return (
                    <div
                      key={message.id}
                      className={`mb-4 flex ${isFromPet ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-lg p-3 ${
                          isFromPet ? "bg-blue-500 text-white" : "bg-gray-200"
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {format(message.createdAt.toDate(), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </ScrollArea>
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

