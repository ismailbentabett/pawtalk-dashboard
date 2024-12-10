import { PetFilters } from "import { Pet } from "@/types/Pet";";

export const PETS_PER_PAGE = 10;

export const INITIAL_FILTERS: PetFilters = {
  species: [],
  status: [],
  ageRange: { min: 0, max: 100 },
  matchRateThreshold: 0,
  tags: [],
};

