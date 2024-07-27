import { createAndloadTables } from "./setupProject.js";
import { testEmitter } from "../routes/index.js";

import {
  findSunnyCloudCityMatches,
  uploadMatchesToMatchTable,
} from "./util_weatherRequests.js";
import {
  pullWeatherFlightsSetsTable,
  getFlightPrices,
} from "./util_flightRequests_plain.js";
import {
  pullSunnyCloudyCityMatches,
  pullIataCodeTable,
  mergeMatchesWithIata,
  uploadMergedIataFlights,
} from "./util_prepMatchData.js";

// Function to delay execution for a given number of milliseconds
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const main = async () => {
  console.log("Running main...");

  // Emit an event
  try {
    testEmitter.emitEvent("eventToLog", {
      log: "Running main... in eventToLog",
    });
  } catch (error) {
    console.log("[testEmitter-main] error: ", error);
  }

  try {
    // Create & load initial tables
    await createAndloadTables();

    // Delay execution for 2 seconds (2000 milliseconds)
    console.log("Waiting 3 seconds while csvs are processed.............");
    await delay(3000);

    // Generate a JSON object of Sunny - Cloudy city matches
    const arrayOf_sunnyCloudyCityMatches = await findSunnyCloudCityMatches();
    // Now upload it into HarperDB, so we can query it at the next step.
    await uploadMatchesToMatchTable(arrayOf_sunnyCloudyCityMatches);

    // Pull the matches that need IATA codes merged
    const response_flightsGenerated = await pullSunnyCloudyCityMatches();
    const response_pullIataCodeTable = await pullIataCodeTable();

    // Merge IATA codes with the flights data
    const response_mergeIataToFlights = await mergeMatchesWithIata(
      response_flightsGenerated,
      response_pullIataCodeTable
    );
    // Upload the merged data
    await uploadMergedIataFlights(response_mergeIataToFlights);

    // Pull all data from weatherFlightSets table which contains our origin & destination cities' (selected by weather forecasts) & their IATA codes
    const response_pullWeatherFlightsSetsTable =
      await pullWeatherFlightsSetsTable();

    // Query for flights by passing Iata codes to Flights Pricing REST API
    const response_getFlightPrices = await getFlightPrices(
      response_pullWeatherFlightsSetsTable
    );
    console.log("Main is done...");
    return response_getFlightPrices;
  } catch (error) {
    console.error("An error occurred in the main function:", error);
  }
};
