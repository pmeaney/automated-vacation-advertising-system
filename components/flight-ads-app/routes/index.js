import { main } from "../routesLibrary/main.js";

const routesIndex = async (server, { hdbCore, logger }) => {
  server.route({
    url: "/getCities",
    method: "GET",
    schema: {
      // request needs to have a querystring with a `name` parameter
      querystring: {
        limit: { type: "string" },
      },
    },
    handler: async (request) => {
      const limit = request.query.limit || 3;
      console.log("Querying cities. Limit: ", limit);
      request.body = {
        operation: "sql",
        sql: `SELECT * FROM data.citiesPopList ORDER BY Population DESC LIMIT ${limit}`,
      };
      return hdbCore.requestWithoutAuthentication(request);
    },
  });

  server.route({
    url: "/runMain",
    method: "GET",
    handler: async (request, reply) => {
      const mainResults = await main(reply);
      return reply.send(mainResults);
    },
  });
};
export default routesIndex;

// server.route({
//   url: "/generateIataForFlights",
//   method: "GET",
//   handler: async (request) => {
//     console.log("Creating a Cities Matches table with Iata airport codes.");
//     request.body = {
//       operation: "sql",
//       sql: `
//         CREATE TABLE weatherFlightSets AS
//         SELECT
//             data.sunnyCloudyCityMatches.match_id AS weatherFlightSet_id,
//             data.sunnyCloudyCityMatches.cloudy_orig_city,
//             originAirportCodes.iata AS cloudy_orig_airportCode,
//             data.sunnyCloudyCityMatches.sunny_dest_city,
//             destinationAirportCodes.iata AS sunny_dest_airportCode
//         FROM
//             data.sunnyCloudyCityMatches
//         JOIN
//             data.airportIataCodes originAirportCodes ON data.sunnyCloudyCityMatches.cloudy_orig_city = originAirportCodes.city
//         JOIN
//             data.airportIataCodes destinationAirportCodes ON data.sunnyCloudyCityMatches.sunny_dest_city = destinationAirportCodes.city
//       `,
//     };
//     return hdbCore.requestWithoutAuthentication(request);
//   },
// });

// #################################################################
// #################################################################
// server.route({
//   url: "/generateIataForFlights",
//   method: "GET",
//   handler: async (request) => {
//     console.log("Creating a Cities Matches table with Iata airport codes.");
//     request.body = {
//       operation: "sql",
//       sql: `SELECT
//             data.sunnyCloudyCityMatches.match_id AS weatherFlightSet_id,
//             data.sunnyCloudyCityMatches.cloudy_orig_city,
//             originAirportCodes.iata AS cloudy_orig_airportCode,
//             data.sunnyCloudyCityMatches.sunny_dest_city,
//             destinationAirportCodes.iata AS sunny_dest_airportCode
//         FROM
//             data.sunnyCloudyCityMatches
//         JOIN
//             data.airportIataCodes originAirportCodes ON data.sunnyCloudyCityMatches.cloudy_orig_city = originAirportCodes.city
//         JOIN
//             data.airportIataCodes destinationAirportCodes ON data.sunnyCloudyCityMatches.sunny_dest_city = destinationAirportCodes.city`,
//     };
//     return hdbCore.requestWithoutAuthentication(request);
//   },
// });

//                  ###### Above code leads to this: ########
// HTTP/1.1 500 Internal Server Error
// Server: Unlicensed HarperDB, this should only be used for educational and development purposes
// content-type: application/json
// server-timing: db;dur=12.007
// Date: Sun, 14 Jul 2024 23:11:51 GMT
// Connection: close
// Transfer-Encoding: chunked

// {
//   "error": "unsupported SQL type select\n in SQL: [object Object]"
// }

// harperdb  | 2024-07-14T23:11:51.071Z [http/2] [error]: Error: unsupported SQL type select
// harperdb  |  in SQL: [object Object]
// harperdb  |     at processAST (/home/harperdb/.npm-global/lib/node_modules/harperdb/server/threads/threadServer.js:19:771)
// harperdb  |     at evaluateSQL (/home/harperdb/.npm-global/lib/node_modules/harperdb/server/threads/threadServer.js:18:27929)
// harperdb  |     at node:internal/util:431:7
// harperdb  |     at new Promise (<anonymous>)
// harperdb  |     at evaluateSQL (node:internal/util:417:12)
// harperdb  |     at Object.callOperationFunctionAsAwait (/home/harperdb/.npm-global/lib/node_modules/harperdb/server/threads/threadServer.js:28:27829)
// harperdb  |     at Object.processLocalTransaction (/home/harperdb/.npm-global/lib/node_modules/harperdb/server/threads/threadServer.js:28:48046)
// harperdb  |     at handlePostRequest (/home/harperdb/.npm-global/lib/node_modules/harperdb/server/threads/threadServer.js:28:58902)
// harperdb  |     at Object.requestWithoutAuthentication (/home/harperdb/.npm-global/lib/node_modules/harperdb/server/threads/threadServer.js:28:59610)
// harperdb  |     at Object.handler (file:///home/harperdb/hdb/components/flight-ads-app/routes/index.js:44:22)

// ######################## One Liner Version
// server.route({
//   url: "/generateIataForFlights",
//   method: "GET",
//   handler: async (request) => {
//     console.log("Creating a Cities Matches table with Iata airport codes.");
//     request.body = {
//       operation: "sql",
//       sql: "SELECT data.sunnyCloudyCityMatches.match_id AS weatherFlightSet_id, data.sunnyCloudyCityMatches.cloudy_orig_city, originAirportCodes.iata AS cloudy_orig_airportCode, data.sunnyCloudyCityMatches.sunny_dest_city, destinationAirportCodes.iata AS sunny_dest_airportCode FROM data.sunnyCloudyCityMatches JOIN data.airportIataCodes originAirportCodes ON data.sunnyCloudyCityMatches.cloudy_orig_city = originAirportCodes.city JOIN data.airportIataCodes destinationAirportCodes ON data.sunnyCloudyCityMatches.sunny_dest_city = destinationAirportCodes.city",
//     };
//     return hdbCore.requestWithoutAuthentication(request);
//   },
// });

// ### Has this error result:
// harperdb  | 2024-07-14T23:22:54.163Z [http/2] [error]: Error calling operation: evaluateSQL
// harperdb  | 2024-07-14T23:22:54.164Z [http/2] [error]: unknown column data.sunnyCloudyCityMatches
// harperdb  | 2024-07-14T23:22:54.164Z [http/2] [error]: unknown column data.sunnyCloudyCityMatches
// harperdb  | 2024-07-14T23:22:54.164Z [http/2] [error]: unknown column data.sunnyCloudyCityMatches
