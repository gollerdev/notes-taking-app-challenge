import { faker } from "@faker-js/faker";
import type { AuthCredentials, AuthTokens } from "@/types";

/** Returns a randomized auth credentials payload. */
export const mockAuthPayload = (): AuthCredentials => ({
  email: faker.internet.email(),
  password: faker.internet.password({ length: 12 }),
});

/** Returns a randomized auth token pair. */
export const mockAuthTokens = (): AuthTokens => ({
  access: faker.string.alphanumeric(64),
  refresh: faker.string.alphanumeric(64),
});
