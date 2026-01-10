import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader } from 'lucide-react';
import { userService } from '../../services/userService'; // Updated import to allow destructuring later or direct use

// Define interfaces for form data
interface FranchiseSettings {
    minOrderAmount: number;
    shippingCost: number;
    isActive: boolean;
}

interface LocationData {
    address: string;
    city: string;
    zipCodes: string[];
}

interface FranchiseFormData {
    name: string;
    slug: string;
    settings: FranchiseSettings;
    location: LocationData;
}

interface CreateFranchiseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateFranchiseModal: React.FC<CreateFranchiseModalProps> = ({ isOpen, onClose, onSuccess }) => {
    // Estado Inicial Limpio (Reset on Open)
    const initialFormState: FranchiseFormData = {
        name: '',
        slug: '',
        settings: { minOrderAmount: 0, shippingCost: 0, isActive: true },
        location: { address: '', city: '', zipCodes: [] } // Array vacío por defecto
    };

    const [formData, setFormData] = useState<FranchiseFormData>(initialFormState);
    const [zipInput, setZipInput] = useState(''); // Estado temporal para el input de CP
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Resetear formulario cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            setFormData(initialFormState);
            setError(null);
            setZipInput('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // --- Handlers Lógicos ---

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Auto-generar slug si estamos editando el nombre
        if (name === 'name') {
            const autoSlug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            setFormData(prev => ({ ...prev, name: value, slug: autoSlug }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            settings: { ...prev.settings, [name]: parseFloat(value) || 0 }
        }));
    };

    // Gestión de Array de ZIPs (Add/Remove)
    const handleAddZip = () => {
        // Prevent default if it's a form submission event, though here it's button or keydown
        // e.preventDefault(); 

        const trimmedZip = zipInput.trim();
        if (trimmedZip && !formData.location.zipCodes.includes(trimmedZip)) {
            setFormData(prev => ({
                ...prev,
                location: { ...prev.location, zipCodes: [...prev.location.zipCodes, trimmedZip] }
            }));
            setZipInput('');
        }
    };

    const handleRemoveZip = (zipToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            location: {
                ...prev.location,
                zipCodes: prev.location.zipCodes.filter(zip => zip !== zipToRemove)
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validación de Bloqueo
        if (formData.location.zipCodes.length === 0) {
            setError("Debes añadir al menos un Código Postal.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await userService.createFranchise(formData);
            onSuccess(); // Notificar al padre para recargar datos
            onClose();   // Cerrar modal
        } catch {
            setError("Error al crear la franquicia. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render ---

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Nueva Franquicia</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Cerrar modal">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Mensaje de Error */}
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3">
                            <AlertCircle size={20} />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    {/* Sección 1: Identidad */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial *</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ej: Madrid Centro"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL) *</label>
                            <input
                                name="slug"
                                value={formData.slug}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-600 font-bold uppercase tracking-wider text-sm"
                                required
                                aria-label="Slug (URL)"
                            />
                        </div>
                    </div>

                    {/* Sección 2: Logística y ZIPs */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Códigos Postales de Reparto *</label>
                        <div className="flex gap-2">
                            <input
                                value={zipInput}
                                onChange={(e) => setZipInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddZip();
                                    }
                                }}
                                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Escribe un CP y pulsa Enter"
                            />
                            <button
                                type="button"
                                onClick={handleAddZip}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                            >
                                Añadir
                            </button>
                        </div>

                        {/* Lista de Chips de CP */}
                        <div className="flex flex-wrap gap-2 mt-2 min-h-[40px] p-2 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            {formData.location.zipCodes.length === 0 && (
                                <span className="text-gray-400 text-sm italic p-1">Sin zonas asignadas...</span>
                            )}
                            {formData.location.zipCodes.map(zip => (
                                <span key={zip} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                    {zip}
                                    <button type="button" onClick={() => handleRemoveZip(zip)} className="hover:text-blue-900" title={`Eliminar CP ${zip}`}>
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Sección 3: Configuración Económica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pedido Mínimo (€)</label>
                            <input
                                type="number"
                                name="minOrderAmount"
                                value={formData.settings.minOrderAmount}
                                onChange={handleSettingChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                min="0"
                                step="0.01"
                                aria-label="Pedido Mínimo (€)"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Costo Envío Base (€)</label>
                            <input
                                type="number"
                                name="shippingCost"
                                value={formData.settings.shippingCost}
                                onChange={handleSettingChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                min="0"
                                step="0.01"
                                aria-label="Costo Envío Base (€)"
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader size={18} className="animate-spin" /> Creando...
                                </>
                            ) : (
                                'Crear Franquicia'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateFranchiseModal;
