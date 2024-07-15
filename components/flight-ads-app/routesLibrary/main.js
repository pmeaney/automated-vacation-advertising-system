import {
  findSunnyCloudCityMatches,
  uploadMatchesToMatchTable,
} from "./util_weatherRequests.js";
import {
  pullWeatherFlightsSetsTable,
  getFlightPrices,
} from "./util_flightRequests.js";
import {
  pullSunnyCloudyCityMatches,
  pullIataCodeTable,
  mergeMatchesWithIata,
  uploadMergedIataFlights,
} from "./util_prepMatchData.js";

export const main = async () => {
  console.log("running main...");

  // ###############################################################
  // ###### Section one: Setup sunnyCloudyCityMatches Table  #######
  // ###############################################################
  // Generate a JSON object of Sunny - Cloudy city matches
  const arrayOf_sunnyCloudyCityMatches = await findSunnyCloudCityMatches();
  // Now upload it into HarperDB, so we can query it at the next step.
  await uploadMatchesToMatchTable(arrayOf_sunnyCloudyCityMatches);

  // ###############################################################
  // ###### Section Two: For our Matches, Merge 3 letter     #######
  // ######              airport codes & create new table    #######
  // ###############################################################
  // For simplicity, let's load a CSV into a table called airportCodesPerCity
  // Then, for our matches (i.e. the flight list we generate),
  //    let's add an IATA Airport code for both Origin & Destination city, and create a new table with that data
  //    We'll do that through node-- to merge both JSON objects to create a new JSON object.  Then upload it as a new table.
  const response_flightsGenerated = await pullSunnyCloudyCityMatches();
  const response_pullIataCodeTable = await pullIataCodeTable();

  const response_mergeIataToFlights = await mergeMatchesWithIata(
    response_flightsGenerated,
    response_pullIataCodeTable
  );
  // console.log("response_mergeIataToFlights", response_mergeIataToFlights);
  // Now we can upload the merged data.
  await uploadMergedIataFlights(response_mergeIataToFlights);
  // ###############################################################
  // ###### Section Three: For our Matches, Query for Flights ######
  // ###############################################################

  // First, we'll pull all data from weatherFlightSets table.  It contains our origin & destination cities' weather forecasts & IATA codes.
  // Then, query for flights by passing Iata codes to Flights Pricing REST API
  const response_pullWeatherFlightsSetsTable =
    await pullWeatherFlightsSetsTable();

  // const response_getFlightPrices = await getFlightPrices(
  //   response_pullWeatherFlightsSetsTable
  // );

  // ##############################################################
  // ######  Section 3.5: Sort by price & output to SSE       #####
  // ##############################################################
  // await sortPrices_OutputToSSE(response_pullWeatherFlightsSetsTable);

  // ################################################################################
  // ######  Section Four: Query final data & output to SSE                     #####
  // ###### Status: Leaving for later, once I get SQL join statements to work   #####
  // ################################################################################

  // From our table, run a dervied data calculation:
  //  Query flight prices of top 10 cities by pop. in FinalFlightPrices table (prices of our Cloudy->Sunny flights)
  // #### -> I would need to do a SQL join.  Previously I was unable to do so via Operations API
  //          So, I'll save that for later, once I learn to get more than a basic SQL query working via Operations API--
  //          such as Multi-line or really long query or complex query.
  //  Then, output the results to a SSE Endpoint

  // This would replace "sortPrices_OutputToSSE" in section 3.
  // await queryPriceTableAndRunSSE();

  // If we were to set our main function into a cron-job or other process to run it on a cadence,
  // we would then have an example of long polling for derived data and outputting the data to an SSE endpoint.
  // - It could be the top 10 cities by population
  // - It could be simply the 100 cities most recently added to the list.
  // - Or it could b all the cities on the list.
  // --> In the above example, I limit it to 10.

  // From there, we could watch our SSE endpoint for updates-- via another endpoint which checks it on a certain schedule.
  // It would would run a process to buy advertisements of the most up to date flight deals via web & social media ads,
  // and include some sort of affiliate code tracking mechanism to get credit for each click or conversion.

  console.log("Main is done...");
  return response_pullWeatherFlightsSetsTable;
};
