# Configuración del Clima en Tiempo Real

## Estado Actual

El sistema de clima está configurado pero usa:

- **API Key**: `'demo'` (no funciona con API real)
- **Ciudad**: Madrid por defecto
- **Datos**: Fallback basado en día de la semana (temperatura simulada)

## Para Activar Clima Real

### 1. Obtener API Key Gratuita de OpenWeatherMap

1. Ve a <https://openweathermap.org/api>
2. Regístrate (plan gratuito incluye 1000 llamadas/día)
3. Ve a "API Keys" en tu perfil
4. Copia tu API key

### 2. Configurar la API Key

Edita `src/services/weatherService.js`, línea 8:

```javascript
// Antes:
const WEATHER_API_KEY = 'demo';

// Después:
const WEATHER_API_KEY = 'TU_API_KEY_AQUÍ';
```

### 3. Añadir Campo `city` a Franquicias (Opcional)

Para que cada franquicia tenga su propia ciudad:

#### Opción A: Via Firebase Console

1. Abre Firebase Console → Firestore
2. Busca tu documento de franquicia en `franchises/{franchiseId}`
3. Añade campo: `city: "Madrid"` (o la ciudad correspondiente)

#### Opción B: Via Código

Descomentar líneas 57-59 en `WeeklyScheduler.jsx`:

```javascript
const franchiseDoc = await getDoc(doc(db, 'franchises', franchiseId));
const city = franchiseDoc.data()?.city || 'Madrid';
```

Y añadir import:

```javascript
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
```

### 4. Desplegar

```bash
npm run build
firebase deploy
```

## Resultado Esperado

Una vez configurado verás:

- ☀️ **Sol** cuando haga buen tiempo
- 🌧️ **Lluvia** cuando esté lloviendo
- ⛈️ **Tormenta** si hay tormentas
- Temperatura **real en °C** de la ciudad de la franquicia

## Notas Técnicas

- **Caché**: 30 minutos para evitar exceder límite de API
- **Fallback**: Si falla la API, usa datos demo
- **Idioma**: Español (`lang=es` en la API call)
- **Unidades**: Métricas (Celsius)
