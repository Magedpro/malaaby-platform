import { Stadiums } from '../src/lib/db';

async function check() {
  const stadium = await Stadiums.findBySlug('tarek');
  console.log('Stadium "tarek" data:', JSON.stringify(stadium, null, 2));
}

check().catch(console.error);
