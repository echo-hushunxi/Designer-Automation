#!/usr/bin/env node
import {superviseDelivery} from '../lib/experience-delivery.mjs';
try {
  await superviseDelivery(process.argv[2]);
} catch {
  process.exitCode = 1;
}
