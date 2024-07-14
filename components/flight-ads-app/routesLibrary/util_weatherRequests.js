import {
  HDB_AUTH_TOKEN,
  OPENWEATHERMAP_API_KEY,
  CITIES_LIMIT,
  WEATHERAPI_REQUEST_INTERVAL_MS,
} from "../env.js";

import pLimit from "p-limit";

// Settings to for creating 1 request at a time, once per # milliseconds
// Note: This isnt exact but its decently close to making 1 request per # ms
const limitedConcurrentRequest = pLimit(1); // Only one concurrent request
// WEATHERAPI_REQUEST_INTERVAL_MS is set to a default of 500 milliseconds-- between requests for weather data

// Function to fetch cities from our table
export const fetchCities = async () => {
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
export const fetchWeatherDataByCity = async (city) => {
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${OPENWEATHERMAP_API_KEY}`;

  return limitedConcurrentRequest(async () => {
    try {
      const beginTimeTracker_in_ms = Date.now(); // Capture the begin time in milliseconds since Unix epoch
      const beginTimeTracker_dt_stamp = new Date().toLocaleString(); // Current date time stamp

      const response = await fetch(apiUrl);
      if (!response.ok) {
        // If we can't access weather data for a particular city-- maybe it's too small or it has a typo.
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
      console.error(
        "[fetchWeatherDataByCity]: error",
        error,
        "is error msg fetch failed?",
        error === "fetch failed"
      );
      return null;
    } finally {
      // Ensure the interval is respected
      await delay(WEATHERAPI_REQUEST_INTERVAL_MS);
    }
  });
};

// Function to delay execution respecting milliseconds
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

  console.log("matchList", matchList);
  // console.log("uploadMatchesToMatchTable jsonObject[0]", jsonObject[0]);
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
    console.log("responseData, ", responseData);
    console.log("###  Completed: Step 1 - findSunnyCloudCityMatches ###");

    return responseData; // Assuming the API returns the cities array directly
  } catch (error) {
    console.error("[uploadMatchesToMatchTable]: Error encountered... ", error);
  }
};
