import { CONFIG, AVAILABLE_CURRENCIES } from './config.js';

// Cache para almacenar las tasas de cambio
let ratesCache = {
    timestamp: 0,
    baseCurrency: '',
    rates: {}
};

// Variables para el historial y gráficos
let conversionHistory = [];
let chart = null;

// Función para actualizar el timestamp de última actualización
function actualizarTimestamp() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleTimeString();
}

// Función para filtrar monedas
function filtrarMonedas(searchText, selectElement) {
    const texto = searchText.toLowerCase();
    const options = selectElement.options;
    const selectedValue = selectElement.value;
    
    // Guardar la opción seleccionada
    let selectedOption = null;
    for (let i = 0; i < options.length; i++) {
        if (options[i].value === selectedValue) {
            selectedOption = options[i].cloneNode(true);
            break;
        }
    }

    // Limpiar opciones actuales
    selectElement.innerHTML = '';

    // Restaurar la opción seleccionada si existe
    if (selectedOption) {
        selectElement.add(selectedOption);
    }

    // Filtrar y añadir opciones que coincidan
    Object.entries(AVAILABLE_CURRENCIES).forEach(([code, name]) => {
        if (code.toLowerCase().includes(texto) || 
            name.toLowerCase().includes(texto)) {
            if (code !== selectedValue) {
                const option = new Option(`${code} (${name})`, code);
                selectElement.add(option);
            }
        }
    });
}

