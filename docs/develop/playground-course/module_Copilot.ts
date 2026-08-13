import type { Disposer, JSONSchema, LocaleMessage } from "./base";

export type CopilotTopic = {
  title: LocaleMessage;
  description: string;
  reactToEvents: boolean;
  endable: boolean;
  /** Controls both code-block Copy and code-change Apply helpers in this session. */
  allowCodeHelper: boolean;
};

export type CopilotRound = {
  userMessage: string;
  resultMessages: string[];
};

export type CopilotTextRequest = {
  response: "text";
  message: string;
};

export type CopilotJSONRequest = {
  response: "json";
  message: string;
  schema: JSONSchema;
};

/** Generic Copilot capabilities. This interface has no Course or Tutorial concepts. */
export interface Copilot {
  /** Starts a session under the given Topic, ending the current session first if needed. */
  startSession(topic: CopilotTopic): Promise<void>;

  /** Ends the current session and cancels its in-progress round. */
  endCurrentSession(): void;

  /** Generates one plain-text response without adding a round to the current session. */
  generateResponse(
    request: CopilotTextRequest,
    signal?: AbortSignal,
  ): Promise<string>;

  /** Generates one JSON response conforming to the supplied schema. */
  generateResponse(
    request: CopilotJSONRequest,
    signal?: AbortSignal,
  ): Promise<unknown>;

  /** Subscribes to completed rounds through the module's event-emitter API. */
  on(event: "roundFinish", listener: (round: CopilotRound) => void): Disposer;
}
