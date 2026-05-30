// Variáveis globais
let map;
let marker;
let filterLayers = {}; // Objeto para armazenar as camadas de filtro (polígonos/círculos)

// Coordenadas de Maringá, PR
const MARINGA_COORDS = { lat: -23.4205, lng: -51.9333 };

// Dados geográficos fictícios para as zonas de Maringá
// Estes são exemplos e podem ser ajustados para melhor representação
const FAKE_ZONE_DATA = {
    densidade: [
        // Zona de alta densidade (centro)
        L.polygon([
            [-23.420, -51.935],
            [-23.420, -51.930],
            [-23.425, -51.930],
            [-23.425, -51.935]
        ], { color: 'red', fillColor: 'red', fillOpacity: 0.4, weight: 1 }),
        // Zona de média densidade
        L.circle([-23.415, -51.925], { radius: 2000, color: 'orange', fillColor: 'orange', fillOpacity: 0.3, weight: 1 })
    ],
    infraestrutura: [
        // Zona com boa infraestrutura
        L.polygon([
            [-23.410, -51.940],
            [-23.410, -51.930],
            [-23.430, -51.930],
            [-23.430, -51.940]
        ], { color: 'purple', fillColor: 'purple', fillOpacity: 0.3, weight: 1 }),
        // Ponto de infraestrutura específica
        L.circle([-23.428, -51.938], { radius: 800, color: 'darkblue', fillColor: 'darkblue', fillOpacity: 0.4, weight: 1 })
    ],
    poluicao: [
        // Zona com alta poluição (exemplo)
        L.circle([-23.420, -51.910], { radius: 3000, color: 'darkred', fillColor: 'darkred', fillOpacity: 0.5, weight: 1 }),
        // Zona com média poluição
        L.polygon([
            [-23.400, -51.920],
            [-23.400, -51.915],
            [-23.405, -51.915],
            [-23.405, -51.920]
        ], { color: 'brown', fillColor: 'brown', fillOpacity: 0.4, weight: 1 })
    ],
    saude: [
        // Zona com bom acesso à saúde
        L.polygon([
            [-23.430, -51.920],
            [-23.430, -51.910],
            [-23.440, -51.910],
            [-23.440, -51.920]
        ], { color: 'blue', fillColor: 'blue', fillOpacity: 0.3, weight: 1 }),
        // Ponto de unidade de saúde
        L.circle([-23.418, -51.930], { radius: 1000, color: 'lightblue', fillColor: 'lightblue', fillOpacity: 0.4, weight: 1 })
    ],
    cobertura: [
        // Zona com alta cobertura vegetal (parque)
        L.polygon([
            [-23.430, -51.950],
            [-23.430, -51.940],
            [-23.440, -51.940],
            [-23.440, -51.950]
        ], { color: 'green', fillColor: 'green', fillOpacity: 0.4, weight: 1 }),
        // Zona com média cobertura
        L.circle([-23.400, -51.940], { radius: 2500, color: 'lightgreen', fillColor: 'lightgreen', fillOpacity: 0.3, weight: 1 })
    ],
    risco: [
        // Zona de risco climático (exemplo de enchente)
        L.polygon([
            [-23.420, -51.900],
            [-23.420, -51.890],
            [-23.430, -51.890],
            [-23.430, -51.900]
        ], { color: 'darkorange', fillColor: 'darkorange', fillOpacity: 0.5, weight: 1 }),
        // Outra zona de risco
        L.circle([-23.405, -51.905], { radius: 1500, color: 'red', fillColor: 'red', fillOpacity: 0.4, weight: 1 })
    ]
};

// Inicialização
document.addEventListener("DOMContentLoaded", function() {
    initializeMap();
    initializeEventListeners();
    setupFilterListeners();
});

// Inicializar mapa Leaflet
function initializeMap() {
    const mapElement = document.getElementById("map");
    
    // Inicializar o mapa
    map = L.map(mapElement).setView([MARINGA_COORDS.lat, MARINGA_COORDS.lng], 13);

    // Adicionar camada de tiles do OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"
    }).addTo(map);

    // Adicionar marcador central de Maringá
    marker = L.marker([MARINGA_COORDS.lat, MARINGA_COORDS.lng]).addTo(map)
        .bindPopup("<b>Maringá - Paraná</b><br>Zona 7 - Centro<br>Vulnerabilidade: Média<br>População: 430,000 hab.")
        .openPopup();

    // Adicionar círculo de área de vulnerabilidade (simulado)
    L.circle([MARINGA_COORDS.lat, MARINGA_COORDS.lng], {
        color: "#F5A623",
        fillColor: "#F5A623",
        fillOpacity: 0.15,
        radius: 5000 // 5km
    }).addTo(map);

    showNotification("Mapa de Maringá carregado com sucesso!", "success");
    addDataLayers();
}

