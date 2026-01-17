import { useForm, FormProvider } from 'react-hook-form';
import SmartFinanceInput from '../components/ui/inputs/smart-input/SmartFinanceInput';

interface FormValues {
    amount_happy?: number;
    amount_nolabel?: number;
    [key: string]: any;
}

export default function DevSandbox() {
    const methods = useForm<FormValues>({
        mode: 'onChange'
    });

    const onSubmit = (data: FormValues) => {
        console.log("Form Data:", data);
        alert(JSON.stringify(data, null, 2));
    };

    return (
        <div className="min-h-screen bg-slate-50 p-10 font-sans text-slate-900">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl border border-slate-200 p-8">
                <h1 className="text-2xl font-bold mb-6 text-slate-800 border-b pb-4">
                    ☣️ Zona de Pruebas Nuclear (DevSandbox)
                </h1>

                <p className="mb-6 text-slate-600 text-sm">
                    Este entorno está aislado para probar componentes sin arriesgar el Dashboard.
                    Si el Linter funciona, no deberíamos poder romper esto fácilmente.
                </p>

                <FormProvider {...methods}>
                    <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">

                        {/* TEST CASE 1: Happy Path */}
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <h3 className="text-xs font-bold text-blue-800 mb-3 uppercase tracking-wider">Test 1: Uso Correcto</h3>
                            <SmartFinanceInput
                                name="amount_happy"
                                label="Ingresos (Monto Correcto)"
                                placeholder="0.00"
                                rules={{
                                    required: "Este campo es requerido",
                                    min: { value: 0, message: "No puede ser negativo" }
                                }}
                            />
                        </div>

                        {/* TEST CASE 2: No Label */}
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">Test 2: Sin Label (Props Opcionales)</h3>
                            <SmartFinanceInput
                                name="amount_nolabel"
                                placeholder="Sin label visible"
                            />
                        </div>

                        <div className="pt-4 border-t flex justify-end">
                            <button
                                type="submit"
                                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg"
                            >
                                Probar Submit
                            </button>
                        </div>

                        <div className="mt-8 p-4 bg-slate-900 rounded-lg font-mono text-xs text-green-400">
                            <p className="mb-2 text-slate-500 uppercase font-bold">Estado del Formulario (Live):</p>
                            {/* eslint-disable-next-line react-hooks/incompatible-library */}
                            <pre>{JSON.stringify(methods.watch(), null, 2)}</pre>
                        </div>

                    </form>
                </FormProvider>
            </div>
        </div>
    );
}
