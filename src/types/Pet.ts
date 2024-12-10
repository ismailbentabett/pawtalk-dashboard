import { Match } from "date-fns";

export interface Pet {
  id: string;
  name: string;
  species: string;
  age: number;
  owner: string;
  status: 'Active' | 'Inactive';
  matchRate: string;
  lastActivity: string;
  matches: Match[];
  humans: string[];
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  tags: string[];
  vaccinated: boolean;
  profileComplete: boolean;
  images : string[];
  mainImage : string;
  type : string;
  breed : string
  description : string;
  gender : string;
  location : {
    city : string;
    state : string;
    country : string;
  };
  adoptionFee : number;
  healthInfo : {
    vaccinated : boolean;
    neutered : boolean;
    microchipped : boolean;
  };
}

export interface PetFilters {
  species: string[];
  status: ('Active' | 'Inactive')[];
  ageRange: { min: number; max: number };
  matchRateThreshold: number;
  tags: string[];
}

