const FAVORITES_KEY = 'dev_tools_favorites';

/**
 * Obtiene la lista de favoritos desde localStorage
 */
export function getFavorites(): string[] {
    try {
        const stored = localStorage.getItem(FAVORITES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.warn('Failed to load favorites:', error);
        return [];
    }
}

/**
 * Guarda la lista de favoritos en localStorage
 */
export function saveFavorites(favorites: string[]): void {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (error) {
        console.warn('Failed to save favorites:', error);
    }
}

/**
 * Añade una herramienta a favoritos
 */
export function addFavorite(toolName: string): string[] {
    const favorites = getFavorites();
    if (!favorites.includes(toolName)) {
        favorites.push(toolName);
        saveFavorites(favorites);
    }
    return favorites;
}

/**
 * Quita una herramienta de favoritos
 */
export function removeFavorite(toolName: string): string[] {
    const favorites = getFavorites().filter(name => name !== toolName);
    saveFavorites(favorites);
    return favorites;
}

/**
 * Verifica si una herramienta está en favoritos
 */
export function isFavorite(toolName: string): boolean {
    return getFavorites().includes(toolName);
}

/**
 * Alterna el estado de favorito de una herramienta
 */
export function toggleFavorite(toolName: string): boolean {
    const favorites = getFavorites();
    const isCurrentlyFavorite = favorites.includes(toolName);

    if (isCurrentlyFavorite) {
        removeFavorite(toolName);
        return false;
    } else {
        addFavorite(toolName);
        return true;
    }
}
