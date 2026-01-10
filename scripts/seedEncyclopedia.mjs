// Script para poblar Firebase con datos de Encyclopedia
// Ejecutar: node scripts/seedEncyclopedia.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

// Configuración Firebase (REEMPLAZA CON TUS CREDENCIALES)
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DATOS A POBLAR
const categoriesData = [
    { id: "estrategia", name: "Estrategia", icon: "TrendingUp", color: "blue", order: 1, unlockRequirement: null },
    { id: "finanzas", name: "Finanzas", icon: "DollarSign", color: "emerald", order: 2, unlockRequirement: "estrategia" },
    { id: "operativa", name: "Operativa", icon: "Truck", color: "sky", order: 3, unlockRequirement: "finanzas" },
    { id: "rrhh", name: "RRHH & Equipo", icon: "Users", color: "indigo", order: 4, unlockRequirement: "operativa" },
    { id: "seguridad", name: "Seguridad", icon: "Shield", color: "red", order: 5, unlockRequirement: "rrhh" },
    { id: "eficiencia", name: "Eficiencia", icon: "Zap", color: "yellow", order: 6, unlockRequirement: "seguridad" },
    { id: "comercial", name: "Comercial", icon: "Briefcase", color: "purple", order: 7, unlockRequirement: "eficiencia" },
    { id: "cultura", name: "Cultura", icon: "Heart", color: "pink", order: 8, unlockRequirement: "comercial" },
    { id: "maestria", name: "Maestría", icon: "Award", color: "amber", order: 9, unlockRequirement: "cultura" },
    { id: "tactica", name: "Táctica", icon: "Target", color: "slate", order: 10, unlockRequirement: "maestria" },
    { id: "crisis", name: "Legal & Crisis", icon: "AlertTriangle", color: "orange", order: 11, unlockRequirement: "tactica" },
    { id: "micro", name: "Micro-Gestión", icon: "Crosshair", color: "teal", order: 12, unlockRequirement: "crisis" }
];

const modulesData = [
    { categoryId: "estrategia", title: "Modelo Superautónomos", content: "No somos una ETT ni una plataforma. Somos Operadores Logísticos.", action: "Vende 'Flota Dedicada'.", order: 1 },
    { categoryId: "estrategia", title: "Packs Básico vs Premium", content: "Básico (1.500€) para expertos. Premium (3.000€) vital para novatos.", action: "Elige Premium si dudas.", order: 2 },
    { categoryId: "estrategia", title: "Matriz de Tarifas", content: "Zona A (0-4km) a 6€ es el núcleo. Zona D (6-7km) disuasoria.", action: "80% facturación en Zona A.", order: 3 },
    { categoryId: "estrategia", title: "Expansión Contigua", content: "Crece barrio a barrio como mancha de aceite. No saltes zonas.", action: "Consolida antes de abrir más lejos.", order: 4 },
    { categoryId: "estrategia", title: "Regla del 'No-Go'", content: "Mínimo 700 pedidos para arrancar. Menos es suicidio financiero.", action: "Sin firmas no hay motos.", order: 5 },
    { categoryId: "finanzas", title: "Protocolo Tesorería", content: "Facturación quincenal. Kill-Switch al día 6 de impago.", action: "Tolerancia cero con cobros.", order: 1 },
    { categoryId: "finanzas", title: "Fondo de Maniobra", content: "1.500€ intocables para emergencias. No es sueldo.", action: "Cuenta separada.", order: 2 },
    { categoryId: "finanzas", title: "Caja de Resistencia", content: "Alerta Roja si bajas de 1.100€. Corta gastos.", action: "Vigila el saldo diario.", order: 3 },
    { categoryId: "operativa", title: "Tecnología Flyder", content: "0,35€/pedido. Cerebro de la operación. TestFlight en iOS.", action: "Audita clics fantasma.", order: 1 },
    { categoryId: "operativa", title: "Flota Yamimoto", content: "Renting con mantenimiento. Revisiones 1k, 5k, 10k km.", action: "Ten moto de reserva propia.", order: 2 },
    { categoryId: "rrhh", title: "Perfil Rider", content: "24-40 años. Compromiso. Evita muy jóvenes.", action: "Bolsa de reserva siempre llena.", order: 1 },
    { categoryId: "seguridad", title: "Viento Lateral", content: "Efecto vela. No adelantar camiones.", action: "Reduce velocidad.", order: 1 },
    { categoryId: "eficiencia", title: "Pisos Bajos", content: "Ascensor lento. Escaleras 1º-3º piso.", action: "Cardio táctico.", order: 1 },
    { categoryId: "comercial", title: "Argumentario", content: "Vende Paz Mental y seguridad jurídica.", action: "No compitas por precio.", order: 1 },
];

const quizzesData = [
    { categoryId: "estrategia", question: "¿Volumen mínimo recomendado para arrancar?", options: ["300 pedidos", "500 pedidos", "700 pedidos", "1000 pedidos"], correctIndex: 2, order: 1 },
    { categoryId: "estrategia", question: "¿Función principal de la Zona D?", options: ["Generar volumen", "Disuasoria", "Competencia", "Rural"], correctIndex: 1, order: 2 },
    { categoryId: "estrategia", question: "¿Estrategia de expansión recomendada?", options: ["Aislada", "Mancha de Aceite", "Salto", "Aleatoria"], correctIndex: 1, order: 3 },
    { categoryId: "estrategia", question: "¿Pack recomendado para novatos?", options: ["Básico", "Premium", "Ninguno", "Ambos"], correctIndex: 1, order: 4 },
    { categoryId: "finanzas", question: "¿Alerta Roja en tesorería?", options: ["<500€", "<1100€", "<2000€", "0€"], correctIndex: 1, order: 1 },
    { categoryId: "finanzas", question: "¿Fondo de maniobra mínimo?", options: ["500€", "1000€", "1500€", "2000€"], correctIndex: 2, order: 2 },
    { categoryId: "operativa", question: "¿Cuándo cubre Yamimoto sustitución?", options: ["Siempre", ">10 días", "Solo con pago", "Nunca"], correctIndex: 1, order: 1 },
];

// FUNCIÓN SEED
async function seed() {
    try {
        console.log('🌱 Iniciando seed de Encyclopedia...\n');

        // 1. Categories
        console.log('📁 Creando categorías...');
        for (const cat of categoriesData) {
            await setDoc(doc(db, 'encyclopedia_categories', cat.id), {
                ...cat,
                createdAt: new Date()
            });
            console.log(`  ✅ ${cat.name}`);
        }

        // 2. Modules
        console.log('\n📚 Creando módulos...');
        for (const mod of modulesData) {
            const docRef = doc(collection(db, 'encyclopedia_modules'));
            await setDoc(docRef, {
                ...mod,
                createdAt: new Date()
            });
            console.log(`  ✅ ${mod.title}`);
        }

        // 3. Quizzes
        console.log('\n❓ Creando preguntas...');
        for (const quiz of quizzesData) {
            const docRef = doc(collection(db, 'encyclopedia_quizzes'));
            await setDoc(docRef, {
                ...quiz,
                createdAt: new Date()
            });
            console.log(`  ✅ ${quiz.question.substring(0, 50)}...`);
        }

        console.log('\n✨ ¡Seed completado exitosamente!');
        console.log(`\n📊 Resumen:`);
        console.log(`   - ${categoriesData.length} categorías`);
        console.log(`   - ${modulesData.length} módulos`);
        console.log(`   - ${quizzesData.length} preguntas`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error durante el seed:', error);
        process.exit(1);
    }
}

// Ejecutar
seed();