// Función para obtener las tasas de cambio de la API
async function fetchExchangeRates(baseCurrency) {
    try {
        // Mostrar loader mientras se obtienen las tasas
        document.getElementById('loader').style.display = 'flex';
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/${CONFIG.API_KEY}/latest/${baseCurrency}`);
        const data = await response.json();
        
        if (data.result === 'success') {
            ratesCache = {
                timestamp: Date.now(),
                baseCurrency: baseCurrency,
                rates: data.conversion_rates
            };
            actualizarTimestamp();
            return data.conversion_rates;
        } else {
            throw new Error('Error al obtener las tasas de cambio');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Hubo un error al obtener las tasas de cambio. Por favor, intente nuevamente.');
        return null;
    } finally {
        document.getElementById('loader').style.display = 'none';
    }
}

// Función para inicializar los tooltips
function initializeTooltips() {
    tippy('[data-tippy-content]', {
        placement: 'auto',
        arrow: true,
        theme: 'light-border',
        delay: [200, 0], // Retraso antes de mostrar/ocultar
        touch: ['hold', 500], // En móviles, mantener presionado para mostrar
    });
}

// Función para optimizar el rendimiento del gráfico
function optimizeChartRendering() {
    if (chart) {
        chart.options.animation = {
            duration: 600,
            easing: 'easeOutQuart',
        };
        chart.options.responsive = true;
        chart.options.maintainAspectRatio = false;
        chart.options.plugins.tooltip = {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#2c3e50',
            bodyColor: '#2c3e50',
            borderColor: '#e0e0e0',
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
                label: function(context) {
                    return `Tasa: ${context.parsed.y}`;
                }
            }
        };
        chart.options.scales.y.grid = {
            color: 'rgba(0, 0, 0, 0.1)',
            drawBorder: false
        };
        chart.options.scales.x.grid = {
            display: false
        };
    }
}

// Función para manejar errores de red
function handleNetworkError(error) {
    console.error('Error de red:', error);
    const message = error.message || 'Error de conexión';
    const resultadoTexto = document.getElementById('resultadoTexto');
    resultadoTexto.textContent = `Error: ${message}`;
    resultadoTexto.style.color = '#e74c3c';
    
    // Restaurar color después de 3 segundos
    setTimeout(() => {
        resultadoTexto.style.color = '#2c3e50';
    }, 3000);
}

// Función que realiza la conversión de moneda
async function convertirMoneda() {
    const cantidad = parseFloat(document.getElementById('cantidad').value);
    const monedaOrigen = document.getElementById('monedaOrigen').value;
    const monedaDestino = document.getElementById('monedaDestino').value;

    if (isNaN(cantidad) || cantidad <= 0) {
        alert("Por favor, ingresa una cantidad válida.");
        return;
    }

    document.getElementById('loader').style.display = 'flex';
    document.getElementById('resultadoTexto').textContent = 'Calculando...';

    try {
        // Verificar si necesitamos actualizar el caché
        const needsUpdate = Date.now() - ratesCache.timestamp > CONFIG.CACHE_DURATION * 1000 
            || ratesCache.baseCurrency !== monedaOrigen;
        
        let rates;
        if (needsUpdate) {
            rates = await fetchExchangeRates(monedaOrigen);
            if (!rates) throw new Error('No se pudieron obtener las tasas de cambio');
        } else {
            rates = ratesCache.rates;
        }

        const tasa = rates[monedaDestino];
        if (!tasa) throw new Error(`No se encontró tasa de cambio para ${monedaOrigen} a ${monedaDestino}`);

        const resultado = cantidad * tasa;
        const resultadoFormateado = new Intl.NumberFormat('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        }).format(resultado);
        
        document.getElementById('resultadoTexto').textContent = 
            `${cantidad.toFixed(2)} ${monedaOrigen} = ${resultadoFormateado} ${monedaDestino}`;
        
        saveToHistory(monedaOrigen, monedaDestino, cantidad, resultado);
        updateChart(monedaOrigen, monedaDestino);
        
    } catch (error) {
        handleNetworkError(error);
    } finally {
        document.getElementById('loader').style.display = 'none';
    }
}

// Función para intercambiar monedas
async function intercambiarMonedas() {
    const selectOrigen = document.getElementById('monedaOrigen');
    const selectDestino = document.getElementById('monedaDestino');
    const cantidad = document.getElementById('cantidad');
    
    // Guardar valores actuales
    const tempValue = selectOrigen.value;
    const tempCantidad = cantidad.value;
    
    try {
        // Intercambiar valores
        selectOrigen.value = selectDestino.value;
        selectDestino.value = tempValue;
        
        // Si hay un resultado previo, actualizar la cantidad
        const resultadoTexto = document.getElementById('resultadoTexto').textContent;
        if (resultadoTexto.includes('=')) {
            const valorConvertido = parseFloat(resultadoTexto.split('=')[1]);
            if (!isNaN(valorConvertido)) {
                cantidad.value = valorConvertido;
            }
        }
        
        // Actualizar banderas
        cambiarBanderas();
        
        // Forzar nueva obtención de tasas
        ratesCache.timestamp = 0;
        await convertirMoneda();
    } catch (error) {
        console.error('Error al intercambiar monedas:', error);
        // Restaurar valores originales en caso de error
        selectOrigen.value = tempValue;
        selectDestino.value = selectDestino.value;
        cantidad.value = tempCantidad;
        cambiarBanderas();
    }
}

// Función para inicializar los selectores de moneda
function inicializarSelectores() {
    const selectOrigen = document.getElementById('monedaOrigen');
    const selectDestino = document.getElementById('monedaDestino');
    
    // Limpiar opciones existentes
    selectOrigen.innerHTML = '';
    selectDestino.innerHTML = '';

    // Agregar nuevas opciones
    Object.entries(AVAILABLE_CURRENCIES).forEach(([code, name]) => {
        const optionOrigen = new Option(`${code} (${name})`, code);
        const optionDestino = new Option(`${code} (${name})`, code);
        
        selectOrigen.add(optionOrigen);
        selectDestino.add(optionDestino);
    });

    // Establecer valores por defecto
    selectOrigen.value = 'USD';
    selectDestino.value = 'EUR';
}

// Función para cambiar las banderas
function cambiarBanderas() {
    const monedaOrigen = document.getElementById('monedaOrigen').value;
    const monedaDestino = document.getElementById('monedaDestino').value;

    // Actualizar las banderas usando el servicio de banderas
    const flagOrigen = `https://flagcdn.com/w320/${monedaOrigen.toLowerCase().slice(0, 2)}.png`;
    const flagDestino = `https://flagcdn.com/w320/${monedaDestino.toLowerCase().slice(0, 2)}.png`;

    document.getElementById('flagOrigen').src = flagOrigen;
    document.getElementById('flagDestino').src = flagDestino;
    document.getElementById('flagDestinoFinal').src = flagDestino;
}

// Event Listeners
document.getElementById('monedaOrigen').addEventListener('change', async () => {
    cambiarBanderas();
    ratesCache.timestamp = 0;
    await convertirMoneda();
});

document.getElementById('monedaDestino').addEventListener('change', async () => {
    cambiarBanderas();
    await convertirMoneda();
});

document.getElementById('convertir').addEventListener('click', convertirMoneda);
document.getElementById('swapCurrencies').addEventListener('click', intercambiarMonedas);

// Eventos para la búsqueda de monedas
document.getElementById('buscarOrigen').addEventListener('input', (e) => {
    filtrarMonedas(e.target.value, document.getElementById('monedaOrigen'));
});

document.getElementById('buscarDestino').addEventListener('input', (e) => {
    filtrarMonedas(e.target.value, document.getElementById('monedaDestino'));
});

// Agregar evento para convertir cuando se presiona Enter
document.getElementById('cantidad').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        convertirMoneda();
    }
});

