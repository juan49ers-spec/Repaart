import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface DailyForecast {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
}

export interface WeatherData {
    current: {
        temperature: number;
        weatherCode: number;
        isDay: boolean;
        city: string;
    } | null;
    daily: DailyForecast | null;
    loading: boolean;
    error: boolean;
}

export const useWeather = (id?: string, collectionName: 'users' | 'franchises' = 'users') => {
    const [data, setData] = useState<WeatherData>({
        current: null,
        daily: null,
        loading: true,
        error: false
    });

    useEffect(() => {
        if (!id) {
            setData(prev => ({ ...prev, loading: false }));
            return;
        }

        // Listener for Profile/Franchise Changes
        const unsub = onSnapshot(doc(db, collectionName, id), async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();

                // Determine City (works for both User and Franchise documents if fields align)
                // Franchise often has 'address' or 'city' at root.
                let rawCity = data?.city;
                if (!rawCity && data?.address) {
                    rawCity = data.address;
                }
                if (!rawCity) rawCity = 'Madrid';
                console.log(`[useWeather] Detecting weather for city: ${rawCity} (ID: ${id})`);

                const queryCity = rawCity; // Search by city name directly

                try {
                    // 1. Geocoding
                    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(queryCity)}&count=10&language=es&format=json`);
                    const geoData = await geoRes.json();

                    let lat, lon, confirmedName;
                    console.log(`[useWeather] Geocoding result for ${queryCity}:`, geoData);

                    // Try to find a result in Spain (ES)
                    const spainResult = geoData.results?.find((r: any) => r.country_code === 'ES' || r.country === 'España' || r.country === 'Spain');
                    const bestResult = spainResult || geoData.results?.[0];

                    if (!bestResult) {
                        // Fallback to Madrid
                        console.log(`[useWeather] No geocoding results for ${queryCity}, falling back to Madrid`);
                        if (rawCity !== 'Madrid') {
                            const retryRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=Madrid&count=1&language=es&format=json`);
                            const retryData = await retryRes.json();
                            if (retryData.results && retryData.results.length > 0) {
                                lat = retryData.results[0].latitude;
                                lon = retryData.results[0].longitude;
                                confirmedName = retryData.results[0].name;
                            }
                        }
                    } else {
                        lat = bestResult.latitude;
                        lon = bestResult.longitude;
                        confirmedName = bestResult.name;
                        console.log(`[useWeather] Selected location: ${confirmedName} (${lat}, ${lon})`);
                    }

                    if (!lat || !lon) throw new Error("Location not found");

                    // 2. Fetch Weather & Forecast
                    // Added past_days=7 to ensure we have data for the full week view even if it's Sunday
                    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&past_days=7`);
                    const weatherJson = await weatherRes.json();

                    setData({
                        current: weatherJson.current_weather ? {
                            temperature: weatherJson.current_weather.temperature,
                            weatherCode: weatherJson.current_weather.weathercode,
                            isDay: weatherJson.current_weather.is_day === 1,
                            city: confirmedName
                        } : null,
                        daily: weatherJson.daily || null,
                        loading: false,
                        error: false
                    });

                } catch (err) {
                    console.error("Weather hook error:", err);
                    setData(prev => ({ ...prev, loading: false, error: true }));
                }
            } else {
                console.warn(`Weather hook: Document ${id} in ${collectionName} not found.`);
                setData(prev => ({ ...prev, loading: false, error: true }));
            }
        }, (err) => {
            console.error("Weather snapshot error:", err);
            setData(prev => ({ ...prev, loading: false, error: true }));
        });

        return () => unsub();
    }, [id, collectionName]);

    return data;
};
