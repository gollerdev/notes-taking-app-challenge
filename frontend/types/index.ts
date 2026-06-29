/** Represents a note returned by the API. */
export interface Note {
  id: string;
  title: string;
  body: string;
  category: string;
  created_at: string;
  updated_at: string;
}

/** Payload for creating a new note. */
export interface CreateNotePayload {
  title: string;
  body: string;
  category?: string;
}

/** Represents an authenticated user. */
export interface User {
  id: number;
  username: string;
  email: string;
}

/** Standard health check response from the backend. */
export interface HealthCheckResponse {
  status: string;
}
