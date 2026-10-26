import {z} from 'zod';
const candidate = z.string().regex(/^[a-f0-9]{64}$/);
export const experienceCaseSchema = z.object({
  summary:z.string().min(1),cause:z.string().min(1),prevention:z.string().min(1),actor:z.string().min(1),
  classification:z.enum(['general','site-preference','hard-failure','unclassified']),
  scope:z.object({pages:z.array(z.string()).min(1),site:z.string().optional()}),
  evidence:z.array(z.object({candidate}).passthrough()).min(1),
  verification:z.object({retested:z.boolean().optional(),designerApproved:z.boolean().optional(),candidate:candidate.optional()}).optional(),
  approval:z.object({decision:z.literal('approve'),actor:z.string().min(1),text:z.string().min(1),candidate,at:z.string().datetime(),feedbackId:z.string().optional()}).optional()
});
export const experienceSearchSchema = {pages:z.array(z.string()).optional(),site:z.string().optional(),query:z.string().optional(),knownHash:z.string().optional()};
