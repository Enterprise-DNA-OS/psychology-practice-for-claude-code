import { readFileSync } from 'node:fs';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import path from 'node:path';
const db=await getDb();
try { await db.exec('BEGIN'); await db.exec(readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8')); await db.exec('COMMIT'); console.log('seed: fictional psychology practice ready'); }
catch(e){ await db.exec('ROLLBACK'); throw e; } finally { await db.close(); }
