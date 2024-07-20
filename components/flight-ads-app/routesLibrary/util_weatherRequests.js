import { testEmitter } from "../routes/index.js";

import {
  HDB_AUTH_TOKEN,
  OPENWEATHERMAP_API_KEY,
  CITIES_LIMIT,
  WEATHERAPI_REQUEST_INTERVAL_MS,
  LIMIT_OF_CITIES_WEATHERLOOKUP,
  PER_SUNNY_CITY_MAX_QTY_LIMIT,
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
    console.error(error);
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

    testEmitter.emitEvent("eventToLog", {
      log: `${city} closestForecastTime: ${closestForecast.dt_txt} (reqTime: ${beginTimeTracker_dt_stamp} (${beginTimeTracker_in_ms} ms). WeatherCode ${closestForecast.weather[0].id}: ${closestForecast.weather[0].description}`,
    });

    return {
      weatherConditionId: closestForecast.weather[0].id,
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
  console.log("###  Begin: Step 1: findSunnyCloudCityMatches ###");

  let sunnyCloudyMatches = [];
  const cities = await fetchCities();
  const preSearched = {};
  const uniquePairs = new Set(); // Set to track unique city pairs
  let matchId = 1;

  // label for the outer loop for breaking out of nested loops
  outerLoop: for (let i = 0; i < cities.length; i++) {
    const sunnyCity = cities[i].City;
    if (!preSearched[sunnyCity]) {
      const weatherData = await fetchWeatherDataByCity(sunnyCity);
      if (weatherData) {
        preSearched[sunnyCity] = {
          weatherConditionId: weatherData.weatherConditionId,
          closestForecastTime: weatherData.closestForecastTime,
        };
      }
    }

    if (
      !SUNNY_WEATHER_CODES.includes(preSearched[sunnyCity]?.weatherConditionId)
    ) {
      continue;
    }

    for (let j = 0; j < cities.length; j++) {
      if (i === j) continue;

      const cloudyCity = cities[j].City;
      if (cloudyCity === sunnyCity) continue;

      if (!preSearched[cloudyCity]) {
        const weatherData = await fetchWeatherDataByCity(cloudyCity);
        if (weatherData) {
          preSearched[cloudyCity] = {
            weatherConditionId: weatherData.weatherConditionId,
            closestForecastTime: weatherData.closestForecastTime,
          };
        }
      }

      if (
        SUNNY_WEATHER_CODES.includes(
          preSearched[cloudyCity]?.weatherConditionId
        )
      ) {
        continue;
      }

      const pairKey = `${sunnyCity}-${cloudyCity}`;
      if (
        !uniquePairs.has(pairKey) &&
        preSearched[cloudyCity] &&
        !SUNNY_WEATHER_CODES.includes(
          preSearched[cloudyCity]?.weatherConditionId
        )
      ) {
        uniquePairs.add(pairKey);
        sunnyCloudyMatches.push({
          match_id: matchId++,
          cloudy_orig_city: cloudyCity,
          sunny_dest_city: sunnyCity,
          closestForecastTime: preSearched[cloudyCity].closestForecastTime, // Ensure correct time is used
        });

        if (sunnyCloudyMatches.length === LIMIT_OF_CITIES_WEATHERLOOKUP) {
          break outerLoop; // Break out of all loops if the limit is reached
        }
      }
    }
  }

  return sunnyCloudyMatches;
};
