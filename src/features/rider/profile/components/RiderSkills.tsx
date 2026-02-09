import React from 'react';
import { Badge, BadgeIntent } from '../../../../components/ui/primitives/Badge';
import { Truck, Languages, Award, Star } from 'lucide-react';

interface RiderSkillsProps {
    skills: string[];
}

interface SkillCategory {
    id: string;
    label: string;
    icon: React.ReactNode;
    keywords: string[]; // Keywords to match skills to this category
    intent: BadgeIntent;
}

const CATEGORIES: SkillCategory[] = [
    {
        id: 'vehicles',
        label: 'Vehículos',
        icon: <Truck size={18} />,
        keywords: ['moto', 'coche', 'bici', 'furgoneta', 'van', 'electric'],
        intent: 'accent'
    },
    {
        id: 'languages',
        label: 'Idiomas',
        icon: <Languages size={18} />,
        keywords: ['inglés', 'español', 'francés', 'alemán', 'catalán', 'euskera', 'gallego'],
        intent: 'info'
    },
    {
        id: 'certifications',
        label: 'Certificaciones',
        icon: <Award size={18} />,
        keywords: ['manipulador', 'carnet', 'prl', 'seguridad', 'primeros auxilios'],
        intent: 'success'
    }
];

const OTHER_CATEGORY: SkillCategory = {
    id: 'other',
    label: 'Otras Habilidades',
    icon: <Star size={18} />,
    keywords: [],
    intent: 'neutral'
};

const RiderSkills: React.FC<RiderSkillsProps> = ({ skills }) => {
    // Group skills by category
    const groupedSkills = React.useMemo(() => {
        const groups: Record<string, string[]> = {};

        if (!skills) return groups;

        skills.forEach(skill => {
            const lowerSkill = skill.toLowerCase();
            let matched = false;

            for (const category of CATEGORIES) {
                if (category.keywords.some(k => lowerSkill.includes(k))) {
                    if (!groups[category.id]) groups[category.id] = [];
                    groups[category.id].push(skill);
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                if (!groups['other']) groups['other'] = [];
                groups['other'].push(skill);
            }
        });

        return groups;
    }, [skills]);

    if (!skills || skills.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Star size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">No hay habilidades registradas</p>
                <p className="text-xs opacity-60 mt-1">Las habilidades se asignan desde administración</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {CATEGORIES.map(category => {
                const categorySkills = groupedSkills[category.id];
                if (!categorySkills || categorySkills.length === 0) return null;

                return (
                    <div key={category.id} className="space-y-3">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                {category.icon}
                            </span>
                            {category.label}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {categorySkills.map((skill, index) => (
                                <Badge key={`${category.id}-${index}`} intent={category.intent} size="md">
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    </div>
                );
            })}

            {groupedSkills['other'] && groupedSkills['other'].length > 0 && (
                <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {OTHER_CATEGORY.icon}
                        </span>
                        {OTHER_CATEGORY.label}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {groupedSkills['other'].map((skill, index) => (
                            <Badge key={`other-${index}`} intent={OTHER_CATEGORY.intent} size="md">
                                {skill}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiderSkills;
