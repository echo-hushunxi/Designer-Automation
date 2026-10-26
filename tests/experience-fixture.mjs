import {digest} from '../lib/io.mjs';
export const candidate = digest('synthetic-current-candidate');
export const lessonSpec = (key = 'capacity.long-title') => ({
  summary: 'Preserve long offer titles on narrow cards',
  cause: 'A fixed text track consumed the available width',
  prevention:
    'Allow the title track to wrap within its actual card content width',
  classification: 'general',
  component: 'offer-card',
  pages: ['home'],
  learning: {
    key,
    when: 'Offer cards display long content near a narrow breakpoint',
    exceptions: [],
    transferable: true,
  },
});
export function sample({
  site = 'fixture-a',
  task = 'task-1',
  key = 'capacity.long-title',
  prevention,
  ...rest
} = {}) {
  const l = lessonSpec(key);
  return {
    summary: l.summary,
    cause: l.cause,
    prevention: prevention || l.prevention,
    actor: 'synthetic-agent',
    classification: 'general',
    scope: {pages: ['home'], site, component: l.component},
    learning: l.learning,
    source: {site, task, checkIds: ['home/393/layout']},
    evidence: [{candidate}],
    verification: {
      retested: true,
      designerApproved: true,
      candidate,
      pages: ['home'],
    },
    approval: {
      decision: 'approve',
      actor: 'synthetic-designer',
      text: 'Synthetic approval for protocol fixtures only',
      candidate,
      at: '2026-10-26T00:00:00.000Z',
    },
    ...rest,
  };
}
