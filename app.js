/**
 * app.js — Lógica principal do Zênite KM Tracker
 * Gerencia navegação, formulário, localStorage e renderização do dashboard/histórico
 */

// ===== CONFIGURAÇÃO DOS USUÁRIOS =====
const USERS = {
    alberto: {
        id: "alberto",
        name: "Alberto",
        role: "Mestre Conselheiro Estadual",
        city: "Canindé de São Francisco",
    },
    arthur: {
        id: "arthur",
        name: "Arthur Vinícius",
        role: "Mestre Conselheiro Estadual Adjunto",
        city: "Itabaiana",
    },
};

const STORAGE_KEY = "zenite_km_trips";

// ===== STATE =====
let trips = loadTrips();
let activeFilter = "all";
let deleteTarget = null;

// ===== INICIALIZAÇÃO =====
document.addEventListener("DOMContentLoaded", () => {
    generateStars();
    setupNavigation();
    setupForm();
    setupHistory();
    renderAll();
    setDefaultDate();
});

// ===== STAR BACKGROUND =====
function generateStars() {
    const container = document.getElementById("stars-bg");
    const count = 120;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
        const star = document.createElement("div");
        star.className = "star";
        const size = Math.random() * 2.5 + 0.5;
        star.style.cssText = `
            width: ${size}px; height: ${size}px;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            --dur: ${2 + Math.random() * 4}s;
            --o1: ${0.2 + Math.random() * 0.3};
            --o2: ${0.6 + Math.random() * 0.4};
            animation-delay: ${Math.random() * 5}s;
        `;
        fragment.appendChild(star);
    }
    container.appendChild(fragment);
}

// ===== NAVEGAÇÃO =====
function setupNavigation() {
    const navBtns = document.querySelectorAll(".nav-btn");
    const mobileBtn = document.getElementById("mobile-menu-btn");
    const nav = document.getElementById("header-nav");

    navBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const section = btn.dataset.section;
            switchSection(section);
            nav.classList.remove("open");
        });
    });

    mobileBtn.addEventListener("click", () => {
        nav.classList.toggle("open");
    });
}

function switchSection(sectionId) {
    document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));

    document.getElementById(`section-${sectionId}`).classList.add("active");
    document.querySelector(`[data-section="${sectionId}"]`).classList.add("active");
}

// ===== FORMULÁRIO =====
function setupForm() {
    const form = document.getElementById("trip-form");
    const travelerSelect = document.getElementById("traveler-select");
    const destInput = document.getElementById("destination-input");
    const suggestionsEl = document.getElementById("suggestions-dropdown");

    // Autocomplete de destino
    destInput.addEventListener("input", () => {
        const query = destInput.value.trim();
        const results = searchCities(query);
        renderSuggestions(results, suggestionsEl, destInput);
        updateDistancePreview();
    });

    destInput.addEventListener("focus", () => {
        const query = destInput.value.trim();
        if (query.length >= 2) {
            const results = searchCities(query);
            renderSuggestions(results, suggestionsEl, destInput);
        }
    });

    // Fechar dropdown ao clicar fora
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".input-with-suggestions")) {
            suggestionsEl.classList.remove("show");
        }
    });

    // Atualiza preview quando muda o viajante
    travelerSelect.addEventListener("change", updateDistancePreview);

    // Submit
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        handleFormSubmit();
    });
}

function renderSuggestions(cities, container, input) {
    if (cities.length === 0) {
        container.classList.remove("show");
        return;
    }
    container.innerHTML = cities
        .map(
            (c) =>
                `<div class="suggestion-item" data-city="${c.name}">${c.name}<span class="state-tag">${c.state}</span></div>`
        )
        .join("");
    container.classList.add("show");

    container.querySelectorAll(".suggestion-item").forEach((item) => {
        item.addEventListener("click", () => {
            input.value = item.dataset.city;
            container.classList.remove("show");
            updateDistancePreview();
        });
    });
}

let previewDebounce = null;

