import { readableStreamFromReader as toStream } from "https://deno.land/std@0.118.0/streams/conversion.ts";

const dataLocation = "./data/area";

export async function areaResultHandler(request: Request): Promise<Response> {
  const url = new URL(request.url, `http://${request.headers.get("host")}`);

  const resultsetName = url.pathname.split("/")[2];

  if (!resultsetName) {
    return new Response('Please provide the "Resultset Name"', {
      status: 400,
    });
  }

  const filePath = `${dataLocation}/${resultsetName}`;

  const fileExists = await Deno.stat(filePath).catch(() => {
    return null;
  });

  if (!fileExists) {
    return new Response("Resultset not found", {
      status: 202,
    });
  }

  console.log(`Reading ${filePath}`);
  return new Response(toStream(await Deno.open(filePath)), {
    status: 200,
    headers: new Headers({ "Content-Type": "application/json" }),
  });
}
