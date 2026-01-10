import { useState, type FC, type ChangeEvent } from 'react';
import { Gamepad2, X, Edit2 } from 'lucide-react';

type NextSceneType = 'next' | 'end_success' | 'end_fail' | number;

interface Choice {
    text: string;
    nextScene: NextSceneType;
    feedback: string;
}

interface Scene {
    id: number;
    text: string;
    choices: Choice[];
}

interface AdminSimulationEditorProps {
    simulationData?: Scene[];
    onChange: (data: Scene[]) => void;
}

const AdminSimulationEditor: FC<AdminSimulationEditorProps> = ({ simulationData = [], onChange }) => {
    const [currentScene, setCurrentScene] = useState<Scene>({
        id: (simulationData?.length || 0) + 1,
        text: '',
        choices: [{ text: '', nextScene: 'next', feedback: '' }]
    });
    const [editingSceneIndex, setEditingSceneIndex] = useState<number | null>(null);

    const handleAddChoice = (): void => {
        setCurrentScene({
            ...currentScene,
            choices: [...currentScene.choices, { text: '', nextScene: 'next', feedback: '' }]
        });
    };

    const handleChoiceChange = (idx: number, field: keyof Choice, value: string): void => {
        const newChoices = [...currentScene.choices];
        newChoices[idx] = { ...newChoices[idx], [field]: value };
        setCurrentScene({ ...currentScene, choices: newChoices });
    };

    const addSceneToSimulation = (): void => {
        if (!currentScene.text) {
            alert("Escribe el texto de la escena");
            return;
        }

        let newData: Scene[];
        if (editingSceneIndex !== null) {
            newData = [...simulationData];
            newData[editingSceneIndex] = currentScene;
            setEditingSceneIndex(null);
        } else {
            newData = [...simulationData, { ...currentScene, id: simulationData.length + 1 }];
        }

        onChange(newData);

        // Reset scene builder
        setCurrentScene({
            id: newData.length + 1,
            text: '',
            choices: [{ text: '', nextScene: 'next', feedback: '' }]
        });
    };

    const handleEditScene = (scene: Scene, idx: number): void => {
        setCurrentScene(scene);
        setEditingSceneIndex(idx);
    };

    const handleDeleteScene = (idx: number): void => {
        const newData = simulationData.filter((_, i) => i !== idx);
        onChange(newData);
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 transition-colors">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    {editingSceneIndex !== null ? `Editar Escena #${editingSceneIndex + 1}` : 'Nueva Escena'}
                </h3>

                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Narrativa de la Escena</label>
                    <textarea
                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-medium text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 placeholder:text-slate-400"
                        placeholder="Describe la situación: 'El cliente entra enfadado...'"
                        value={currentScene.text}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCurrentScene({ ...currentScene, text: e.target.value })}
                    />
                </div>

                <div className="space-y-3 mb-4">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Opciones de Decisión</label>
                    {currentScene.choices.map((choice, idx) => (
                        <div key={idx} className="flex gap-2 items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex-1 space-y-2">
                                <input
                                    className="w-full p-2 text-sm border border-slate-200 rounded bg-white"
                                    placeholder="Texto de la opción (ej: 'Pedir disculpas')"
                                    value={choice.text}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleChoiceChange(idx, 'text', e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 p-2 text-xs border border-slate-200 rounded bg-white"
                                        placeholder="Feedback (ej: 'Buena elección, se calma.')"
                                        value={choice.feedback}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleChoiceChange(idx, 'feedback', e.target.value)}
                                    />
                                    <select
                                        className="w-32 p-2 text-xs border border-slate-200 rounded bg-white"
                                        value={choice.nextScene}
                                        onChange={(e: ChangeEvent<HTMLSelectElement>) => handleChoiceChange(idx, 'nextScene', e.target.value)}
                                        title="Siguiente Escena"
                                    >
                                        <option value="next">Siguiente (+1)</option>
                                        <option value="end_success">Fin (Éxito)</option>
                                        <option value="end_fail">Fin (Fallo)</option>
                                        {simulationData.map((s, i) => (
                                            <option key={s.id} value={s.id}>Escena {i + 1}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const newChoices = currentScene.choices.filter((_, i) => i !== idx);
                                    setCurrentScene({ ...currentScene, choices: newChoices });
                                }}
                                className="p-1 hover:bg-rose-100 text-rose-400 rounded"
                                title="Eliminar Opción"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={handleAddChoice}
                        className="text-xs font-bold text-orange-600 hover:bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200 border-dashed w-full"
                    >
                        + Añadir Opción
                    </button>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                        onClick={addSceneToSimulation}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition shadow-md"
                    >
                        {editingSceneIndex !== null ? 'Guardar Cambios' : 'Añadir Escena'}
                    </button>
                </div>
            </div>

            {/* Scene List Preview */}
            <div className="space-y-4">
                {simulationData.length === 0 && (
                    <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-200">
                        <Gamepad2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-400 font-medium">No hay escenas creadas. ¡Empieza la aventura!</p>
                    </div>
                )}
                {simulationData.map((scene, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-4 group hover:shadow-md transition-all relative">
                        <div className="w-8 h-8 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-black text-slate-500 dark:text-slate-400 text-sm border-2 border-white dark:border-slate-700 shadow-sm">
                            {idx + 1}
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-slate-800 dark:text-slate-200 text-sm mb-2 line-clamp-2">&quot;{scene.text}&quot;</p>
                            <div className="flex gap-2 flex-wrap">
                                {scene.choices.map((c, cIdx) => (
                                    <span key={cIdx} className="text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-2 py-1 rounded text-slate-500 dark:text-slate-400">
                                        {c.text} → {c.nextScene === 'next' ? 'Sig.' : c.nextScene === 'end_success' ? '🏆' : c.nextScene === 'end_fail' ? '💀' : `Escena ${c.nextScene}`}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEditScene(scene, idx)}
                                className="p-1.5 hover:bg-blue-50 text-blue-500 rounded"
                                title="Editar Escena"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDeleteScene(idx)}
                                className="p-1.5 hover:bg-rose-50 text-rose-500 rounded"
                                title="Eliminar Escena"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminSimulationEditor;
