import {loadTask, mutateTask, saveTask} from './workbench.mjs';
import {caseContent} from './experience-case.mjs';
import {taskLesson, feedbackCases, stageFeedback} from './experience-task.mjs';
export {ExperienceStore} from './experience-memory.mjs';
export {ExperienceClient} from './experience-client.mjs';
export async function learnTask({
  data,
  id,
  actor,
  summary,
  cause,
  prevention,
  classification = 'general',
  component,
  pages,
  checkIds,
  learning,
  client,
}) {
  const lesson = {
    summary,
    cause,
    prevention,
    classification,
    component,
    pages,
    checkIds,
    learning,
  };
  const task = await mutateTask(data, id, async (current) => {
    const entry = taskLesson(current, lesson, actor);
    caseContent(entry);
    const next = stageFeedback(
      {
        ...current,
        lessonDrafts: [
          ...(current.lessonDrafts || []),
          {candidate: current.candidates.at(-1).hash, lesson, actor},
        ],
      },
      [entry],
    );
    await saveTask(data, next);
    return next;
  });
  return client.capture(taskLesson(task, lesson, actor));
}
export async function captureDialogue({data, id, client}) {
  const task = await loadTask(data, id),
    records = [];
  for (const entry of feedbackCases(task))
    records.push(await client.capture(entry));
  return {
    sync: records.some((r) => r.sync === 'queued')
      ? 'queued'
      : records.some((r) => r.sync === 'rejected' || r.review?.required)
        ? 'needs-attention'
        : 'saved',
    records,
  };
}
