import {
  HDB_AUTH_TOKEN,
  AMADEUS_API_KEY,
  AMADEUS_API_SECRET,
  AMADEUS_BASE_URL,
} from "../env.js";

async function getAmadeusToken() {
  // Post req for API Token - https://developers.amadeus.com/get-started/get-started-with-self-service-apis-335
  // curl "https://test.api.amadeus.com/v1/security/oauth2/token" \
  //    -H "Content-Type: application/x-www-form-urlencoded" \
  //    -d "grant_type=client_credentials&client_id={client_id}&client_secret={client_secret}"
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
    console.log("Token received:", data);
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
      Authorization: `Basic ${HDB_AUTH_TOKEN}`, // Assumes your base64 encoded credentials
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
    // console.log(data);
    return data;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return null;
  }
};

const makeFlightPriceRequestWithToken = async (token) => {
  const url = `${AMADEUS_BASE_URL}/shopping/flight-offers`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  const body = JSON.stringify({
    currencyCode: "USD",
    originDestinations: [
      {
        id: "1",
        originLocationCode: "NYC",
        destinationLocationCode: "MAD",
        departureDateTimeRange: {
          date: "2023-11-01",
          time: "10:00:00",
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
      maxFlightOffers: 2,
      flightFilters: {
        cabinRestrictions: [
          {
            cabin: "BUSINESS",
            coverage: "MOST_SEGMENTS",
            originDestinationIds: ["1"],
          },
        ],
      },
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
    console.log("Flight offers received:", data);
    return data;
  } catch (error) {
    console.error("Error fetching flight offers:", error);
  }
};

export const getFlightPrices = async (flightsTableList) => {
  const amadeusAPIToken = await getAmadeusToken();
  console.log("amadeusAPIToken", amadeusAPIToken);

  const flightPriceList = await makeFlightPriceRequestWithToken(
    amadeusAPIToken
  );

  return flightPriceList();
};
