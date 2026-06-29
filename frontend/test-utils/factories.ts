import { faker } from "@faker-js/faker";
import type { AuthCredentials, AuthTokens, Note } from "@/types";

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

/** Returns a randomized note. */
export const mockNote = (overrides?: Partial<Note>): Note => ({
  id: faker.string.uuid(),
  title: faker.lorem.sentence(),
  body: faker.lorem.paragraphs(),
  category: faker.helpers.arrayElement(["random_thoughts", "school", "personal"]),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});
