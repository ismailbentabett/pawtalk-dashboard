'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { auth, db, storage } from '@/lib/firebase'
import { format } from 'date-fns'
import EmojiPicker from 'emoji-picker-react'
import { addDoc, collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, Timestamp, updateDoc, where } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { Paperclip, Send, Smile } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

interface Conversation {
  id: string
  participants: string[]
  petId: string
  createdAt: Timestamp
  lastMessageAt: Timestamp
  status: 'active' | 'archived'
  typing: Record<string, boolean>
}

interface Message {
  id: string
  content: string
  senderId: string
  conversationId: string
  createdAt: Date
  type: 'text' | 'image' | 'gif'
  read: boolean
  gifUrl?: string
}

export function CommunicationCenter() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const user = auth.currentUser
    console
    if (!user) {
      setError('No authenticated user found')
      setLoading(false)
      return
    }

    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      where('status', '==', 'active'),
      orderBy('lastMessageAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      conversationsQuery,
      (snapshot) => {
        const newConversations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Conversation[]
        setConversations(newConversations)
        setLoading(false)
      },
      (err) => {
        console.error('Conversations subscription error:', err)
        setError('Failed to load conversations')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', selectedConversation.id),
        orderBy('createdAt', 'desc'),
        limit(50)
      )

      const unsubscribe = onSnapshot(
        messagesQuery,
        (snapshot) => {
          const newMessages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          })) as Message[]

          setMessages(newMessages.reverse())

          // Mark messages as read
          newMessages.forEach((msg) => {
            if (msg.senderId !== auth.currentUser?.uid && !msg.read) {
              updateDoc(doc(db, 'messages', msg.id), { read: true }).catch(console.error)
            }
          })
        },
        (error) => {
          console.error('Messages subscription error:', error)
          setError('Failed to load messages')
        }
      )

      return () => unsubscribe()
    }
  }, [selectedConversation])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation)
  }

  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'gif' = 'text', gifUrl?: string) => {
    if (!auth.currentUser || !selectedConversation) return

    try {
      const messageData: any = {
        content,
        conversationId: selectedConversation.id,
        senderId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        type,
        read: false,
      }

      if (type === 'gif' && gifUrl) {
        messageData.gifUrl = gifUrl
      }

      await addDoc(collection(db, 'messages'), messageData)
      await updateConversationTimestamp()
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Failed to send message')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const storageRef = ref(storage, `chat_images/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      await handleSendMessage(downloadURL, 'image')
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Failed to upload image')
    }
  }

  const updateConversationTimestamp = async () => {
    if (!selectedConversation) return

    try {
      const conversationRef = doc(db, 'conversations', selectedConversation.id)
      await updateDoc(conversationRef, {
        lastMessageAt: serverTimestamp(),
      })
    } catch (error) {
      console.error('Error updating conversation timestamp:', error)
    }
  }

  const filteredConversations = conversations.filter((conversation) =>
    conversation.participants.some((participant) =>
      participant.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <Card className="w-full max-w-6xl mx-auto h-[calc(100vh-2rem)]">
      <CardHeader>
        <CardTitle>Communication Center</CardTitle>
      </CardHeader>
      <CardContent className="flex h-[calc(100%-5rem)]">
        <div className="w-1/3 border-r pr-4 flex flex-col">
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <ScrollArea className="flex-grow">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 cursor-pointer hover:bg-gray-100 ${
                  selectedConversation?.id === conversation.id ? 'bg-gray-200' : ''
                }`}
                onClick={() => handleConversationSelect(conversation)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={`/placeholder.svg?text=${conversation.petId}`} />
                    <AvatarFallback>{conversation.petId[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conversation.participants.join(', ')}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.typing[conversation.participants[0]] ? 'Typing...' : 'Last message preview'}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {format(conversation.lastMessageAt.toDate(), 'HH:mm')}
                  </Badge>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
        <div className="flex-1 pl-4 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="mb-4 flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={`/placeholder.svg?text=${selectedConversation.petId}`} />
                  <AvatarFallback>{selectedConversation.petId[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-semibold">{selectedConversation.participants.join(', ')}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.typing[selectedConversation.participants[0]] ? 'Typing...' : 'Online'}
                  </p>
                </div>
              </div>
              <ScrollArea className="flex-grow mb-4" ref={scrollAreaRef}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-4 flex ${
                      message.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                        message.senderId === auth.currentUser?.uid
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-800'
                      } rounded-lg p-3`}
                    >
                      {message.type === 'text' ? (
                        <p>{message.content}</p>
                      ) : message.type === 'image' ? (
                        <img src={message.content} alt="Shared image" className="max-w-full rounded" />
                      ) : (
                        <img src={message.gifUrl} alt="Shared GIF" className="max-w-full rounded" />
                      )}
                      <p className="text-xs mt-1 opacity-70">
                        {format(message.createdAt, 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </ScrollArea>
              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <EmojiPicker
                      onEmojiClick={(emojiObject) => setNewMessage((prev) => prev + emojiObject.emoji)}
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(newMessage, 'text')}
                />
                <Button onClick={() => handleSendMessage(newMessage, 'text')} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
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

