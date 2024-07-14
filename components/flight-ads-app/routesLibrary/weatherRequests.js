import pLimit from "p-limit";
import { HDB_AUTH_TOKEN, OPENWEATHERMAP_API_KEY } from "../env.js";

const CITIES_LIMIT = 1000;
const WEATHER_LIMIT = 90;
const PER_SUNNY_CITY_MAX_QTY_LIMIT = 3;

// Weather API Requests limit: 60 calls/minute
const SUNNY_WEATHER_CODES = [800, 801, 802, 803];

// Settings to for creating 1 request at a time, once per # milliseconds
// Note: This isnt exact but its decently close to making 1 request per # ms
const limit = pLimit(1); // Only one concurrent request
const requestInterval = 500; // 500 milliseconds between requests

// Function to fetch cities from our table
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
    const data = await response.json();
    return data; // Assuming the API returns the cities array directly
  } catch (error) {
    console.error(error);
    return [];
  }
};

// Function to fetch weather forecast (5 days from today) by city name.
// The API provides a big JSON object of a 5 day forecast, with data for every 3 hours.
// This function iterates over the forecast data and finds the entry that is closest to 5 days from now.
const fetchWeatherDataByCity = async (city) => {
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${OPENWEATHERMAP_API_KEY}`;

  return limit(async () => {
    try {
      const beginTimeTracker_in_ms = Date.now(); // Capture the begin time in milliseconds since Unix epoch
      const beginTimeTracker_dt_stamp = new Date().toLocaleString(); // Current date time stamp

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch weather data for city=${city}`);
      }
      const data = await response.json();

      // Get the current date and the date 5 days from now
      const now = new Date();
      const fiveDaysFromNow = new Date();
      fiveDaysFromNow.setDate(now.getDate() + 5);

      // Find the forecast closest to 5 days from now
      let closestForecast = null;
      let minDiff = Infinity;

      data.list.forEach((item) => {
        const forecastDate = new Date(item.dt * 1000); // Convert UNIX timestamp to Date
        const diff = Math.abs(fiveDaysFromNow - forecastDate);

        if (diff < minDiff) {
          minDiff = diff;
          closestForecast = item;
        }
      });

      if (!closestForecast) {
        return null;
      }

      // Get the weather condition ID from the closest forecast entry
      const weatherConditionId = closestForecast.weather[0].id;
      const weatherDesc = closestForecast.weather[0].description;

      // Log the request details
      console.log(
        `Weather request begin time: ${beginTimeTracker_dt_stamp} (${beginTimeTracker_in_ms} ms) for City ${city} with weatherCode ${weatherConditionId}: ${weatherDesc}`
      );

      return weatherConditionId;
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      // Ensure the interval is respected
      await delay(requestInterval);
    }
  });
};

// Function to delay execution respecting milliseconds
async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to process cities and find Sunny -> Cloudy matches
export const findSunnyCloudCityMatches = async () => {
  let sunnyCloudyMatches = [];
  const cities = await fetchCities();

  // Registry to keep track of already searched cities
  const preSearched = {};

  // Generate match_id incrementally
  let matchId = 1;

  // Iterate through cities and fetch weather data until condition met
  for (let i = 0; i < cities.length; i++) {
    const sunnyCity = cities[i].City;

    // Check if the city is already in the pre-searched registry
    if (preSearched[sunnyCity]) {
      // Skip if the city is already searched and is not 'Sunny'
      if (!SUNNY_WEATHER_CODES.includes(preSearched[sunnyCity])) {
        continue;
      }
    } else {
      // Fetch weather data if not pre-searched
      const sunnyWeather = await fetchWeatherDataByCity(sunnyCity);
      preSearched[sunnyCity] = sunnyWeather;

      if (!SUNNY_WEATHER_CODES.includes(sunnyWeather)) {
        continue;
      }
    }

    // Find up to 3 Cloudy cities for each Sunny city
    let cloudyCount = 0;
    for (let j = i + 1; j < cities.length; j++) {
      const cloudyCity = cities[j].City;

      // Check if the city is already in the pre-searched registry
      if (preSearched[cloudyCity]) {
        if (SUNNY_WEATHER_CODES.includes(preSearched[cloudyCity])) {
          continue;
        }
      } else {
        // Fetch weather data if not pre-searched
        const cloudyWeather = await fetchWeatherDataByCity(cloudyCity);
        preSearched[cloudyCity] = cloudyWeather;

        if (SUNNY_WEATHER_CODES.includes(cloudyWeather)) {
          continue;
        }
      }

      // Check if the Sunny city has reached the limit of PER_SUNNY_CITY_MAX_QTY_LIMIT (which is 3)
      const sunnyCityMatchCount = sunnyCloudyMatches.filter(
        (match) => match.sunny_dest_city === sunnyCity
      ).length;
      if (sunnyCityMatchCount < PER_SUNNY_CITY_MAX_QTY_LIMIT) {
        const matchItem = {
          match_id: matchId++,
          cloudy_orig_city: cloudyCity,
          sunny_dest_city: sunnyCity,
        };
        sunnyCloudyMatches.push(matchItem);
        cloudyCount++;
      }

      if (
        cloudyCount >= PER_SUNNY_CITY_MAX_QTY_LIMIT ||
        sunnyCloudyMatches.length >= WEATHER_LIMIT
      ) {
        break; // Maximum 3 cloudy cities per sunny city or total matches reached
      }
    }

    if (sunnyCloudyMatches.length >= WEATHER_LIMIT) {
      break; // Condition met, exit loop
    }
  }

  return sunnyCloudyMatches;
};
