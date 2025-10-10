import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import { fetch, Headers, Request, Response } from 'undici';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill fetch, TextEncoder and TextDecoder for Firebase compatibility
global.fetch = fetch as any;
global.Headers = Headers as any;
global.Request = Request as any;
global.Response = Response as any;
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

setupZoneTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});
