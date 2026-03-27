/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("http");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const host = process.env.HOST || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname: host, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    http
      .createServer((req, res) => {
        handle(req, res);
      })
      .listen(port, host, () => {
        console.log(`> Server ready on http://${host}:${port}`);
      });
  })
  .catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
