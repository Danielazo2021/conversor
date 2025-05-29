const CONFIG = {
    API_BASE_URL: 'https://v6.exchangerate-api.com/v6',
    API_KEY: '44bf275d5ec2226959125276', // Esto deberá ser reemplazado con tu API key real
    UPDATE_INTERVAL: 3600000, // Actualizar tasas cada hora (en milisegundos)
    CACHE_DURATION: 3600, // Duración del caché en segundos
    AUTO_UPDATE_INTERVAL: 300000 // Actualizar tasas cada 5 minutos
};

// Lista de monedas disponibles con sus nombres
const AVAILABLE_CURRENCIES = {
    // América
    USD: "US Dollar",
    ARS: "Argentine Peso",
    BRL: "Brazilian Real",
    CLP: "Chilean Peso",
    COP: "Colombian Peso",
    MXN: "Mexican Peso",
    PEN: "Peruvian Sol",
    UYU: "Uruguayan Peso",
    CAD: "Canadian Dollar",

    // Europa
    EUR: "Euro",
    GBP: "British Pound",
    CHF: "Swiss Franc",
    NOK: "Norwegian Krone",
    SEK: "Swedish Krona",
    DKK: "Danish Krone",
    PLN: "Polish Zloty",
    CZK: "Czech Koruna",

    // Asia
    JPY: "Japanese Yen",
    CNY: "Chinese Yuan",
    KRW: "South Korean Won",
    INR: "Indian Rupee",
    SGD: "Singapore Dollar",
    HKD: "Hong Kong Dollar",
    THB: "Thai Baht",
    IDR: "Indonesian Rupiah",

    // Oceanía
    AUD: "Australian Dollar",
    NZD: "New Zealand Dollar",

    // África y Medio Oriente
    ZAR: "South African Rand",
    AED: "UAE Dirham",
    SAR: "Saudi Riyal",
    ILS: "Israeli Shekel",
    EGP: "Egyptian Pound",
    TRY: "Turkish Lira"
};

export { CONFIG, AVAILABLE_CURRENCIES }; 