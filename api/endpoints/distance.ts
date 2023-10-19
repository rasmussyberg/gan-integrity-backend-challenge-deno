import { calculateDistance } from '../../libs/geocalc.ts';
import { getByGuid } from '../../services/addressRepository.ts';

export function distanceHandler(request: Request): Response {
  const url = new URL(request.url, `http://${request.headers.get('host')}`);

  const fromGuid = url.searchParams.get('from');
  const toGuid = url.searchParams.get('to');
  const unit = url.searchParams.get('unit') ?? 'km';

  if (!fromGuid || !toGuid) {
    return new Response(
      'Please provide the "from" and "to" parameter in the URL.',
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
  const toCity = getByGuid(toGuid);

  if (!fromCity || !toCity) {
    return new Response('Cities not found', {
      status: 404,
    });
  }

  const distance = calculateDistance(
    { latitude: fromCity.latitude, longitude: fromCity.longitude },
    { latitude: toCity.latitude, longitude: toCity.longitude },
    unit
  );

  return new Response(
    JSON.stringify({
      from: fromCity,
      to: toCity,
      unit,
      distance: parseFloat(distance.toFixed(2)),
    }),
    {
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
    }
  );
}

function isAcceptedUnit(unit: string): unit is 'km' | 'miles' {
  return unit === 'km' || unit === 'miles';
}
