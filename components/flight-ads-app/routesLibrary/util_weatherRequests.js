import { testEmitter } from "../routes/index.js";

import {
  HDB_AUTH_TOKEN,
  OPENWEATHERMAP_API_KEY,
  CITIES_LIMIT,
  WEATHERAPI_REQUEST_INTERVAL_MS,
  CHUNK_OF_CITIES_WEATHERLOOKUP,
  TOTAL_DESIRED_CITY_PAIRS,
  SUNNY_WEATHER_CODES,
} from "../env.js";

const fetchCities = async () => {
  const citiesUrl = `http://localhost:9926/flight-ads-app/getCities?limit=${CITIES_LIMIT}`;
  const citiesRequestHeaders = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${HDB_AUTH_TOKEN}`,
    },
  };

  try {
    const response = await fetch(citiesUrl, citiesRequestHeaders);
    if (!response.ok) {
      throw new Error(`Failed to fetch cities data`);
    }
    return await response.json();
  } catch (error) {
    console.error("[fetchCities]: error", error);
    return [];
  }
};

const fetchWeatherDataByCity = async (city) => {
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${OPENWEATHERMAP_API_KEY}`;
  const beginTimeTracker_in_ms = Date.now();
  const beginTimeTracker_dt_stamp = new Date().toLocaleString();

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch weather data for city=${city}`);
    }
    const data = await response.json();
    const now = new Date();
    const fiveDaysFromNow = new Date(now.setDate(now.getDate() + 5));
    let closestForecast = null;
    let minDiff = Infinity;

    data.list.forEach((item) => {
      const forecastDate = new Date(item.dt * 1000);
      const diff = Math.abs(fiveDaysFromNow - forecastDate);
      if (diff < minDiff) {
        minDiff = diff;
        closestForecast = item;
      }
    });

    if (!closestForecast) return null;

    console.log(
      `${city} closestForecastTime: ${closestForecast.dt_txt} (reqTime: ${beginTimeTracker_dt_stamp} (${beginTimeTracker_in_ms} ms). WeatherCode ${closestForecast.weather[0].id}: ${closestForecast.weather[0].description}`
    );

    // try {
    //   testEmitter.emitEvent("eventToLog", {
    //     log: `${city} closestForecastTime: ${closestForecast.dt_txt} (reqTime: ${beginTimeTracker_dt_stamp} (${beginTimeTracker_in_ms} ms). WeatherCode ${closestForecast.weather[0].id}: ${closestForecast.weather[0].description}`,
    //   });
    // } catch (error) {
    //   console.log("[testEmitter-util_weatherRequests] error: ", error);
    // }

    /**
    closestForecast looks like this:
    {
      dt: 1722535200,
      main: {
        temp: 306.2,
        feels_like: 307.23,
        temp_min: 306.2,
        temp_max: 306.2,
        pressure: 1017,
        sea_level: 1017,
        grnd_level: 993,
        humidity: 41,
        temp_kf: 0
      },
      weather: [
        {
          id: 802,
          main: 'Clouds',
          description: 'scattered clouds',
          icon: '03d'
        }
      ],
      clouds: { all: 28 },
      wind: { speed: 4.57, deg: 158, gust: 5.58 },
      visibility: 10000,
      pop: 0,
      sys: { pod: 'd' },
      dt_txt: '2024-08-01 18:00:00'
    }
    */
    return {
      weatherConditionId: closestForecast.weather[0].id,
      weatherConditionMain: closestForecast.weather[0].main,
      weatherConditionDescription: closestForecast.weather[0].description,
      closestForecastTime: closestForecast.dt_txt,
    };
  } catch (error) {
    console.error("[fetchWeatherDataByCity]: error", error);
    return null;
  } finally {
    await delay(WEATHERAPI_REQUEST_INTERVAL_MS);
  }
};

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export const uploadMatchesToMatchTable = async (matchList) => {
  const reqUrl = `http://localhost:9925/`;
  const reqHeaders = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${HDB_AUTH_TOKEN}`,
    },
  };
  const reqBody = {
    operation: "upsert",
    database: "data",
    table: "sunnyCloudyCityMatches",
    records: matchList,
  };

  try {
    const response = await fetch(reqUrl, {
      method: "POST",
      headers: reqHeaders.headers,
      body: JSON.stringify(reqBody),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch uploadMatchesToMatchTable`);
    }
    const responseData = await response.json();
    console.log(
      "[Uploaded matchList to table: sunnyCloudyCityMatches] ",
      matchList
    );
    console.log("###  Completed: Step 1 - findSunnyCloudCityMatches ###");

    return responseData;
  } catch (error) {
    console.error("[uploadMatchesToMatchTable]: Error encountered... ", error);
  }
};

