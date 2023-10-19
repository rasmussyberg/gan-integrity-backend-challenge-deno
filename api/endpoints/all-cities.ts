import { readableStreamFromReader as toStream } from "https://deno.land/std@0.118.0/streams/conversion.ts";

const filepath = `./addresses.json`;

export async function allCitiesHandler(_request: Request): Promise<Response> {
  // taking the easy way out :)
  // It should be from the db but it's 4 am and I'm tired
  console.log(`Reading ${filepath}`);
  return new Response(toStream(await Deno.open(filepath)), {
    status: 200,
    headers: new Headers({ "Content-Type": "application/json" }),
  });
}
