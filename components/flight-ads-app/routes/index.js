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
      reply.send(mainResults);
    },
  });
};
export default routesIndex;
