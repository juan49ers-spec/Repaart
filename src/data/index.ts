// Enciclopedia Repaart 2.0 - Índice de Todos los Módulos
// Este archivo combina todos los módulos de todas las categorías

import { EncyclopediaModule, getEstrategiaModules } from './encyclopediaModules';
import { getFinanzasModules } from './finanzasModules';
import { getOperativaModules } from './operativaModules';
import { getRRHHModules } from './rrhhModules';
import { getComercialModules } from './comercialModules';
import { getTecnologiaModules, getCalidadModules } from './tecnologiaCalidadModules';
import { getSeguridadModules, getLiderazgoModules } from './seguridadLiderazgoModules';

// Re-exportar el tipo para uso externo
export type { EncyclopediaModule };

// Función para obtener todos los módulos combinados
export function getAllModules(): EncyclopediaModule[] {
    return [
        ...getEstrategiaModules(),
        ...getFinanzasModules(),
        ...getOperativaModules(),
        ...getRRHHModules(),
        ...getComercialModules(),
        ...getTecnologiaModules(),
        ...getCalidadModules(),
        ...getSeguridadModules(),
        ...getLiderazgoModules()
    ];
}

// Función para obtener módulos por categoría
export function getModulesByCategory(category: string): EncyclopediaModule[] {
    return getAllModules().filter(m => m.category === category);
}

// Función para obtener todas las categorías únicas
export function getCategories(): string[] {
    return [...new Set(getAllModules().map(m => m.category))];
}

// Estadísticas de contenido
export function getContentStats() {
    const modules = getAllModules();
    const categories = getCategories();

    return {
        totalModules: modules.length,
        totalCategories: categories.length,
        byCategory: categories.map(cat => ({
            name: cat,
            count: modules.filter(m => m.category === cat).length
        }))
    };
}

// Exportar funciones individuales para uso directo
export {
    getEstrategiaModules,
    getFinanzasModules,
    getOperativaModules,
    getRRHHModules,
    getComercialModules,
    getTecnologiaModules,
    getCalidadModules,
    getSeguridadModules,
    getLiderazgoModules
};
