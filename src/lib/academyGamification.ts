export const ACADEMY_XP = {
    LESSON_TEXT: 10,
    LESSON_VIDEO: 20,
    QUIZ_PASSED: 50,
    QUIZ_PERFECT_BONUS: 50, // Otorgado adicionalmente si el score es 100%
};

export const ACADEMY_LEVELS = [
    { name: 'Novato 🌱', minXp: 0, maxXp: 99, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { name: 'Principiante 🚀', minXp: 100, maxXp: 299, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { name: 'Intermedio ⚡', minXp: 300, maxXp: 699, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { name: 'Avanzado 💎', minXp: 700, maxXp: 1499, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { name: 'Experto 👑', minXp: 1500, maxXp: Infinity, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' }
];

export const calculateLevel = (xp: number) => {
    return ACADEMY_LEVELS.find(level => xp >= level.minXp && xp <= level.maxXp) || ACADEMY_LEVELS[0];
};

export const getNextLevel = (currentXp: number) => {
    const currentLevelIndex = ACADEMY_LEVELS.findIndex(level => currentXp >= level.minXp && currentXp <= level.maxXp);
    if (currentLevelIndex >= 0 && currentLevelIndex < ACADEMY_LEVELS.length - 1) {
        return ACADEMY_LEVELS[currentLevelIndex + 1];
    }
    return null; // Ya es el máximo nivel
};

export const getXpProgressToNextLevel = (xp: number) => {
    const currentLevel = calculateLevel(xp);
    const nextLevel = getNextLevel(xp);

    if (!nextLevel) return 100; // Máximo nivel

    const xpInCurrentLevel = xp - currentLevel.minXp;
    const levelXpRequirement = nextLevel.minXp - currentLevel.minXp;

    return Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / levelXpRequirement) * 100)));
};

export const getXpForLesson = (type?: string) => {
    switch (type) {
        case 'video': return ACADEMY_XP.LESSON_VIDEO;
        case 'quiz': return ACADEMY_XP.QUIZ_PASSED;
        default: return ACADEMY_XP.LESSON_TEXT;
    }
};

