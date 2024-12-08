import { Timestamp } from "firebase/firestore";

export interface Pet {
    id: string;
    name: string;
    type: string;
    breed: string;
    age: number;
    gender: 'male' | 'female';
    description: string;
    images: string[];
    status: 'available' | 'pending' | 'adopted';
    location: {
      city: string;
      state: string;
      country: string;
    };
    adoptionFee: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    healthInfo: {
      vaccinated: boolean;
      neutered: boolean;
      microchipped: boolean;
    };
    shelterId: string;
  }