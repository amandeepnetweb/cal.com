import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } from "../constants";

export async function generateGoogleCalendarAccessToken() {
  const keys = {
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uris: [
      "http://localhost:3000/api/integrations/googlecalendar/callback",
      "http://localhost:3000/api/auth/callback/google",
    ],
  };
  const clientId = keys.client_id;
  const clientSecret = keys.client_secret;
  const refresh_token = GOOGLE_REFRESH_TOKEN;

  const url = "https://oauth2.googleapis.com/token";
  const data = {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refresh_token,
    grant_type: "refresh_token",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(data),
    });

    const json = await response.json();
    if (json.access_token) {
      console.log("Access Token:", json.access_token);
      return json.access_token;
    } else {
      console.error("Failed to retrieve access token:", json);
      return null;
    }
  } catch (error) {
    console.error("Error fetching access token:", error);
    return null;
  }
}

export async function generateZoomAccessToken() {
  const keys = {
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uris: [
      "http://localhost:3000/api/integrations/googlecalendar/callback",
      "http://localhost:3000/api/auth/callback/google",
    ],
  };
  const clientId = keys.client_id;
  const clientSecret = keys.client_secret;
  const refresh_token = GOOGLE_REFRESH_TOKEN;

  const url = "https://oauth2.googleapis.com/token";
  const data = {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refresh_token,
    grant_type: "refresh_token",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(data),
    });

    const json = await response.json();
    if (json.access_token) {
      console.log("Access Token:", json.access_token);
      return json.access_token;
    } else {
      console.error("Failed to retrieve access token:", json);
      return null;
    }
  } catch (error) {
    console.error("Error fetching access token:", error);
    return null;
  }
}
