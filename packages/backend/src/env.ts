import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

// Resolve from this module so startup does not depend on the working directory.
config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });
