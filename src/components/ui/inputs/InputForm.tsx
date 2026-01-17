import { useState, type FC, type ChangeEvent, type FormEvent } from 'react';

interface FormData {
    ordersNew0To4: number;
    ordersNew4To5: number;
    ordersNew5To6: number;
    ordersNew6To7: number;
    ordersNewGt7: number;
    ordersOld0To35: number;
    ordersOldGt35: number;
    salaries: number;
    motoCount: number;
    insurance: number;
    services: number;
    quota: number;
    gasoline: number;
    repairs: number;
    royaltyPercent: number;
    [key: string]: number; // Allow indexing
}

interface InputFormProps {
    onCalculate: (data: FormData) => void;
}

const InputForm: FC<InputFormProps> = ({ onCalculate }) => {
    const [formData, setFormData] = useState<FormData>({
        // Revenue Inputs
        ordersNew0To4: 0,
        ordersNew4To5: 0,
        ordersNew5To6: 0,
        ordersNew6To7: 0,
        ordersNewGt7: 0,
        ordersOld0To35: 0,
        ordersOldGt35: 0,

        // Expense Inputs
        salaries: 0,
        motoCount: 0, // Changed from renting amount to count
        insurance: 0,
        services: 0,
        quota: 0,
        gasoline: 0,
        repairs: 0,
        royaltyPercent: 0, // % of Revenue
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        // Parse all fields to numbers before submitting (already numbers in state but good to ensure)
        const parsedData = Object.keys(formData).reduce((acc, key) => {
            // In TS state is already number, but ensuring safe copy
            acc[key] = formData[key];
            return acc;
        }, {} as FormData);
        onCalculate(parsedData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Datos Financieros de la Franquicia</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Revenue Section */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-blue-600 border-b pb-2">Ingresos: Pedidos por Distancia</h3>

                    <div className="mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">Tarifa NUEVA</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="block">
                                <span className="text-sm text-gray-600">0 - 4 km (5,50€)</span>
                                <input type="number" name="ordersNew0To4" value={formData.ordersNew0To4} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" min="0" />
                            </label>
                            <label className="block">
                                <span className="text-sm text-gray-600">4,01 - 5 km (6,50€)</span>
                                <input type="number" name="ordersNew4To5" value={formData.ordersNew4To5} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" min="0" />
                            </label>
                            <label className="block">
                                <span className="text-sm text-gray-600">5,01 - 6 km (7,50€)</span>
                                <input type="number" name="ordersNew5To6" value={formData.ordersNew5To6} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" min="0" />
                            </label>
                            <label className="block">
                                <span className="text-sm text-gray-600">6,01 - 7 km (8,50€)</span>
                                <input type="number" name="ordersNew6To7" value={formData.ordersNew6To7} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" min="0" />
                            </label>
                            <label className="block">
                                <span className="text-sm text-gray-600">&gt; 7 km (8,50€)</span>
                                <input type="number" name="ordersNewGt7" value={formData.ordersNewGt7} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" min="0" />
                            </label>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">Tarifa ANTIGUA</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="block">
                                <span className="text-sm text-gray-600">0 - 3,5 km (5,50€)</span>
                                <input type="number" name="ordersOld0To35" value={formData.ordersOld0To35} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" min="0" />
                            </label>
                            <label className="block">
                                <span className="text-sm text-gray-600">&gt; 3,5 km (7,50€)</span>
                                <input type="number" name="ordersOldGt35" value={formData.ordersOldGt35} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" min="0" />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Expenses Section */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-red-600 border-b pb-2">Gastos Mensuales</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Salarios</span>
                            <input type="number" name="salaries" value={formData.salaries} onChange={handleChange} className="ml-2 w-32 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2" />
                        </label>
                        <label className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm text-gray-600">Nº de Motos</span>
                                <span className="text-xs text-gray-400">(x 154€/mes)</span>
                            </div>
                            <input type="number" name="motoCount" value={formData.motoCount} onChange={handleChange} className="ml-2 w-32 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2" />
                        </label>
                        <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Gasolina</span>
                            <input type="number" name="gasoline" value={formData.gasoline} onChange={handleChange} className="ml-2 w-32 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2" />
                        </label>
                        <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Reparaciones</span>
                            <input type="number" name="repairs" value={formData.repairs} onChange={handleChange} className="ml-2 w-32 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2" />
                        </label>
                        <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Servicios Prof.</span>
                            <input type="number" name="services" value={formData.services} onChange={handleChange} className="ml-2 w-32 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2" />
                        </label>
                        <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Cuota Autónomo</span>
                            <input type="number" name="quota" value={formData.quota} onChange={handleChange} className="ml-2 w-32 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2" />
                        </label>
                        <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Seguros</span>
                            <input type="number" name="insurance" value={formData.insurance} onChange={handleChange} className="ml-2 w-32 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2" />
                        </label>
                        <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Royalty (%)</span>
                            <input type="number" name="royaltyPercent" value={formData.royaltyPercent} onChange={handleChange} className="ml-2 w-32 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2" step="0.1" />
                        </label>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-center">
                <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition shadow-lg transform hover:scale-105">
                    Generar Reporte
                </button>
            </div>
        </form>
    );
};

export default InputForm;
