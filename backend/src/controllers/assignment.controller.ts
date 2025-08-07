import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const assignmentController = {
  // Create a new assignment
  async create(req: Request, res: Response) {
    try {
      const data = req.body;
      const { userId } = req.user as any;

      // Verify teacher owns the textbook
      const textbook = await prisma.textbook.findFirst({
        where: {
          id: data.textbookId,
          authorId: userId,
        },
      });

      if (!textbook) {
        return res.status(404).json({ error: 'Textbook not found' });
      }

      // Verify teacher owns the class
      const classExists = await prisma.class.findFirst({
        where: {
          id: data.classId,
          teacherId: userId,
        },
      });

      if (!classExists) {
        return res.status(404).json({ error: 'Class not found' });
      }

      const assignment = await prisma.assignment.create({
        data: {
          title: data.title,
          description: data.description,
          type: data.type || 'ESSAY',
          dueDate: new Date(data.dueDate),
          points: data.points || 100,
          classId: data.classId,
        },
        include: {
          class: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Send real-time notification to all students in the class
      if (req.socketService) {
        await req.socketService.sendAssignmentNotification(data.classId, {
          type: 'NEW_ASSIGNMENT',
          assignment: {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate,
            points: assignment.points,
            teacherName: assignment.class.teacher.user.name,
          },
          className: assignment.class.name,
          timestamp: new Date(),
        });
      }

      // TODO: Also create persistent notifications
      // await notificationService.notifyNewAssignment(data.classId, assignment);

      res.json(assignment);
    } catch (error) {
      console.error('Create assignment error:', error);
      res.status(400).json({ error: 'Failed to create assignment' });
    }
  },

  // Get assignments for a class
  async getByClass(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const { userId } = req.user as any;

      // Check if user is teacher or student in class
      const classInfo = await prisma.class.findUnique({
        where: { id: classId },
        include: {
          enrollments: {
            where: { studentId: userId }
          }
        }
      });
      
      const hasAccess = classInfo?.teacherId === userId || classInfo?.enrollments.length > 0;

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const assignments = await prisma.assignment.findMany({
        where: {
          classId,
        },
        include: {
          class: true,
          // TODO: Add submissions relation when implementing assignment submissions
        },
        orderBy: {
          dueDate: 'asc',
        },
      });

      res.json(assignments);
    } catch (error) {
      console.error('Get assignments error:', error);
      res.status(500).json({ error: 'Failed to get assignments' });
    }
  },

  // Get assignment details
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.user as any;

      const assignment = await prisma.assignment.findUnique({
        where: { id },
        include: {
          class: true,
          // TODO: Add submissions relation when implementing assignment submissions
        },
      });

      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }

      // Check if user is teacher or student in class
      const classInfo = await prisma.class.findUnique({
        where: { id: assignment.classId },
        include: {
          enrollments: {
            where: { studentId: userId }
          }
        }
      });
      
      const hasAccess = classInfo?.teacherId === userId || classInfo?.enrollments.length > 0;

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(assignment);
    } catch (error) {
      console.error('Get assignment error:', error);
      res.status(500).json({ error: 'Failed to get assignment' });
    }
  },

  // Submit or update assignment
  async submit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const { userId } = req.user as any;

      // Update assignment with submission data
      const assignment = await prisma.assignment.findUnique({
        where: { id }
      });
      
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      
      // Check if this is the assigned student or if no student is assigned
      if (assignment.studentId && assignment.studentId !== userId) {
        return res.status(403).json({ error: 'Not assigned to this student' });
      }
      
      const updatedSubmission = await prisma.assignment.update({
        where: { id },
        data: {
          studentId: userId,
          submission: data.content || {},
          submittedAt: data.status === 'SUBMITTED' ? new Date() : assignment.submittedAt,
          score: data.score || assignment.score,
          feedback: data.feedback || assignment.feedback,
        },
        include: {
          class: true,
        },
      });

      res.json(updatedSubmission);
    } catch (error) {
      console.error('Submit assignment error:', error);
      res.status(400).json({ error: 'Failed to submit assignment' });
    }
  },

  // Get submissions for an assignment (teacher only)
  async getSubmissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.user as any;

      // Verify teacher owns the assignment
      const assignment = await prisma.assignment.findFirst({
        where: {
          id,
          class: {
            teacherId: userId,
          },
        },
      });

      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }

      const submissions = await prisma.assignment.findMany({
        where: { 
          classId: assignment.classId,
          submittedAt: { not: null }
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          submittedAt: 'desc',
        },
      });

      res.json(submissions);
    } catch (error) {
      console.error('Get submissions error:', error);
      res.status(500).json({ error: 'Failed to get submissions' });
    }
  },

  // Delete assignment (teacher only)
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.user as any;

      // Verify teacher owns the assignment
      const assignment = await prisma.assignment.findFirst({
        where: {
          id,
          class: {
            teacherId: userId,
          },
        },
      });

      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }

      await prisma.assignment.delete({
        where: { id },
      });

      res.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
      console.error('Delete assignment error:', error);
      res.status(500).json({ error: 'Failed to delete assignment' });
    }
  },
};