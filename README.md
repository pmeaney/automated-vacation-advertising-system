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
- Start the application by issuing a GET request to run the main function:
  ```bash
      curl -X GET \
      http://localhost:9926/flight-ads-app/runMain \
      -H 'Content-Type: application/json' \
      -H 'Authorization: Basic SERCX0FETUlOOnBhc3N3b3Jk'
  ```
- To change the # of cities we run the program on, change the value for this in env.js `LIMIT_OF_CITIES_WEATHERLOOKUP`

## Results

Taking weather forecasts into consideration, we make a request for Flight Prices from Cloudy cities to Sunny cities (forecasted 5 days in advance). Processing the data, we return data for the lowest priced flight and publish it on a REST API endpoint.

As a result, we have a ready to use process which we can run on a certain cadence (such as twice a day) to get the cheapest flights from Cloudy to Sunny cities (in 5 days) to promote good weather vacations to potential travelers via web or social media ads.

![alt "Example Flight Ad"](./docs/nyc-to-lax-2.jpg "Example Flight Ad")

### Data example

Here's an example of the data returned by the overall process.
It returns a list of flights from Cloudy to Sunny cities, including the lowest price offer, and alternative ticket prices to compare to-- up to a total of 5 maximum price examples. It may return fewer than 5, or even none at all if it does not find matches for those particular airports on that date. The Airport Codes csv file includes multiple airports per city, so for example, #4, Houston to Phoenix references a SPX "Houston Gulf Airport" which closed down in 2002, rather than Houston's main IAH airport, which is why no matches are found.

```javascript
[
  {
    weatherFlightIataSet_id: 1,
    __createdtime__: 1721076350615.6953,
    __updatedtime__: 1721078576450.6472,
    closestForecastTime: "2024-07-20 21:00:00",
    cloudy_orig_city: "New York",
    cloudy_orig_city_iata: "LGA",
    cloudy_orig_state: "NY",
    sunny_dest_city: "Los Angeles",
    sunny_dest_city_iata: "LAX",
    sunny_dest_state: "CA",
    cloudy_orig_forecast: "overcast clouds",
    sunny_dest_forecast: "clear sky",
    count: 5,
    lowestPrice: 249.58,
    sortedPrices: [249.58, 249.58, 249.58, 306.04, 386.16],
    lowestPrice_flightCode: "F9-3423-32N",
  },
  {
    weatherFlightIataSet_id: 2,
    __createdtime__: 1721076350615.6953,
    __updatedtime__: 1721078576450.6472,
    closestForecastTime: "2024-07-20 21:00:00",
    cloudy_orig_city: "New York",
    cloudy_orig_city_iata: "LGA",
    cloudy_orig_state: "NY",
    sunny_dest_city: "Phoenix",
    sunny_dest_city_iata: "PHX",
    sunny_dest_state: "AZ",
    cloudy_orig_forecast: "overcast clouds",
    sunny_dest_forecast: "clear sky",
    count: 2,
    lowestPrice: 229.58,
    sortedPrices: [229.58, 593.96],
    lowestPrice_flightCode: "F9-3161-32N",
  },
  {
    weatherFlightIataSet_id: 3,
    __createdtime__: 1721076350615.6953,
    __updatedtime__: 1721078576450.6472,
    closestForecastTime: "2024-07-20 21:00:00",
    cloudy_orig_city: "Chicago",
    cloudy_orig_city_iata: "ORD",
    cloudy_orig_state: "IL",
    sunny_dest_city: "Phoenix",
    sunny_dest_city_iata: "PHX",
    sunny_dest_state: "AZ",
    cloudy_orig_forecast: "light intensity drizzle",
    sunny_dest_forecast: "few clouds: 11-25%",
    count: 5,
    lowestPrice: 576.91,
    sortedPrices: [576.91, 576.91, 606.91, 606.91, 623.93],
    lowestPrice_flightCode: "UA-1774-7M9",
  },
  {
    weatherFlightIataSet_id: 4,
    __createdtime__: 1721076350615.6953,
    __updatedtime__: 1721078576450.6472,
    closestForecastTime: "2024-07-20 21:00:00",
    cloudy_orig_city: "Houston",
    cloudy_orig_city_iata: "SPX",
    cloudy_orig_state: "TX",
    sunny_dest_city: "Phoenix",
    sunny_dest_city_iata: "PHX",
    sunny_dest_state: "AZ",
    cloudy_orig_forecast: "thunderstorm with heavy rain",
    sunny_dest_forecast: "few clouds: 11-25%",
    count: 0,
    lowestPrice: null,
    sortedPrices: [],
    lowestPrice_flightCode: null,
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
{
    "weatherFlightIataSet_id": 1,
    "__createdtime__": 1721076350615.6953,
    "__updatedtime__": 1721078576450.6472,
    "closestForecastTime": "2024-07-20 21:00:00",
    "cloudy_orig_city": "New York",
    "cloudy_orig_city_iata": "LGA",
    "cloudy_orig_state": "NY",
    "sunny_dest_city": "Los Angeles",
    "sunny_dest_city_iata": "LAX",
    "sunny_dest_state": "CA",
    "cloudy_orig_forecast": "overcast clouds",
    "sunny_dest_forecast": "clear sky",
    "count": 5,
    "lowestPrice": 249.58,
    "sortedPrices": [
      249.58,
      249.58,
      249.58,
      306.04,
      386.16
    ],
    "lowestPrice_flightCode": "F9-3423-32N"
  },
```

### API Used

- **OpenWeatherMaps** - Weather forecast API
  - Docs:
    - [5-day forecast API](https://openweathermap.org/forecast5)
    - The OpenWeatherMaps API structure is convenient as a developer, because it offers codified weather status codes-- Sort of like how http status codes include broad groups and specific codes (i.e. 2XX vs 200 codes), the API offers for example, "Group 2xx: Thunderstorm", vs "201 Thunderstorm Description: thunderstorm with rain", or "202 Thunderstorm Description: thunderstorm with heavy rain"
      - You can find those weather code IDs here: https://openweathermap.org/weather-conditions
- **Amadeus** - Flight prices API
  - Docs:
    - https://developers.amadeus.com/get-started/get-started-with-self-service-apis-335
    - Test Env Data & API - https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/test-data/

### Loading CSV Files locally via Operations API

- To setup a Cities data table, we load data from a CSV file into HarperDB.
  - We'll need to add a data volume to share with our harperdb docker container: `- ./data-for-hdb:/home/harperdb/hdb/data-for-hdb` in docker-compose.yml
  - We'll download a csv file into a new directory we create called `data-for-hdb`. The example csv file in this case is a list of the top 1000 US cities by population, from a repo by Plotly, at: https://raw.githubusercontent.com/plotly/datasets/master/us-cities-top-1k.csv
- We then use the HarperDB Operations API create a REST API Request to our HarperDB App to create a table for the csv file data, and then one to upload the csv file-- See the `proj.http` file.
- We also set up a query to take a look at some sample data to make sure our table looks as we expect it to.
  - **Note**:
    - table primary keys are created automatically (as is common with table migration tools)
    - keys are created as unique ids, rather than a series of numbers (e.g. 1, 2, 3)
