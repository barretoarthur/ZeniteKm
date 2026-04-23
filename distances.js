/**
 * distances.js — Sistema de distâncias com API do IBGE
 * Busca TODOS os municípios do Brasil via API e calcula distâncias
 * usando Haversine + fator rodoviário.
 *
 * Fontes: API IBGE (municípios), coordenadas via API IBGE localidades
 */

// ===== BANCO LOCAL (cidades com coordenadas conhecidas) =====
// Usado como fallback e para as cidades-base dos viajantes
const LOCAL_CITIES = [
    // SERGIPE (todas)
    { name: "Aracaju", state: "SE", lat: -10.9091, lon: -37.0677 },
    { name: "Itabaiana", state: "SE", lat: -10.6851, lon: -37.4258 },
    { name: "Canindé de São Francisco", state: "SE", lat: -9.6318, lon: -37.7893 },
    { name: "Lagarto", state: "SE", lat: -10.9167, lon: -37.6500 },
    { name: "Estância", state: "SE", lat: -11.2682, lon: -37.4382 },
    { name: "Nossa Senhora do Socorro", state: "SE", lat: -10.8553, lon: -37.1264 },
    { name: "São Cristóvão", state: "SE", lat: -11.0086, lon: -37.2065 },
    { name: "Simão Dias", state: "SE", lat: -10.7389, lon: -37.8083 },
    { name: "Tobias Barreto", state: "SE", lat: -11.1833, lon: -37.9989 },
    { name: "Propriá", state: "SE", lat: -10.2133, lon: -36.8422 },
    { name: "Capela", state: "SE", lat: -10.5047, lon: -37.0536 },
    { name: "Neópolis", state: "SE", lat: -10.3197, lon: -36.5783 },
    { name: "Carmópolis", state: "SE", lat: -10.6489, lon: -36.9872 },
    { name: "Boquim", state: "SE", lat: -11.1483, lon: -37.6208 },
    { name: "Poço Redondo", state: "SE", lat: -9.8064, lon: -37.6861 },
    { name: "Gararu", state: "SE", lat: -9.9681, lon: -37.0853 },
    { name: "Itabaianinha", state: "SE", lat: -11.2739, lon: -37.7900 },
    { name: "Nossa Senhora da Glória", state: "SE", lat: -10.2175, lon: -37.4214 },
    { name: "Umbaúba", state: "SE", lat: -11.3833, lon: -37.6600 },
    { name: "Maruim", state: "SE", lat: -10.7358, lon: -37.0842 },
    { name: "Laranjeiras", state: "SE", lat: -10.8064, lon: -37.1697 },
    { name: "Ribeirópolis", state: "SE", lat: -10.5364, lon: -37.4400 },
    { name: "Frei Paulo", state: "SE", lat: -10.5519, lon: -37.5322 },
    { name: "Carira", state: "SE", lat: -10.3569, lon: -37.7019 },
    { name: "Indiaroba", state: "SE", lat: -11.5194, lon: -37.5117 },
    { name: "Japaratuba", state: "SE", lat: -10.5936, lon: -36.9417 },
    { name: "Campo do Brito", state: "SE", lat: -10.7331, lon: -37.4933 },
    { name: "Poço Verde", state: "SE", lat: -10.7167, lon: -38.1833 },
    { name: "Monte Alegre de Sergipe", state: "SE", lat: -10.0264, lon: -37.5636 },
    { name: "Porto da Folha", state: "SE", lat: -9.9178, lon: -37.2783 },
    { name: "Aquidabã", state: "SE", lat: -10.2786, lon: -37.0153 },
    { name: "Areia Branca", state: "SE", lat: -10.7581, lon: -37.3133 },
    { name: "Salgado", state: "SE", lat: -11.0297, lon: -37.4742 },
    { name: "Riachão do Dantas", state: "SE", lat: -11.0689, lon: -37.7317 },
    { name: "Nossa Senhora das Dores", state: "SE", lat: -10.4900, lon: -37.1953 },
    { name: "Itaporanga d'Ajuda", state: "SE", lat: -11.1128, lon: -37.3106 },
    { name: "Cristinápolis", state: "SE", lat: -11.4683, lon: -37.7567 },
    { name: "Japoatã", state: "SE", lat: -10.3472, lon: -36.8014 },
    { name: "Pedrinhas", state: "SE", lat: -11.1919, lon: -37.6764 },
    { name: "Arauá", state: "SE", lat: -11.2614, lon: -37.6217 },

    // CAPITAIS DE TODOS OS ESTADOS
    { name: "Maceió", state: "AL", lat: -9.6658, lon: -35.7353 },
    { name: "Salvador", state: "BA", lat: -12.9714, lon: -38.5124 },
    { name: "Recife", state: "PE", lat: -8.0476, lon: -34.8770 },
    { name: "João Pessoa", state: "PB", lat: -7.1195, lon: -34.8450 },
    { name: "Natal", state: "RN", lat: -5.7945, lon: -35.2110 },
    { name: "Fortaleza", state: "CE", lat: -3.7172, lon: -38.5433 },
    { name: "Teresina", state: "PI", lat: -5.0892, lon: -42.8019 },
    { name: "São Luís", state: "MA", lat: -2.5297, lon: -44.2825 },
    { name: "Brasília", state: "DF", lat: -15.7975, lon: -47.8919 },
    { name: "São Paulo", state: "SP", lat: -23.5505, lon: -46.6333 },
    { name: "Rio de Janeiro", state: "RJ", lat: -22.9068, lon: -43.1729 },
    { name: "Belo Horizonte", state: "MG", lat: -19.9167, lon: -43.9345 },
    { name: "Curitiba", state: "PR", lat: -25.4284, lon: -49.2733 },
    { name: "Goiânia", state: "GO", lat: -16.6869, lon: -49.2648 },
    { name: "Palmas", state: "TO", lat: -10.1689, lon: -48.3317 },
    { name: "Vitória", state: "ES", lat: -20.3155, lon: -40.3128 },
    { name: "Florianópolis", state: "SC", lat: -27.5954, lon: -48.5480 },
    { name: "Porto Alegre", state: "RS", lat: -30.0346, lon: -51.2177 },
    { name: "Campo Grande", state: "MS", lat: -20.4697, lon: -54.6201 },
    { name: "Cuiabá", state: "MT", lat: -15.6014, lon: -56.0979 },
    { name: "Manaus", state: "AM", lat: -3.1190, lon: -60.0217 },
    { name: "Belém", state: "PA", lat: -1.4558, lon: -48.5024 },
    { name: "Porto Velho", state: "RO", lat: -8.7612, lon: -63.9004 },
    { name: "Rio Branco", state: "AC", lat: -9.9754, lon: -67.8249 },
    { name: "Macapá", state: "AP", lat: 0.0349, lon: -51.0694 },
    { name: "Boa Vista", state: "RR", lat: 2.8195, lon: -60.6714 },

    // CIDADES IMPORTANTES / VIZINHOS
    { name: "Arapiraca", state: "AL", lat: -9.7525, lon: -36.6614 },
    { name: "Penedo", state: "AL", lat: -10.2903, lon: -36.5856 },
    { name: "Delmiro Gouveia", state: "AL", lat: -9.3856, lon: -37.9972 },
    { name: "Paulo Afonso", state: "BA", lat: -9.4006, lon: -38.2147 },
    { name: "Feira de Santana", state: "BA", lat: -12.2669, lon: -38.9666 },
    { name: "Vitória da Conquista", state: "BA", lat: -14.8619, lon: -40.8444 },
    { name: "Ilhéus", state: "BA", lat: -14.7939, lon: -39.0394 },
    { name: "Itabuna", state: "BA", lat: -14.7856, lon: -39.2803 },
    { name: "Caruaru", state: "PE", lat: -8.2823, lon: -35.9761 },
    { name: "Petrolina", state: "PE", lat: -9.3891, lon: -40.5031 },
    { name: "Campina Grande", state: "PB", lat: -7.2290, lon: -35.8801 },
    { name: "Mossoró", state: "RN", lat: -5.1878, lon: -37.3444 },
    { name: "Juazeiro do Norte", state: "CE", lat: -7.2131, lon: -39.3150 },
    { name: "Sobral", state: "CE", lat: -3.6861, lon: -40.3481 },
    { name: "Imperatriz", state: "MA", lat: -5.5195, lon: -47.4919 },
    { name: "Juazeiro", state: "BA", lat: -9.4131, lon: -40.5033 },
    { name: "Barreiras", state: "BA", lat: -12.1528, lon: -44.9961 },
    { name: "Ribeirão Preto", state: "SP", lat: -21.1704, lon: -47.8103 },
    { name: "Campinas", state: "SP", lat: -22.9099, lon: -47.0626 },
    { name: "Santos", state: "SP", lat: -23.9608, lon: -46.3336 },
    { name: "Guarulhos", state: "SP", lat: -23.4538, lon: -46.5333 },
    { name: "Uberlândia", state: "MG", lat: -18.9186, lon: -48.2772 },
    { name: "Juiz de Fora", state: "MG", lat: -21.7642, lon: -43.3503 },
    { name: "Montes Claros", state: "MG", lat: -16.7350, lon: -43.8617 },
    { name: "Londrina", state: "PR", lat: -23.3045, lon: -51.1696 },
    { name: "Maringá", state: "PR", lat: -23.4205, lon: -51.9333 },
    { name: "Joinville", state: "SC", lat: -26.3045, lon: -48.8487 },
    { name: "Caxias do Sul", state: "RS", lat: -29.1681, lon: -51.1794 },
    { name: "Niterói", state: "RJ", lat: -22.8833, lon: -43.1036 },
    { name: "Petrópolis", state: "RJ", lat: -22.5049, lon: -43.1822 },
    { name: "Aparecida de Goiânia", state: "GO", lat: -16.8198, lon: -49.2469 },
    { name: "Anápolis", state: "GO", lat: -16.3281, lon: -48.9530 },
    { name: "Rondonópolis", state: "MT", lat: -16.4673, lon: -54.6372 },
    { name: "Santarém", state: "PA", lat: -2.4386, lon: -54.7081 },
    { name: "Marabá", state: "PA", lat: -5.3686, lon: -49.1178 },
];

