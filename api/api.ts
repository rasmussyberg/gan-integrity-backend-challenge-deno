import { allCitiesHandler } from "./endpoints/all-cities.ts";
import { areaResultHandler } from "./endpoints/area-result.ts";
import { areaHandler } from "./endpoints/area.ts";
import { citiesByTagHandler } from './endpoints/cities-by-tag.ts';
import { distanceHandler } from './endpoints/distance.ts';

export async function apiHandler(request: Request): Promise<Response | void> {
  const url = new URL(request.url, `http://${request.headers.get('host')}`);

  const path = url.pathname.split("/")[1]
  console.log(`Handling ${path}`)
  if (path === 'cities-by-tag') {
    return citiesByTagHandler(request);
  }

  if (path === 'distance') {
    return distanceHandler(request);
  }

  if (path === 'area') {
    return await areaHandler(request);
  }

  if (path === 'area-result') {
    return await areaResultHandler(request);
  }

  if (path === 'all-cities') {
    return await allCitiesHandler(request);
  }
}
