import type { IncomingMessage, ServerResponse } from 'node:http';
import { learningHttp } from '../server/learningHttp.ts';

export default function aprendizado(request: IncomingMessage, response: ServerResponse) {
  return learningHttp(request, response, process.env);
}
