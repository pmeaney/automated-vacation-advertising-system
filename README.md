## Akita Adventures Automated Vacation Advertising system

> A proof of concept project to automate the harnessing of weather data to promote vacation flights from gloomy cities to sunny cities, powered by HarperDB

Akita Adventures is a vacation planning company helping people explore the world by promoting Terrier Airlines deals via Web and Social Media ads-- promoting flights to Sunny cities to audiences in cities with Gloomy weather.

Saluki Solutions has been retained to develop a Proof of Concept project, using HarperDB, to forecast the weather of major American cities and promote flights to cities with Sunny weather forecasts to audiences in cities with overcast, rainy, or snowy weather forecasts. Ultimately, flights could be substituted with hotel deals, or vacation packages if this project were to be expanded.

![alt "Saluki Solutions"](./docs/saluki-solutions.jpg "Saluki Solutions")

## Start it up 🚀

- Clone the repo: `git clone https://github.com/pmeaney/automated-vacation-advertising-system.git`
- **You'll need the env.js file. Place it at `./components/flight-ads-app/env.js`. For the env.js file contact Patrick.**
- Setup API keys -- see `./components/flight-ads-app/env.js`
  - OpenWeatherMaps - Weather Forecasts
    - https://openweathermap.org/forecast5
  - Amadeus - Flight Prices
    - https://developers.amadeus.com/get-started/get-started-with-self-service-apis-335
- Boot up the project with docker-compose: `docker compose up`
- Cleanup (remove the container & its volumes) with: `docker compose rm -fv harperdb`
- Start the application by issuing a GET request to run the main function:
  ```bash
      curl -X GET \
      http://localhost:9926/flight-ads-app/runMain \
      -H 'Content-Type: application/json' \
      -H 'Authorization: Basic SERCX0FETUlOOnBhc3N3b3Jk'
  ```
- To change the # of cities we run the program on, change the value for this in env.js `TOTAL_DESIRED_CITY_PAIRS`

## Results

Taking weather forecasts into consideration, we make a request for Flight Prices from Cloudy cities to Sunny cities (forecasted 5 days in advance). Processing the data, we return data for the lowest priced flight and publish it on a REST API endpoint.

As a result, we have a ready to use process which we can run on a certain cadence (such as twice a day) to get the cheapest flights from Cloudy to Sunny cities (in 5 days) to promote good weather vacations to potential travelers via web or social media ads.

![alt "Example Flight Ad"](./docs/nyc-to-lax-2.jpg "Example Flight Ad")

## What, Why, & How

An API Endpoint which

- Matches Cloudy Cities to Sunny Cities using a 5-day out weather forecast
- Provides Flight Prices for the matched cities
- Generates derived data via a flight data analysis function

... built with significantly less developer time & overhead compared to alternatives

The project showcases HarperDB’s benefits including automatic datatable interoperability of multiple formats (CSV, JSON, SQL), querying with SQL via REST API, and HarperDB’s offer of an adaptable, quick-to-build, easy-to-use Developer Experience

![alt "Overall Concept"](./docs/slides/s2.png "Overall Concept")

![alt "Inner workings"](./docs/slides/s3.png "Inner workings")

### Data example

Here's an example of the data returned by the overall process.
It returns a list of flights from Cloudy to Sunny cities, including the lowest price offer, and alternative ticket prices to compare to-- up to a total of 5 maximum price examples. It may return fewer than 5, or even none at all if it does not find matches for those particular airports on that date. The Airport Codes csv file includes multiple airports per city, including ones which are closed, so in the case where no matches are found, we'll see "null" in the lowestPrice & as the sorted price.

