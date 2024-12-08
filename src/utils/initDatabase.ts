// src/utils/initDatabase.ts
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import {
  getEmptyPet,
  getEmptyMatch,
  getEmptyConversation,
  getEmptyMessage,
  getEmptyShelter
} from "@/schemas/index";

interface Schema {
  _schemaVersion: number;
  _createdAt: Timestamp;
  _lastUpdated?: Timestamp;
}

type CollectionSchema<T> = T & Schema;

async function collectionExists(collectionName: string): Promise<boolean> {
  try {
    const schemaDoc = doc(collection(db, collectionName), 'schema');
    const docSnap = await getDoc(schemaDoc);
    return docSnap.exists();
  } catch (error) {
    console.error(`Error checking collection ${collectionName}:`, error);
    return false;
  }
}

async function createCollectionIfNotExists<T>(
  collectionName: string,
  emptySchema: T
): Promise<void> {
  try {
    const exists = await collectionExists(collectionName);

    if (!exists) {
      const collectionRef = collection(db, collectionName);
      const docRef = doc(collectionRef, 'schema');

      const schema: CollectionSchema<T> = {
        ...emptySchema,
        _schemaVersion: 1,
        _createdAt: Timestamp.now(),
        _lastUpdated: Timestamp.now()
      };

      await setDoc(docRef, schema);
      console.log(`✅ Collection ${collectionName} initialized`);
    } else {
      console.log(`ℹ️ Collection ${collectionName} already exists`);
    }
  } catch (error) {
    console.error(`❌ Error creating collection ${collectionName}:`, error);
    throw error;
  }
}

async function initializeCollections() {
  const collections = [
    { name: 'pets', schema: getEmptyPet() },
    { name: 'matches', schema: getEmptyMatch() },
    { name: 'conversations', schema: getEmptyConversation() },
    { name: 'messages', schema: getEmptyMessage() },
    { name: 'shelter', schema: getEmptyShelter() }
  ] as const;

  try {
    console.log('🚀 Starting database initialization...');

    await Promise.all(
      collections.map(({ name, schema }) => 
        createCollectionIfNotExists(name, schema)
      )
    );

    console.log('✨ Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    const anyCollectionExists = await collectionExists('users');

    if (!anyCollectionExists) {
      console.log('📦 Database needs initialization...');
      await initializeCollections();
    } else {
      console.log('✅ Database already initialized');
    }
  } catch (error) {
    console.error('❌ Fatal database initialization error:', error);
    throw error;
  }
}

export default initializeDatabase;