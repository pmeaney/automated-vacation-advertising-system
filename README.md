## Akita Adventures Automated Vacation Advertising system

> A proof of concept project to automate the harnessing of weather data to promote vacation flights from gloomy cities to sunny cities, powered by HarperDB

Akita Adventures is a vacation planning company helping people explore the world by promoting Terrier Airlines deals via Web and Social Media ads-- promoting flights to Sunny cities to audiences in cities with Gloomy weather.

Saluki Solutions has been retained to develop a Proof of Concept project, using HarperDB, to forecast the weather of major American cities and promote flights to cities with Sunny weather forecasts to audiences in cities with overcast, rainy, or snowy weather forecasts. Ultimately, flights could be substituted with hotel deals, or vacation packages if this project were to be expanded.

![alt "Saluki Solutions"](./docs/saluki-solutions.jpg "Saluki Solutions")

### Start it up 🚀

- Clone the repo: `git clone https://github.com/pmeaney/automated-vacation-advertising-system.git`
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

### API Used

- **OpenWeatherMaps**
  - Docs:
    - [5-day forecast API](https://openweathermap.org/forecast5)
    - The OpenWeatherMaps API structure is convenient as a developer, because it offers codified weather status codes-- Sort of like how http status codes include broad groups and specific codes (i.e. 2XX vs 200 codes), the API offers for example, "Group 2xx: Thunderstorm", vs "201 Thunderstorm Description: thunderstorm with rain", or "202 Thunderstorm Description: thunderstorm with heavy rain"
      - You can find those weather code IDs here: https://openweathermap.org/weather-conditions

### Loading CSV Files locally via Operations API

- To setup a Cities data table, we load data from a CSV file into HarperDB.
  - We'll need to add a data volume to share with our harperdb docker container: `- ./data-for-hdb:/home/harperdb/hdb/data-for-hdb` in docker-compose.yml
  - We'll download a csv file into a new directory we create called `data-for-hdb`. The example csv file in this case is a list of the top 1000 US cities by population, from a repo by Plotly, at: https://raw.githubusercontent.com/plotly/datasets/master/us-cities-top-1k.csv
- We then use the HarperDB Operations API create a REST API Request to our HarperDB App to create a table for the csv file data, and then one to upload the csv file-- See the `proj.http` file.
- We also set up a query to take a look at some sample data to make sure our table looks as we expect it to.
  - **Note**:
    - table primary keys are created automatically (as is common with table migration tools)
    - keys are created as unique ids, rather than a series of numbers (e.g. 1, 2, 3)
