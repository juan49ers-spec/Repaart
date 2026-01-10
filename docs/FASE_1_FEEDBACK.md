# 📝 FASE 1: SISTEMA DE FEEDBACK Y EVALUACIÓN

**ID**: #9  
**Duración Estimada**: 1-2 días  
**Prioridad**: 🔴 CRÍTICA  
**Dependencias**: Ninguna

---

## 🎯 OBJETIVOS

Implementar un sistema completo de feedback que permita a los usuarios:

- Evaluar la calidad de cada módulo (rating 1-5)
- Dejar comentarios constructivos
- Reportar errores o contenido obsoleto

Y a los administradores:

- Ver estadísticas de evaluación por módulo
- Identificar contenido problemático
- Priorizar mejoras basadas en datos reales

---

## 🏗️ ARQUITECTURA

### Estructura de Datos Firestore

```javascript
// Colección: module_feedback
{
  id: "auto-generated",
  moduleId: "estrategia-modelo-superautonomos",
  userId: "abc123",
  rating: 4, // 1-5
  comment: "Muy útil pero falta ejemplo de..."  // opcional
  reportedIssue: false, // true si marca "Reportar error"
  issueType: null, // "outdated" | "error" | "unclear" | null
  createdAt: timestamp,
  userName: "Juan Pérez" // Denormalizado para queries
}

// Índices compuestos necesarios:
// - moduleId + createdAt (desc)
// - moduleId + rating
// - reportedIssue + createdAt (desc)
```

---

## 🎨 DISEÑO UI/UX

### 1. Componente de Rating en Módulo

**Ubicación**: Al final de cada módulo en Brutal Learning View

**Wireframe**:

```
┌─────────────────────────────────────┐
│  ¿Te fue útil este módulo?          │
│                                      │
│  ⭐ ⭐ ⭐ ⭐ ⭐  (4.2/5 - 45 votos)  │
│                                      │
│  💬 Comparte tu experiencia (opcional)│
│  ┌──────────────────────────────┐   │
│  │                              │   │
│  └──────────────────────────────┘   │
│                                      │  
│  🚨 Reportar error/contenido obsoleto│
│                                      │
│  [Enviar Feedback]  [Omitir]        │
└─────────────────────────────────────┘
```

### 2. Panel Admin - Analytics de Feedback

**Ubicación**: Nueva tab en AdminEncyclopediaPanel

**Wireframe**:

```
┌────────────────────────────────────────────────┐
│ 📊 FEEDBACK & ANALYTICS                        │
├────────────────────────────────────────────────┤
│                                                 │
│  Filtros: [Todas las categorías ▼] [Últimos 30d▼]│
│                                                 │
│  ┌─────────────────────────────────────┐      │
│  │ Módulos Mejor Valorados              │      │
│  │ 1. ⭐4.8 - SLA y Penalizaciones      │      │
│  │ 2. ⭐4.7 - Modelo Superautónomos     │      │
│  └─────────────────────────────────────┘      │
│                                                 │
│  ┌─────────────────────────────────────┐      │
│  │ ⚠️ Requieren Atención                │      │
│  │ 1. ⭐2.3 - Facturación Rítmica (12 reports)│
│  │ 2. ⭐3.1 - Control de Costes (5 reports)  │
│  └─────────────────────────────────────┘      │
│                                                 │
│  📈 [Ver todos los módulos]                    │
└────────────────────────────────────────────────┘
```

---

## 💻 IMPLEMENTACIÓN

### Componente Frontend: `ModuleFeedbackWidget.jsx`

