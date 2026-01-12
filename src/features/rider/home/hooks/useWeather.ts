import { useState, useEffect } from 'react';

// Default to Sevilla, Spain
const DEFAULT_LAT = 37.3891;
const DEFAULT_LON = -5.9845;

export const useWeather = () => {
    const [weather, setWeather] = useState<{ temp: number; city: string; code: number } | null>(null);

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
                        city = "Ubicación Actual"; // Ideally reverse geocode, but simple for now
                    } catch (e) {
                        // Keep default
                    }
                }

                // OpenMeteo API (Free, No Key)
                const res = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
                );
                const data = await res.json();

                if (data.current) {
                    setWeather({
                        temp: Math.round(data.current.temperature_2m),
                        code: data.current.weather_code,
                        city
                    });
                }
            } catch (error) {
                console.error("Failed to fetch weather", error);
                setWeather({ temp: 22, city: 'Sevilla', code: 0 }); // Fallback
            }
        };

        fetchWeather();
        const interval = setInterval(fetchWeather, 600000); // 10 mins
        return () => clearInterval(interval);
    }, []);

    return weather;
};
