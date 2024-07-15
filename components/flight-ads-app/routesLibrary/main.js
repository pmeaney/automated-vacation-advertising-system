import { findSunnyCloudCityMatches } from "./weatherRequests.js";
import { uploadMatchesToMatchTable } from "./util_weatherRequests.js";
import {
  pullSunnyCloudyCityMatches,
  pullIataCodeTable,
  mergeMatchesWithIata,
} from "./util_prepMatchData.js";

export const main = async () => {
  console.log("running main...");

  // ###############################################################
  // ###### Section one: Setup sunnyCloudyCityMatches Table  #######
  // ###############################################################
  // Generate a JSON object of Sunny - Cloudy city matches
  const arrayOf_sunnyCloudyCityMatches = await findSunnyCloudCityMatches();
  // Now upload it into HarperDB, so we can query it at the next step.
  const response_uploadMatchesToMatchTable = await uploadMatchesToMatchTable(
    arrayOf_sunnyCloudyCityMatches
  );

  // ###############################################################
  // ###### Section Two: For our Matches, Merge 3 letter     #######
  // ######              airport codes & create new table    #######
  // ###############################################################
  // For simplicity, let's load a CSV into a table called airportCodesPerCity
  // Then, for our matches (i.e. the flight list we generate),
  //    let's add an IATA Airport code for both Origin & Destination city, and create a new table with that data
  //    We'll do that through node-- to merge both JSON objects to create a new JSON object.  Then upload it as a new table.
  const response_flightsGenerated = await pullSunnyCloudyCityMatches();

  // console.log(
  //   "response_flightsGenerated",
  //   response_flightsGenerated
  // );

  const response_pullIataCodeTable = await pullIataCodeTable();
  const response_addIataToFlights = await mergeMatchesWithIata(
    response_flightsGenerated,
    response_pullIataCodeTable
  );
  console.log("response_addIataToFlights", response_addIataToFlights);

  // console.log("response_pullIataCodeTable", response_pullIataCodeTable);
  // ###############################################################
  // ###### Section Three: For our Matches, Query for Flights ######
  // ###############################################################
  console.log("Main is done...");
  return response_addIataToFlights;
};