```javascript
import React, { useState } from 'react';
import { Star, MessageSquare, AlertTriangle, Send } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const ModuleFeedbackWidget = ({ moduleId, moduleName }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [reportIssue, setReportIssue] = useState(false);
    const [issueType, setIssueType] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Check if user already submitted feedback
    useEffect(() => {
        const checkExistingFeedback = async () => {
            const q = query(
                collection(db, 'module_feedback'),
                where('moduleId', '==', moduleId),
                where('userId', '==', auth.currentUser.uid)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                setSubmitted(true);
                const data = snapshot.docs[0].data();
                setRating(data.rating);
            }
        };
        checkExistingFeedback();
    }, [moduleId]);

    const handleSubmit = async () => {
        if (rating === 0) return;
        
        setLoading(true);
        try {
            await addDoc(collection(db, 'module_feedback'), {
                moduleId,
                userId: auth.currentUser.uid,
                userName: auth.currentUser.displayName || 'Usuario',
                rating,
                comment: comment.trim() || null,
                reportedIssue: reportIssue,
                issueType: reportIssue ? issueType : null,
                createdAt: new Date()
            });
            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Error al enviar feedback');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-emerald-700 font-bold">
                    ✅ Gracias por tu feedback!
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MessageSquare size={20} />
                ¿Te fue útil este módulo?
            </h3>

            {/* Star Rating */}
            <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110"
                    >
                        <Star
                            size={32}
                            className={`${
                                star <= (hoverRating || rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-slate-300'
                            } transition-colors`}
                        />
                    </button>
                ))}
            </div>

            {/* Comment */}
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Comparte tu experiencia (opcional)"
                className="w-full border border-slate-200 rounded-xl p-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                rows={3}
            />

            {/* Report Issue */}
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                    type="checkbox"
                    checked={reportIssue}
                    onChange={(e) => setReportIssue(e.target.checked)}
                    className="w-4 h-4"
                />
                <AlertTriangle size={16} className="text-amber-500" />
                <span className="text-sm font-medium">Reportar error/contenido obsoleto</span>
            </label>

            {reportIssue && (
                <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 mb-4"
                >
                    <option value="">Tipo de problema...</option>
                    <option value="outdated">Contenido desactualizado</option>
                    <option value="error">Error en la información</option>
                    <option value="unclear">No está claro</option>
                </select>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={handleSubmit}
                    disabled={rating === 0 || loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? 'Enviando...' : (
                        <>
                            <Send size={18} />
                            Enviar Feedback
                        </>
                    )}
                </button>
                <button className="px-4 py-3 bg-slate-100 rounded-xl font-bold hover:bg-slate-200">
                    Omitir
                </button>
            </div>
        </div>
    );
};

export default ModuleFeedbackWidget;
```

---

### Hook Custom: `useModuleFeedbackStats.js`

```javascript
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const useModuleFeedbackStats = (moduleId) => {
    const [stats, setStats] = useState({
        averageRating: 0,
        totalRatings: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        reportedIssues: 0,
        loading: true
    });

    useEffect(() => {
        const fetchStats = async () => {
            const q = query(
                collection(db, 'module_feedback'),
                where('moduleId', '==', moduleId)
            );
            
            const snapshot = await getDocs(q);
            const feedbacks = snapshot.docs.map(d => d.data());

            const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            let totalRating = 0;
            let reported = 0;

            feedbacks.forEach(f => {
                distribution[f.rating]++;
                totalRating += f.rating;
                if (f.reportedIssue) reported++;
            });

            setStats({
                averageRating: feedbacks.length > 0 ? (totalRating / feedbacks.length).toFixed(1) : 0,
                totalRatings: feedbacks.length,
                distribution,
                reportedIssues: reported,
                loading: false
            });
        };

        fetchStats();
    }, [moduleId]);

    return stats;
};
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend

- [ ] Crear colección `module_feedback` en Firestore
- [ ] Configurar índices compuestos
- [ ] Actualizar Firestore Rules
- [ ] Crear Cloud Function para calcular stats (opcional, puede ser client-side)

### Frontend  

- [ ] Crear `ModuleFeedbackWidget.jsx`
- [ ] Crear `useModuleFeedbackStats.js`
- [ ] Integrar en `BrutalLearningView.jsx`
- [ ] Crear tab "Feedback" en `AdminEncyclopediaPanel.jsx`
- [ ] Crear `FeedbackAnalyticsDashboard.jsx` para admin

### Testing

- [ ] Test: Usuario puede enviar rating
- [ ] Test: Usuario no puede votar 2 veces mismo módulo
- [ ] Test: Feedback aparece en panel admin
- [ ] Test: Reports se marcan correctamente

### Deployment

- [ ] Deploy Firestore Rules
- [ ] Deploy Frontend
- [ ] Verificar en producción

---

## 📊 MÉTRICAS DE ÉXITO

- ✅ **>70%** de usuarios dejan feedback
- ✅ Rating promedio general **>4.0**
- ✅ **<5%** de módulos con reportes de errores
- ✅ Tiempo de respuesta a feedback **<48h**

---

**Siguiente**: [FASE_1_ONBOARDING.md](./FASE_1_ONBOARDING.md)
