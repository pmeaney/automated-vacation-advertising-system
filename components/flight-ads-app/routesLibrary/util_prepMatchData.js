import { HDB_AUTH_TOKEN, LIMIT_OF_CITIES_WEATHERLOOKUP } from "../env.js";

export const pullSunnyCloudyCityMatches = async () => {
  const url = "http://localhost:9925/";
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic SERCX0FETUlOOnBhc3N3b3Jk", // Assumes your base64 encoded credentials
    },
    body: JSON.stringify({
      operation: "sql",
      sql: `SELECT * FROM data.sunnyCloudyCityMatches LIMIT ${LIMIT_OF_CITIES_WEATHERLOOKUP}`,
    }),
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    // console.log(data);
    return data;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return null;
  }
};

export const pullIataCodeTable = async () => {
  const url = "http://localhost:9925/";
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic SERCX0FETUlOOnBhc3N3b3Jk", // Assumes your base64 encoded credentials
    },
    body: JSON.stringify({
      operation: "sql",
      sql: "SELECT * FROM data.airportIataCodes",
    }),
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    // console.log(data);
    return data;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return null;
  }
};
export const mergeMatchesWithIata = async (matchTable, iataTable) => {
  // Normalize and map the iataTable for quick lookup
  const iataMap = iataTable.reduce((acc, item) => {
    const normalizedCity = item.city.toLowerCase(); // Normalize city names to lower case
    acc[normalizedCity] = { iata: item.iata, state: item.state };
    return acc;
  }, {});
  // console.log("iataMap", iataMap); // Log to see what the map looks like

  // Filter and map over matchTable to construct the new matchesWithIata array
  const matchesWithIata = matchTable.reduce((acc, match) => {
    const normalizedCloudyCity = match.cloudy_orig_city.toLowerCase(); // Normalize input city names
    const normalizedSunnyCity = match.sunny_dest_city.toLowerCase();
    const cloudyOrigInfo = iataMap[normalizedCloudyCity];
    const sunnyDestInfo = iataMap[normalizedSunnyCity];

    // Check if city information is found in the map
    if (!cloudyOrigInfo || !sunnyDestInfo) {
      console.error(
        `Skipping match_id ${match.match_id}: Missing IATA code for cities. Cloudy city: ${match.cloudy_orig_city}, Sunny city: ${match.sunny_dest_city}`
      );
      return acc; // Continue to next iteration
    }

    acc.push({
      weatherFlightIataSet_id: match.match_id,
      closestForecastTime: match.closestForecastTime,
      cloudy_orig_city: match.cloudy_orig_city,
      cloudy_orig_state: cloudyOrigInfo.state,
      cloudy_orig_city_iata: cloudyOrigInfo.iata,
      sunny_dest_city: match.sunny_dest_city,
      sunny_dest_state: sunnyDestInfo.state,
      sunny_dest_city_iata: sunnyDestInfo.iata,
    });

    return acc;
  }, []);

  return matchesWithIata;
};

export const uploadMergedIataFlights = async (mergedJsonObject) => {
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
    table: "weatherFlightSets",
    records: mergedJsonObject,
  };

  try {
    const response = await fetch(reqUrl, {
      method: "POST",
      headers: reqHeaders.headers,
      body: JSON.stringify(reqBody),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch uploadMergedIataFlights`);
    }
    const responseData = await response.json();
    console.log(
      "###  Completed: Step 2 - Merged Sunny/Cloudy Cities table with Airport IATA Codes table to create new table: weatherFlightSets   ###"
    );

    return responseData;
  } catch (error) {
    console.error("[uploadMatchesToMatchTable]: Error encountered... ", error);
  }
};
