// OpenWeather API Key: https://openweathermap.org/full-price#current
export const OPENWEATHERMAP_API_KEY = "";
export const HDB_AUTH_TOKEN = "SERCX0FETUlOOnBhc3N3b3Jk"; // this is the base64 encoded HarperDB username:password credentials shown in docker-compose.yml

// Amadeus API keys: https://developers.amadeus.com/get-started/get-started-with-self-service-apis-335
export const AMADEUS_API_KEY = "";
export const AMADEUS_API_SECRET = "";
export const AMADEUS_BASE_URL = "test.api.amadeus.com/v2";

export const CITIES_LIMIT = 1000;

// LIMIT_OF_CITIES_WEATHERLOOKUP is the limit of the total cities we want weather for.
// For testing, 5 cities is good.  For a decent list of flights to rank for value, let's do 90 cities-- which yields 8010 total flights
export const LIMIT_OF_CITIES_WEATHERLOOKUP = 10;

// PER_SUNNY_CITY_MAX_QTY_LIMIT is the max amount of sunny cities we want in our match table.
// This way we don't match one city with the whole list of other cities--
// it ensures we move on to a new Sunny city after 3 Flights to it.
export const PER_SUNNY_CITY_MAX_QTY_LIMIT = 3;

// This is the amount of time we want to try to set as a dely between requests for weather data.
// The Free tier of the weather API has a limit of 1 request per minute (1000ms).
// Yet, it seems we may be able to make more than that? This allows for only a 100ms pause for example.
export const WEATHERAPI_REQUEST_INTERVAL_MS = 100;

// weather code IDs (src: https://openweathermap.org/weather-conditions )
// SUNNY_WEATHER_CODES represent the weather codes for sunny & partly sunny weather
export const SUNNY_WEATHER_CODES = [800, 801, 802, 803];
