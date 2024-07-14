/**
First, A sketch using example quantities.
Then, converting the quantities to env vars so we can dial the project
*/
/**
Weather Data
Request weather for cities. The API has a limit of 90 rpm.
https://openweathermap.org/full-price#current

  - We have a database table of 1000 cities and their populations.
  - We want to set up a NodeJS request for weather for as much as them as we need to fulfill the following condition:
  - Condition: We need enough Weather per City data such that we have 90 total rows of data for of Sunny City -> Cloudy City.  So, once we have 90, we can end the weather request process.
  - We start with the most populous cities.  We begin the project by querying the cities table (SELECT * FROM data.citiesPopList ORDER BY Population DESC LIMIT 1000) which returns a JSON object we'll map the city name of which into a request for weather data.  The json of the cities data has this structure:
  ```json
[
  {
    "id": "ab51cf74-cfc5-46bc-9682-daa1903d67e1",
    "__createdtime__": 1720912085245.2961,
    "__updatedtime__": 1720912085245.2961,
    "City": "New York",
    "Population": 8405837,
    "State": "New York",
    "lat": 40.7127837,
    "lon": -74.00594129999999
  },
  {
    "id": "28548f0f-a214-41b6-8f57-fb53495ba3a6",
    "__createdtime__": 1720912085245.2961,
    "__updatedtime__": 1720912085245.2961,
    "City": "Los Angeles",
    "Population": 3884307,
    "State": "California",
    "lat": 34.0522342,
    "lon": -118.24368490000002
  },
  {
    "id": "f8582007-a7ec-4acc-9863-a39aa6b63c05",
    "__createdtime__": 1720912085245.2961,
    "__updatedtime__": 1720912085245.2961,
    "City": "Chicago",
    "Population": 2718782,
    "State": "Illinois",
    "lat": 41.8781136,
    "lon": -87.62979820000001
  },
]
  ```
  - We're matching on Sunny City -> Cloudy City forecasts, because these will become our flight searches.
  - Since we have 1000 cities, we could potentially take 1 Sunny city and match it to a max of 999 Gloomy cities.  So, let's set a max of a city appearing in our 90 cities match list to a maximum of 3 appearances.

Now we have a table of cities and their weather forecast.
  - Let's look at weather 5 days from today-- since it's the max forecast available.
  - Let's keep things simple:
    - Take all matches for Cloudy & place them into a table_cloudyForecast
    - Take all matches for Sunny & place them into a table_SunnyForecast
  - Now let's consider the math of the possible combinations of flights between an Origin city and a Destination city, when we have 1000 cities.  With 1000 cities total, we have 999,000 possible combinations of flights.  It turns out that the amount of combinations vs the number of total has a quadratic relationship. For example, for approximately 5% of that prior total combinations-- 50,000 combinations, we need about 25% (22.5%) of the total cities: about 225.  Or to put it another way, comparing those two examples, we 4x the cities, and get get 20x the combinations.
  - For our example, let's set it up to run quickly-- with just enough cities to fill one request for data-- 90 cities.  Might as well round it up to 100.
  - There are 9900 possible combinations of flights between an origin city and a destination city when considering 100 cities.  Our Flight API has a 10k request limit on its cheapest tier, which is for $1.
    - ...Let's step it back 90 cities-- 8010 possible flight combinations.  Just so we have some extra API requests as we go about building & testing this app out.  Or so we can make realtime updates on click.
*/

import { findSunnyCloudCityMatches } from "./weatherRequests.js";

export const main = async () => {
  console.log("running main...");
  const response_sunnyCloudyCityMatches = await findSunnyCloudCityMatches();
  console.log("Main is done...");
  return response_sunnyCloudyCityMatches;
};
