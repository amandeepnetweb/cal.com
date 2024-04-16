import type { NextApiRequest } from "next";

import { symmetricEncrypt } from "@calcom/lib/crypto";

import {
  CALCOM_APP_CREDENTIAL_ENCRYPTION_KEY,
  CALCOM_CREDENTIAL_SYNC_SECRET,
  CALCOM_CREDENTIAL_SYNC_HEADER_NAME,
} from "../../constants";
import { generateGoogleCalendarAccessToken } from "../../lib/integrations";

export default async function handler(req: NextApiRequest, res) {
  const isInvalid = req.query["invalid"] === "1";
  const userId = parseInt(req.query["userId"] as string);
  try {
    const result = await fetch("http://localhost:3000/api/webhook/app-credential", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [CALCOM_CREDENTIAL_SYNC_HEADER_NAME]: CALCOM_CREDENTIAL_SYNC_SECRET,
      },
      body: JSON.stringify({
        userId,
        appSlug: "google-calendar",
        keys: symmetricEncrypt(
          JSON.stringify({
            access_token: isInvalid ? 1233231231231 : await generateGoogleCalendarAccessToken(),
          }),
          CALCOM_APP_CREDENTIAL_ENCRYPTION_KEY
        ),
      }),
    });
    const clonedResult = result.clone();
    try {
      if (result.ok) {
        const json = await result.json();
        return res.status(200).json(json);
      } else {
        return res.status(400).json({ error: await clonedResult.text() });
      }
    } catch (e) {
      return res.status(400).json({ error: await clonedResult.text() });
    }
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "Internal Server Error", error: error.message });
  }
}
