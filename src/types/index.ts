// User Types
export interface User {
  id: string
  email: string
  name: string
  userType: 'teacher' | 'student' | 'admin'
  schoolName?: string
  gradeLevel?: number
  profileImage?: string
  createdAt: Date
  updatedAt: Date
}

// Textbook Types
export interface Textbook {
  id: string
  teacherId: string
  title: string
  description?: string
  subject: string
  gradeLevel: number
  totalPages: number
  coverImage?: string
  status: 'draft' | 'published' | 'archived'
  publishedAt?: Date
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface TextbookPage {
  id: string
  textbookId: string
  pageNumber: number
  content: string
  imageUrl?: string
  imagePrompt?: string
  estimatedReadingTime: number
  difficulty: number
  keywords: string[]
  questions: Question[]
  createdAt: Date
}

// Question Types
export interface Question {
  id: string
  pageId: string
  questionText: string
  questionType: 'multiple_choice' | 'short_answer' | 'essay' | 'true_false'
  suggestedAnswer: string
  answerExplanation?: string
  hints: string[]
  difficulty: number
  points: number
  options?: QuestionOption[]
}

export interface QuestionOption {
  id: string
  text: string
  isCorrect: boolean
}

// Learning Types
export interface LearningSession {
  id: string
  studentId: string
  textbookId: string
  pageId: string
  startedAt: Date
  endedAt?: Date
  duration?: number
  aiInteractionsCount: number
  questionsAttempted: number
  questionsCorrect: number
}

export interface StudentAnswer {
  id: string
  studentId: string
  questionId: string
  sessionId: string
  answerText: string
  isCorrect?: boolean
  score?: number
  timeSpent: number
  attemptNumber: number
  aiFeedback?: string
  teacherFeedback?: string
  submittedAt: Date
}

// AI Types
export interface AIConversation {
  id: string
  sessionId: string
  studentId: string
  pageId?: string
  threadId: string
  messages: AIMessage[]
  createdAt: Date
}

export interface AIMessage {
  id: string
  role: 'student' | 'ai' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    tokensUsed?: number
    responseTime?: number
    model?: string
  }
}

// Writing Types
export interface WritingAssignment {
  id: string
  teacherId: string
  title: string
  prompt: string
  genre: 'narrative' | 'argumentative' | 'expository' | 'descriptive' | 'creative'
  requirements: WritingRequirements
  rubric?: WritingRubric
  dueDate?: Date
  publishedAt?: Date
  createdAt: Date
}

export interface WritingRequirements {
  minLength: number
  maxLength: number
  includeElements?: string[]
  format?: string
}

export interface WritingRubric {
  criteria: RubricCriterion[]
  totalPoints: number
}

export interface RubricCriterion {
  name: string
  description: string
  maxPoints: number
  levels: RubricLevel[]
}

export interface RubricLevel {
  score: number
  description: string
}

export interface WritingSubmission {
  id: string
  assignmentId: string
  studentId: string
  content: string
  wordCount: number
  isDraft: boolean
  submittedAt: Date
  aiEvaluation?: AIEvaluation
  teacherEvaluation?: TeacherEvaluation
  version: number
}

// Evaluation Types
export interface AIEvaluation {
  overallScore: number
  strengths: string[]
  improvements: string[]
  detailedFeedback: {
    structure?: EvaluationDetail
    grammar?: EvaluationDetail
    coherence?: EvaluationDetail
    creativity?: EvaluationDetail
    vocabulary?: EvaluationDetail
  }
  suggestions: string[]
  evaluatedAt: Date
}

export interface EvaluationDetail {
  score: number
  comment: string
  examples?: string[]
}

export interface TeacherEvaluation {
  score: number
  feedback: string
  evaluatedAt: Date
  evaluatedBy: string
}

// Progress Types
export interface StudentProgress {
  studentId: string
  textbookId: string
  currentPage: number
  completionRate: number
  totalTimeSpent: number
  lastAccessedAt: Date
  pageProgress: PageProgress[]
}

export interface PageProgress {
  pageNumber: number
  status: 'not_started' | 'in_progress' | 'completed'
  timeSpent: number
  questionsAnswered: number
  correctAnswers: number
  lastVisited?: Date
}

// Analytics Types
export interface ClassAnalytics {
  classId: string
  totalStudents: number
  averageProgress: number
  averageScore: number
  activeStudents: number
  strugglingStudents: StudentMetric[]
  topPerformers: StudentMetric[]
}

export interface StudentMetric {
  studentId: string
  studentName: string
  metric: number
  trend: 'improving' | 'stable' | 'declining'
}