import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  data?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface NotificationPreferences {
  assignments: boolean;
  grades: boolean;
  announcements: boolean;
  reminders: boolean;
  collaboration: boolean;
  system: boolean;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = Boolean(
      process.env.SMTP_HOST && 
      process.env.SMTP_USER && 
      process.env.SMTP_PASS
    );

    if (this.isEnabled) {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Verify connection
      this.verifyConnection();
    } else {
      logger.warn('Email service disabled - missing SMTP configuration');
    }
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('Email service connected successfully');
    } catch (error) {
      logger.error('Email service connection failed:', error);
      this.isEnabled = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isEnabled) {
      logger.warn('Email service disabled - skipping email send');
      return false;
    }

    try {
      const mailOptions = {
        from: `"디지털 교과서" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully: ${result.messageId}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  async sendTemplateEmail(
    template: string,
    to: string | string[],
    data: Record<string, any>
  ): Promise<boolean> {
    const emailTemplate = this.getTemplate(template, data);
    if (!emailTemplate) {
      logger.error(`Email template not found: ${template}`);
      return false;
    }

    return this.sendEmail({
      to,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });
  }

  private getTemplate(templateName: string, data: Record<string, any>): EmailTemplate | null {
    const templates: Record<string, (data: any) => EmailTemplate> = {
      // Assignment notifications
      assignmentCreated: (data) => ({
        subject: `새로운 과제가 등록되었습니다: ${data.title}`,
        html: this.renderAssignmentCreatedHTML(data),
        text: this.renderAssignmentCreatedText(data),
      }),

      assignmentDue: (data) => ({
        subject: `과제 마감 알림: ${data.title}`,
        html: this.renderAssignmentDueHTML(data),
        text: this.renderAssignmentDueText(data),
      }),

      assignmentGraded: (data) => ({
        subject: `과제가 채점되었습니다: ${data.title}`,
        html: this.renderAssignmentGradedHTML(data),
        text: this.renderAssignmentGradedText(data),
      }),

      // User management
      welcomeTeacher: (data) => ({
        subject: '디지털 교과서에 오신 것을 환영합니다!',
        html: this.renderWelcomeTeacherHTML(data),
        text: this.renderWelcomeTeacherText(data),
      }),

      welcomeStudent: (data) => ({
        subject: '디지털 교과서에 오신 것을 환영합니다!',
        html: this.renderWelcomeStudentHTML(data),
        text: this.renderWelcomeStudentText(data),
      }),

      passwordReset: (data) => ({
        subject: '비밀번호 재설정 요청',
        html: this.renderPasswordResetHTML(data),
        text: this.renderPasswordResetText(data),
      }),

      // Collaboration
      collaborationInvite: (data) => ({
        subject: `협업 초대: ${data.projectName}`,
        html: this.renderCollaborationInviteHTML(data),
        text: this.renderCollaborationInviteText(data),
      }),

      // System notifications
      systemMaintenance: (data) => ({
        subject: '시스템 점검 안내',
        html: this.renderSystemMaintenanceHTML(data),
        text: this.renderSystemMaintenanceText(data),
      }),

      // Weekly digest
      weeklyDigest: (data) => ({
        subject: '주간 학습 요약',
        html: this.renderWeeklyDigestHTML(data),
        text: this.renderWeeklyDigestText(data),
      }),
    };

    const templateFunction = templates[templateName];
    return templateFunction ? templateFunction(data) : null;
  }

  // Assignment Created Templates
  private renderAssignmentCreatedHTML(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>새로운 과제 알림</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .assignment-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 새로운 과제가 등록되었습니다</h1>
          </div>
          
          <div class="content">
            <h2>안녕하세요, ${data.studentName}님!</h2>
            <p>${data.teacherName} 선생님이 새로운 과제를 등록했습니다.</p>
            
            <div class="assignment-info">
              <h3>${data.title}</h3>
              <p><strong>과목:</strong> ${data.subject}</p>
              <p><strong>마감일:</strong> ${new Date(data.dueDate).toLocaleDateString('ko-KR')}</p>
              <p><strong>설명:</strong> ${data.description}</p>
              ${data.hasAI ? '<p>🤖 <strong>AI 도움 기능이 포함되어 있습니다</strong></p>' : ''}
            </div>
            
            <a href="${data.assignmentUrl}" class="button">과제 확인하기</a>
            
            <p>과제를 완료하고 제출하는 것을 잊지 마세요!</p>
          </div>
          
          <div class="footer">
            <p>이 이메일은 디지털 교과서 시스템에서 자동으로 발송되었습니다.</p>
            <p><a href="${data.unsubscribeUrl}">이메일 수신 거부</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private renderAssignmentCreatedText(data: any): string {
    return `
새로운 과제가 등록되었습니다

안녕하세요, ${data.studentName}님!

${data.teacherName} 선생님이 새로운 과제를 등록했습니다.

과제 정보:
- 제목: ${data.title}
- 과목: ${data.subject}
- 마감일: ${new Date(data.dueDate).toLocaleDateString('ko-KR')}
- 설명: ${data.description}

과제 확인: ${data.assignmentUrl}

과제를 완료하고 제출하는 것을 잊지 마세요!

--
디지털 교과서 시스템
이메일 수신 거부: ${data.unsubscribeUrl}
    `;
  }

  // Assignment Due Templates
  private renderAssignmentDueHTML(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>과제 마감 알림</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #f39c12 0%, #e74c3c 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .urgent { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .button { display: inline-block; background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ 과제 마감 알림</h1>
          </div>
          
          <div class="content">
            <h2>${data.studentName}님, 과제 마감이 ${data.timeRemaining} 남았습니다!</h2>
            
            <div class="urgent">
              <h3>${data.title}</h3>
              <p><strong>마감일:</strong> ${new Date(data.dueDate).toLocaleString('ko-KR')}</p>
              <p><strong>현재 상태:</strong> ${data.submissionStatus}</p>
            </div>
            
            <p>아직 제출하지 않은 과제가 있습니다. 마감 전에 완료해 주세요.</p>
            
            <a href="${data.assignmentUrl}" class="button">지금 과제 완료하기</a>
          </div>
          
          <div class="footer">
            <p>이 이메일은 디지털 교과서 시스템에서 자동으로 발송되었습니다.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private renderAssignmentDueText(data: any): string {
    return `
과제 마감 알림

${data.studentName}님, 과제 마감이 ${data.timeRemaining} 남았습니다!

과제: ${data.title}
마감일: ${new Date(data.dueDate).toLocaleString('ko-KR')}
현재 상태: ${data.submissionStatus}

아직 제출하지 않은 과제가 있습니다. 마감 전에 완료해 주세요.

과제 완료: ${data.assignmentUrl}

--
디지털 교과서 시스템
    `;
  }

  // Welcome Templates
  private renderWelcomeTeacherHTML(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>환영합니다!</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .features { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .feature { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 디지털 교과서에 오신 것을 환영합니다!</h1>
          </div>
          
          <div class="content">
            <h2>안녕하세요, ${data.name} 선생님!</h2>
            <p>디지털 교과서 플랫폼에 가입해 주셔서 감사합니다. AI 기반 맞춤형 교육 도구로 더욱 효과적인 수업을 만들어보세요.</p>
            
            <div class="features">
              <div class="feature">
                <h3>📚 스마트 교과서</h3>
                <p>AI 기반 맞춤형 학습 콘텐츠</p>
              </div>
              <div class="feature">
                <h3>📝 과제 관리</h3>
                <p>간편한 과제 생성 및 채점</p>
              </div>
              <div class="feature">
                <h3>📊 학습 분석</h3>
                <p>학생들의 학습 현황 분석</p>
              </div>
              <div class="feature">
                <h3>🤝 협업 도구</h3>
                <p>동료 교사와의 협업</p>
              </div>
            </div>
            
            <a href="${data.dashboardUrl}" class="button">교사 대시보드 시작하기</a>
            
            <p>궁금한 점이 있으시면 언제든지 <a href="mailto:support@digitalbook.kr">고객지원</a>으로 연락해 주세요.</p>
          </div>
          
          <div class="footer">
            <p>디지털 교과서와 함께 교육의 미래를 만들어가세요!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private renderWelcomeTeacherText(data: any): string {
    return `
디지털 교과서에 오신 것을 환영합니다!

안녕하세요, ${data.name} 선생님!

디지털 교과서 플랫폼에 가입해 주셔서 감사합니다. AI 기반 맞춤형 교육 도구로 더욱 효과적인 수업을 만들어보세요.

주요 기능:
• 📚 스마트 교과서: AI 기반 맞춤형 학습 콘텐츠
• 📝 과제 관리: 간편한 과제 생성 및 채점
• 📊 학습 분석: 학생들의 학습 현황 분석
• 🤝 협업 도구: 동료 교사와의 협업

교사 대시보드: ${data.dashboardUrl}

궁금한 점이 있으시면 언제든지 support@digitalbook.kr로 연락해 주세요.

--
디지털 교과서
교육의 미래를 만들어가세요!
    `;
  }

  // Password Reset Templates
  private renderPasswordResetHTML(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>비밀번호 재설정</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .security-info { background: #e3f2fd; border: 1px solid #90caf9; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 비밀번호 재설정</h1>
          </div>
          
          <div class="content">
            <h2>안녕하세요, ${data.name}님</h2>
            <p>비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새로운 비밀번호를 설정해 주세요.</p>
            
            <a href="${data.resetUrl}" class="button">비밀번호 재설정하기</a>
            
            <div class="security-info">
              <p><strong>보안 알림:</strong></p>
              <ul>
                <li>이 링크는 24시간 후 만료됩니다</li>
                <li>만약 비밀번호 재설정을 요청하지 않으셨다면, 이 이메일을 무시해 주세요</li>
                <li>링크는 한 번만 사용 가능합니다</li>
              </ul>
            </div>
            
            <p>링크가 작동하지 않는 경우, 다음 주소를 복사하여 브라우저에 직접 입력해 주세요:</p>
            <p style="word-break: break-all; color: #666;">${data.resetUrl}</p>
          </div>
          
          <div class="footer">
            <p>이 이메일은 디지털 교과서 시스템에서 자동으로 발송되었습니다.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private renderPasswordResetText(data: any): string {
    return `
비밀번호 재설정

안녕하세요, ${data.name}님

비밀번호 재설정을 요청하셨습니다. 아래 링크를 클릭하여 새로운 비밀번호를 설정해 주세요.

비밀번호 재설정: ${data.resetUrl}

보안 알림:
- 이 링크는 24시간 후 만료됩니다
- 만약 비밀번호 재설정을 요청하지 않으셨다면, 이 이메일을 무시해 주세요
- 링크는 한 번만 사용 가능합니다

--
디지털 교과서 시스템
    `;
  }

  // Weekly Digest Templates
  private renderWeeklyDigestHTML(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>주간 학습 요약</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0; }
          .stat { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-number { font-size: 24px; font-weight: bold; color: #667eea; }
          .achievements { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 주간 학습 요약</h1>
            <p>${data.weekStart} - ${data.weekEnd}</p>
          </div>
          
          <div class="content">
            <h2>안녕하세요, ${data.name}님!</h2>
            <p>이번 주 학습 활동을 요약해 드립니다.</p>
            
            <div class="stats">
              <div class="stat">
                <div class="stat-number">${data.stats.studyTime}</div>
                <div>학습 시간</div>
              </div>
              <div class="stat">
                <div class="stat-number">${data.stats.completedAssignments}</div>
                <div>완료한 과제</div>
              </div>
              <div class="stat">
                <div class="stat-number">${data.stats.averageScore}</div>
                <div>평균 점수</div>
              </div>
            </div>
            
            ${data.achievements && data.achievements.length > 0 ? `
            <div class="achievements">
              <h3>🏆 이번 주 성취</h3>
              <ul>
                ${data.achievements.map((achievement: string) => `<li>${achievement}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
            
            <h3>📚 이번 주 활동</h3>
            <ul>
              ${data.activities.map((activity: string) => `<li>${activity}</li>`).join('')}
            </ul>
            
            <a href="${data.dashboardUrl}" class="button">대시보드에서 자세히 보기</a>
          </div>
          
          <div class="footer">
            <p>계속해서 훌륭한 학습을 이어가세요! 💪</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private renderWeeklyDigestText(data: any): string {
    return `
주간 학습 요약 (${data.weekStart} - ${data.weekEnd})

안녕하세요, ${data.name}님!

이번 주 학습 통계:
- 학습 시간: ${data.stats.studyTime}
- 완료한 과제: ${data.stats.completedAssignments}
- 평균 점수: ${data.stats.averageScore}

${data.achievements && data.achievements.length > 0 ? `
이번 주 성취:
${data.achievements.map((achievement: string) => `• ${achievement}`).join('\n')}
` : ''}

이번 주 활동:
${data.activities.map((activity: string) => `• ${activity}`).join('\n')}

자세한 내용: ${data.dashboardUrl}

--
디지털 교과서
계속해서 훌륭한 학습을 이어가세요! 💪
    `;
  }

  // Add more template methods for other email types...
  private renderAssignmentGradedHTML(data: any): string {
    // Implementation for graded assignment notification
    return `<!-- Assignment graded HTML template -->`;
  }

  private renderAssignmentGradedText(data: any): string {
    // Implementation for graded assignment notification
    return `Assignment graded text template`;
  }

  private renderWelcomeStudentHTML(data: any): string {
    // Implementation for student welcome email
    return `<!-- Student welcome HTML template -->`;
  }

  private renderWelcomeStudentText(data: any): string {
    // Implementation for student welcome email
    return `Student welcome text template`;
  }

  private renderCollaborationInviteHTML(data: any): string {
    // Implementation for collaboration invite
    return `<!-- Collaboration invite HTML template -->`;
  }

  private renderCollaborationInviteText(data: any): string {
    // Implementation for collaboration invite
    return `Collaboration invite text template`;
  }

  private renderSystemMaintenanceHTML(data: any): string {
    // Implementation for system maintenance notification
    return `<!-- System maintenance HTML template -->`;
  }

  private renderSystemMaintenanceText(data: any): string {
    // Implementation for system maintenance notification
    return `System maintenance text template`;
  }

  // Batch email sending
  async sendBulkEmails(emails: EmailOptions[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const email of emails) {
      const result = await this.sendEmail(email);
      if (result) {
        success++;
      } else {
        failed++;
      }
      
      // Add delay to prevent overwhelming the email server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    logger.info(`Bulk email sent - Success: ${success}, Failed: ${failed}`);
    return { success, failed };
  }

  // Check if email service is enabled
  isEmailEnabled(): boolean {
    return this.isEnabled;
  }
}

export const emailService = new EmailService();
export default emailService;