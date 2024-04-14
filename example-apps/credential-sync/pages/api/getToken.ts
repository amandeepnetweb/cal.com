import type { NextApiRequest, NextApiResponse } from "next";

import { CALCOM_CREDENTIAL_SYNC_HEADER_NAME, CALCOM_CREDENTIAL_SYNC_SECRET } from "../../constants";
import { generateGoogleCalendarAccessToken } from "../../lib/integrations";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const secret = req.headers[CALCOM_CREDENTIAL_SYNC_HEADER_NAME];
  if (!secret) {
    return res.status(403).json({ message: "secret header not set" });
  }
  if (secret !== CALCOM_CREDENTIAL_SYNC_SECRET) {
    return res.status(403).json({ message: "Invalid secret" });
  }
  const calcomUserId = req.body.calcomUserId;
  const appSlug = req.body.appSlug;
  console.log({
    calcomUserId,
    appSlug,
  });
  if (appSlug === "google-calendar") {
    // Respond as per app and userId
    res.status(200).json({
      _1: true,
      access_token: await generateGoogleCalendarAccessToken(),
    });
    return;
  } else if (appSlug === "zoom") {
    res.status(200).json({
      _1: true,
      access_token: await generateGoogleCalendarAccessToken(),
    });
  }
  throw new Error("Unhandled values");
}
