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
import { db } from "../lib/firebase";
import { debounce } from "lodash";
import Avatar from "react-avatar";

// Constants
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

interface UserDetails {
  displayName: string;
  email: string;
  avatar?: string;
}

interface PetDetails {
  name: string;
  images: {
    main: string;
  };
  breed: string;
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
  participants: string[];
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
  status: "active" | "archived";
  typing: Record<string, boolean>;
}

// Cloudinary upload utility
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
  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [userDetails, setUserDetails] = useState<{
    [key: string]: UserDetails;
  }>({});
  const [petDetails, setPetDetails] = useState<{ [key: string]: PetDetails }>(
    {}
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loadingGifs, setLoadingGifs] = useState(false);

  // Refs
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number>();

  // Fetch conversations
  useEffect(() => {
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
        // Fetch details for each conversation
        fetchedConversations.forEach((conv) => {
          fetchUserDetails(conv.userId);
          fetchPetDetails(conv.petId);
        });
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching conversations:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch user details
  const fetchUserDetails = async (userId: string) => {
    if (userDetails[userId]) return;

    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserDetails((prev) => ({
          ...prev,
          [userId]: {
            displayName: data.displayName,
            email: data.email,
            avatar: data.avatar,
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

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
            images: data.images,
            breed: data.breed,
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching pet details:", error);
    }
  };

  // Subscribe to messages
  useEffect(() => {
    if (!selectedConversation) return;

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

        // Mark messages as read if they're from the user
        newMessages.forEach((msg) => {
          if (msg.senderId === selectedConversation.userId && !msg.read) {
            updateDoc(doc(db, "messages", msg.id), { read: true }).catch(
              console.error
            );
          }
        });

        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      },
      (error) => {
        console.error("Messages subscription error:", error);
      }
    );

    // Subscribe to typing indicators
    const typingUnsubscribe = onSnapshot(
      doc(db, "conversations", selectedConversation.id),
      (doc) => {
        const data = doc.data();
        if (data?.typing) {
          const othersTyping = Object.entries(data.typing).some(
            ([uid, isTyping]) => uid === selectedConversation.userId && isTyping
          );
          setOtherUserTyping(othersTyping);
        }
      }
    );

    return () => {
      unsubscribe();
      typingUnsubscribe();
    };
  }, [selectedConversation]);

  // Message sending
  const sendMessage = async (
    content: string,
    type: "text" | "image" | "gif" = "text",
    gifUrl?: string
  ) => {
    if (!selectedConversation) return;

    try {
      const messageData = {
        content,
        conversationId: selectedConversation.id,
        senderId: selectedConversation.petId,
        createdAt: serverTimestamp(),
        type,
        read: false,
        ...(gifUrl && { gifUrl }),
      };

      await addDoc(collection(db, "messages"), messageData);
      await updateConversationTimestamp();
      await updateTypingStatus(false);

      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    }
  };

  // Message handlers
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim()) return;
    const messageText = message.trim();
    setMessage("");
    await sendMessage(messageText, "text");
  };

  const handleImageSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("Image size must be less than 5MB");
      return;
    }

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

  const handleGifSelect = async (gif: GiphyGif) => {
    try {
      await sendMessage(
        gif.images.fixed_width.url,
        "gif",
        gif.images.original.url
      );
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
      if (!selectedConversation) return;

      try {
        const conversationRef = doc(
          db,
          "conversations",
          selectedConversation.id
        );
        await updateDoc(conversationRef, {
          [`typing.${selectedConversation.petId}`]: isTyping,
        });
      } catch (error) {
        console.error("Error updating typing status:", error);
      }
    },
    [selectedConversation]
  );

  const handleTextChange = (text: string) => {
    setMessage(text);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    updateTypingStatus(true);
    typingTimeoutRef.current = window.setTimeout(() => {
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

  // GIF search
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

  // Initialize GIFs
  useEffect(() => {
    searchGifs("");
    return () => {
      debouncedSearch.cancel();
    };
  }, []);
  // Message renderer
  const renderMessage = (message: Message) => {
    const isPetSender = message.senderId === selectedConversation?.petId;
    const messageTime = format(message.createdAt, "HH:mm");

    const avatarName = isPetSender
      ? petDetails[selectedConversation?.petId]?.name
      : userDetails[selectedConversation?.userId]?.displayName || "User";

    const avatarUrl = isPetSender
      ? petDetails[selectedConversation?.petId]?.images?.main
      : userDetails[selectedConversation?.userId]?.avatar;

    return (
      <div
        key={message.id}
        className={`flex ${
          isPetSender ? "flex-row-reverse" : "flex-row"
        } mb-4 items-end`}
      >
        <Avatar
          name={avatarName || ""}
          src={avatarUrl}
          size="32"
          round={true}
          className="mx-2"
        />

        <div
          className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-lg p-3 ${
            isPetSender
              ? "bg-blue-500 text-white rounded-tr-none"
              : "bg-gray-200 text-gray-800 rounded-tl-none"
          }`}
        >
          {message.type === "text" ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : message.type === "gif" ? (
            <img
              src={message.gifUrl || message.content}
              alt="GIF"
              className="w-full h-auto rounded"
            />
          ) : (
            <img
              src={message.content}
              alt="Image"
              className="w-full h-auto rounded"
            />
          )}

          <div
            className={`flex items-center mt-1 space-x-1 ${
              isPetSender ? "justify-start" : "justify-end"
            }`}
          >
            <span
              className={`text-xs ${
                isPetSender ? "text-blue-100" : "text-gray-500"
              }`}
            >
              {messageTime}
            </span>
            {isPetSender && message.read && (
              <span
                className={`text-xs ${
                  isPetSender ? "text-blue-100" : "text-gray-500"
                }`}
              >
                • Read
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Conversation List */}
      <div className="w-1/3 border-r bg-white overflow-auto">
        {conversations.map((conversation) => {
          const user = userDetails[conversation.userId];
          const pet = petDetails[conversation.petId];
          return (
            <div
              key={conversation.id}
              className={`p-4 cursor-pointer hover:bg-gray-100 ${
                selectedConversation?.id === conversation.id
                  ? "bg-gray-200"
                  : ""
              }`}
              onClick={() => setSelectedConversation(conversation)}
            >
              <div className="flex items-center space-x-3">
                <Avatar
                  name={user?.displayName || "User"}
                  src={user?.avatar}
                  size="40"
                  round={true}
                />
                <div>
                  <p className="font-semibold">{user?.displayName || "User"}</p>
                  <p className="text-sm text-gray-500">
                    <span className="text-xs text-gray-400">
                      {pet?.name || "Loading..."} •{" "}
                    </span>
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
          );
        })}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex-shrink-0 p-4 border-b bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar
                    name={
                      userDetails[selectedConversation.userId]?.displayName ||
                      "User"
                    }
                    src={userDetails[selectedConversation.userId]?.avatar}
                    size="40"
                    round={true}
                  />
                  <div>
                    <h2 className="text-lg font-bold">
                      {userDetails[selectedConversation.userId]?.displayName ||
                        "User"}
                    </h2>
                    {otherUserTyping && (
                      <p className="text-sm text-gray-500 animate-pulse">
                        typing...
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {userDetails[selectedConversation.userId]?.email}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-grow overflow-hidden">
              <div
                ref={scrollAreaRef}
                className="h-full overflow-y-auto p-4 space-y-4"
              >
                {messages.map(renderMessage)}
              </div>
            </div>

            {/* Upload Progress */}
            {uploadingMedia && (
              <div className="bg-blue-500 text-white p-2 text-center">
                <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Sending media...
              </div>
            )}

            {/* Message Input */}
            <form onSubmit={handleSend} className="p-4 border-t bg-white">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => setIsMediaDialogOpen(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-600"
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
                  placeholder={`Message as ${
                    petDetails[selectedConversation.petId]?.name
                  }...`}
                  className="flex-grow p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>

      {/* Media Dialog */}
      {isMediaDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Send Media</h3>
              <button
                onClick={() => setIsMediaDialogOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Emoji Section */}
              <div>
                <h4 className="font-medium mb-2">Emoji</h4>
                <div className="grid grid-cols-8 gap-2">
                  {["😀", "😃", "😄", "😁", "😅", "😂", "🐱", "🐶"].map(
                    (emoji) => (
                      <button
                        key={emoji}
                        type="button"
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

              {/* GIF Section */}
              <div>
                <h4 className="font-medium mb-2">GIF</h4>
                <input
                  type="text"
                  placeholder="Search GIFs..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    debouncedSearch(e.target.value);
                  }}
                  className="w-full p-2 border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        type="button"
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() => handleGifSelect(gif)}
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

              {/* Image Upload Section */}
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
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
