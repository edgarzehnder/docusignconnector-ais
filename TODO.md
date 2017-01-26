Improvements
------------

1. The connector only accepts one document - extend for several ones. Both the DS API and AIS support the signing of several documents simultaneously - it's just not implemented in the connector yet.

> Should be easy with Multipart/MIME?

2. With the newest API, DocuSign returns a "CustomerID" which the connector should check before starting the signing process. The check is made against an additional ENV variable which needs to be configured for each customer (e.g. with each instance). If the ID does not match, the connector returns an error.

3. Improve Logging (INFO and DEBUG modes - log files instead of using the console).

> I suggest using the [Winston](https://github.com/winstonjs/winston) framework for loggin purposes.

4. Improve Error Handling.

> Suggestion is to fail early if contracts are not met (some 400-403 errors) and return gateway errors (502-504) if backend is unable to process the request (programming mistakes will occur ;-).

5. The polling should be done by the client, the redirect to /poll bit could be implemented more nicely.

> Maybe there's a channce to use Server-Sent Events (SSE) which is supported by all modern browsers. Maybe for IE there should be a fallback solution.

6. Multi-threading (serve multiple simultaneous requests) capabilities of nodejs.

> Node.JS is single-threaded by nature. Incoming requests are handled by asynchronouus call-backs, so the event loop returns immediately to handle further incoming requests.
