import React, { useState, useRef, useEffect, useCallback } from "react";
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
  getDoc,
  limit,
  Timestamp,
} from "firebase/firestore";
import { format } from "date-fns";
import { db, auth } from "../lib/firebase";
import { debounce } from "lodash";

const CLOUDINARY_CLOUD_NAME = "dkdscxzz7";
const CLOUDINARY_UPLOAD_PRESET = "pawtalk";
const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;
const GIPHY_API_URL = "https://api.giphy.com/v1/gifs";

// Types
interface Message {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  createdAt: Date;
  type: "text" | "image" | "gif";
  read: boolean;
  gifUrl?: string;
}

interface PetDetails {
  name: string;
  avatar: string;
  bio?: string;
}

interface GiphyGif {
  id: string;
  images: {
    fixed_width: {
      url: string;
      width: string;
      height: string;
    };
    original: {
      url: string;
    };
  };
  title: string;
}

interface Conversation {
  id: string;
  userId: string;
  petId: string;
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
  status: "active" | "archived";
  typing: Record<string, boolean>;
}

// Cloudinary upload helper
const uploadToCloudinary = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

export function CommunicationCenter() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [petDetails, setPetDetails] = useState<{ [key: string]: PetDetails }>(
    {}
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loadingGifs, setLoadingGifs] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const currentUser = auth.currentUser;
  const typingTimeoutRef = useRef<number>();

  // Fetch conversations
  useEffect(() => {
    if (!currentUser) return;

    const conversationsQuery = query(
      collection(db, "conversations"),
      where("status", "==", "active"),
      orderBy("lastMessageAt", "desc")
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      (snapshot) => {
        const fetchedConversations = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Conversation[];
        setConversations(fetchedConversations);
        fetchedConversations.forEach((conv) => fetchPetDetails(conv.petId));
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching conversations:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch pet details
  const fetchPetDetails = async (petId: string) => {
    if (petDetails[petId]) return;

    try {
      const petDoc = await getDoc(doc(db, "pets", petId));
      if (petDoc.exists()) {
        const data = petDoc.data();
        setPetDetails((prev) => ({
          ...prev,
          [petId]: {
            name: data.name,
            avatar: data.images?.main || "/placeholder.png",
            bio: data.bio,
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching pet details:", error);
    }
  };

  // Subscribe to messages
  useEffect(() => {
    if (!selectedConversation || !currentUser) return;

    const messagesQuery = query(
      collection(db, "messages"),
      where("conversationId", "==", selectedConversation.id),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const newMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Message[];

        setMessages(newMessages.reverse());

        // Mark messages as read
        newMessages.forEach((msg) => {
          if (msg.senderId !== currentUser.uid && !msg.read) {
            updateDoc(doc(db, "messages", msg.id), { read: true }).catch(
              console.error
            );
          }
        });
      },
      (error) => {
        console.error("Messages subscription error:", error);
      }
    );

    return () => unsubscribe();
  }, [selectedConversation, currentUser?.uid]);

  const sendMessage = async (
    content: string,
    type: "text" | "image" | "gif" = "text",
    gifUrl?: string
  ) => {
    if (!currentUser || !selectedConversation) return;

    try {
      const messageData: any = {
        content,
        conversationId: selectedConversation.id,
        senderId: currentUser.uid,
        createdAt: serverTimestamp(),
        type,
        read: false,
      };

      if (type === "gif" && gifUrl) {
        messageData.gifUrl = gifUrl;
      }

      await addDoc(collection(db, "messages"), messageData);
      await updateConversationTimestamp();
      scrollAreaRef.current?.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    const messageText = message.trim();
    setMessage("");
    await sendMessage(messageText, "text");
  };

  const handleImageSelect = async (file: File) => {
    setUploadingMedia(true);
    try {
      const cloudinaryUrl = await uploadToCloudinary(file);
      await sendMessage(cloudinaryUrl, "image");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to send image");
    } finally {
      setUploadingMedia(false);
      setIsMediaDialogOpen(false);
    }
  };

  const handleGifSelect = async (gif: { url: string; preview: string }) => {
    try {
      await sendMessage(gif.preview, "gif", gif.url);
    } catch (error) {
      console.error("Error sending GIF:", error);
      alert("Failed to send GIF");
    } finally {
      setIsMediaDialogOpen(false);
    }
  };

  // Typing indicator
  const updateTypingStatus = useCallback(
    async (isTyping: boolean) => {
      if (!selectedConversation || !currentUser) return;

      try {
        const conversationRef = doc(
          db,
          "conversations",
          selectedConversation.id
        );
        await updateDoc(conversationRef, {
          [`typing.${currentUser.uid}`]: isTyping,
        });
      } catch (error) {
        console.error("Error updating typing status:", error);
      }
    },
    [selectedConversation, currentUser]
  );

  const handleTextChange = (text: string) => {
    setMessage(text);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    updateTypingStatus(true);
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 2000);
  };

  // Update conversation timestamp
  const updateConversationTimestamp = useCallback(async () => {
    if (!selectedConversation) return;

    try {
      const conversationRef = doc(db, "conversations", selectedConversation.id);
      await updateDoc(conversationRef, {
        lastMessageAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating conversation timestamp:", error);
    }
  }, [selectedConversation]);

  // Message renderer
  const renderMessage = (message: Message) => {
    const isUserMessage = message.senderId === currentUser?.uid;
    const messageTime = format(message.createdAt, "HH:mm");

    return (
      <div
        key={message.id}
        className={`flex ${
          isUserMessage ? "justify-end" : "justify-start"
        } mb-4`}
      >
        {!isUserMessage && petDetails[selectedConversation?.petId || ""] && (
          <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
            <img
              src={petDetails[selectedConversation?.petId || ""].avatar}
              alt={petDetails[selectedConversation?.petId || ""].name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div
          className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-lg p-3 ${
            isUserMessage ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          {message.type === "text" ? (
            <p>{message.content}</p>
          ) : (
            <img
              src={message.type === "gif" ? message.gifUrl : message.content}
              alt="Message content"
              className="w-full h-auto rounded"
            />
          )}
          <div className="flex justify-end items-center mt-1 space-x-2">
            <span className="text-xs opacity-70">{messageTime}</span>
            {isUserMessage && message.read && (
              <span className="text-xs">Read</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const searchGifs = async (query: string) => {
    setLoadingGifs(true);
    try {
      const endpoint = query
        ? `${GIPHY_API_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
            query
          )}&limit=20&rating=g`
        : `${GIPHY_API_URL}/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.meta.status === 200) {
        setGifs(data.data);
      } else {
        throw new Error(data.meta.msg);
      }
    } catch (error) {
      console.error("Error fetching GIFs:", error);
      alert("Failed to load GIFs");
    } finally {
      setLoadingGifs(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => searchGifs(query), 500),
    []
  );

  useEffect(() => {
    searchGifs("");
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/3 border-r bg-white overflow-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`p-4 cursor-pointer hover:bg-gray-100 ${
              selectedConversation?.id === conversation.id ? "bg-gray-200" : ""
            }`}
            onClick={() => setSelectedConversation(conversation)}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img
                  src={petDetails[conversation.petId]?.avatar}
                  alt={petDetails[conversation.petId]?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-semibold">
                  {petDetails[conversation.petId]?.name || "Unknown Pet"}
                </p>
                <p className="text-sm text-gray-500">
                  {conversation.lastMessageAt
                    ? format(
                        conversation.lastMessageAt.toDate(),
                        "MMM d, HH:mm"
                      )
                    : "No messages"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            <div className="flex-shrink-0 p-4 border-b">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full overflow-hidden mr-2">
                  <img
                    src={petDetails[selectedConversation.petId]?.avatar}
                    alt={petDetails[selectedConversation.petId]?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {petDetails[selectedConversation.petId]?.name}
                  </h2>
                  {otherUserTyping && (
                    <p className="text-sm text-gray-500">typing...</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-grow overflow-hidden" ref={scrollAreaRef}>
              <div className="h-full overflow-y-auto p-4">
                {messages.map(renderMessage)}
              </div>
            </div>
            {uploadingMedia && (
              <div className="bg-blue-500 text-white p-2 text-center">
                <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Sending media...
              </div>
            )}
            <div className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <button
                  className="p-2 rounded-full hover:bg-gray-200"
                  onClick={() => setIsMediaDialogOpen(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-grow p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>

      {isMediaDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Send Media</h3>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <h4 className="font-medium mb-2">Emoji</h4>
                <div className="grid grid-cols-8 gap-2">
                  {["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊"].map(
                    (emoji) => (
                      <button
                        key={emoji}
                        className="text-2xl hover:bg-gray-100 rounded p-1"
                        onClick={() => {
                          setMessage((prev) => prev + emoji);
                          setIsMediaDialogOpen(false);
                        }}
                      >
                        {emoji}
                      </button>
                    )
                  )}
                </div>
              </div>
              <div className="mb-4">
                <h4 className="font-medium mb-2">GIF</h4>
                <input
                  type="text"
                  placeholder="Search GIFs..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    debouncedSearch(e.target.value);
                  }}
                  className="w-full p-2 border rounded mb-2"
                />
                {loadingGifs ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {gifs.map((gif) => (
                      <button
                        key={gif.id}
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() =>
                          handleGifSelect({
                            url: gif.images.original.url,
                            preview: gif.images.fixed_width.url,
                          })
                        }
                      >
                        <img
                          src={gif.images.fixed_width.url}
                          alt={gif.title}
                          className="w-full h-auto rounded"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium mb-2">Image</h4>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageSelect(file);
                    }
                  }}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setIsMediaDialogOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
