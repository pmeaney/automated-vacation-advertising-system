import {
  LIMIT_OF_CITIES_WEATHERLOOKUP,
  PER_SUNNY_CITY_MAX_QTY_LIMIT,
  SUNNY_WEATHER_CODES,
} from "../env.js";

import { fetchCities, fetchWeatherDataByCity } from "./util_weatherRequests.js";

export const findSunnyCloudCityMatches = async () => {
  console.log("###  Begin: Step 1: findSunnyCloudCityMatches ###");

  let sunnyCloudyMatches = [];
  const cities = await fetchCities();
  const preSearched = {};
  let matchId = 1;

  for (let i = 0; i < cities.length; i++) {
    if (sunnyCloudyMatches.length >= LIMIT_OF_CITIES_WEATHERLOOKUP) {
      console.log("Limit of total city weather lookups reached.");
      break;
    }

    const sunnyCity = cities[i].City;
    if (preSearched[sunnyCity] === undefined) {
      const sunnyWeather = await fetchWeatherDataByCity(sunnyCity);
      preSearched[sunnyCity] = sunnyWeather;
    }

    if (!SUNNY_WEATHER_CODES.includes(preSearched[sunnyCity])) {
      continue;
    }

    let cloudyCount = 0;
    for (let j = 0; j < cities.length; j++) {
      if (
        i === j ||
        sunnyCloudyMatches.length >= LIMIT_OF_CITIES_WEATHERLOOKUP
      ) {
        break;
      }

      const cloudyCity = cities[j].City;
      if (
        cloudyCity === sunnyCity ||
        (preSearched[cloudyCity] &&
          SUNNY_WEATHER_CODES.includes(preSearched[cloudyCity]))
      ) {
        continue;
      }

      if (preSearched[cloudyCity] === undefined) {
        const cloudyWeather = await fetchWeatherDataByCity(cloudyCity);
        preSearched[cloudyCity] = cloudyWeather;
      }

      if (SUNNY_WEATHER_CODES.includes(preSearched[cloudyCity])) {
        continue;
      }

      if (cloudyCount < PER_SUNNY_CITY_MAX_QTY_LIMIT) {
        sunnyCloudyMatches.push({
          match_id: matchId++,
          cloudy_orig_city: cloudyCity,
          sunny_dest_city: sunnyCity,
        });
        cloudyCount++;
      }
    }
  }

  console.log(
    "Search for sunnyCloudyMatches done. Length:",
    sunnyCloudyMatches.length
  );
  return sunnyCloudyMatches;
};
