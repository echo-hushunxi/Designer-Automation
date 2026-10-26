#!/usr/bin/env node
import {runDeliveryWorker} from '../lib/experience-delivery.mjs';
try {
  await runDeliveryWorker(process.argv[2]);
} catch {
  process.exitCode = 1;
}
