import { db } from './firebase';
import {
    collection,
    addDoc,
    query,
    orderBy,
    getDocs,
    limit,
    Timestamp,
    doc,
    setDoc,
    getDoc,
    arrayUnion,
    deleteDoc
} from 'firebase/firestore';
import { TroubleshootingGuide } from '../types/guides';

export interface Message {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    attachments?: {
        type: 'image' | 'video' | 'file';
        url: string;
        name: string;
    }[];
}

export const MemoryService = {
    /**
     * Save a chat message to Firestore
     */
    saveMessage: async (userId: string, message: Message) => {
        if (userId === 'guest') return; // Skip persistence for guests

        try {
            const messagesRef = collection(db, 'users', userId, 'chats');
            await addDoc(messagesRef, {
                content: message.content,
                sender: message.sender,
                timestamp: Timestamp.fromDate(message.timestamp),
                attachments: message.attachments || []
            });
        } catch (error) {
            console.error("Error saving message:", error);
        }
    },

    /**
     * Get recent chat history (last 50 messages)
     */
    getHistory: async (userId: string): Promise<Message[]> => {
        if (userId === 'guest') return []; // No history for guests

        try {
            const messagesRef = collection(db, 'users', userId, 'chats');
            const q = query(
                messagesRef,
                orderBy('timestamp', 'asc'), // Get oldest first to reconstruct flow
                limit(50) // Limit to last 50 for context window
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    content: data.content,
                    sender: data.sender,
                    timestamp: data.timestamp.toDate(),
                    attachments: data.attachments || []
                };
            });
        } catch (error) {
            console.error("Error fetching history:", error);
            return [];
        }
    },

    /**
     * Save a new fact about the user
     */
    saveFact: async (userId: string, fact: string) => {
        if (userId === 'guest') return;

        try {
            const userRef = doc(db, 'users', userId);
            // Use setDoc with merge to ensure document exists
            await setDoc(userRef, {
                facts: arrayUnion(fact),
                lastUpdated: Timestamp.now()
            }, { merge: true });
        } catch (error) {
            console.error("Error saving fact:", error);
        }
    },

    /**
     * Get all known facts about the user
     */
    getFacts: async (userId: string): Promise<string[]> => {
        if (userId === 'guest') return [];

        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists() && userDoc.data().facts) {
                return userDoc.data().facts as string[];
            }
            return [];
        } catch (error) {
            console.error("Error fetching facts:", error);
            return [];
        }
    },

    /**
     * Save user-specific data
     */
    saveUserData: async (userId: string, data: Record<string, any>) => {
        if (userId === 'guest') return;

        try {
            const userRef = doc(db, 'users', userId);
            await setDoc(userRef, { userData: data }, { merge: true });
        } catch (error) {
            console.error("Error saving user data:", error);
        }
    },

    /**
     * Get user-specific data
     */
    getUserData: async (userId: string): Promise<Record<string, any> | null> => {
        if (userId === 'guest') return null;

        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists() && userDoc.data().userData) {
                return userDoc.data().userData;
            }
            return null;
        } catch (error) {
            console.error("Error fetching user data:", error);
            return null;
        }
    },


    /**
     * Save a pending guide (AI generated or from discovery) to Firestore
     */
    savePendingGuide: async (guide: TroubleshootingGuide) => {
        try {
            const pendingRef = doc(db, 'pending_guides', guide.id);
            await setDoc(pendingRef, {
                ...guide,
                lastUpdated: Timestamp.now()
            });
            console.log(`📝 Saved pending guide to Firebase: ${guide.title}`);
        } catch (error) {
            console.error("Error saving pending guide:", error);
        }
    },

    /**
     * Get all pending guides from Firestore
     */
    getFirebasePendingGuides: async (): Promise<TroubleshootingGuide[]> => {
        try {
            const pendingRef = collection(db, 'pending_guides');
            const q = query(pendingRef, orderBy('meta.created', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data() as TroubleshootingGuide);
        } catch (error) {
            console.error("Error fetching firebase pending guides:", error);
            return [];
        }
    },

    /**
     * Delete a pending guide from Firestore (after approval or manual deletion)
     */
    deletePendingGuide: async (guideId: string) => {
        try {
            const pendingRef = doc(db, 'pending_guides', guideId);
            await deleteDoc(pendingRef);
            console.log(`🗑️ Deleted pending guide from Firebase: ${guideId}`);
        } catch (error) {
            console.error("Error deleting pending guide:", error);
        }
    }
};
