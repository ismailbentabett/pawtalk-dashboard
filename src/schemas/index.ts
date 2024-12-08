// src/schemas/index.ts
import { Conversation } from "@/types/Conversation";
import { Match } from "@/types/Match";
import { Message } from "@/types/Message";
import { Pet } from "@/types/Pet";
import { Shelter } from "@/types/Shelter";
import { Timestamp } from "firebase/firestore";

export function getEmptyPet(): Pet {
  return {
    id: "",
    name: "",
    type: "",
    breed: "",
    age: 0,
    gender: "male",
    description: "",
    images: [],
    status: "available",
    location: {
      city: "",
      state: "",
      country: "",
    },
    adoptionFee: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    healthInfo: {
      vaccinated: false,
      neutered: false,
      microchipped: false,
    },
  };
}

export function getEmptyMatch(): Match {
  return {
    id: '',
    userId: '',
    petId: '', 
    status: 'liked',
    createdAt: Timestamp.now(),
    matchedAt: Timestamp.now() // Changed from undefined to Timestamp
  };
 }

export function getEmptyConversation(): Conversation {
  return {
    id: "",
    participants: [],
    petId: "",
    createdAt: Timestamp.now(),
    lastMessageAt: Timestamp.now(),
    status: "active",
  };
}

export function getEmptyMessage(): Message {
  return {
    id: "",
    senderId: "",
    content: "",
    createdAt: Timestamp.now(),
    read: false,
    type: "text",
  };
}

export function getEmptyShelter(): Shelter {
  return {
    id: "",
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    },
    operatingHours: {
      monday: { open: "09:00", close: "17:00" },
      tuesday: { open: "09:00", close: "17:00" },
      wednesday: { open: "09:00", close: "17:00" },
      thursday: { open: "09:00", close: "17:00" },
      friday: { open: "09:00", close: "17:00" },
      saturday: { open: "09:00", close: "17:00" },
      sunday: { open: "09:00", close: "17:00" },
    },
    moderators: [],
  };
}
