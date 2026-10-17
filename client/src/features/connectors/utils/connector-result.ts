import { NextResponse } from "next/server";

export function connectorResult(
  connector: string,
  name: string,
  status: "connected" | "error"
) {
  return new NextResponse(
    `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${name}</title>
        </head>

        <body>
          <script>
            window.opener?.postMessage(
              {
                type: "connector",
                connector: "${connector}",
                status: "${status}"
              },
              window.location.origin
            );

            window.close();
          </script>

          <p>
            ${
              status === "connected"
                ? `${name} connected successfully.`
                : `Unable to connect ${name}.`
            }
          </p>
        </body>
      </html>
    `,
    {
      headers: {
        "Content-Type": "text/html",
      },
    }
  );
}
