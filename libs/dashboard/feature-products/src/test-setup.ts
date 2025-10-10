import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder before importing undici
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

import { fetch, Headers, Request, Response, FormData } from 'undici';

// Polyfill fetch for Firebase tests
global.fetch = fetch as typeof global.fetch;
global.Headers = Headers as typeof global.Headers;
global.Request = Request as typeof global.Request;
global.Response = Response as typeof global.Response;
global.FormData = FormData as typeof global.FormData;

setupZoneTestEnv({
	errorOnUnknownElements: true,
	errorOnUnknownProperties: true
});
