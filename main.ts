import { load } from 'https://deno.land/std@0.204.0/dotenv/mod.ts';
import { apiHandler } from './api/api.ts';
import { prepareDB } from './services/addressRepository.ts';
await load({ export: true });

const PORT = Deno.env.get('PORT');
const SECRET = Deno.env.get('SECRET');

console.log(`Preparing DB...`);
await prepareDB()
Deno.serve({ port: parseInt(PORT ?? '8000') }, handler);

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url, `http://${request.headers.get('host')}`);
  const authorization =
    request.headers.get('Authorization')?.replace('bearer ', '') ?? '';

  if (!authorization || atob(authorization) !== SECRET) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  const path = url.pathname;

  if (path === '/') {
    return new Response('Ping!', {
      status: 200,
    });
  }

  const response = await apiHandler(request)
  if (response) {
    return response
  }

  return new Response('Not found', {status: 404});
}
