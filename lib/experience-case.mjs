import {digest,requireText} from './io.mjs';

export function caseContent(input) {
  for (const key of ['summary','cause','prevention','actor']) requireText(input[key],key);
  if (!['general','site-preference','hard-failure','unclassified'].includes(input.classification)) throw Error('Invalid experience classification');
  if (!Array.isArray(input.scope?.pages) || !input.scope.pages.length || input.scope.pages.some(p => typeof p !== 'string' || !p)) throw Error('Experience requires page scope');
  if (input.scope.site !== undefined) requireText(input.scope.site,'Site identity');
  if (input.classification === 'site-preference' && !input.scope.site) throw Error('Site preference needs site identity');
  if (!Array.isArray(input.evidence) || !input.evidence.length || input.evidence.some(e => !/^[a-f0-9]{64}$/.test(e.candidate || ''))) throw Error('Experience needs exact candidate evidence');
  if (input.verification !== undefined && (!input.verification || typeof input.verification !== 'object' || Array.isArray(input.verification) || ['retested','designerApproved'].some(key=>input.verification[key] !== undefined && typeof input.verification[key] !== 'boolean'))) throw Error('Invalid experience verification');
  // Reconstruct the same identity for local retries, MongoDB and old JSON imports.
  return {summary:input.summary,cause:input.cause,prevention:input.prevention,classification:input.classification,scope:input.scope,evidence:input.evidence,verification:input.verification || {},actor:input.actor};
}
export const caseId = content => 'case-'+digest(content).slice(0,32);
export function validatePublication(entry,{expectedRevision,actor,reason}) {
  requireText(actor,'Maintainer'); requireText(reason,'Validation reason');
  if (!entry || entry.revision !== expectedRevision) throw Error('Experience revision is absent or stale');
  if (entry.classification === 'unclassified') throw Error('Unclassified dialogue feedback must be investigated before activation');
  if (entry.verification.retested !== true || entry.verification.designerApproved !== true) throw Error('Retest and designer approval are required before shared activation');
}
export function validateStoredCase(entry) {
  if (caseId(caseContent(entry)) !== entry.id) throw Error('Stored case identity does not match its content');
  if (!['candidate','active'].includes(entry.status) || !Number.isInteger(entry.revision) || entry.revision < 1 || !Number.isFinite(Date.parse(entry.createdAt))) throw Error('Invalid stored case lifecycle');
  if (entry.status === 'active') {
    validatePublication(entry,{expectedRevision:entry.revision,actor:entry.publishedBy,reason:entry.reason});
    if (entry.revision < 2 || !Number.isFinite(Date.parse(entry.publishedAt))) throw Error('Invalid published case metadata');
  }
  return entry;
}
