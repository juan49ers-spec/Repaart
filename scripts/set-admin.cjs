const admin = require("firebase-admin");
const serviceAccount = require("../service-account.json"); // DESCÁRGALO DE FIREBASE CONSOLA

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const YOUR_EMAIL = "hola@repaart.es"; // <--- PON TU EMAIL AQUÍ

async function makeAdmin() {
    try {
        const user = await admin.auth().getUserByEmail(YOUR_EMAIL);

        // Asignar rol admin
        await admin.auth().setCustomUserClaims(user.uid, {
            role: 'admin'
        });

        console.log(`¡Éxito! El usuario ${YOUR_EMAIL} ahora es ADMIN Supremo.`);
        console.log("Cierra sesión y vuelve a entrar en la app para obtener el nuevo token.");

    } catch (error) {
        console.error("Error:", error);
    }
}

makeAdmin();
