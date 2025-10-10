import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, TransformStream } from 'stream/web';
import { MessageChannel } from 'worker_threads';

// Mock ngDevMode
(global as typeof global & { ngDevMode: boolean }).ngDevMode = true;

// Polyfill Web APIs BEFORE importing undici
global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
global.ReadableStream = ReadableStream as unknown as typeof global.ReadableStream;
global.TransformStream = TransformStream as unknown as typeof global.TransformStream;

// Polyfill MessagePort
const { port1 } = new MessageChannel();
global.MessagePort = port1.constructor as typeof global.MessagePort;

// Import undici after all polyfills
import { fetch, Headers, Request, Response, FormData } from 'undici';

// Polyfill fetch for Firebase tests
global.fetch = fetch as unknown as typeof global.fetch;
global.Headers = Headers as unknown as typeof global.Headers;
global.Request = Request as unknown as typeof global.Request;
global.Response = Response as unknown as typeof global.Response;
global.FormData = FormData as unknown as typeof global.FormData;

setupZoneTestEnv({
	errorOnUnknownElements: true,
	errorOnUnknownProperties: true
});
