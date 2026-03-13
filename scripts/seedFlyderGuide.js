import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC0vTiufm9bWbzXzWwqy2sEuIZLNxYiVdg",
    authDomain: "repaartfinanzas.firebaseapp.com",
    projectId: "repaartfinanzas",
    storageBucket: "repaartfinanzas.firebasestorage.app",
    messagingSenderId: "263883873106",
    appId: "1:263883873106:web:9860e5519848f48533788b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const moduleData = {
    order: 2,
    title: "Herramientas y Software",
    description: "Manuales y guías paso a paso para la instalación y uso de las aplicaciones del ecosistema Repaart.",
    duration: "15 min",
    status: "active",
    createdAt: new Date().toISOString()
};

const lessonContent = "# Guía de Instalación: Flyder para iPhone (iOS)\n\n## 📱 Requisitos Previos\n\nAntes de comenzar, asegúrate de recopilar la información correcta del Rider. Es fundamental no cometer errores en este paso para garantizar una instalación fluida.\n\n**Necesitarás pedir al rider:**\n- Nombre y apellidos.\n- **Correo electrónico de su iPhone (Apple ID)**.\n\n> ⚠️ **IMPORTANTE:** El correo debe ser obligatoriamente el asociado a su ID de Apple (con el que descarga apps en la App Store). Si nos facilita un correo cualquiera, la invitación fallará y no podrá descargarlo.\n\n---\n\n## 🚀 Fase 1: Descarga de TestFlight (App de Pruebas de Apple)\n\nComo Flyder es una aplicación empresarial en constante actualización y evolución operativa, utilizamos **TestFlight** (la plataforma oficial de Apple para este tipo de software) para su distribución segura.\n\n### Paso 1: Primer Correo (Invitación de Apple)\nDile a tu rider que esté atento a su bandeja de entrada. Recibirá un primer correo electrónico de Apple invitándole a participar en el programa.\n- Debe abrir el correo y pulsar en **Aceptar la invitación**.\n\n### Paso 2: Segundo Correo (TestFlight)\nInmediatamente después de aceptar, recibirá un segundo correo con la invitación al grupo de TestFlight de Flyder.\n- Al aceptar, su iPhone le dirigirá a la App Store oficial para descargar la aplicación **TestFlight** (si no la tenía ya instalada).\n- Desde dentro de la aplicación TestFlight recién instalada, podrá finalmente **descargar e instalar la aplicación FLYDER**.\n\n---\n\n## ⚙️ Fase 2: Alta y Registro en el Sistema\n\nCon la aplicación corporativa ya instalada en su iPhone, debemos darle de alta en nuestra base de datos para habilitarle un usuario.\n\n### Paso 3: Alta desde el Panel de Control\nEl gerente de la franquicia debe realizar el ALTA del rider desde la pestaña de Riders en su **Panel de Control de Repaart**.\n- *Nota:* Para este paso en el panel, se puede usar **cualquier correo electrónico** válido del rider para que ingrese a la app (ya no es obligatorio que sea el de Apple ID, aunque por simplicidad recomendamos que sea el mismo).\n\n### Paso 4: Tercer Correo (Verificación Flyder)\nTras registrarlo en el panel, el sistema emitirá automáticamente un **tercer y último correo** al rider.\n- Este correo contiene las credenciales o el enlace mágico para **verificar su cuenta** en Flyder.\n- Una vez verificado, el rider podrá iniciar sesión en la app Flyder, completar su perfil, y comenzar su turno.\n\n---\n\n## ✅ Checklist Rápido de Resumen\n\nPara que no te pierdas, este es el flujo lógico:\n\n- [ ] 1. Solicitar el **Correo de Apple ID** al rider antes de empezar.\n- [ ] 2. El rider **acepta la invitación inicial** de Apple (Mail 1).\n- [ ] 3. El rider **acepta TestFlight e instala Flyder** (Mail 2).\n- [ ] 4. Como franquiciado, das de **alta al rider** en tu panel Repaart.\n- [ ] 5. El rider recibe sus accesos, **verifica su cuenta** e inicia sesión (Mail 3).\n";

const lessonData = {
    order: 1,
    title: "Descarga e Instalación de Flyder (iPhone)",
    content: lessonContent,
    content_type: "text",
    status: "published",
    duration: 5,
    resources: [],
    createdAt: new Date().toISOString()
};

async function seedFlyderGuide() {
    try {
        console.log("📱 Iniciando creación de la guía de Flyder...");
        const q = query(collection(db, "academy_modules"), where("title", "==", "Herramientas y Software"));
        const snapshot = await getDocs(q);

        let moduleId;
        if (snapshot.empty) {
            console.log("📚 Creando nuevo módulo 'Herramientas y Software'...");
            const moduleRef = await addDoc(collection(db, "academy_modules"), moduleData);
            moduleId = moduleRef.id;
            console.log("✅ Módulo creado con ID: " + moduleId);
        } else {
            moduleId = snapshot.docs[0].id;
            console.log("ℹ️ El módulo ya existía. Usando ID: " + moduleId);
        }

        console.log("📝 Añadiendo la lección de Flyder...");
        const finalLessonData = {
            ...lessonData,
            module_id: moduleId
        };

        const lessonRef = await addDoc(collection(db, "academy_lessons"), finalLessonData);
        console.log("✅ Lección creada con éxito. ID: " + lessonRef.id);
        console.log("\\n🎉 ¡Guía de Flyder importada correctamente a la Academia!");
        process.exit(0);
    } catch (error) {
    }
}

seedFlyderGuide();
