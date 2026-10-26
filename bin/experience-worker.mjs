#!/usr/bin/env node
import {runDeliveryWorker} from '../lib/experience-delivery.mjs';
// The durable queue survives this process and resumes on the next MCP startup.
try { await runDeliveryWorker(process.argv[2]); } catch { process.exitCode = 1; }
