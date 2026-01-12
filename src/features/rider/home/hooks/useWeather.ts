import { useState, useEffect } from 'react';

// Default to Sevilla, Spain
const DEFAULT_LAT = 37.3891;
const DEFAULT_LON = -5.9845;

export interface WeatherData {
    temp: number;
    city: string;
    code: number;
    condition: string;
}

/**
 * Mapping OpenMeteo WMO Codes to human readable labels
 */
const getWeatherCondition = (code: number): string => {
    if (code === 0) return 'Despejado';
    if (code <= 3) return 'Parcialmente Nublado';
    if (code <= 48) return 'Niebla';
    if (code <= 55) return 'Llovizna';
    if (code <= 65) return 'Lluvia';
    if (code <= 75) return 'Nieve';
    if (code <= 82) return 'Chubascos';
    if (code <= 99) return 'Tormenta';
    return 'Despejado';
};

export const useWeather = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Determine location (Browser Geolocation or Default)
                let lat = DEFAULT_LAT;
                let lon = DEFAULT_LON;
                let city = "Sevilla";

                if (navigator.geolocation) {
                    try {
                        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                        });
                        lat = position.coords.latitude;
                        lon = position.coords.longitude;
                        city = "Ubicación Actual";
                    } catch (e) {
                        // Keep default Sevilla if position fails
                    }
                }

                // OpenMeteo API (Free, No Key)
                const res = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
                );

                if (!res.ok) throw new Error("Weather API failed");

                const data = await res.json();

                if (data.current) {
                    setWeather({
                        temp: Math.round(data.current.temperature_2m),
                        code: data.current.weather_code,
                        condition: getWeatherCondition(data.current.weather_code),
                        city
                    });
                }
            } catch (error) {
                console.error("Failed to fetch weather", error);
                // Graceful fallback so UI doesn't break
                setWeather({
                    temp: 22,
                    city: 'Sevilla',
                    code: 0,
                    condition: 'Despejado'
                });
            }
        };

        fetchWeather();
        const interval = setInterval(fetchWeather, 600000); // 10 mins
        return () => clearInterval(interval);
    }, []);

    return weather;
};