export const findSunnyCloudCityMatches = async () => {
  console.log("### Begin: Step 1: findSunnyCloudCityMatches ###");

  let allCities = await fetchCities();
  let weatherDataCache = {};
  let matches = [];
  let processedCitiesCount = 0;
  let totalWeatherRequestsCount = 0; // Initialize the weather request count

  // Initialize counters for city appearance frequencies
  const cloudyCityFrequency = new Map();
  const sunnyCityFrequency = new Map();

  // Maximum appearances for each city role
  const cloudy_city_maxFrequency = 3;
  const sunny_city_maxFrequency = 3;

  // Process cities in chunks until we reach the desired number of matches or run out of cities
  while (
    matches.length < TOTAL_DESIRED_CITY_PAIRS &&
    processedCitiesCount < allCities.length
  ) {
    const endSlice = Math.min(
      processedCitiesCount + CHUNK_OF_CITIES_WEATHERLOOKUP,
      allCities.length
    );
    const currentChunkOfCities = allCities.slice(
      processedCitiesCount,
      endSlice
    );

    const sunnyCities = new Map();
    const cloudyCities = new Map();

    // Fetch and categorize weather data for each city in the current chunk
    for (const city of currentChunkOfCities) {
      if (!weatherDataCache[city.City]) {
        const weather = await fetchWeatherDataByCity(city.City);
        weatherDataCache[city.City] = weather;
        totalWeatherRequestsCount++; // Count each weather data request
      }

      const weather = weatherDataCache[city.City];
      if (weather) {
        if (SUNNY_WEATHER_CODES.includes(weather.weatherConditionId)) {
          if (
            (sunnyCityFrequency.get(city.City) || 0) < sunny_city_maxFrequency
          ) {
            sunnyCities.set(city.City, weather);
            sunnyCityFrequency.set(
              city.City,
              (sunnyCityFrequency.get(city.City) || 0) + 1
            );
          }
        } else {
          if (
            (cloudyCityFrequency.get(city.City) || 0) < cloudy_city_maxFrequency
          ) {
            cloudyCities.set(city.City, weather);
            cloudyCityFrequency.set(
              city.City,
              (cloudyCityFrequency.get(city.City) || 0) + 1
            );
          }
        }
      }
    }

    // Generate matches ensuring unique pairings with frequency constraints
    for (const [sunnyCity, sunnyWeather] of sunnyCities.entries()) {
      let count = 0; // Track matches per sunny city
      for (const [cloudyCity, cloudyWeather] of cloudyCities.entries()) {
        if (sunnyCity !== cloudyCity && count < sunny_city_maxFrequency) {
          matches.push({
            match_id: matches.length + 1,
            cloudy_orig_city: cloudyCity,
            cloudy_orig_forecast: cloudyWeather.weatherConditionDescription,
            sunny_dest_city: sunnyCity,
            sunny_dest_forecast: sunnyWeather.weatherConditionDescription,
            closestForecastTime: cloudyWeather.closestForecastTime,
          });
          count++;
          if (matches.length >= TOTAL_DESIRED_CITY_PAIRS) break;
        }
      }
      if (matches.length >= TOTAL_DESIRED_CITY_PAIRS) break;
    }

    processedCitiesCount += CHUNK_OF_CITIES_WEATHERLOOKUP;
  }

  console.log(
    `Completed matches search. Total matches found: ${matches.length} via ${totalWeatherRequestsCount} weather requests.`
  );
  return matches;
};
