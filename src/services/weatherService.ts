import { Cloud, CloudRain, CloudSnow, Sun, CloudDrizzle, Zap, LucideIcon } from 'lucide-react';

/**
 * Weather Service - Integrates with OpenWeatherMap API
 * Free tier: 1000 calls/day, 60 calls/minute
 */

const WEATHER_API_KEY = 'demo'; // User should replace with their own key
const WEATHER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface WeatherData {
    condition: string;
    temp: number;
    description: string;
    icon: LucideIcon;
    color: string;
}

interface WeatherCache {
    [key: string]: {
        data: WeatherData;
        timestamp: number;
    };
}

let weatherCache: WeatherCache = {};

export const WeatherService = {
    /**
     * Get weather for a specific date and location
     * @param {string} date - ISO date string (YYYY-MM-DD)
     * @param {string} city - City name (default: Madrid)
     */
    async getWeatherForDate(date: string, city: string = 'Madrid'): Promise<WeatherData> {
        const cacheKey = `${date}_${city}`;

        // Check cache
        if (weatherCache[cacheKey] && Date.now() - weatherCache[cacheKey].timestamp < WEATHER_CACHE_DURATION) {
            return weatherCache[cacheKey].data;
        }

        try {
            // For demo purposes, use current weather
            // In production, you'd use the forecast API with the specific date
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric&lang=es`
            );

            if (!response.ok) {
                console.warn('Weather API error, using fallback');
                return this.getFallbackWeather(date);
            }

            const data = await response.json();
            const weatherData = this.parseWeatherData(data);

            // Cache the result
            weatherCache[cacheKey] = {
                data: weatherData,
                timestamp: Date.now()
            };

            return weatherData;
        } catch (error) {
            console.error('Weather fetch error:', error);
            return this.getFallbackWeather(date);
        }
    },

    /**
     * Parse OpenWeatherMap response
     */
    parseWeatherData(data: any): WeatherData {
        const condition = data.weather[0].main.toLowerCase();
        const temp = Math.round(data.main.temp);
        const description = data.weather[0].description;

        return {
            condition,
            temp,
            description,
            icon: this.getWeatherIcon(condition),
            color: this.getWeatherColor(condition)
        };
    },

    /**
     * Map weather condition to icon component
     */
    getWeatherIcon(condition: string): LucideIcon {
        const iconMap: Record<string, LucideIcon> = {
            'clear': Sun,
            'clouds': Cloud,
            'rain': CloudRain,
            'drizzle': CloudDrizzle,
            'snow': CloudSnow,
            'thunderstorm': Zap,
        };

        return iconMap[condition] || Cloud;
    },

    /**
     * Get theme color for weather condition
     */
    getWeatherColor(condition: string): string {
        const colorMap: Record<string, string> = {
            'clear': 'text-amber-400',
            'clouds': 'text-slate-400',
            'rain': 'text-blue-400',
            'drizzle': 'text-cyan-400',
            'snow': 'text-slate-200',
            'thunderstorm': 'text-purple-400',
        };

        return colorMap[condition] || 'text-slate-400';
    },

    /**
     * Fallback weather based on day of week (for demo when API fails)
     */
    getFallbackWeather(date: string): WeatherData {
        const day = new Date(date).getDay();
        const conditions = ['clear', 'clouds', 'rain', 'drizzle'];
        const condition = conditions[day % conditions.length];

        return {
            condition,
            temp: 15 + (day * 2),
            description: 'Demo weather',
            icon: this.getWeatherIcon(condition),
            color: this.getWeatherColor(condition)
        };
    }
};
