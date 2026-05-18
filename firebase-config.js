/**
 * firebase-config.js — Configuração e funções Firebase para o Zênite KM Tracker
 * Usa Firebase Realtime Database para sincronização em tempo real entre dispositivos
 */

// ===== CONFIGURAÇÃO DO FIREBASE =====
const firebaseConfig = {
    apiKey: "AIzaSyDQvPc-JtZU9tDxZ3h29pQpRb8zS6nz5_Y",
    authDomain: "zenite-km-tracker.firebaseapp.com",
    databaseURL: "https://zenite-km-tracker-default-rtdb.firebaseio.com",
    projectId: "zenite-km-tracker",
    storageBucket: "zenite-km-tracker.firebasestorage.app",
    messagingSenderId: "1054424239703",
    appId: "1:1054424239703:web:f40bdff6f203c4387a9d12",
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tripsRef = db.ref("zenite_km/trips");

// ===== CRUD - FIREBASE =====

/**
 * Salva uma viagem no Firebase Realtime Database
 * @param {Object} trip — objeto da viagem com todos os campos
 * @returns {Promise<string>} — ID gerado pelo Firebase
 */
async function firebaseSaveTrip(trip) {
    try {
        const newRef = tripsRef.push();
        // Usa o ID do Firebase como identificador
        trip.id = newRef.key;
        await newRef.set(trip);
        return newRef.key;
    } catch (err) {
        console.error("Erro ao salvar viagem no Firebase:", err);
        throw err;
    }
}

/**
 * Remove uma viagem do Firebase
 * @param {string} tripId — ID da viagem (key do Firebase)
 */
async function firebaseDeleteTrip(tripId) {
    try {
        await tripsRef.child(tripId).remove();
    } catch (err) {
        console.error("Erro ao excluir viagem do Firebase:", err);
        throw err;
    }
}

/**
 * Inicia o listener em tempo real para viagens
 * Chama o callback toda vez que os dados mudam (inclusive por outro usuário)
 * @param {Function} callback — recebe o array de viagens atualizado
 */
function firebaseListenTrips(callback) {
    tripsRef.on("value", (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            callback([]);
            return;
        }
        // Converte o objeto do Firebase para array
        const tripsArray = Object.keys(data).map((key) => ({
            ...data[key],
            id: key,
        }));
        callback(tripsArray);
    });
}

/**
 * Migra dados do localStorage para o Firebase (executa apenas uma vez)
 * Verifica se já houve migração para evitar duplicatas
 */
async function migrateLocalStorageToFirebase() {
    const MIGRATION_KEY = "zenite_km_migrated_to_firebase";
    const STORAGE_KEY = "zenite_km_trips";

    // Já migrou? Não faz nada
    if (localStorage.getItem(MIGRATION_KEY)) return;

    const localData = localStorage.getItem(STORAGE_KEY);
    if (!localData) {
        localStorage.setItem(MIGRATION_KEY, "true");
        return;
    }

    try {
        const localTrips = JSON.parse(localData);
        if (!Array.isArray(localTrips) || localTrips.length === 0) {
            localStorage.setItem(MIGRATION_KEY, "true");
            return;
        }

        console.log(`Migrando ${localTrips.length} viagem(ns) do localStorage para Firebase...`);

        // Salva cada viagem no Firebase
        for (const trip of localTrips) {
            const newRef = tripsRef.push();
            trip.id = newRef.key;
            await newRef.set(trip);
        }

        // Marca como migrado
        localStorage.setItem(MIGRATION_KEY, "true");
        console.log("Migração concluída com sucesso!");
    } catch (err) {
        console.error("Erro na migração:", err);
    }
}
