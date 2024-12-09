import { Pet } from '@/types/pet';
import { collection, doc, setDoc, getDocs, query } from 'firebase/firestore';

interface PetConfig {
  id: string;
  name: string;
  species: 'Dog' | 'Cat';
  age: number;
  notes: string;
  tags: string[];
}

// Function to fetch a single random dog image URL
async function fetchRandomDogImage(): Promise<string> {
  try {
    const response = await fetch('https://dog.ceo/api/breeds/image/random');
    const data = await response.json();
    if (data.status === "success") {
      return data.message;
    }
    throw new Error('Failed to fetch dog image');
  } catch (error) {
    console.error('Error fetching dog image:', error);
    throw error;
  }
}

const catImages = [
  'https://cdn2.thecatapi.com/images/0XYvRd7oD.jpg',
  'https://cdn2.thecatapi.com/images/OOD3VXAQn.jpg',
  'https://cdn2.thecatapi.com/images/MTk0MTAxOQ.jpg',
  'https://cdn2.thecatapi.com/images/JFPROfGtQ.jpg',
  'https://cdn2.thecatapi.com/images/MjA2ODY0Nw.jpg'
];

const petConfigs: PetConfig[] = [

  {
    id: "pet-002",
    name: "Oliver",
    species: "Dog",
    age: 3,
    notes: "Friendly Golden Retriever, loves playing fetch",
    tags: ["friendly", "trained", "energetic", "good-with-kids"]
  },
  {
    id: "pet-003",
    name: "Rocky",
    species: "Dog",
    age: 5,
    notes: "German Shepherd, excellent guard dog",
    tags: ["protective", "trained", "active", "loyal"]
  },
  {
    id: "pet-004",
    name: "Bella",
    species: "Cat",
    age: 1,
    notes: "Persian cat, very affectionate",
    tags: ["groomed", "calm", "friendly", "indoor"]
  },
  {
    id: "pet-005",
    name: "Max",
    species: "Dog",
    age: 4,
    notes: "Labrador mix, loves swimming",
    tags: ["active", "water-loving", "friendly"]
  },
  {
    id: "pet-006",
    name: "Milo",
    species: "Cat",
    age: 3,
    notes: "Tabby cat, expert mouser",
    tags: ["active", "independent", "outdoor", "hunter"]
  },
  {
    id: "pet-007",
    name: "Charlie",
    species: "Dog",
    age: 2,
    notes: "Poodle mix, hypoallergenic",
    tags: ["hypoallergenic", "smart", "friendly", "trained"]
  },
  {
    id: "pet-008",
    name: "Lucy",
    species: "Cat",
    age: 5,
    notes: "Russian Blue, very gentle",
    tags: ["quiet", "shy", "indoor", "gentle"]
  },
  {
    id: "pet-009",
    name: "Cooper",
    species: "Dog",
    age: 1,
    notes: "Beagle puppy, full of energy",
    tags: ["puppy", "energetic", "friendly", "training-in-progress"]
  },
  {
    id: "pet-010",
    name: "Shadow",
    species: "Cat",
    age: 4,
    notes: "Black cat, currently in foster care",
    tags: ["fostered", "quiet", "independent"]
  }
];

async function generatePetImages(species: 'Dog' | 'Cat'): Promise<string[]> {
  if (species === 'Dog') {
    // Get 4 different random dog images
    return Promise.all([
      fetchRandomDogImage(),
      fetchRandomDogImage(),
      fetchRandomDogImage(),
      fetchRandomDogImage()
    ]);
  } else {
    // Use random cat image
    const randomCatImage = catImages[Math.floor(Math.random() * catImages.length)];
    return Array(4).fill(randomCatImage);
  }
}

async function generatePetData(): Promise<Pet[]> {
  const pets: Pet[] = [];

  for (const config of petConfigs) {
    // Get images for this pet
    const images = await generatePetImages(config.species);

    // Generate random user IDs for relationships
    const randomUsers = Array.from({ length: 2 }, () => 
      `user-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
    );

    pets.push({
      ...config,
      owner: `user-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      status: Math.random() > 0.2 ? "Active" : "Inactive",
      matchRate: `${Math.floor(Math.random() * 15) + 85}%`,
      lastActivity: new Date().toISOString(),
      matches: randomUsers,
      humans: randomUsers,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
      updatedAt: new Date(),
      vaccinated: true,
      profileComplete: true,
      mainImage: images[0],
      images: images.slice(0, 3),
      imageCarousel: images
    });
  }

  return pets;
}

export const seedPetsData = async () => {
  try {
    console.log('Starting pet data seeding...');
    
    // Check if pets already exist
    const existingPets = await getDocs(query(collection(db, 'pets')));
    if (!existingPets.empty) {
      console.log('Pets collection already has data. Skipping seeding.');
      return { success: false, message: 'Data already exists' };
    }

    const petsData = await generatePetData();
    const batch = [];

    for (const pet of petsData) {
      const petRef = doc(collection(db, 'pets'), pet.id);
      batch.push(setDoc(petRef, {
        ...pet,
        createdAt: new Date(pet.createdAt),
        updatedAt: new Date(pet.updatedAt)
      }));
    }

    // Execute all operations
    await Promise.all(batch);
    
    console.log(`Successfully seeded ${petsData.length} pets`);
    return { success: true, count: petsData.length };
    
  } catch (error) {
    console.error('Error seeding pets data:', error);
    throw error;
  }
};

export const validatePetsData = async () => {
  try {
    const petsSnapshot = await getDocs(collection(db, 'pets'));
    const pets = petsSnapshot.docs.map(doc => doc.data());
    
    const validation = {
      totalPets: pets.length,
      activePets: pets.filter(p => p.status === 'Active').length,
      dogs: pets.filter(p => p.species === 'Dog').length,
      cats: pets.filter(p => p.species === 'Cat').length,
      vaccinated: pets.filter(p => p.vaccinated).length,
      profileComplete: pets.filter(p => p.profileComplete).length,
      imagesCount: pets.reduce((acc, pet) => acc + pet.images.length, 0)
    };

    console.log('Validation Results:', validation);
    return validation;
    
  } catch (error) {
    console.error('Error validating pets data:', error);
    throw error;
  }
};