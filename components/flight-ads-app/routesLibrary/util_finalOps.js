import { HDB_AUTH_TOKEN } from "../env.js";

const postFlightPriceData = async (jsonObject) => {
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
    table: "finalPriceData",
    records: jsonObject,
  };

  try {
    const response = await fetch(reqUrl, {
      method: "POST",
      headers: reqHeaders.headers,
      body: JSON.stringify(reqBody),
    });

    if (!response.ok) {
      throw new Error(`Failed to postFlightPriceData`);
    }
    const responseData = await response.json();

    return responseData;
  } catch (error) {
    console.error("[postFlightPriceData]: Error encountered... ", error);
  }
};

const joinPopulationOnFlights = async () => {
  const url = "http://localhost:9925/";
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic SERCX0FETUlOOnBhc3N3b3Jk", // Assumes your base64 encoded credentials
    },
    body: JSON.stringify({
      operation: "sql",
      // sql: "SELECT * FROM data.finalPriceData",
      // sql: "SELECT * FROM data.finalPriceData JOIN data.citiesPopList ON data.citiesPopList.City = data.finalPriceData.cloudy_orig_city AND data.citiesPopList.City = data.finalPriceData.sunny_dest_city",
      // sql: "SELECT * FROM data.finalPriceData JOIN data.citiesPopList ON data.citiesPopList.City = data.finalPriceData.cloudy_orig_city",
      sql: "SELECT fp.closestForecastTime, fp.cloudy_orig_city, fp.cloudy_orig_city_iata, fp.cloudy_orig_forecast, fp.cloudy_orig_state, fp.lowestPrice, fp.lowestPrice_flightCode, fp.flightQty, fp.sortedPrices, fp.sunny_dest_city, fp.sunny_dest_city_iata, fp.sunny_dest_forecast, fp.sunny_dest_state, fp.weatherFlightIataSet_id, c1.Population AS cloudy_orig_city_pop, c2.Population AS sunny_dest_city_pop FROM data.finalPriceData fp LEFT JOIN data.citiesPopList c1 ON fp.cloudy_orig_city = c1.City LEFT JOIN data.citiesPopList c2 ON fp.sunny_dest_city = c2.City;",
    }),
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error("[joinPopulationOnFlights] -- response not ok");
    }
    const data = await response.json();
    // console.log(data);
    return data;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return null;
  }
};

export const uploadFlightPrices_addJoin = async (finalFlightsPriceList) => {
  // upload the final flights price list
  // const response_postedData = await postFlightPriceData(finalFlightsPriceList);
  await postFlightPriceData(finalFlightsPriceList);

  // Pull the final flights price data we just uploaded
  // and use a SQL join to combine it with Population data from our cities table.
  const response_joinPopulationOnFlights = await joinPopulationOnFlights();
  return response_joinPopulationOnFlights;
  // return response_postedData;
};
