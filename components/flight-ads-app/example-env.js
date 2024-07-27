// OpenWeather API Key: https://openweathermap.org/full-price#current
export const OPENWEATHERMAP_API_KEY = "";

export const HDB_AUTH_TOKEN = "SERCX0FETUlOOnBhc3N3b3Jk"; // this is the base64 encoded HarperDB username:password credentials shown in docker-compose.yml

// Amadeus API keys: https://developers.amadeus.com/get-started/get-started-with-self-service-apis-335
export const AMADEUS_API_KEY = "";
export const AMADEUS_API_SECRET = "";
export const AMADEUS_BASE_URL = "test.api.amadeus.com/v2";

export const CITIES_LIMIT = 1000;

// TOTAL_DESIRED_CITY_PAIRS
// To limit our interaction with the Flights API,
// This determines how many city matches we limit our flight search to
// For example, up to 10 city matches-- Origin (cloudy) to Destination (sunny), for which to query flight price data.
export const TOTAL_DESIRED_CITY_PAIRS = 10;

// CHUNK_OF_CITIES_WEATHERLOOKUP
// To limit our interaction with the Weather API,
// This chunks up the list of cities which we do lookups for... into chunks of 20
// This will help limit API usage-- This way we only look up weather for up to 20 cities, then determine if we have enough matches.
// If not, we lookup another chunk of cities.
export const CHUNK_OF_CITIES_WEATHERLOOKUP = 20;

// This is the amount of time we want to try to set as a dely between requests for weather data.
// The Free tier of the weather API has a limit of 1 request per minute (1000ms).
// Yet, it seems we may be able to make more than that? This allows for only a 100ms pause for example.
export const WEATHERAPI_REQUEST_INTERVAL_MS = 100;

// weather code IDs (src: https://openweathermap.org/weather-conditions )
// SUNNY_WEATHER_CODES represent the weather codes for sunny & partly sunny weather
export const SUNNY_WEATHER_CODES = [800, 801, 802, 803];
