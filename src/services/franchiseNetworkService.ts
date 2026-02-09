/**
 * Franchise Network Service
 * 
 * Servicio para gestionar la jerarquía:
 * Franquicias (Business) → Restaurantes (Stores) → Riders
 */

import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Interfaces
export interface Franchise {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive' | 'pending';
  location?: string;
  managerName?: string;
  managerEmail?: string;
  phone?: string;
  createdAt: Timestamp;
  metadata?: {
    totalStores: number;
    totalRiders: number;
    lastActivity?: Timestamp;
  };
}

export interface Store {
  id: string;
  franchiseId: string;
  name: string;
  code: string;
  status: 'active' | 'inactive' | 'pending';
  address?: string;
  phone?: string;
  email?: string;
  platform?: 'glovo' | 'uber' | 'justeat' | 'other';
  createdAt: Timestamp;
  metadata?: {
    totalRiders: number;
    lastActivity?: Timestamp;
  };
}

export interface Rider {
  id: string;
  franchiseId: string;
  storeId?: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'on_leave';
  vehicleType?: 'moto' | 'bike' | 'car';
  vehiclePlate?: string;
  createdAt: Timestamp;
  lastShiftAt?: Timestamp;
  metrics?: {
    totalShifts: number;
    totalHours: number;
    totalOrders: number;
    rating?: number;
  };
}

export interface NetworkHierarchy {
  franchise: Franchise;
  stores: Store[];
  riders: Rider[];
}

class FranchiseNetworkService {
  private readonly franchisesCollection = 'franchises';
  private readonly storesCollection = 'stores';
  private readonly ridersCollection = 'riders';

  /**
   * Obtener todas las franquicias
   */
  async getAllFranchises(): Promise<Franchise[]> {
    try {
      const q = query(collection(db, this.franchisesCollection));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Franchise[];
    } catch (error) {
      console.error('[FranchiseNetwork] Error getting franchises:', error);
      throw error;
    }
  }

  /**
   * Obtener una franquicia por ID
   */
  async getFranchiseById(franchiseId: string): Promise<Franchise | null> {
    try {
      const docRef = doc(db, this.franchisesCollection, franchiseId);
      const snapshot = await getDoc(docRef);
      
      if (!snapshot.exists()) return null;
      
      return {
        id: snapshot.id,
        ...snapshot.data()
      } as Franchise;
    } catch (error) {
      console.error('[FranchiseNetwork] Error getting franchise:', error);
      throw error;
    }
  }

  /**
   * Obtener restaurantes de una franquicia
   */
  async getStoresByFranchise(franchiseId: string): Promise<Store[]> {
    try {
      const q = query(
        collection(db, this.storesCollection),
        where('franchiseId', '==', franchiseId)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Store[];
    } catch (error) {
      console.error('[FranchiseNetwork] Error getting stores:', error);
      throw error;
    }
  }

  /**
   * Obtener un restaurante por ID
   */
  async getStoreById(storeId: string): Promise<Store | null> {
    try {
      const docRef = doc(db, this.storesCollection, storeId);
      const snapshot = await getDoc(docRef);
      
      if (!snapshot.exists()) return null;
      
      return {
        id: snapshot.id,
        ...snapshot.data()
      } as Store;
    } catch (error) {
      console.error('[FranchiseNetwork] Error getting store:', error);
      throw error;
    }
  }

  /**
   * Obtener riders de una franquicia
   */
  async getRidersByFranchise(franchiseId: string): Promise<Rider[]> {
    try {
      const q = query(
        collection(db, this.ridersCollection),
        where('franchiseId', '==', franchiseId)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Rider[];
    } catch (error) {
      console.error('[FranchiseNetwork] Error getting riders:', error);
      throw error;
    }
  }

  /**
   * Obtener riders de un restaurante específico
   */
  async getRidersByStore(storeId: string): Promise<Rider[]> {
    try {
      const q = query(
        collection(db, this.ridersCollection),
        where('storeId', '==', storeId)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Rider[];
    } catch (error) {
      console.error('[FranchiseNetwork] Error getting riders by store:', error);
      throw error;
    }
  }

  /**
   * Obtener un rider por ID
   */
  async getRiderById(riderId: string): Promise<Rider | null> {
    try {
      const docRef = doc(db, this.ridersCollection, riderId);
      const snapshot = await getDoc(docRef);
      
      if (!snapshot.exists()) return null;
      
      return {
        id: snapshot.id,
        ...snapshot.data()
      } as Rider;
    } catch (error) {
      console.error('[FranchiseNetwork] Error getting rider:', error);
      throw error;
    }
  }

  /**
   * Obtener jerarquía completa de una franquicia
   */
  async getFranchiseHierarchy(franchiseId: string): Promise<NetworkHierarchy> {
    try {
      const [franchise, stores, riders] = await Promise.all([
        this.getFranchiseById(franchiseId),
        this.getStoresByFranchise(franchiseId),
        this.getRidersByFranchise(franchiseId)
      ]);

      if (!franchise) {
        throw new Error(`Franchise ${franchiseId} not found`);
      }

      return {
        franchise,
        stores,
        riders
      };
    } catch (error) {
      console.error('[FranchiseNetwork] Error getting hierarchy:', error);
      throw error;
    }
  }

  /**
   * Buscar riders por nombre o email
   */
  async searchRiders(searchTerm: string): Promise<Rider[]> {
    try {
      // Nota: Firestore no soporta búsqueda parcial nativa
      // Esto es una búsqueda simple por prefijo
      const q = query(
        collection(db, this.ridersCollection),
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Rider[];
    } catch (error) {
      console.error('[FranchiseNetwork] Error searching riders:', error);
      throw error;
    }
  }
}

export const franchiseNetworkService = new FranchiseNetworkService();
export default franchiseNetworkService;