```javascript
[
  {
    closestForecastTime: "2024-08-01 21:00:00",
    cloudy_orig_city: "Chicago",
    cloudy_orig_city_iata: "ORD",
    cloudy_orig_forecast: "light rain",
    cloudy_orig_state: "IL",
    lowestPrice: 402.94,
    lowestPrice_flightCode: "UA-787-753",
    flightQty: 5,
    sortedPrices: [402.94, 402.94, 438.44, 475.14, 475.14],
    sunny_dest_city: "Los Angeles",
    sunny_dest_city_iata: "LAX",
    sunny_dest_forecast: "clear sky",
    sunny_dest_state: "CA",
    weatherFlightIataSet_id: 4,
    cloudy_orig_city_pop: 2718782,
    sunny_dest_city_pop: 3884307,
  },
  {
    closestForecastTime: "2024-08-01 21:00:00",
    cloudy_orig_city: "San Jose",
    cloudy_orig_city_iata: "SJC",
    cloudy_orig_forecast: "overcast clouds",
    cloudy_orig_state: "CA",
    lowestPrice: 324.56,
    lowestPrice_flightCode: "NK-2523-32N",
    flightQty: 5,
    sortedPrices: [324.56, 577.23, 606.22, 606.22, 611.17],
    sunny_dest_city: "Los Angeles",
    sunny_dest_city_iata: "LAX",
    sunny_dest_forecast: "clear sky",
    sunny_dest_state: "CA",
    weatherFlightIataSet_id: 5,
    cloudy_orig_city_pop: 998537,
    sunny_dest_city_pop: 3884307,
  },
  {
    closestForecastTime: "2024-08-01 21:00:00",
    cloudy_orig_city: "San Jose",
    cloudy_orig_city_iata: "SJC",
    cloudy_orig_forecast: "overcast clouds",
    cloudy_orig_state: "CA",
    lowestPrice: 229.95,
    lowestPrice_flightCode: "UA-1786-738",
    flightQty: 2,
    sortedPrices: [229.95, 229.95],
    sunny_dest_city: "New York",
    sunny_dest_city_iata: "LGA",
    sunny_dest_forecast: "scattered clouds",
    sunny_dest_state: "NY",
    weatherFlightIataSet_id: 2,
    cloudy_orig_city_pop: 998537,
    sunny_dest_city_pop: 8405837,
  },
];
```

## Here is a representation of how we reach the final dataset.

```javascript

// Load cities CSV into HarperDB
// Table: citiesPopList
{
    "id": "0871afcd-96b4-4aba-95d8-ed5e3c3b640e",
    "City": "New York",
    "Population": 8405837,
    "State": "New York",
    "__createdtime__": 1721080164634.7595,
    "__updatedtime__": 1721080164634.7595,
    "lat": 40.7127837,
    "lon": -74.00594129999999
  },

// Load airport iata codes CSV into HarperDB
// We're interested mainly in using this data to match iata codes to the cities for which we request weather forecasts.
// Table: airportIataCodes
{
    "iata": "00M",  // <-- ########### This is our focus
    "__createdtime__": 1721080164806.5408,
    "__updatedtime__": 1721080793681.915,
    "city": "Bay Springs",
    "country": "USA",
    "latitude": 31.95376472,
    "longitude": -89.23450472,
    "name": "Thigpen",
    "state": "MS"
  }

// Our first request is for Weather data.
// For each Cloudy city, we search for up to 3 Sunny cities to fly to.
// We look at the forecasts for the two cities which are closest to exactly 5 days from when the main function runs.
// Table: sunnyCloudyCityMatches
{
    "match_id": 1,
    "__createdtime__": 1721080169620.8171,
    "__updatedtime__": 1721080797431.3623,
    "closestForecastTime": "2024-07-20 21:00:00",
    "cloudy_orig_city": "New York",
    "sunny_dest_city": "Los Angeles"
    "cloudy_orig_forecast": "overcast clouds",
    "sunny_dest_forecast": "clear sky",
  }


// We then merge in the iata codes for the two cities
// Table: weatherFlightSets
{
    "weatherFlightIataSet_id": 1,
    "__createdtime__": 1721080169824.4937,
    "__updatedtime__": 1721080797616.5005,
    "closestForecastTime": "2024-07-20 21:00:00", // <-- Flight date
    "cloudy_orig_city": "New York",
    "cloudy_orig_city_iata": "LGA", // <-- Flight Origin City IataCode
    "cloudy_orig_state": "NY",
    "sunny_dest_city": "Los Angeles",
    "sunny_dest_city_iata": "LAX", // <-- Flight Destination City IataCode
    "sunny_dest_state": "CA"
    "cloudy_orig_forecast": "overcast clouds",
    "sunny_dest_forecast": "clear sky",
  }

// Lastly, we make a request for Flight Prices
// We process the data to return a list of up to 5 flights' prices
// and focus in on the lowest price along with its flight code.
// Then, as was requested in the client's requirements-- we demo a SQL Join via REST API request in the NodeJS code.
// The SQL join can also be tested via the runMain.http file-- it's at the bottom of the file.
{
    "closestForecastTime": "2024-08-01 21:00:00",
    "cloudy_orig_city": "Chicago",
    "cloudy_orig_city_iata": "ORD",
    "cloudy_orig_forecast": "light rain",
    "cloudy_orig_state": "IL",
    "lowestPrice": 402.94,
    "lowestPrice_flightCode": "UA-787-753",
    "flightQty": 5,
    "sortedPrices": [
      402.94,
      402.94,
      438.44,
      475.14,
      475.14
    ],
    "sunny_dest_city": "Los Angeles",
    "sunny_dest_city_iata": "LAX",
    "sunny_dest_forecast": "clear sky",
    "sunny_dest_state": "CA",
    "weatherFlightIataSet_id": 4,
    "cloudy_orig_city_pop": 2718782,
    "sunny_dest_city_pop": 3884307
  }
```