// Event Listeners
function initializeEventListeners() {
    // Botão de download
    const downloadBtn = document.querySelector(".btn-download");
    downloadBtn.addEventListener("click", downloadReport);
}

// Configurar listeners dos filtros
function setupFilterListeners() {
    const filters = document.querySelectorAll(".filter-item input[type=\"checkbox\"]");
    
    filters.forEach(filter => {
        filter.addEventListener("change", function() {
            updateMapLayers(this.id, this.checked);
            showNotification(`Filtro "${getFilterName(this.id)}" ${this.checked ? 'ativado' : 'desativado'}`);
        });
    });
}

// Obter nome do filtro
function getFilterName(filterId) {
    const names = {
        'densidade': 'Densidade Populacional',
        'infraestrutura': 'Infraestrutura Urbana',
        'poluicao': 'Poluição do Ar',
        'saude': 'Acesso à Saúde',
        'cobertura': 'Cobertura Vegetal',
        'risco': 'Risco Climático'
    };
    return names[filterId] || filterId;
}

// Adicionar camadas de dados (inicialmente)
function addDataLayers() {
    const activeFilters = getActiveFilters();
    activeFilters.forEach(filterId => {
        addFilterZone(filterId);
    });
}

// Obter filtros ativos
function getActiveFilters() {
    const filters = document.querySelectorAll(".filter-item input[type=\"checkbox\"]:checked");
    return Array.from(filters).map(f => f.id);
}

// Atualizar camadas do mapa (adicionar/remover zonas)
function updateMapLayers(filterId, isActive) {
    if (!map) return;
    
    console.log(`Camada ${filterId} ${isActive ? 'ativada' : 'desativada'}`);
    
    if (isActive) {
        addFilterZone(filterId);
    } else {
        removeFilterZone(filterId);
    }
}

// Adicionar zona de filtro
function addFilterZone(filterId) {
    if (FAKE_ZONE_DATA[filterId]) {
        filterLayers[filterId] = L.layerGroup(FAKE_ZONE_DATA[filterId]).addTo(map);
    }
}

// Remover zona de filtro
function removeFilterZone(filterId) {
    if (filterLayers[filterId]) {
        map.removeLayer(filterLayers[filterId]);
        delete filterLayers[filterId];
    }
}