// ===== CACHE de cidades do IBGE =====
let ibgeCitiesCache = null;
let ibgeLoading = false;
let ibgeLoadPromise = null;

/**
 * Carrega TODOS os municípios do Brasil via API IBGE
 * Retorna array de { name, state, lat, lon }
 */
async function loadIBGECities() {
    if (ibgeCitiesCache) return ibgeCitiesCache;
    if (ibgeLoadPromise) return ibgeLoadPromise;

    ibgeLoading = true;
    ibgeLoadPromise = (async () => {
        try {
            const response = await fetch(
                "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado"
            );
            if (!response.ok) throw new Error("Falha na API do IBGE");

            const data = await response.json();

            // Mapeia UF-id para sigla
            const cities = data.map((m) => ({
                name: m["municipio-nome"],
                state: m["UF-sigla"],
                // IBGE não retorna coordenadas nesta API, então vamos
                // verificar se já temos no banco local
                lat: null,
                lon: null,
                ibgeId: m["municipio-id"],
            }));

            // Merge com coordenadas do banco local
            const localMap = new Map();
            LOCAL_CITIES.forEach((c) => {
                const key = normalizeStr(c.name) + "_" + c.state;
                localMap.set(key, c);
            });

            cities.forEach((c) => {
                const key = normalizeStr(c.name) + "_" + c.state;
                const local = localMap.get(key);
                if (local) {
                    c.lat = local.lat;
                    c.lon = local.lon;
                }
            });

            ibgeCitiesCache = cities;
            ibgeLoading = false;
            return cities;
        } catch (err) {
            console.warn("Erro ao carregar IBGE, usando banco local:", err);
            ibgeLoading = false;
            ibgeCitiesCache = LOCAL_CITIES.map((c) => ({ ...c, ibgeId: null }));
            return ibgeCitiesCache;
        }
    })();

    return ibgeLoadPromise;
}

