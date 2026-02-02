import React from 'react';
import { ResponsiveCard } from '../components/ui/primitives/Card';

/**
 * ResponsiveDemo - Demostración completa de Container Queries Avanzados
 * 
 * Este componente demuestra:
 * 1. Container Queries con breakpoints (@xs, @sm, @md, @lg)
 * 2. Fluid Typography con clamp()
 * 3. Safe Areas para iPhone X+
 * 4. Touch Targets de 44px mínimo
 * 5. Responsive padding y spacing
 */
export const ResponsiveDemo: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 @xs:p-3 @sm:p-4 @md:p-6 @lg:p-8 safe-area-inset">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header con Fluid Typography */}
                <header className="text-center space-y-4">
                    <h1 className="text-fluid-3xl font-bold text-slate-900 dark:text-slate-100">
                        Container Queries Demo
                    </h1>
                    <p className="text-fluid-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Esta demostración muestra cómo los componentes se adaptan automáticamente 
                        al tamaño de su contenedor, no al tamaño de la pantalla.
                    </p>
                </header>

                {/* Grid de Cards con Container Queries */}
                <div className="grid grid-cols-1 @xs:grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-4 @xs:gap-3 @sm:gap-4 @md:gap-6">
                    
                    {/* Card 1: Información General */}
                    <ResponsiveCard className="@xs:min-h-[200px] @sm:min-h-[250px]">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 min-w-[44px] min-h-[44px] rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-fluid-lg">
                                    1
                                </div>
                                <h2 className="text-fluid-xl font-semibold text-slate-800 dark:text-slate-200">
                                    Container Queries
                                </h2>
                            </div>
                            
                            <p className="text-fluid-sm text-slate-600 dark:text-slate-400 flex-1">
                                Los container queries permiten que los componentes respondan al 
                                tamaño de su contenedor padre, no al viewport. Esto permite 
                                componentes más reutilizables y adaptables.
                            </p>
                            
                            <button className="mt-4 w-full min-h-[44px] px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-fluid-sm font-medium touch-target">
                                Ver Ejemplo
                            </button>
                        </div>
                    </ResponsiveCard>

                    {/* Card 2: Fluid Typography */}
                    <ResponsiveCard className="@xs:min-h-[200px] @sm:min-h-[250px]">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 min-w-[44px] min-h-[44px] rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-fluid-lg">
                                    2
                                </div>
                                <h2 className="text-fluid-xl font-semibold text-slate-800 dark:text-slate-200">
                                    Fluid Typography
                                </h2>
                            </div>
                            
                            <div className="space-y-3 flex-1">
                                <p className="text-fluid-xs text-slate-500">Texto extra pequeño (xs)</p>
                                <p className="text-fluid-sm text-slate-600">Texto pequeño (sm)</p>
                                <p className="text-fluid-base text-slate-700">Texto base - Se adapta al contenedor</p>
                                <p className="text-fluid-lg text-slate-800 font-medium">Texto grande (lg)</p>
                            </div>
                            
                            <button className="mt-4 w-full min-h-[44px] px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-fluid-sm font-medium touch-target">
                                Probar Tamaños
                            </button>
                        </div>
                    </ResponsiveCard>

                    {/* Card 3: Safe Areas */}
                    <ResponsiveCard className="@xs:min-h-[200px] @sm:min-h-[250px]">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 min-w-[44px] min-h-[44px] rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-fluid-lg">
                                    3
                                </div>
                                <h2 className="text-fluid-xl font-semibold text-slate-800 dark:text-slate-200">
                                    Safe Areas
                                </h2>
                            </div>
                            
                            <p className="text-fluid-sm text-slate-600 dark:text-slate-400 flex-1">
                                Las safe areas respetan el notch y las áreas seguras de 
                                dispositivos modernos como iPhone X+. El contenido nunca 
                                queda oculto detrás de elementos del sistema.
                            </p>
                            
                            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <p className="text-fluid-xs text-amber-700 dark:text-amber-300">
                                    📱 Prueba en un iPhone X+ para ver el efecto
                                </p>
                            </div>
                            
                            <button className="mt-4 w-full min-h-[44px] px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors text-fluid-sm font-medium touch-target">
                                Más Info
                            </button>
                        </div>
                    </ResponsiveCard>
                </div>

                {/* Sección de Breakpoints */}
                <ResponsiveCard className="mt-8">
                    <div className="space-y-6">
                        <h2 className="text-fluid-2xl font-bold text-slate-900 dark:text-slate-100">
                            Breakpoints de Container Queries
                        </h2>
                        
                        <div className="grid grid-cols-2 @sm:grid-cols-3 @md:grid-cols-6 gap-4">
                            {[
                                { name: '@xs', size: '300px', desc: 'Móvil pequeño' },
                                { name: '@sm', size: '480px', desc: 'Móvil grande' },
                                { name: '@md', size: '768px', desc: 'Tablet' },
                                { name: '@lg', size: '1024px', desc: 'Desktop' },
                                { name: '@xl', size: '1280px', desc: 'Desktop L' },
                                { name: '@2xl', size: '1536px', desc: 'Desktop XL' },
                            ].map((bp) => (
                                <div 
                                    key={bp.name}
                                    className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center"
                                >
                                    <code className="text-fluid-lg font-bold text-indigo-600 dark:text-indigo-400">
                                        {bp.name}
                                    </code>
                                    <p className="text-fluid-sm text-slate-600 dark:text-slate-400 mt-1">
                                        {bp.size}
                                    </p>
                                    <p className="text-fluid-xs text-slate-500 dark:text-slate-500">
                                        {bp.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </ResponsiveCard>

                {/* Footer */}
                <footer className="text-center pt-8 pb-safe">
                    <p className="text-fluid-sm text-slate-500 dark:text-slate-500">
                        Demo creada con Tailwind CSS 4 Container Queries
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default ResponsiveDemo;
