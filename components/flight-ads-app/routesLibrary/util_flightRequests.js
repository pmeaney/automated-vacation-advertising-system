export const pullWeatherFlightsSetsTable = async () => {
  const url = "http://localhost:9925/";
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic SERCX0FETUlOOnBhc3N3b3Jk", // Assumes your base64 encoded credentials
    },
    body: JSON.stringify({
      operation: "sql",
      sql: "SELECT * FROM data.weatherFlightSets",
    }),
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    // console.log(data);
    return data;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return null;
  }
};

export const getFlightPrices = async (flightsTableList) => {};
