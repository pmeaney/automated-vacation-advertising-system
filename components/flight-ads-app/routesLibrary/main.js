import { findSunnyCloudCityMatches } from "./weatherRequests.js";
import { uploadMatchesToMatchTable } from "./util_weatherRequests.js";

export const main = async () => {
  console.log("running main...");
  // Generate a JSON object of Sunny - Cloudy city matches
  const arrayOf_sunnyCloudyCityMatches = await findSunnyCloudCityMatches();
  // Now upload it into HarperDB, so we can query it at the next step.
  const response_uploadMatchesToMatchTable = await uploadMatchesToMatchTable(
    arrayOf_sunnyCloudyCityMatches
  );

  console.log("Main is done...");
  return arrayOf_sunnyCloudyCityMatches;
};