// Inicia o carregamento ao carregar a página
loadIBGECities();

/**
 * Remove acentos e converte para minúsculo para comparação
 */
function normalizeStr(str) {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Calcula distância entre dois pontos via fórmula de Haversine
 * @returns distância em km (linha reta)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Busca coordenadas de uma cidade via Nominatim (OpenStreetMap)
 * Usado como fallback quando o banco local não tem coordenadas
 */
async function geocodeCity(cityName, state) {
    try {
        const query = encodeURIComponent(`${cityName}, ${state}, Brasil`);
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=br`,
            { headers: { "User-Agent": "ZeniteKMTracker/1.0" } }
        );
        if (!response.ok) return null;
        const data = await response.json();
        if (data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Calcula distância rodoviária estimada (ida) entre duas cidades
 * Aplica fator rodoviário de 1.3x sobre a distância em linha reta
 * @returns {number|null} distância em km (arredondada) ou null se não encontrada
 */
function getRoadDistance(originName, destName) {
    const origin = LOCAL_CITIES.find(
        (c) => normalizeStr(c.name) === normalizeStr(originName)
    );
    const dest = LOCAL_CITIES.find(
        (c) => normalizeStr(c.name) === normalizeStr(destName)
    );
    if (!origin || !dest) return null;
    if (!origin.lat || !dest.lat) return null;

    const straight = haversineDistance(origin.lat, origin.lon, dest.lat, dest.lon);
    const ROAD_FACTOR = 1.3;
    return Math.round(straight * ROAD_FACTOR);
}

/**
 * Versão assíncrona de getRoadDistance que tenta geocodificar cidades desconhecidas
 * @returns {Promise<number|null>}
 */
async function getRoadDistanceAsync(originName, destName) {
    // Primeiro tenta no banco local
    let origin = LOCAL_CITIES.find(
        (c) => normalizeStr(c.name) === normalizeStr(originName)
    );
    let dest = LOCAL_CITIES.find(
        (c) => normalizeStr(c.name) === normalizeStr(destName)
    );

    // Se não encontrou destino, tenta geocodificar
    if (!dest || !dest.lat) {
        // Busca na lista IBGE para pegar o estado
        const allCities = ibgeCitiesCache || LOCAL_CITIES;
        const ibgeCity = allCities.find(
            (c) => normalizeStr(c.name) === normalizeStr(destName)
        );
        const state = ibgeCity ? ibgeCity.state : "";

        const coords = await geocodeCity(destName, state);
        if (coords) {
            const newCity = {
                name: destName,
                state: state,
                lat: coords.lat,
                lon: coords.lon,
            };
            LOCAL_CITIES.push(newCity);
            dest = newCity;
        }
    }

    if (!origin || !dest || !origin.lat || !dest.lat) return null;

    const straight = haversineDistance(origin.lat, origin.lon, dest.lat, dest.lon);
    const ROAD_FACTOR = 1.3;
    return Math.round(straight * ROAD_FACTOR);
}

/**
 * Busca cidades que contêm o termo digitado
 * Prioriza cidades de Sergipe, depois o resto do Brasil
 * @returns {Array} lista de cidades correspondentes (max 12)
 */
function searchCities(query) {
    if (!query || query.length < 2) return [];
    const q = normalizeStr(query);

    // Usa cache IBGE se disponível, senão usa local
    const database = ibgeCitiesCache || LOCAL_CITIES;

    const matches = database.filter((c) => {
        const name = normalizeStr(c.name);
        return name.includes(q);
    });

    // Prioriza: começa com o texto > Sergipe > outros
    matches.sort((a, b) => {
        const aName = normalizeStr(a.name);
        const bName = normalizeStr(b.name);
        const aStartsWith = aName.startsWith(q) ? 0 : 1;
        const bStartsWith = bName.startsWith(q) ? 0 : 1;
        if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;

        const aSE = a.state === "SE" ? 0 : 1;
        const bSE = b.state === "SE" ? 0 : 1;
        if (aSE !== bSE) return aSE - bSE;

        return aName.localeCompare(bName);
    });

    // Remove duplicatas (mesmo nome + estado)
    const seen = new Set();
    const unique = [];
    for (const c of matches) {
        const key = normalizeStr(c.name) + "_" + c.state;
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(c);
        }
        if (unique.length >= 12) break;
    }

    return unique;
}