function updateDistancePreview() {
    const traveler = document.getElementById("traveler-select").value;
    const dest = document.getElementById("destination-input").value.trim();
    const preview = document.getElementById("distance-preview");

    if (!traveler || !dest) {
        preview.classList.add("hidden");
        return;
    }

    const user = USERS[traveler];

    // Tenta buscar localmente primeiro (síncrono)
    const distOneWay = getRoadDistance(user.city, dest);

    if (distOneWay !== null) {
        showDistancePreview(user.city, dest, distOneWay);
        return;
    }

    // Se não encontrou, tenta assíncrono com debounce
    clearTimeout(previewDebounce);
    previewDebounce = setTimeout(async () => {
        const asyncDist = await getRoadDistanceAsync(user.city, dest);
        if (asyncDist !== null) {
            showDistancePreview(user.city, dest, asyncDist);
        } else {
            preview.classList.add("hidden");
        }
    }, 500);
}

function showDistancePreview(origin, dest, distOneWay) {
    const preview = document.getElementById("distance-preview");
    const distRound = distOneWay * 2;

    document.getElementById("route-origin").textContent = origin;
    document.getElementById("route-dest").textContent = dest;
    document.getElementById("dist-oneway").textContent = `${distOneWay} km`;
    document.getElementById("dist-return").textContent = `${distOneWay} km`;
    document.getElementById("dist-total").textContent = `${distRound} km`;

    preview.classList.remove("hidden");
}

