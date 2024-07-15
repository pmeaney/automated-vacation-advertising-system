// Added this file... but not using it... it's just an example of an improvement
// to DRY the code up a bit
import { HDB_AUTH_TOKEN } from "../env.js";

export const hdbReqHeaders = {
  "Content-Type": "application/json",
  Authorization: `Basic ${HDB_AUTH_TOKEN}`, // Assumes your base64 encoded credentials
};
