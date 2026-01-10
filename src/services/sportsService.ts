import { useState, useEffect } from 'react';

export interface MatchData {
    id: string;
    competition: string;
    opponent: string;
    opponentLogo: string; // URL or placeholder
    home: boolean;
    date: Date;
    status: 'scheduled' | 'live' | 'finished';
    score: {
        realMadrid: number;
        opponent: number;
    };
    minute?: number;
}

// MOCK DATA for Demo
const MOCK_OPPONENTS = [
    { name: 'FC Barcelona', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1200px-FC_Barcelona_%28crest%29.svg.png' },
    { name: 'Atlético Madrid', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f4/Atletico_Madrid_2017_logo.svg/1200px-Atletico_Madrid_2017_logo.svg.png' },
    { name: 'Manchester City', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png' },
    { name: 'Bayern Munich', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg/1200px-FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg.png' },
];

export const sportsService = {
    // Simulate fetching the "Current" or "Next" significant match
    getRealMadridMatch: async (): Promise<MatchData> => {
        // SIMULATION LOGIC:
        // To show the user the "Live" feature, we'll randomize the state occasionally
        // or just return a static "Pre-match" state that they can toggle with a dev tool if needed.
        // For this demo, let's return a "Live" match if the minute is odd, and "Scheduled" if even?
        // No, better to default to a "Next Match" and allow a "Simulate Live" button in the widget itself.

        return {
            id: 'match-123',
            competition: 'La Liga EA Sports',
            opponent: 'FC Barcelona',
            opponentLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1200px-FC_Barcelona_%28crest%29.svg.png',
            home: true,
            date: new Date(new Date().getTime() + 86400000 * 2), // 2 days from now
            status: 'scheduled',
            score: {
                realMadrid: 0,
                opponent: 0
            }
        };
    }
};

// Custom Hook for Real-Time Simulation
export const useRealMadridMatch = () => {
    const [match, setMatch] = useState<MatchData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSimulating, setIsSimulating] = useState(false);

    useEffect(() => {
        // Initial Load
        loadMatch();
    }, []);

    // Simulation Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isSimulating && match) {
            // Start simulation: Change status to live and increment time/score
            setMatch(prev => prev ? ({ ...prev, status: 'live', minute: 1 }) : null);

            interval = setInterval(() => {
                setMatch(prev => {
                    if (!prev) return null;
                    const newMinute = (prev.minute || 0) + 1;

                    // Random Goal Logic
                    let newScore = { ...prev.score };
                    if (Math.random() > 0.92) { // 8% chance of goal every tick (fast simulation)
                        if (Math.random() > 0.4) newScore.realMadrid++;
                        else newScore.opponent++;
                    }

                    if (newMinute > 90) {
                        setIsSimulating(false);
                        return { ...prev, status: 'finished', minute: 90, score: newScore };
                    }

                    return {
                        ...prev,
                        status: 'live',
                        minute: newMinute,
                        score: newScore
                    };
                });
            }, 1000); // 1 tick = 1 minute, updates every second for demo
        } else if (!isSimulating && match?.status === 'live') {
            // Stop simulation logic if needed or reset
        }

        return () => clearInterval(interval);
    }, [isSimulating]);

    const loadMatch = async () => {
        setLoading(true);
        const data = await sportsService.getRealMadridMatch();
        setMatch(data);
        setLoading(false);
    };

    const toggleSimulation = () => {
        if (match?.status === 'live') {
            // Stop
            setIsSimulating(false);
            loadMatch(); // Reset
        } else {
            // Start
            setIsSimulating(true);
        }
    };

    return { match, loading, isSimulating, toggleSimulation };
};
