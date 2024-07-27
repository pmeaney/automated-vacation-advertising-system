const BASE_URL = "http://localhost:9925/";
const AUTHORIZATION = "Basic SERCX0FETUlOOnBhc3N3b3Jk";

// Function to make POST requests to the database
const postData = async (url = "", data = {}) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTHORIZATION,
    },
    body: JSON.stringify(data),
  });
  return response.json(); // parses JSON response into native JavaScript objects
};

const createTables = async () => {
  // Create citiesPopList table
  await postData(BASE_URL, {
    operation: "create_table",
    table: "citiesPopList",
    primary_key: "id",
  });

  // Create airportIataCodes table
  await postData(BASE_URL, {
    operation: "create_table",
    table: "airportIataCodes",
    primary_key: "iata",
  });

  // Create sunnyCloudyCityMatches table
  await postData(BASE_URL, {
    operation: "create_table",
    table: "sunnyCloudyCityMatches",
    primary_key: "match_id",
  });

  // Create weatherFlightSets table
  await postData(BASE_URL, {
    operation: "create_table",
    table: "weatherFlightSets",
    primary_key: "weatherFlightIataSet_id",
  });

  // Create weatherFlightSets table
  await postData(BASE_URL, {
    operation: "create_table",
    table: "finalPriceData",
    primary_key: "id_flightPriceSet",
  });
};

const importCSVData = async () => {
  // Import cities population data
  await postData(BASE_URL, {
    operation: "csv_file_load",
    action: "upsert",
    database: "data",
    table: "citiesPopList",
    file_path: "/home/harperdb/hdb/data-for-hdb/us-cities-top-1k.csv",
  });

  // Import airport IATA codes
  await postData(BASE_URL, {
    operation: "csv_file_load",
    action: "upsert",
    database: "data",
    table: "airportIataCodes",
    file_path: "/home/harperdb/hdb/data-for-hdb/us-airports.csv",
  });
};

export const createAndloadTables = async () => {
  try {
    console.log("Creating tables...");
    await createTables();
    console.log("Tables created successfully.");

    console.log("Importing CSV data...");
    await importCSVData();
    console.log("CSV data imported successfully.");
  } catch (error) {
    console.error("An error occurred during setup:", error);
  }
};
