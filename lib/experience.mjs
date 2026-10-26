import path from 'node:path';
import {digest, readJSON, writeJSON, exists, locked, requireText} from './io.mjs';
import {loadTask,mutateTask,saveTask} from './workbench.mjs';
import {caseContent,caseId,capturedCase,validatePublication} from './experience-case.mjs';

export class ExperienceStore {
  constructor(directory) { this.directory = directory; this.file = path.join(directory, 'store.json'); this.queue = Promise.resolve(); }
  mutate(action) {
    const pending = this.queue.then(() => locked(this.directory,action));
    this.queue = pending.catch(() => {}); return pending;
  }
  async read() { return await exists(this.file) ? readJSON(this.file) : {version:1,revision:0,cases:[]}; }
  async capture(input) {
    const content = caseContent(input), id = caseId(content);
    return this.mutate(async () => {
      const state = await this.read(), old = state.cases.find(c => c.id === id);
      if (old) return old;
      const entry = capturedCase(content);
      await writeJSON(this.file, {...state,revision:state.revision+1,cases:[...state.cases,entry]}); return entry;
    });
  }
  async search({pages = [], site, query = '', includeCandidates = false} = {}) {
    const state = await this.read();
    const cases = state.cases.filter(c => (includeCandidates || c.status === 'active')
      && (!c.scope.site || c.scope.site === site)
      && (!pages.length || c.scope.pages.includes('*') || c.scope.pages.some(p => pages.includes(p)))
      && (!query || (c.summary+' '+c.cause+' '+c.prevention).toLowerCase().includes(query.toLowerCase())));
    return {revision:state.revision,cases,hash:digest(cases)};
  }
  async publish({id, expectedRevision, actor, reason}) {
    requireText(actor, 'Maintainer'); requireText(reason, 'Validation reason');
    return this.mutate(async () => {
      const state = await this.read(), entry = state.cases.find(c => c.id === id);
      validatePublication(entry,{expectedRevision,actor,reason});
      if (entry.status === 'active') return entry;
      const active = {...entry,status:'active',revision:entry.revision+1,publishedBy:actor,reason,publishedAt:new Date().toISOString()};
      await writeJSON(this.file, {...state,revision:state.revision+1,cases:state.cases.map(c => c.id === id ? active : c)}); return active;
    });
  }
}

export {ExperienceClient} from './experience-client.mjs';

function taskLesson(task,lesson,actor) {
  const candidate = task.candidates.at(-1), approved = task.approval?.candidate === candidate?.hash;
  if (!candidate) throw Error('No candidate to learn from');
  const corrections = task.feedback.filter(f=>f.decision === 'revise');
  const repairs = (task.events || []).filter(e=>e.type === 'repair');
  if (!corrections.length && !repairs.length) throw Error('Preserve actual correction feedback or repair history before extracting a lesson');
  const classification = lesson.classification || 'general';
  return {
    summary:requireText(lesson.summary,'Summary'),cause:requireText(lesson.cause,'Confirmed cause'),prevention:requireText(lesson.prevention,'Transferable prevention'),actor:requireText(actor,'Actor'),classification,
    scope:{pages:[...new Set(task.config.pages.map(p=>p.family))],...(classification === 'site-preference' ? {site:task.repo} : {})},
    evidence:[...corrections.map(f=>({candidate:f.candidate,feedback:f.text,feedbackId:f.id})),...repairs.map(e=>({candidate:e.from,files:e.files,at:e.at,source:'recorded-repair'})),{candidate:candidate.hash,sourceHash:digest(candidate.source),artifactHash:candidate.artifactHash}],
    verification:{retested:task.checks.length > 0 && task.checks.every(c=>task.results[c.id]?.candidate === candidate.hash && task.results[c.id].status === 'pass'),designerApproved:approved,candidate:candidate.hash},
    ...(approved ? {approval:{decision:'approve',actor:task.approval.actor,text:task.approval.text,candidate:candidate.hash,at:task.approval.at,feedbackId:task.feedback.at(-1).id}} : {})
  };
}
export async function learnTask({data,id,actor,summary,cause,prevention,classification = 'general',client}) {
  const lesson = {summary,cause,prevention,classification};
  const task = await mutateTask(data,id,async current=>{
    const entry = taskLesson(current,lesson,actor); caseContent(entry);
    const next = {...current,lessonDrafts:[...(current.lessonDrafts || []),{candidate:current.candidates.at(-1).hash,lesson,actor}]};
    await saveTask(data,next); return next;
  });
  return client.capture(taskLesson(task,lesson,actor));
}
export async function captureDialogue({data,id,client}) {
  const task = await loadTask(data,id), feedback = task.feedback.at(-1);
  if (!feedback) throw Error('No actual designer feedback to capture');
  if (feedback.decision === 'approve' && feedback.lessons?.length) {
    const records = [];
    for (const lesson of feedback.lessons) records.push(await client.capture(taskLesson(task,lesson,feedback.actor)));
    return {sync:records.some(r=>r.sync === 'queued') ? 'queued' : 'saved',records};
  }
  const entry = {summary:feedback.text,cause:'Pending investigation; original designer feedback is preserved',prevention:'Pending verified correction; do not treat raw feedback as a shared rule',actor:feedback.actor,classification:'unclassified',scope:{pages:[...new Set(task.config.pages.map(p=>p.family))],site:task.repo},evidence:[{candidate:feedback.candidate,feedbackId:feedback.id,decision:feedback.decision}],verification:{retested:false,designerApproved:false}};
  return client.capture(entry);
}
