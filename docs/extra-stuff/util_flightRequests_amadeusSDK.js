import pLimit from "p-limit";
import Amadeus from "amadeus";

import {
  HDB_AUTH_TOKEN,
  AMADEUS_API_KEY,
  AMADEUS_API_SECRET,
  AMADEUS_BASE_URL,
} from "../../components/flight-ads-app/env.js";

const amadeus = new Amadeus({
  clientId: AMADEUS_API_KEY,
  clientSecret: AMADEUS_API_SECRET,
});

const DELAY_MS = 500;
const CONCURRENT_REQUESTS = 2;

export const pullWeatherFlightsSetsTable = async () => {
  const url = "http://localhost:9925/";
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${HDB_AUTH_TOKEN}`,
    },
    body: JSON.stringify({
      operation: "sql",
      sql: "SELECT * FROM data.weatherFlightSets",
    }),
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return null;
  }
};

const analyzeFlightPrices = (flightsData) => {
  const prices = flightsData.map((flight) => parseFloat(flight.price.total));
  prices.sort((a, b) => a - b);

  return {
    count: prices.length,
    lowestPrice: prices[0] || null,
    sortedPrices: prices,
    lowestPrice_flightCode: prices.length
      ? `${flightsData[0].itineraries[0].segments[0].carrierCode}-${flightsData[0].itineraries[0].segments[0].number}-${flightsData[0].itineraries[0].segments[0].aircraft.code}`
      : null,
  };
};

// Function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to make requests with control over concurrency and delay
const makeFlightPriceRequest = async (flight) => {
  const [date, time] = flight.closestForecastTime.split(" ");

  try {
    const data = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: flight.cloudy_orig_city_iata,
      destinationLocationCode: flight.sunny_dest_city_iata,
      departureDate: date,
      currencyCode: "USD",
      adults: "1",
      max: "7",
    });

    // console.log("flight response data", data.data);
    const pricingAnalysis = analyzeFlightPrices(data.data);
    const flightWithPriceAnalysis = { ...flight, ...pricingAnalysis };
    console.log("flightWithPriceAnalysis", flightWithPriceAnalysis);
    return flightWithPriceAnalysis;
  } catch (error) {
    console.error("Error fetching flight offers:", error);
  }
};

export const getFlightPrices = async (flightsTableList) => {
  const limit = pLimit(CONCURRENT_REQUESTS); // Limit concurrent tasks
  const flightPriceRequests = flightsTableList.map((flight) =>
    limit(async () => {
      await makeFlightPriceRequest(flight);
      await delay(DELAY_MS);
    })
  );
  const results = await Promise.all(flightPriceRequests);
  console.log(
    "### Completed: Step 3 - Requesting flight prices for our Sunny/Cloudy cities"
  );
  console.log("results: ", results);
  return results;
};