async function handleFormSubmit() {
    const travelerId = document.getElementById("traveler-select").value;
    const date = document.getElementById("trip-date").value;
    const dest = document.getElementById("destination-input").value.trim();
    const submitBtn = document.getElementById("btn-submit");

    if (!travelerId || !date || !dest) return;

    const user = USERS[travelerId];

    // Tenta síncrono primeiro
    let distOneWay = getRoadDistance(user.city, dest);

    // Se não encontrou, tenta assíncrono
    if (distOneWay === null) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Calculando distância...";
        distOneWay = await getRoadDistanceAsync(user.city, dest);
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Salvar Viagem`;
    }

    if (distOneWay === null) {
        showToast("Cidade não encontrada! Verifique o nome e tente novamente.", true);
        return;
    }

    const trip = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        travelerId,
        date,
        origin: user.city,
        destination: dest,
        distanceOneWay: distOneWay,
        distanceTotal: distOneWay * 2,
        createdAt: new Date().toISOString(),
    };

    trips.push(trip);
    saveTrips();
    renderAll();

    // Reset form
    document.getElementById("trip-form").reset();
    document.getElementById("distance-preview").classList.add("hidden");
    setDefaultDate();

    showToast("Viagem registrada com sucesso!");

    // Animate counter
    animateCounter(travelerId);
}

function setDefaultDate() {
    const dateInput = document.getElementById("trip-date");
    dateInput.value = new Date().toISOString().split("T")[0];
}

// ===== PERSISTÊNCIA =====
function loadTrips() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveTrips() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

// ===== RENDERIZAÇÃO =====
function renderAll() {
    renderDashboard();
    renderHistory();
}

function renderDashboard() {
    // Calcular totais por usuário
    const stats = { alberto: { km: 0, trips: 0 }, arthur: { km: 0, trips: 0 } };
    let lastDate = null;

    // Ordenar por data
    const sorted = [...trips].sort((a, b) => a.date.localeCompare(b.date));

    sorted.forEach((t) => {
        stats[t.travelerId].km += t.distanceTotal;
        stats[t.travelerId].trips += 1;
        lastDate = t.date;
    });

    document.getElementById("km-alberto").textContent = stats.alberto.km.toLocaleString("pt-BR");
    document.getElementById("trips-alberto").textContent = stats.alberto.trips;
    document.getElementById("km-arthur").textContent = stats.arthur.km.toLocaleString("pt-BR");
    document.getElementById("trips-arthur").textContent = stats.arthur.trips;

    const totalKm = stats.alberto.km + stats.arthur.km;
    const totalTrips = stats.alberto.trips + stats.arthur.trips;
    document.getElementById("total-km-combined").textContent = `${totalKm.toLocaleString("pt-BR")} km`;
    document.getElementById("total-trips-combined").textContent = totalTrips;
    document.getElementById("last-trip-date").textContent = lastDate
        ? formatDate(lastDate)
        : "—";
}

function renderHistory() {
    const tbody = document.getElementById("history-tbody");
    const emptyState = document.getElementById("empty-state");

    // Filtrar
    let filtered = [...trips];
    if (activeFilter !== "all") {
        filtered = filtered.filter((t) => t.travelerId === activeFilter);
    }

    // Ordenar por data (mais recente primeiro)
    filtered.sort((a, b) => b.date.localeCompare(a.date));

    if (filtered.length === 0) {
        tbody.innerHTML = "";
        emptyState.style.display = "block";
        return;
    }

    emptyState.style.display = "none";

    // Calcular acumulado progressivo (cronológico)
    const chronological = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
    const accumulatedMap = {};
    const runningTotals = {};

    chronological.forEach((t) => {
        if (!runningTotals[t.travelerId]) runningTotals[t.travelerId] = 0;
        runningTotals[t.travelerId] += t.distanceTotal;
        accumulatedMap[t.id] = runningTotals[t.travelerId];
    });

    // Renderizar (ordem mais recente primeiro)
    tbody.innerHTML = filtered
        .map((t) => {
            const user = USERS[t.travelerId];
            return `
            <tr>
                <td>${formatDate(t.date)}</td>
                <td><span class="traveler-tag ${t.travelerId}">${user.name}</span></td>
                <td>${t.origin}</td>
                <td>${t.destination}</td>
                <td class="km-highlight">${t.distanceTotal.toLocaleString("pt-BR")} km</td>
                <td>${accumulatedMap[t.id].toLocaleString("pt-BR")} km</td>
                <td><button class="btn-delete" onclick="confirmDelete('${t.id}')">Excluir</button></td>
            </tr>`;
        })
        .join("");
}

// ===== EXCLUSÃO =====
function confirmDelete(tripId) {
    deleteTarget = tripId;
    document.getElementById("delete-modal").classList.add("show");
}

document.getElementById("modal-cancel").addEventListener("click", () => {
    document.getElementById("delete-modal").classList.remove("show");
    deleteTarget = null;
});

document.getElementById("modal-confirm").addEventListener("click", () => {
    if (deleteTarget) {
        trips = trips.filter((t) => t.id !== deleteTarget);
        saveTrips();
        renderAll();
        showToast("Viagem excluída.");
    }
    document.getElementById("delete-modal").classList.remove("show");
    deleteTarget = null;
});

// ===== FILTROS =====
function setupHistory() {
    document.querySelectorAll(".filter-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            activeFilter = btn.dataset.filter;
            renderHistory();
        });
    });

    document.getElementById("btn-export").addEventListener("click", exportCSV);
}

// ===== EXPORT CSV =====
function exportCSV() {
    if (trips.length === 0) {
        showToast("Nenhuma viagem para exportar.", true);
        return;
    }

    const sorted = [...trips].sort((a, b) => a.date.localeCompare(b.date));
    const headers = "Data,Viajante,Origem,Destino,Distância (km),Acumulado (km)\n";
    const runningTotals = {};

    const rows = sorted.map((t) => {
        const user = USERS[t.travelerId];
        if (!runningTotals[t.travelerId]) runningTotals[t.travelerId] = 0;
        runningTotals[t.travelerId] += t.distanceTotal;
        return `${formatDate(t.date)},${user.name},${t.origin},${t.destination},${t.distanceTotal},${runningTotals[t.travelerId]}`;
    });

    const csv = "\uFEFF" + headers + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zenite_km_relatorio_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Relatório CSV exportado!");
}

// ===== UTILITÁRIOS =====
function formatDate(dateStr) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
}

function showToast(message, isError = false) {
    const toast = document.getElementById("toast");
    const msgEl = document.getElementById("toast-message");
    msgEl.textContent = message;
    if (isError) {
        toast.style.background = "linear-gradient(135deg, #5a1a1a, #3d0d0d)";
        toast.style.borderColor = "rgba(255,100,100,0.3)";
        toast.style.color = "#e8a0a0";
    } else {
        toast.style.background = "";
        toast.style.borderColor = "";
        toast.style.color = "";
    }
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}

function animateCounter(userId) {
    const el = document.getElementById(`km-${userId}`);
    el.style.transform = "scale(1.15)";
    el.style.filter = "brightness(1.5)";
    setTimeout(() => {
        el.style.transform = "";
        el.style.filter = "";
    }, 400);
}