### SQL Join example

Goal: Add Population of both the Origin & Destination cities to the final flight prices list.

Explanation:

1. Base Table (data.finalPriceData): This is the main table we are selecting from, aliased as fp.
2. First Join (cloudy_orig_city): We perform a LEFT JOIN on data.citiesPopList using the cloudy_orig_city column to match the City column in data.citiesPopList, and alias this table as c1.
3. Second Join (sunny_dest_city): We perform another LEFT JOIN on data.citiesPopList using the sunny_dest_city column to match the City column in data.citiesPopList, and alias this table as c2.
4. Selecting Population: We select the Population from both joins and alias them as cloudy_orig_city_pop and sunny_dest_city_pop respectively.

```
SELECT
    fp.closestForecastTime,
    fp.cloudy_orig_city,
    fp.cloudy_orig_city_iata,
    fp.cloudy_orig_forecast,
    fp.cloudy_orig_state,
    fp.flightQty,
    fp.lowestPrice,
    fp.lowestPrice_flightCode,
    fp.sortedPrices,
    fp.sunny_dest_city,
    fp.sunny_dest_city_iata,
    fp.sunny_dest_forecast,
    fp.sunny_dest_state,
    fp.weatherFlightIataSet_id,
    c1.Population AS cloudy_orig_city_pop,
    c2.Population AS sunny_dest_city_pop
FROM
    data.finalPriceData fp
LEFT JOIN
    data.citiesPopList c1 ON fp.cloudy_orig_city = c1.City
LEFT JOIN
    data.citiesPopList c2 ON fp.sunny_dest_city = c2.City;
```

### API Used

- **OpenWeatherMaps** - Weather forecast API
  - Docs:
    - [5-day forecast API](https://openweathermap.org/forecast5)
    - The OpenWeatherMaps API structure is convenient as a developer, because it offers codified weather status codes-- Sort of like how http status codes include broad groups and specific codes (i.e. 2XX vs 200 codes), the API offers for example, "Group 2xx: Thunderstorm", vs "201 Thunderstorm Description: thunderstorm with rain", or "202 Thunderstorm Description: thunderstorm with heavy rain"
      - You can find those weather code IDs here: https://openweathermap.org/weather-conditions
- **Amadeus** - Flight prices API
  - Docs:
    - [Getting started with Amadeus Self Service API](https://developers.amadeus.com/get-started/get-started-with-self-service-apis-335)
    - [Test Env Data & API](https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/test-data/)
    - [API Limit](https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/api-rate-limits/#list-of-apis-with-the-above-rate-limits): 10 transactions per second, per user
    - Initially I was able to use plain nodeJS fetch request for Amadeus data. Then was getting 400 error (malformed request). So, as an alterntive, here's [an official amadeus docs example of making a request for flight data using the Amadeus Node SDK's functions](https://developers.amadeus.com/blog/flight-booking-app-angular-1) intead.

### Loading CSV Files locally via Operations API

- To setup a Cities data table, we load data from a CSV file into HarperDB.
  - We'll need to add a data volume to share with our harperdb docker container: `- ./data-for-hdb:/home/harperdb/hdb/data-for-hdb` in docker-compose.yml
  - We'll download a csv file into a new directory we create called `data-for-hdb`. The example csv file in this case is a list of the top 1000 US cities by population, from a repo by Plotly, at: https://raw.githubusercontent.com/plotly/datasets/master/us-cities-top-1k.csv
- We then use the HarperDB Operations API create a REST API Request to our HarperDB App to create a table for the csv file data, and then one to upload the csv file-- See the `proj.http` file.
- We also set up a query to take a look at some sample data to make sure our table looks as we expect it to.
  - **Note**:
    - table primary keys are created automatically (as is common with table migration tools)
    - keys are created as unique ids, rather than a series of numbers (e.g. 1, 2, 3)
