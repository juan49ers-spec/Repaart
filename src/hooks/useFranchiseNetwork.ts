import { useState, useEffect, useCallback } from 'react';
import { 
  franchiseNetworkService, 
  Franchise, 
  Store, 
  Rider
} from '../services/franchiseNetworkService';

interface UseFranchiseNetworkReturn {
  franchises: Franchise[];
  selectedFranchise: Franchise | null;
  stores: Store[];
  selectedStore: Store | null;
  riders: Rider[];
  selectedRider: Rider | null;
  loading: boolean;
  error: string | null;
  // Actions
  selectFranchise: (franchiseId: string) => Promise<void>;
  selectStore: (storeId: string) => Promise<void>;
  selectRider: (riderId: string) => Promise<void>;
  refresh: () => void;
  // Search
  searchRiders: (term: string) => Promise<Rider[]>;
}

/**
 * Hook para gestionar la jerarquía de red de franquicias
 * Admin → Franquicias → Restaurantes → Riders
 */
export function useFranchiseNetwork(): UseFranchiseNetworkReturn {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Cargar todas las franquicias al inicio
  useEffect(() => {
    const loadFranchises = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await franchiseNetworkService.getAllFranchises();
        setFranchises(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando franquicias');
      } finally {
        setLoading(false);
      }
    };

    loadFranchises();
  }, [refreshKey]);

  // Seleccionar una franquicia y cargar sus datos
  const selectFranchise = useCallback(async (franchiseId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const hierarchy = await franchiseNetworkService.getFranchiseHierarchy(franchiseId);
      
      setSelectedFranchise(hierarchy.franchise);
      setStores(hierarchy.stores);
      setRiders(hierarchy.riders);
      
      // Reset selections
      setSelectedStore(null);
      setSelectedRider(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando franquicia');
    } finally {
      setLoading(false);
    }
  }, []);

  // Seleccionar un restaurante y cargar sus riders
  const selectStore = useCallback(async (storeId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const store = await franchiseNetworkService.getStoreById(storeId);
      const storeRiders = await franchiseNetworkService.getRidersByStore(storeId);
      
      setSelectedStore(store);
      // Actualizar riders para mostrar solo los de este store
      setRiders(storeRiders);
      setSelectedRider(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando restaurante');
    } finally {
      setLoading(false);
    }
  }, []);

  // Seleccionar un rider
  const selectRider = useCallback(async (riderId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const rider = await franchiseNetworkService.getRiderById(riderId);
      setSelectedRider(rider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando rider');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refrescar datos
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    setSelectedFranchise(null);
    setSelectedStore(null);
    setSelectedRider(null);
    setStores([]);
    setRiders([]);
  }, []);

  // Buscar riders
  const searchRiders = useCallback(async (term: string) => {
    try {
      return await franchiseNetworkService.searchRiders(term);
    } catch (err) {
      console.error('Error searching riders:', err);
      return [];
    }
  }, []);

  return {
    franchises,
    selectedFranchise,
    stores,
    selectedStore,
    riders,
    selectedRider,
    loading,
    error,
    selectFranchise,
    selectStore,
    selectRider,
    refresh,
    searchRiders
  };
}

export default useFranchiseNetwork;
