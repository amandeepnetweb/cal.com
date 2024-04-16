import { describe } from "vitest";

import {
  getGoogleCalendarCredential,
  getOrganizer,
} from "@calcom/web/test/utils/bookingScenario/bookingScenario";

import EventManager from "./EventManager";

describe("EventManager tests", () => {
  describe("Constructor", () => {
    it("Should create an instance and organize all credentials", () => {
      const organizer = getOrganizer();

      const eventManager = new EventManager({
        credentials: [getGoogleCalendarCredential()],
        destinationCalendar: {
          id: 1,
          integration: "google_calendar",
          externalId: "test@google-calendar.com",
          primaryEmail: "test@test.com",
          userId: 1,
          credentialId: 1,
          eventTypeId: 1,
        },
      });
    });
  });
});
