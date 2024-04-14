import type { z } from "zod";

import {
  APP_CREDENTIAL_SHARING_ENABLED,
  CREDENTIAL_SYNC_ENDPOINT,
  CREDENTIAL_SYNC_SECRET,
  CREDENTIAL_SYNC_SECRET_HEADER_NAME,
} from "@calcom/lib/constants";
import logger from "@calcom/lib/logger";
import { safeStringify } from "@calcom/lib/safeStringify";

import type { OAuth2UniversalSchema } from "../../_auth/universalSchema";
import { OAuth2UniversalSchemaWithCalcomBackwardCompatibility } from "../../_auth/universalSchema";

const credentialSyncEnabled =
  APP_CREDENTIAL_SHARING_ENABLED && process.env.CALCOM_CREDENTIAL_SYNC_ENDPOINT && CREDENTIAL_SYNC_SECRET;
const log = logger.getSubLogger({ prefix: ["app-store/_utils/oauth/authInterface"] });

/**
 * Manages OAuth2.0 tokens for an app and resourceOwner
 */
export const authInterface = ({
  resourceOwner,
  appSlug: slug,
  currentTokenObject,
  fetchNewTokenObject,
  doesResponseInvalidatesToken,
  isTokenResponseValid,
}: {
  resourceOwner:
    | {
        id: number | null;
        type: "team";
      }
    | {
        id: number | null;
        type: "user";
      };
  currentTokenObject: z.infer<typeof OAuth2UniversalSchema>;
  /**
   * The unique identifier of the app that the token is for. It is required to do credential syncing in self-hosting
   */
  appSlug: string;
  /**
   *
   * It could be null in case refresh_token isn't available. This is possible when credential sync happens from a third party who doesn't want to share refresh_token
   */
  fetchNewTokenObject: ({ refreshToken }: { refreshToken: string | null }) => Promise<Response | null>;
  isTokenResponseValid: (token: z.infer<typeof OAuth2UniversalSchema> | null) => Promise<boolean> | boolean;
  doesResponseInvalidatesToken: (response: Response) => Promise<boolean>;
}) => {
  ensureValidResourceOwner(resourceOwner);

  const getTokenObjectOrFetch = async () => {
    const isValid = await isTokenResponseValid(currentTokenObject);
    const refreshToken = currentTokenObject.refresh_token ?? null;
    log.debug(
      "getTokenObjectOrFetch called",
      safeStringify({
        isValid,
        refreshToken,
      })
    );

    if (isValid) {
      return { token: currentTokenObject, isUpdated: false };
    } else {
      const token = await refreshOAuthTokens({
        refresh: async () => {
          return fetchNewTokenObject({ refreshToken });
        },
        appSlug: slug,
        userId: resourceOwner.id,
        doesResponseInvalidatesToken,
      });

      if (token && !token.expiry_date) {
        // Update expiry manually because if we keep using the old expiry the credential would expire soon
        // Use a practically infinite expiry(a year). Token is expected to be refreshed anyway in the meantime.
        token.expiry_date = Date.now() + 365 * 24 * 3600 * 1000;
      }

      return { token, isUpdated: true };
    }
  };

  return {
    getTokenObjectOrFetch,
    getAndValidateOAuth2Response,
  };
};

const refreshOAuthTokens = async ({
  refresh,
  appSlug,
  userId,
  doesResponseInvalidatesToken,
}: {
  refresh: () => Promise<Response | null>;
  appSlug: string;
  userId: number | null;
  /**
   *  @param response The response from the refreshFunction
   * `response` is a clone of the original response, so it can be consumed again
   */
  doesResponseInvalidatesToken: (response: Response) => Promise<boolean>;
}) => {
  let response;

  if (userId && CREDENTIAL_SYNC_ENDPOINT && CREDENTIAL_SYNC_SECRET_HEADER_NAME && CREDENTIAL_SYNC_SECRET) {
    log.debug(
      "Refreshing OAuth token from credential sync endpoint",
      safeStringify({
        appSlug,
        userId,
        endpoint: process.env.CALCOM_CREDENTIAL_SYNC_ENDPOINT,
      })
    );

    try {
      response = await fetch(CREDENTIAL_SYNC_ENDPOINT, {
        method: "POST",
        headers: {
          [CREDENTIAL_SYNC_SECRET_HEADER_NAME]: CREDENTIAL_SYNC_SECRET,
        },
        body: new URLSearchParams({
          calcomUserId: userId.toString(),
          appSlug,
        }),
      });
    } catch (e) {
      log.error("Could not refresh the token.", safeStringify(e));
      throw new Error(
        `Could not refresh the token due to connection issue with the endpoint: ${process.env.CALCOM_CREDENTIAL_SYNC_ENDPOINT}`
      );
    }

    const clonedResponse = response.clone();
    log.debug(
      "Response from credential sync endpoint",
      safeStringify({
        text: await clonedResponse.text(),
        ok: clonedResponse.ok,
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
      })
    );
  } else {
    log.debug(
      "Refreshing OAuth token",
      safeStringify({
        appSlug,
        userId,
      })
    );
    response = await refresh();
  }

  const { json } = await getAndValidateOAuth2Response({ doesResponseInvalidatesToken, response });
  const parsedToken = OAuth2UniversalSchemaWithCalcomBackwardCompatibility.safeParse(json);
  if (!parsedToken.success) {
    log.error("Token parsing error:", safeStringify(parsedToken.error.issues));
    throw new Error("Invalid token response");
  }
  return parsedToken.data;
};

async function getAndValidateOAuth2Response({
  doesResponseInvalidatesToken,
  response,
}: {
  doesResponseInvalidatesToken: (response: Response) => Promise<boolean>;
  response: Response | null;
}) {
  if (!response) {
    return { isValid: true, json: null };
  }

  if (await doesResponseInvalidatesToken(response.clone())) {
    return { isValid: false, json: null };
  }

  if (!response.ok || (response.status < 200 && response.status >= 300)) {
    throw new Error(response.statusText);
  }

  // handle 204 response code with empty response (causes crash otherwise as "" is invalid JSON)
  if (response.status === 204) {
    return { isValid: true, json: null };
  }
  const json = (await response.json()) as unknown;

  return { isValid: true, json: json };
}

function ensureValidResourceOwner(
  resourceOwner: { id: number | null; type: "team" } | { id: number | null; type: "user" }
) {
  if (resourceOwner.type === "team") {
    throw new Error("Teams are not supported");
  } else {
    if (!resourceOwner.id) {
      throw new Error("resourceOwner should have id set");
    }
  }
}
