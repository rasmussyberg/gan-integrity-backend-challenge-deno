import { getByTag } from '../../services/addressRepository.ts';

export function citiesByTagHandler(request: Request): Response {
  const url = new URL(request.url, `http://${request.headers.get('host')}`);

  const tag = url.searchParams.get('tag');
  const isActive = url.searchParams.get('isActive');

  if (!tag) {
    return new Response('Please provide the "tag" parameter in the URL.', {
      status: 400,
    });
  }

  const isActiveBool = isActive === 'true';

  const filteredCities = getByTag(tag, isActiveBool)
  
  return new Response(JSON.stringify({ cities: filteredCities }), {
    status: 200,
    headers: new Headers({ 'Content-Type': 'application/json' }),
  });
}