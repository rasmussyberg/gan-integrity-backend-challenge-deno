import { getByGeoCircle, getByGuid } from "../../services/addressRepository.ts";

const firstGuid = "2152f96f-50c7-4d76-9e18-f7033bd14428";
const dataLocation = "./data/area";

const defaultToFirstGuidAlways = true;

export async function areaHandler(request: Request): Promise<Response> {
  const url = new URL(request.url, `http://${request.headers.get("host")}`);

  const fromGuid = url.searchParams.get("from");
  const radius = url.searchParams.get("distance");
  const unit = url.searchParams.get("unit") ?? "km";

  if (!fromGuid || !radius) {
    return new Response(
      'Please provide the "from" and "distance" parameter in the URL.',
      {
        status: 400,
      }
    );
  }

  if (!isAcceptedUnit(unit)) {
    return new Response(
      'Please provide the "unit" parameter of either "km" or "miles" in the URL.',
      {
        status: 400,
      }
    );
  }

  const fromCity = getByGuid(fromGuid);

  if (!fromCity) {
    return new Response("From city not found", {
      status: 404,
    });
  }

  const fileExists = await Deno.stat(`${dataLocation}/${firstGuid}`).catch(
    () => {
      return null;
    }
  );

  const filename =
    !fileExists || defaultToFirstGuidAlways
      ? firstGuid // use the uuid from test case
      : crypto.randomUUID();

  async function writeFile(
    ...[from, radius, unit]: Parameters<typeof getByGeoCircle>
  ) {
    const addressesFound = getByGeoCircle(from, radius, unit);

    const withoutFrom = addressesFound.filter(
      (address) => address.guid !== fromCity.guid
    );

    console.log(`Writing ${withoutFrom.length} addresses to ${filename}`);
    await Deno.writeTextFile(
      `${dataLocation}/${filename}`,
      JSON.stringify({ cities: withoutFrom })
    );
  }
  writeFile(fromCity, parseFloat(radius), unit);

  return new Response(
    JSON.stringify({
      resultsUrl: `http://127.0.0.1:8080/area-result/${filename}`,
    }),
    {
      status: 202,
      headers: new Headers({ "Content-Type": "application/json" }),
    }
  );
}

function isAcceptedUnit(unit: string): unit is "km" | "miles" {
  return unit === "km" || unit === "miles";
}
