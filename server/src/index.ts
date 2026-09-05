import { createApp } from './app';
import { env } from './env';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[api] Teegold API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});
