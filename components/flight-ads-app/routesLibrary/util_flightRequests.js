import pLimit from "p-limit";

import {
  HDB_AUTH_TOKEN,
  AMADEUS_API_KEY,
  AMADEUS_API_SECRET,
  AMADEUS_BASE_URL,
} from "../env.js";

const DELAY_MS = 500;
const CONCURRENT_REQUESTS = 1;

async function getAmadeusToken() {
  const url = "https://test.api.amadeus.com/v1/security/oauth2/token";
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: AMADEUS_API_KEY,
    client_secret: AMADEUS_API_SECRET,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch token: " + response.statusText);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error fetching token:", error);
  }
}

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
const makeFlightPriceRequestWithToken = async (token, flight, limit) => {
  await limit(async () => {
    const url = `https://${AMADEUS_BASE_URL}/shopping/flight-offers`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    const [date, time] = flight.closestForecastTime.split(" ");
    const body = JSON.stringify({
      currencyCode: "USD",
      originDestinations: [
        {
          id: "1",
          originLocationCode: flight.cloudy_orig_city_iata,
          destinationLocationCode: flight.sunny_dest_city_iata,
          departureDateTimeRange: {
            date: date.replace(/\//g, "-"), // Convert "MM/DD/YYYY" to "MM-DD-YYYY"
            time: time.slice(0, 8), // Remove AM/PM and use 24-hour format if necessary
          },
        },
      ],
      travelers: [
        {
          id: "1",
          travelerType: "ADULT",
        },
      ],
      sources: ["GDS"],
      searchCriteria: {
        maxFlightOffers: 5,
      },
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: body,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const pricingAnalysis = analyzeFlightPrices(data.data);
      return { ...flight, ...pricingAnalysis };
    } catch (error) {
      console.error("Error fetching flight offers:", error);
      return { ...flight, error: "Failed to fetch flight offers" };
    }
  });

  // Wait after each request to respect the rate limit
  await delay(DELAY_MS); // Adjust the delay to manage the rate (500 ms for 2 requests per second)
};

export const getFlightPrices = async (flightsTableList) => {
  const amadeusAPIToken = await getAmadeusToken();
  const limit = pLimit(CONCURRENT_REQUESTS); // Limit concurrent tasks
  const flightPriceRequests = flightsTableList.map((flight) =>
    makeFlightPriceRequestWithToken(amadeusAPIToken, flight, limit)
  );
  const results = await Promise.all(flightPriceRequests);
  console.log(
    "### Completed: Step 3 - Requesting flight prices for our Sunny/Cloudy cities"
  );
  return results;
};