// Función para actualización automática
async function actualizacionAutomatica() {
    const monedaOrigen = document.getElementById('monedaOrigen').value;
    if (document.visibilityState === 'visible') {
        await fetchExchangeRates(monedaOrigen);
        await convertirMoneda();
    }
}

// Configurar actualización automática
setInterval(actualizacionAutomatica, CONFIG.AUTO_UPDATE_INTERVAL);

// Detectar cuando la página vuelve a estar visible
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
        await actualizacionAutomatica();
    }
});

// Inicialización
window.onload = async () => {
    inicializarSelectores();
    cambiarBanderas();
    initializeTooltips();
    
    const savedHistory = localStorage.getItem('conversionHistory');
    if (savedHistory) {
        conversionHistory = JSON.parse(savedHistory);
        updateHistoryDisplay();
    }
    
    initChart();
    optimizeChartRendering();
    
    document.getElementById('periodoTendencia').addEventListener('change', () => {
        const fromCurrency = document.getElementById('monedaOrigen').value;
        const toCurrency = document.getElementById('monedaDestino').value;
        updateChart(fromCurrency, toCurrency);
    });
    
    await convertirMoneda();
};

// Función para guardar una conversión en el historial
function saveToHistory(fromCurrency, toCurrency, amount, result) {
    const conversion = {
        timestamp: new Date(),
        from: fromCurrency,
        to: toCurrency,
        amount: amount,
        result: result
    };
    
    conversionHistory.unshift(conversion);
    if (conversionHistory.length > 10) {
        conversionHistory.pop();
    }
    
    updateHistoryDisplay();
    localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
}

// Función para actualizar la visualización del historial
function updateHistoryDisplay() {
    const historyList = document.getElementById('historialConversiones');
    historyList.innerHTML = '';
    
    conversionHistory.forEach(conversion => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const time = new Intl.DateTimeFormat('es', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(new Date(conversion.timestamp));
        
        item.innerHTML = `
            <div class="conversion-info">
                ${conversion.amount} ${conversion.from} = ${conversion.result} ${conversion.to}
                <div class="timestamp">${time}</div>
            </div>
        `;
        
        historyList.appendChild(item);
    });
}

// Función para inicializar el gráfico
function initChart() {
    const ctx = document.getElementById('tendenciaChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Tipo de Cambio',
                data: [],
                borderColor: '#3498db',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                }
            },
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });
}

// Función para actualizar el gráfico
async function updateChart(fromCurrency, toCurrency) {
    const period = document.getElementById('periodoTendencia').value;
    let days;
    
    switch(period) {
        case '24h':
            days = 1;
            break;
        case '7d':
            days = 7;
            break;
        case '30d':
            days = 30;
            break;
        default:
            days = 7;
    }
    
    try {
        // Obtener la tasa de cambio actual
        const currentRate = ratesCache.rates[toCurrency];
        if (!currentRate) {
            // Si no tenemos la tasa en caché, la obtenemos
            await fetchExchangeRates(fromCurrency);
        }
        
        // Generar datos basados en la tasa real
        const data = generateSampleData(days, ratesCache.rates[toCurrency]);
        
        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.rates;
        chart.data.datasets[0].label = `1 ${fromCurrency} = X ${toCurrency}`;
        chart.update();
    } catch (error) {
        console.error('Error al actualizar el gráfico:', error);
    }
}

// Función para generar datos de ejemplo para el gráfico
function generateSampleData(days, currentRate) {
    const labels = [];
    const rates = [];
    
    // Usar la tasa actual como base
    const baseRate = currentRate;
    // Calcular una variación máxima del 2% para que sea más realista
    const maxVariation = baseRate * 0.02;
    
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString());
        
        // Genera una variación más realista basada en la tasa actual
        const variation = (Math.random() - 0.5) * maxVariation;
        const rate = baseRate + variation;
        rates.push(rate.toFixed(4));
    }
    
    return { labels, rates };
}
