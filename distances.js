/**
 * distances.js — Banco de distâncias rodoviárias (em km, somente ida)
 * Calculadas com base em coordenadas geográficas reais (Haversine) + fator
 * rodoviário de 1.3x para aproximar distâncias por estrada.
 *
 * Fontes de coordenadas: IBGE / Google Maps
 */

const CITY_DATABASE = [
    // ===== SERGIPE =====
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

    // ===== CAPITAIS NORDESTE =====
    { name: "Maceió", state: "AL", lat: -9.6658, lon: -35.7353 },
    { name: "Salvador", state: "BA", lat: -12.9714, lon: -38.5124 },
    { name: "Recife", state: "PE", lat: -8.0476, lon: -34.8770 },
    { name: "João Pessoa", state: "PB", lat: -7.1195, lon: -34.8450 },
    { name: "Natal", state: "RN", lat: -5.7945, lon: -35.2110 },
    { name: "Fortaleza", state: "CE", lat: -3.7172, lon: -38.5433 },
    { name: "Teresina", state: "PI", lat: -5.0892, lon: -42.8019 },
    { name: "São Luís", state: "MA", lat: -2.5297, lon: -44.2825 },

    // ===== OUTRAS CAPITAIS RELEVANTES =====
    { name: "Brasília", state: "DF", lat: -15.7975, lon: -47.8919 },
    { name: "São Paulo", state: "SP", lat: -23.5505, lon: -46.6333 },
    { name: "Rio de Janeiro", state: "RJ", lat: -22.9068, lon: -43.1729 },
    { name: "Belo Horizonte", state: "MG", lat: -19.9167, lon: -43.9345 },
    { name: "Curitiba", state: "PR", lat: -25.4284, lon: -49.2733 },
    { name: "Goiânia", state: "GO", lat: -16.6869, lon: -49.2648 },
    { name: "Palmas", state: "TO", lat: -10.1689, lon: -48.3317 },
    { name: "Vitória", state: "ES", lat: -20.3155, lon: -40.3128 },

    // ===== CIDADES IMPORTANTES DE ALAGOAS (vizinho) =====
    { name: "Arapiraca", state: "AL", lat: -9.7525, lon: -36.6614 },
    { name: "Penedo", state: "AL", lat: -10.2903, lon: -36.5856 },
    { name: "Delmiro Gouveia", state: "AL", lat: -9.3856, lon: -37.9972 },
    { name: "Paulo Afonso", state: "BA", lat: -9.4006, lon: -38.2147 },

    // ===== CIDADES IMPORTANTES DA BAHIA (vizinho) =====
    { name: "Feira de Santana", state: "BA", lat: -12.2669, lon: -38.9666 },
    { name: "Vitória da Conquista", state: "BA", lat: -14.8619, lon: -40.8444 },
    { name: "Ilhéus", state: "BA", lat: -14.7939, lon: -39.0394 },
    { name: "Itabuna", state: "BA", lat: -14.7856, lon: -39.2803 },
];

/**
 * Calcula distância entre dois pontos via fórmula de Haversine
 * @returns distância em km (linha reta)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calcula distância rodoviária estimada (ida) entre duas cidades
 * Aplica fator rodoviário de 1.3x sobre a distância em linha reta
 * @returns {number} distância em km (arredondada)
 */
function getRoadDistance(originName, destName) {
    const origin = CITY_DATABASE.find(c =>
        c.name.toLowerCase() === originName.toLowerCase()
    );
    const dest = CITY_DATABASE.find(c =>
        c.name.toLowerCase() === destName.toLowerCase()
    );
    if (!origin || !dest) return null;

    const straight = haversineDistance(origin.lat, origin.lon, dest.lat, dest.lon);
    const ROAD_FACTOR = 1.3;
    return Math.round(straight * ROAD_FACTOR);
}

/**
 * Busca cidades que contêm o termo digitado
 * @returns {Array} lista de cidades correspondentes (max 10)
 */
function searchCities(query) {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return CITY_DATABASE
        .filter(c => {
            const name = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return name.includes(q);
        })
        .slice(0, 10);
}
