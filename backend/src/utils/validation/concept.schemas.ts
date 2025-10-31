import { z } from 'zod';

// Enum schemas
export const RelationTypeSchema = z.enum([
  'PREREQUISITE',
  'RELATED',
  'EXTENDS',
  'CONTRASTS',
  'APPLIES'
]);

export const DifficultyLevelSchema = z.number().int().min(1).max(5);
export const MasteryLevelSchema = z.number().int().min(1).max(5);

// Extract concepts schema
export const extractConceptsSchema = z.object({
  body: z.object({
    textbookId: z.string().uuid('교재 ID 형식이 올바르지 않습니다'),
    text: z.string()
      .min(1, '텍스트는 최소 1자 이상이어야 합니다')
      .max(50000, '텍스트가 최대 길이(50,000자)를 초과했습니다. 텍스트를 줄여주세요.')
      .optional(), // text is optional - backend will extract from textbook pages if not provided
    grade: z.number().int().min(1, '학년은 1 이상이어야 합니다').max(12, '학년은 12 이하여야 합니다').optional(),
    subject: z.string().max(100, '과목명은 100자 이하여야 합니다').optional()
  })
});

// Update concept schema
export const updateConceptSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid concept ID format')
  }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional().nullable(),
    difficulty: DifficultyLevelSchema.optional(),
    category: z.string().max(100).optional().nullable(),
    keywords: z.array(z.string().max(100)).max(20).optional(),
    learningObjectives: z.array(z.string().max(500)).max(10).optional(),
    inquiryQuestions: z.array(z.string().max(500)).max(10).optional()
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  )
});

// Create concept relation schema
export const createConceptRelationSchema = z.object({
  body: z.object({
    fromId: z.string().uuid('Invalid fromId format'),
    toId: z.string().uuid('Invalid toId format'),
    type: RelationTypeSchema,
    strength: z.number().min(0).max(1).optional().default(1.0),
    description: z.string().max(500).optional().nullable()
  }).refine(
    (data) => data.fromId !== data.toId,
    { message: 'Cannot create self-referencing relation' }
  )
});

// Delete concept schema
export const deleteConceptSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid concept ID format')
  })
});

// Delete relation schema
export const deleteRelationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid relation ID format')
  })
});

// Get textbook concepts schema
export const getTextbookConceptsSchema = z.object({
  params: z.object({
    textbookId: z.string().uuid('Invalid textbook ID format')
  })
});

// Get concept schema
export const getConceptSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid concept ID format')
  })
});

// Get student mastery schema
export const getStudentMasterySchema = z.object({
  query: z.object({
    textbookId: z.string().uuid('Invalid textbook ID format').optional()
  })
});

// Update mastery schema
export const updateMasterySchema = z.object({
  params: z.object({
    conceptId: z.string().uuid('Invalid concept ID format')
  }),
  body: z.object({
    masteryLevel: MasteryLevelSchema,
    evidence: z.any().optional()
  })
});

// Generate inquiry questions schema
export const generateInquiryQuestionsSchema = z.object({
  params: z.object({
    conceptId: z.string().uuid('Invalid concept ID format')
  }),
  body: z.object({
    studentResponse: z.string().max(5000).optional()
  })
});

// Get concept graph schema
export const getConceptGraphSchema = z.object({
  params: z.object({
    textbookId: z.string().uuid('Invalid textbook ID format')
  })
});

// Type exports for request bodies
export type ExtractConceptsInput = z.infer<typeof extractConceptsSchema>['body'];
export type UpdateConceptInput = z.infer<typeof updateConceptSchema>['body'];
export type CreateConceptRelationInput = z.infer<typeof createConceptRelationSchema>['body'];
export type UpdateMasteryInput = z.infer<typeof updateMasterySchema>['body'];
export type GenerateInquiryQuestionsInput = z.infer<typeof generateInquiryQuestionsSchema>['body'];