// Download do relatório
function downloadReport() {
    showNotification("Preparando relatório para download...", "info");
    
    // Simular geração de relatório
    setTimeout(() => {
        const reportContent = generateReportContent();
        const blob = new Blob([reportContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = "relatorio-vulnerabilidade-maringa.html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification("Relatório baixado com sucesso!", "success");
    }, 1000);
}

function generateReportContent() {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Vulnerabilidade - Maringá</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
        }
        h1 { color: #1E3A5F; }
        h2 { color: #2C5282; margin-top: 30px; }
        .stat { 
            background: #F3F4F6; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 5px;
        }
        .highlight {
            background: #FEF3C7;
            padding: 15px;
            border-left: 4px solid #F5A623;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>Relatório de Vulnerabilidade Urbana</h1>
    <h2>Maringá - Paraná</h2>
    
    <div class="stat">
        <strong>Índice de Vulnerabilidade:</strong> MÉDIO (50%)
    </div>
    
    <div class="stat">
        <strong>Região:</strong> Zona 7 - Centro
    </div>
    
    <h2>Dados Demográficos</h2>
    <div class="stat">
        <strong>População Estimada:</strong> 430,000 habitantes<br>
        <strong>Densidade:</strong> 733 hab/km²
    </div>
    
    <h2>Indicadores Ambientais</h2>
    <div class="stat">
        <strong>Cobertura Vegetal:</strong> Alta (48%)<br>
        <strong>Qualidade do Ar (PM2.5):</strong> Moderada
    </div>
    
    <h2>Infraestrutura e Serviços</h2>
    <div class="stat">
        <strong>Infraestrutura:</strong> Boa<br>
        <strong>Acesso à Saúde:</strong> Bom
    </div>
    
    <div class="highlight">
        <h3>Destaques de Maringá:</h3>
        <ul>
            <li>"Cidade Verde" - Alta cobertura arbórea</li>
            <li>Planejamento urbano modelo</li>
            <li>Monitoramento ambiental contínuo</li>
        </ul>
    </div>
    
    <h2>Fontes de Dados</h2>
    <p>NASA, GHSL, WorldPop, Copernicus, WRI</p>
    
    <p style="margin-top: 40px; color: #6B7280; font-size: 14px;">
        Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
    </p>
</body>
</html>
    `;
}

// Sistema de notificações
function showNotification(message, type = 'info') {
    // Remover notificação existente
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Estilos
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: '10000',
        fontWeight: '600',
        fontSize: '14px',
        maxWidth: '400px',
        animation: 'slideIn 0.3s ease-out'
    });
    
    // Cores baseadas no tipo
    const colors = {
        'info': { bg: '#EFF6FF', color: '#1E40AF', border: '#3B82F6' },
        'success': { bg: '#D1FAE5', color: '#065F46', border: '#10B981' },
        'error': { bg: '#FEE2E2', color: '#991B1B', border: '#EF4444' }
    };
    
    const colorScheme = colors[type] || colors.info;
    notification.style.backgroundColor = colorScheme.bg;
    notification.style.color = colorScheme.color;
    notification.style.borderLeft = `4px solid ${colorScheme.border}`;
    
    // Adicionar ao DOM
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Adicionar animações CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);




// Função para carregar os bairros no select
function loadNeighborhoods() {
    const neighborhoodSelect = document.getElementById("neighborhood");
    if (!neighborhoodSelect) return; // Apenas executa se o elemento existir

    const neighborhoods = [
        "Aclimação", "Alamar", "Alvorada", "Andrade", "Bertioga", "Borba Gato", "Campos Elíseos",
        "Cidade Alta", "Cidade Monções", "Colina Verde", "Dias", "Grevíleas", "Guaporé",
        "Hermann Moraes de Barros", "Hortência", "Iguaçu", "Imperial", "Indaiá", "Ipanema",
        "Itaipu", "Jardim América", "Jardim Atami", "Jardim Diamante", "Jardim Industrial",
        "Jardim Itália", "Jardim Oriental", "Jardim Paulista", "Jardim Universo", "Laranjeiras",
        "Liberdade", "Mandacaru", "Miosótis", "Monte Rei", "Moradias Atenas", "Ney Braga",
        "Novo Horizonte", "Oásis", "Olímpico", "Ouro Cola", "Paris", "Parque Avenida",
        "Parque Bandeirantes", "Parque do Horto", "Parque Industrial", "Pinheiros", "Portal das Torres",
        "Rebouças", "Recanto dos Magnatas", "Requião", "Santa Felicidade", "São Clemente",
        "São Silvestre", "Sumaré", "Tarumã", "Tuiuti", "Universitário", "Vila Nova",
        "Vila Rica", "Zona 01", "Zona 02", "Zona 03 - Vila Operária", "Zona 04", "Zona 05",
        "Zona 06", "Zona 07", "Zona 08 - Bairro Aeroporto", "Zona 09", "Zona 10", "Zona Rural"
    ];

    neighborhoods.forEach(neighborhood => {
        const option = document.createElement("option");
        option.value = neighborhood;
        option.textContent = neighborhood;
        neighborhoodSelect.appendChild(option);
    });
}

// Chamar a função de carregamento de bairros quando a página de contribuição for carregada
if (document.getElementById("contributionForm")) {
    loadNeighborhoods();
}

// Adicionar um listener para o formulário de contribuição (apenas para simulação)
const contributionForm = document.getElementById("contributionForm");
if (contributionForm) {
    contributionForm.addEventListener("submit", function(event) {
        event.preventDefault();
        showNotification("Obrigado pela sua sugestão! Ela foi enviada com sucesso.", "success");
        contributionForm.reset();
    });
}




// Função para gerenciar o estado ativo dos links de navegação
function setupNavigation() {
    const navLinks = document.querySelectorAll(".nav-link");
    const currentPath = window.location.pathname.split("/").pop();

    navLinks.forEach(link => {
        link.classList.remove("active");
        const linkPath = link.getAttribute("href");
        if (linkPath === currentPath || (currentPath === "" && linkPath === "index.html")) {
            link.classList.add("active");
        }
    });
}

// Chamar a função de configuração de navegação ao carregar a página
setupNavigation();