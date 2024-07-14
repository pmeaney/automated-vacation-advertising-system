import {
  LIMIT_OF_CITIES_WEATHERLOOKUP,
  PER_SUNNY_CITY_MAX_QTY_LIMIT,
  SUNNY_WEATHER_CODES,
} from "../env.js";

import { fetchCities, fetchWeatherDataByCity } from "./util_weatherRequests.js";

// Function to process cities and find Sunny -> Cloudy matches
export const findSunnyCloudCityMatches = async () => {
  console.log("###  Begin: Step 1: findSunnyCloudCityMatches      ###");

  let sunnyCloudyMatches = [];
  const cities = await fetchCities();

  // Registry to keep track of already searched cities
  const preSearched = {};
  // Generate match_id incrementally
  let matchId = 1;

  // Iterate through cities and fetch weather data until condition met
  for (let i = 0; i < cities.length; i++) {
    const sunnyCity = cities[i].City;

    // First-- We find a Sunny city.  Is one in the reg.?
    // If not, try to find one via request.

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

    // Now that we have a Sunny city, we need to find Cloudy Cities.
    // So that a few Sunny cities don't monopolize our matches, we limit
    // to up to 3 Cloudy cities per the same Sunny City.
    // This way one Sunny City can only have up 3 flights before we
    // move on to checking flights for the next Sunny city.

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
        sunnyCloudyMatches.length >= LIMIT_OF_CITIES_WEATHERLOOKUP
      ) {
        break; // Maximum 3 cloudy cities per sunny city or total matches reached
      }
    }

    if (sunnyCloudyMatches.length >= LIMIT_OF_CITIES_WEATHERLOOKUP) {
      break; // Condition met, exit loop
    }
  }

  console.log(
    "Search for sunnyCloudyMatches done.  Length: ",
    sunnyCloudyMatches.length
  );
  return sunnyCloudyMatches;
};
