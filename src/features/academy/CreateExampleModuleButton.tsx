import { useState, type FC } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface CreateExampleModuleButtonProps {
    onComplete?: () => void;
}

/**
 * Botón para crear módulo de ejemplo con contenido educativo
 */
const CreateExampleModuleButton: FC<CreateExampleModuleButtonProps> = ({ onComplete }) => {
    const [loading, setLoading] = useState<boolean>(false);

    const exampleModule = {
        order: 1,
        title: "Introducción a Repaart",
        description: "Fundamentos del modelo de negocio y conceptos clave para gestionar tu franquicia con éxito",
        duration: "45 min",
        published: true,
        lessonCount: 3,
        createdAt: new Date().toISOString()
    };

    const exampleLessons = [
        {
            order: 1,
            title: "El Modelo de Franquicia Repaart",
            content: `# El Modelo de Franquicia Repaart

## 🎯 Misión y Visión

Repaart no es una simple ETT de repartidores. Somos una **Operadora Logística Descentralizada** que transforma a emprendedores y riders en Directores de Flota Local.

### Nuestra Propuesta de Valor

El ecosistema del Food Delivery tradicional presenta varios problemas:
- **Erosión de márgenes** para restaurantes (comisiones del 25-30%)
- **Precarización** del servicio de reparto
- **Falta de control** para los restaurantes

**Repaart ofrece la solución:**

1. ✅ **Coste predecible**: Tarifa plana por entrega
2. ✅ **Control total**: Gestión directa de tu flota
3. ✅ **Alta fiabilidad**: Servicio profesional garantizado
4. ✅ **Imagen profesional**: Uniformes y motos branded

## 💰 Modelo de Negocio

### Packs de Contratación

| Pack | Inversión | Royalty | Incluye |
|------|-----------|---------|---------|
| **BÁSICO** | 1.500€ | 1% | Licencia, Manuales, Flyder, Yamimoto, Formación |
| **PREMIUM** | 3.000€ | 3% | Todo lo anterior + Mentoring Quincenal |

### Servicios a la Carta

- 💼 **Consultoría**: 50€/hora
- 📊 **Pack Financiero**: 100€/mes
- 🎓 **Formación avanzada**: Bajo demanda

## 📈 Rentabilidad Esperada

### Fase Despegue (700 pedidos/mes)
- **Ingresos brutos**: ~4.200€
- **Gastos operativos**: ~3.200€
- **Beneficio neto**: **~1.000€**

### Fase Rentabilidad (1.500 pedidos/mes)
- **Ingresos brutos**: ~9.000€
- **Gastos operativos**: ~7.200€
- **Beneficio neto**: **~1.800€**

> 💡 **Clave del éxito**: La rentabilidad depende de tu gestión diaria. "Te damos el coche, pero tú conduces".

## 🚀 Próximos Pasos

En las siguientes lecciones aprenderás:
1. Cómo funciona la operativa diaria
2. Estrategias de captación B2B
3. Gestión de tu equipo de riders

¡Vamos a comenzar tu camino hacia la excelencia operativa!
`,
            resources: []
        },
        {
            order: 2,
            title: "Operativa y Tecnología",
            content: `# Operativa y Tecnología

## 🖥️ Flyder: Tu Sistema Operativo

**Flyder** es tu plataforma de gestión integral para coordinar entregas en tiempo real.

### Características Principales

1. **Optimización con IA**
   - Asignación inteligente de pedidos
   - Rutas optimizadas por consumo de combustible
   - Predicción de tiempos de entrega

2. **Monitorización en Tiempo Real**
   - GPS en vivo de todos los riders
   - Alertas de retrasos
   - Dashboard de métricas operativas

3. **Coste**
   - **Activación**: 200€ (una sola vez)
   - **Variable**: 0,35€ por pedido procesado

## 🏍️ Yamimoto: Tu Flota de Motos

### El Modelo de Renting

En lugar de comprar motos, usamos **renting integral**:

- **Cuota mensual**: 154€/moto
- **Incluye**: Seguro a terceros + Mantenimiento preventivo
- **Fianza**: 200€ (recuperable)

### Ventajas del Modelo

✅ **Sin inversión inicial** en vehículos  
✅ **Mantenimiento incluido** (revisiones 1k, 5k, 10k km)  
✅ **Sustitución** en caso de avería (máx. 10 días)  
✅ **Flexibilidad** para escalar la flota

## 📦 Checklist de Inicio de Turno

Antes de cada turno, verificar:

- [ ] Depósito de gasolina lleno
- [ ] Cajón limpio y desinfectado
- [ ] Móvil cargado al 100%
- [ ] Uniforme en buen estado
- [ ] Documentación en regla (permiso, seguro)

## 🎯 KPIs Clave a Monitorizar

1. **Pedidos/hora/rider**: Objetivo 2.2-2.5
2. **Tiempo medio de entrega**: Objetivo <30 min
3. **Tasa de incidencias**: Objetivo <3%
4. **Coste por pedido**: Objetivo <3€

En la próxima lección veremos cómo captar restaurantes y construir tu cartera B2B.
`,
            resources: []
        },
        {
            order: 3,
            title: "Estrategia Comercial B2B",
            content: `# Estrategia Comercial B2B

## 🎯 Tu Cliente Ideal

No todos los restaurantes son buenos clientes. Busca:

- 🍽️ **Volumen medio-alto**: 15+ pedidos/día mínimo
- 📍 **Zona A (0-4km)**: Maximiza margen y eficiencia
- 💪 **Compromiso**: Dispuestos a firmar mínimo 700 pedidos/mes
- ⚖️ **Profesionalidad**: Cocinas limpias, packaging adecuado

## 💰 Estructura de Tarifas por Zona

| Zona | Distancia | Tarifa Cliente | Coste Rider | Margen |
|------|-----------|----------------|-------------|--------|
| **A** | 0-4 km | 5,50 - 6,00€ | 3,50€ | **~2,50€** |
| **B** | 4-5 km | 6,50 - 7,00€ | 4,00€ | ~2,50€ |
| **C** | 5-6 km | 7,50 - 8,00€ | 4,50€ | ~3,00€ |
| **D** | 6-7 km | 8,50 - 9,00€ | 5,00€ | ~3,50€ |

> 💡 **Estrategia**: Prioriza Zona A para volumen. Zona D tiene precio disuasorio (queremos evitar ir).

## 📊 El Argumento de Venta Definitivo

### El Ahorro Real

Un restaurante medio con plataformas tradicionales:
- **Comisión**: 28% sobre 30.000€/año = **8.400€**
- **Riesgo laboral**: Alta (riders como empleados de facto)
- **Control**: Nulo

Con Repaart (1.000 pedidos/año):
- **Coste fijo**: 6.000€
- **Riesgo laboral**: Cero (riders son nuestros)
- **Control**: Total

**Ahorro anual: ~2.400€** + Tranquilidad + Control

## 🎣 El "Battle Card" (Argumentario)

### Vs. Glovo/Uber Eats

| Aspecto | Plataformas | Repaart |
|---------|-------------|---------|
| **Coste** | 25-30% comisión | Tarifa fija/pedido |
| **Control** | Cero | Total |
| **Riesgo laboral** | Alto | Cero (nosotros empleamos) |
| **Imagen** | Variable | Profesional garantizado |
| **Datos** | Son suyos | Son tuyos |

## 📞 El Proceso de Ventas (Framework)

### 1. Prospección (Semana 1-2)
- Mapea tu zona: ¿Qué restaurantes tienen delivery?
- Prioriza por volumen y ubicación (Zona A)
- Identifica a los decisores (dueños, gerentes)

### 2. Primer Contacto (Semana 3-4)
- Llamada o visita en persona (nunca email frío)
- Agenda reunión de 15 minutos
- Lleva calculadora de ahorro preparada

### 3. Reunión Comercial
**Estructura de 15 minutos:**
- Minutos 0-3: Presentación del problema (comisiones altas)
- Minutos 3-8: Solución Repaart (ahorro, control)
- Minutos 8-12: Calculadora de ahorro personalizada
- Minutos 12-15: Cierre y próximos pasos

### 4. Cierre (Semana 5-6)
- Garantía de volumen: 700 pedidos/mes comprometidos
- Firma de contrato marco
- Activación técnica (48h)

---

¡Felicidades! Has completado el Módulo 1. Ya conoces los fundamentos para lanzar tu franquicia Repaart con éxito.

**Próximos pasos:**
- Completa el quiz de evaluación (80% mínimo)
- Recibe tu certificado
- Avanza al Módulo 2: Gestión Operativa Avanzada
`,
            resources: []
        }
    ];

    const handleCreate = async (): Promise<void> => {
        setLoading(true);
        try {
            // 1. Crear el módulo
            const moduleRef = await addDoc(collection(db, 'academy_modules'), exampleModule);
            console.log(`Módulo creado con ID: ${moduleRef.id}`);

            // 2. Crear las lecciones
            for (const lesson of exampleLessons) {
                const lessonData = {
                    ...lesson,
                    moduleId: moduleRef.id,
                    createdAt: new Date().toISOString()
                };

                await addDoc(collection(db, 'academy_lessons'), lessonData);
            }

            alert('✅ Módulo de ejemplo creado con éxito!\n\n📚 Módulo: Introducción a Repaart\n📝 Lecciones: 3\n\nYa puedes verlo en la academia.');

            if (onComplete) onComplete();
        } catch (error) {
            console.error('Error creando módulo de ejemplo:', error);
            alert('❌ Error al crear el módulo de ejemplo: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleCreate}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-700 hover:to-violet-700 font-bold shadow-lg shadow-indigo-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
            aria-label="Crear módulo de ejemplo"
        >
            {loading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creando...
                </>
            ) : (
                <>
                    <Sparkles className="w-5 h-5" />
                    Crear Módulo de Ejemplo
                </>
            )}
        </button>
    );
};

export default CreateExampleModuleButton;
