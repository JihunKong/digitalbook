export interface TeamMember {
  id: string
  name: string
  role: 'leader' | 'researcher' | 'writer' | 'designer' | 'reviewer'
  avatar: string
  tasksAssigned: number
  tasksCompleted: number
  contributionScore: number
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
  assignee?: string
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: string
  uploadedBy: string
  uploadedAt: Date
  version: number
}

export interface Comment {
  id: string
  author: string
  content: string
  timestamp: Date
  reactions?: string[]
  isPinned?: boolean
}

export interface Task {
  id: string
  title: string
  description?: string
  assignees: string[]
  dueDate: Date
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'blocked'
  dependencies: string[]
  subtasks: Subtask[]
  attachments: Attachment[]
  comments: Comment[]
  timeTracking: {
    estimated: number
    actual: number
    remaining: number
  }
  tags?: string[]
}

export interface Deliverable {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed' | 'approved'
  submittedAt?: Date
}

export interface ProjectPhase {
  id: string
  name: 'research' | 'analysis' | 'creation' | 'review' | 'presentation'
  title: string
  description: string
  startDate: Date
  endDate: Date
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed'
  tasks: Task[]
  deliverables: Deliverable[]
}

export interface Milestone {
  id: string
  title: string
  date: Date
  status: 'pending' | 'completed' | 'at_risk' | 'missed'
  description: string
}

export interface ActivityLogEntry {
  id: string
  timestamp: Date
  user: string
  action: 'created' | 'updated' | 'completed' | 'commented' | 'uploaded' | 'started' | 'reviewed'
  target: string
  details: string
}

export interface Resource {
  id: string
  title: string
  type: 'website' | 'document' | 'video' | 'tool'
  url: string
  description: string
}

export interface GroupProject {
  id: string
  title: string
  description: string
  subject: string
  startDate: Date
  endDate: Date
  phases: ProjectPhase[]
  team: TeamMember[]
  milestones: Milestone[]
  resources: Resource[]
  activityLog: ActivityLogEntry[]
}

// 비판적 사고와 가짜뉴스 프로젝트 데이터
export const criticalThinkingProject: GroupProject = {
  id: "proj-2025-08",
  title: "비판적 사고로 가짜뉴스 구별하기",
  description: "SNS 시대의 정보 리터러시를 기르는 2주 프로젝트",
  subject: "국어 5학년 5단원",
  startDate: new Date("2025-08-05"),
  endDate: new Date("2025-08-19"),
  
  phases: [
    {
      id: "phase-1",
      name: "research",
      title: "1단계: 조사 및 자료 수집",
      description: "가짜뉴스 사례와 판별 방법 조사",
      startDate: new Date("2025-08-05"),
      endDate: new Date("2025-08-08"),
      status: "completed",
      tasks: [
        {
          id: "task-1-1",
          title: "최근 가짜뉴스 사례 5개 수집",
          description: "2024-2025년 한국에서 이슈가 된 가짜뉴스 사례를 찾아 정리하기",
          assignees: ["김민수", "이서연"],
          dueDate: new Date("2025-08-06"),
          priority: "high",
          status: "completed",
          dependencies: [],
          subtasks: [
            {
              id: "st-1",
              title: "포털 사이트 뉴스 검색",
              completed: true,
              assignee: "김민수"
            },
            {
              id: "st-2",
              title: "팩트체크 사이트 확인",
              completed: true,
              assignee: "이서연"
            },
            {
              id: "st-3",
              title: "사례별 특징 정리",
              completed: true,
              assignee: "김민수"
            }
          ],
          attachments: [
            {
              id: "att-1",
              name: "가짜뉴스_사례_정리.pdf",
              type: "pdf",
              size: "2.3MB",
              uploadedBy: "김민수",
              uploadedAt: new Date("2025-08-06T10:30:00"),
              version: 2
            },
            {
              id: "att-2",
              name: "참고자료_링크모음.docx",
              type: "docx",
              size: "145KB",
              uploadedBy: "이서연",
              uploadedAt: new Date("2025-08-06T09:15:00"),
              version: 1
            }
          ],
          comments: [
            {
              id: "com-1",
              author: "이서연",
              content: "코로나 관련 가짜뉴스가 아직도 많네요 @김민수",
              timestamp: new Date("2025-08-05T14:20:00"),
              reactions: ["👍", "😮"]
            },
            {
              id: "com-2",
              author: "김민수",
              content: "네, 건강 관련 가짜뉴스가 특히 위험한 것 같아요. 출처 불명확한 건강 정보들이 너무 많이 퍼져있어요.",
              timestamp: new Date("2025-08-05T14:35:00")
            },
            {
              id: "com-3",
              author: "선생님",
              content: "좋은 사례들을 찾았네요! 각 사례마다 어떤 특징이 있는지도 정리해보면 좋겠어요.",
              timestamp: new Date("2025-08-05T16:00:00"),
              isPinned: true
            }
          ],
          timeTracking: {
            estimated: 4,
            actual: 3.5,
            remaining: 0
          },
          tags: ["조사", "문헌연구", "필수"]
        },
        {
          id: "task-1-2",
          title: "전문가 인터뷰 질문 준비",
          description: "미디어 리터러시 전문가 화상 인터뷰를 위한 질문 10개 작성",
          assignees: ["박준혁"],
          dueDate: new Date("2025-08-07"),
          priority: "medium",
          status: "completed",
          dependencies: ["task-1-1"],
          subtasks: [
            {
              id: "st-4",
              title: "기본 질문 5개 작성",
              completed: true,
              assignee: "박준혁"
            },
            {
              id: "st-5",
              title: "심화 질문 5개 작성",
              completed: true,
              assignee: "박준혁"
            }
          ],
          attachments: [
            {
              id: "att-3",
              name: "인터뷰_질문지.pdf",
              type: "pdf",
              size: "320KB",
              uploadedBy: "박준혁",
              uploadedAt: new Date("2025-08-07T11:00:00"),
              version: 1
            }
          ],
          comments: [
            {
              id: "com-4",
              author: "박준혁",
              content: "질문지 초안 작성했습니다. 검토 부탁드려요!",
              timestamp: new Date("2025-08-07T11:05:00")
            }
          ],
          timeTracking: {
            estimated: 2,
            actual: 1.5,
            remaining: 0
          },
          tags: ["인터뷰", "준비"]
        },
        {
          id: "task-1-3",
          title: "관련 도서 및 논문 조사",
          description: "미디어 리터러시와 비판적 사고 관련 참고 자료 수집",
          assignees: ["홍길동"],
          dueDate: new Date("2025-08-08"),
          priority: "low",
          status: "completed",
          dependencies: [],
          subtasks: [
            {
              id: "st-6",
              title: "도서관 자료 검색",
              completed: true,
              assignee: "홍길동"
            },
            {
              id: "st-7",
              title: "온라인 논문 검색",
              completed: true,
              assignee: "홍길동"
            }
          ],
          attachments: [],
          comments: [],
          timeTracking: {
            estimated: 3,
            actual: 2.5,
            remaining: 0
          },
          tags: ["조사", "문헌"]
        }
      ],
      deliverables: [
        {
          id: "del-1",
          title: "가짜뉴스 사례 분석 보고서",
          status: "completed",
          submittedAt: new Date("2025-08-08T17:00:00")
        },
        {
          id: "del-2",
          title: "참고 자료 목록",
          status: "completed",
          submittedAt: new Date("2025-08-08T17:30:00")
        }
      ]
    },
    
    {
      id: "phase-2",
      name: "analysis",
      title: "2단계: 분석 및 패턴 찾기",
      description: "수집한 자료를 분석하여 가짜뉴스의 공통 패턴 도출",
      startDate: new Date("2025-08-09"),
      endDate: new Date("2025-08-12"),
      status: "in_progress",
      tasks: [
        {
          id: "task-2-1",
          title: "가짜뉴스 공통 패턴 분석",
          description: "수집한 사례에서 반복되는 패턴과 특징 찾아내기",
          assignees: ["이서연", "홍길동"],
          dueDate: new Date("2025-08-10"),
          priority: "critical",
          status: "in_progress",
          dependencies: ["task-1-1", "task-1-2"],
          subtasks: [
            {
              id: "st-8",
              title: "제목과 내용 불일치 사례 정리",
              completed: true,
              assignee: "이서연"
            },
            {
              id: "st-9",
              title: "출처 불명확 사례 분류",
              completed: true,
              assignee: "홍길동"
            },
            {
              id: "st-10",
              title: "감정적 표현 과다 사용 분석",
              completed: false,
              assignee: "홍길동"
            },
            {
              id: "st-11",
              title: "통계 오용 사례 찾기",
              completed: false,
              assignee: "이서연"
            }
          ],
          attachments: [
            {
              id: "att-4",
              name: "패턴분석_초안.xlsx",
              type: "xlsx",
              size: "1.8MB",
              uploadedBy: "이서연",
              uploadedAt: new Date("2025-08-09T14:30:00"),
              version: 1
            }
          ],
          comments: [
            {
              id: "com-5",
              author: "이서연",
              content: "제목 낚시가 정말 많네요. 특히 '충격', '경악' 같은 단어가 자주 쓰여요.",
              timestamp: new Date("2025-08-09T14:35:00")
            },
            {
              id: "com-6",
              author: "홍길동",
              content: "출처가 '~카더라', '~라고 한다' 형식이 많아요. 구체적인 출처가 없는 경우가 대부분입니다.",
              timestamp: new Date("2025-08-09T15:00:00")
            },
            {
              id: "com-7",
              author: "선생님",
              content: "패턴을 카테고리별로 잘 정리하고 있네요! 각 패턴마다 실제 사례를 2-3개씩 연결해주세요.",
              timestamp: new Date("2025-08-09T16:00:00"),
              isPinned: true
            }
          ],
          timeTracking: {
            estimated: 6,
            actual: 4,
            remaining: 2
          },
          tags: ["분석", "핵심과제", "진행중"]
        },
        {
          id: "task-2-2",
          title: "체크리스트 초안 작성",
          description: "초등학생용 가짜뉴스 판별 체크리스트 만들기",
          assignees: ["김민수", "박준혁"],
          dueDate: new Date("2025-08-11"),
          priority: "high",
          status: "in_progress",
          dependencies: ["task-2-1"],
          subtasks: [
            {
              id: "st-12",
              title: "체크리스트 항목 선정",
              completed: true,
              assignee: "김민수"
            },
            {
              id: "st-13",
              title: "항목별 설명 작성",
              completed: false,
              assignee: "박준혁"
            },
            {
              id: "st-14",
              title: "시각 디자인 구상",
              completed: false,
              assignee: "박준혁"
            }
          ],
          attachments: [],
          comments: [
            {
              id: "com-8",
              author: "선생님",
              content: "체크리스트는 10개 항목 이내로 간단명료하게 작성해주세요. 초등학생이 이해하기 쉬운 말로요!",
              timestamp: new Date("2025-08-09T09:00:00"),
              isPinned: true
            },
            {
              id: "com-9",
              author: "김민수",
              content: "네, 쉬운 질문 형태로 만들어보겠습니다. 예: '누가 쓴 기사인지 이름이 있나요?'",
              timestamp: new Date("2025-08-10T10:00:00")
            }
          ],
          timeTracking: {
            estimated: 4,
            actual: 2,
            remaining: 2
          },
          tags: ["제작", "중요"]
        },
        {
          id: "task-2-3",
          title: "전문가 인터뷰 실시",
          description: "준비한 질문으로 전문가 화상 인터뷰 진행",
          assignees: ["박준혁", "김민수"],
          dueDate: new Date("2025-08-11"),
          priority: "medium",
          status: "todo",
          dependencies: ["task-1-2"],
          subtasks: [
            {
              id: "st-15",
              title: "인터뷰 일정 확정",
              completed: false,
              assignee: "박준혁"
            },
            {
              id: "st-16",
              title: "화상회의 준비",
              completed: false,
              assignee: "김민수"
            },
            {
              id: "st-17",
              title: "인터뷰 진행 및 녹화",
              completed: false
            }
          ],
          attachments: [],
          comments: [],
          timeTracking: {
            estimated: 2,
            actual: 0,
            remaining: 2
          },
          tags: ["인터뷰", "외부협력"]
        }
      ],
      deliverables: [
        {
          id: "del-3",
          title: "패턴 분석 보고서",
          status: "in_progress"
        },
        {
          id: "del-4",
          title: "체크리스트 초안",
          status: "pending"
        }
      ]
    },
    
    {
      id: "phase-3",
      name: "creation",
      title: "3단계: 결과물 제작",
      description: "인포그래픽과 프레젠테이션 자료 제작",
      startDate: new Date("2025-08-13"),
      endDate: new Date("2025-08-16"),
      status: "not_started",
      tasks: [
        {
          id: "task-3-1",
          title: "인포그래픽 디자인",
          description: "가짜뉴스 판별법을 한눈에 볼 수 있는 인포그래픽 제작",
          assignees: ["박준혁"],
          dueDate: new Date("2025-08-14"),
          priority: "high",
          status: "todo",
          dependencies: ["task-2-2"],
          subtasks: [
            {
              id: "st-18",
              title: "디자인 컨셉 구상",
              completed: false,
              assignee: "박준혁"
            },
            {
              id: "st-19",
              title: "일러스트 제작",
              completed: false,
              assignee: "박준혁"
            },
            {
              id: "st-20",
              title: "텍스트 배치",
              completed: false,
              assignee: "박준혁"
            }
          ],
          attachments: [],
          comments: [],
          timeTracking: {
            estimated: 5,
            actual: 0,
            remaining: 5
          },
          tags: ["디자인", "시각화"]
        },
        {
          id: "task-3-2",
          title: "프레젠테이션 슬라이드 제작",
          description: "5분 발표용 PPT 10장 내외",
          assignees: ["김민수", "이서연"],
          dueDate: new Date("2025-08-15"),
          priority: "critical",
          status: "todo",
          dependencies: ["task-3-1"],
          subtasks: [
            {
              id: "st-21",
              title: "슬라이드 구성 계획",
              completed: false,
              assignee: "김민수"
            },
            {
              id: "st-22",
              title: "내용 작성",
              completed: false,
              assignee: "이서연"
            },
            {
              id: "st-23",
              title: "디자인 적용",
              completed: false,
              assignee: "김민수"
            },
            {
              id: "st-24",
              title: "스크립트 작성",
              completed: false,
              assignee: "이서연"
            }
          ],
          attachments: [],
          comments: [],
          timeTracking: {
            estimated: 6,
            actual: 0,
            remaining: 6
          },
          tags: ["발표자료", "핵심"]
        },
        {
          id: "task-3-3",
          title: "동영상 자료 제작",
          description: "가짜뉴스 판별 방법 설명 영상 (2-3분)",
          assignees: ["홍길동"],
          dueDate: new Date("2025-08-15"),
          priority: "low",
          status: "todo",
          dependencies: ["task-2-1"],
          subtasks: [
            {
              id: "st-25",
              title: "시나리오 작성",
              completed: false,
              assignee: "홍길동"
            },
            {
              id: "st-26",
              title: "촬영 또는 애니메이션 제작",
              completed: false,
              assignee: "홍길동"
            },
            {
              id: "st-27",
              title: "편집 및 자막 추가",
              completed: false,
              assignee: "홍길동"
            }
          ],
          attachments: [],
          comments: [],
          timeTracking: {
            estimated: 4,
            actual: 0,
            remaining: 4
          },
          tags: ["멀티미디어", "선택"]
        }
      ],
      deliverables: [
        {
          id: "del-5",
          title: "인포그래픽",
          status: "pending"
        },
        {
          id: "del-6",
          title: "발표 슬라이드",
          status: "pending"
        },
        {
          id: "del-7",
          title: "설명 영상",
          status: "pending"
        }
      ]
    },
    
    {
      id: "phase-4",
      name: "review",
      title: "4단계: 검토 및 수정",
      description: "피드백 반영 및 최종 점검",
      startDate: new Date("2025-08-17"),
      endDate: new Date("2025-08-18"),
      status: "not_started",
      tasks: [
        {
          id: "task-4-1",
          title: "동료 평가 및 피드백",
          description: "다른 모둠과 결과물 교환 평가",
          assignees: ["전체"],
          dueDate: new Date("2025-08-17"),
          priority: "medium",
          status: "todo",
          dependencies: ["task-3-2"],
          subtasks: [
            {
              id: "st-28",
              title: "다른 모둠 자료 검토",
              completed: false
            },
            {
              id: "st-29",
              title: "피드백 작성",
              completed: false
            },
            {
              id: "st-30",
              title: "받은 피드백 정리",
              completed: false
            }
          ],
          attachments: [],
          comments: [],
          timeTracking: {
            estimated: 2,
            actual: 0,
            remaining: 2
          },
          tags: ["협력", "평가"]
        },
        {
          id: "task-4-2",
          title: "최종 수정 및 리허설",
          description: "피드백 반영하여 최종 수정, 발표 연습",
          assignees: ["전체"],
          dueDate: new Date("2025-08-18"),
          priority: "high",
          status: "todo",
          dependencies: ["task-4-1"],
          subtasks: [
            {
              id: "st-31",
              title: "피드백 반영 수정",
              completed: false
            },
            {
              id: "st-32",
              title: "발표 리허설 1차",
              completed: false
            },
            {
              id: "st-33",
              title: "발표 리허설 2차",
              completed: false
            },
            {
              id: "st-34",
              title: "시간 체크 및 조정",
              completed: false
            }
          ],
          attachments: [],
          comments: [],
          timeTracking: {
            estimated: 3,
            actual: 0,
            remaining: 3
          },
          tags: ["마무리", "연습"]
        }
      ],
      deliverables: [
        {
          id: "del-8",
          title: "최종 발표 자료",
          status: "pending"
        }
      ]
    },
    
    {
      id: "phase-5",
      name: "presentation",
      title: "5단계: 발표 및 평가",
      description: "최종 발표 및 상호 평가",
      startDate: new Date("2025-08-19"),
      endDate: new Date("2025-08-19"),
      status: "not_started",
      tasks: [
        {
          id: "task-5-1",
          title: "최종 발표",
          description: "전체 학급 앞에서 5분 발표",
          assignees: ["김민수", "이서연"],
          dueDate: new Date("2025-08-19"),
          priority: "critical",
          status: "todo",
          dependencies: ["task-4-2"],
          subtasks: [
            {
              id: "st-35",
              title: "발표 준비",
              completed: false
            },
            {
              id: "st-36",
              title: "발표 실시",
              completed: false
            },
            {
              id: "st-37",
              title: "질의응답",
              completed: false
            }
          ],
          attachments: [],
          comments: [],
          timeTracking: {
            estimated: 1,
            actual: 0,
            remaining: 1
          },
          tags: ["발표", "최종"]
        },
        {
          id: "task-5-2",
          title: "자기평가 및 성찰",
          description: "프로젝트 과정 돌아보기 및 자기평가서 작성",
          assignees: ["전체"],
          dueDate: new Date("2025-08-19"),
          priority: "medium",
          status: "todo",
          dependencies: ["task-5-1"],
          subtasks: [
            {
              id: "st-38",
              title: "자기평가서 작성",
              completed: false
            },
            {
              id: "st-39",
              title: "팀 성찰 회의",
              completed: false
            }
          ],
          attachments: [],
          comments: [],
          timeTracking: {
            estimated: 1,
            actual: 0,
            remaining: 1
          },
          tags: ["평가", "성찰"]
        }
      ],
      deliverables: [
        {
          id: "del-9",
          title: "최종 프레젠테이션",
          status: "pending"
        },
        {
          id: "del-10",
          title: "가짜뉴스 판별 체크리스트",
          status: "pending"
        },
        {
          id: "del-11",
          title: "프로젝트 보고서",
          status: "pending"
        },
        {
          id: "del-12",
          title: "자기평가서",
          status: "pending"
        }
      ]
    }
  ],
  
  team: [
    {
      id: "member-1",
      name: "김민수",
      role: "leader",
      avatar: "KM",
      tasksAssigned: 8,
      tasksCompleted: 3,
      contributionScore: 85
    },
    {
      id: "member-2",
      name: "이서연",
      role: "researcher",
      avatar: "LS",
      tasksAssigned: 7,
      tasksCompleted: 3,
      contributionScore: 80
    },
    {
      id: "member-3",
      name: "홍길동",
      role: "writer",
      avatar: "HG",
      tasksAssigned: 5,
      tasksCompleted: 2,
      contributionScore: 70
    },
    {
      id: "member-4",
      name: "박준혁",
      role: "designer",
      avatar: "PJ",
      tasksAssigned: 6,
      tasksCompleted: 2,
      contributionScore: 75
    }
  ],
  
  milestones: [
    {
      id: "m-1",
      title: "조사 완료",
      date: new Date("2025-08-08"),
      status: "completed",
      description: "모든 자료 수집 및 정리 완료"
    },
    {
      id: "m-2",
      title: "분석 완료",
      date: new Date("2025-08-12"),
      status: "at_risk",
      description: "패턴 분석 및 체크리스트 작성"
    },
    {
      id: "m-3",
      title: "결과물 완성",
      date: new Date("2025-08-16"),
      status: "pending",
      description: "발표 자료 및 인포그래픽 완성"
    },
    {
      id: "m-4",
      title: "최종 발표",
      date: new Date("2025-08-19"),
      status: "pending",
      description: "프로젝트 최종 발표"
    }
  ],
  
  activityLog: [
    {
      id: "log-1",
      timestamp: new Date("2025-08-06T10:30:00"),
      user: "김민수",
      action: "uploaded",
      target: "가짜뉴스_사례_정리.pdf",
      details: "파일 업로드 완료"
    },
    {
      id: "log-2",
      timestamp: new Date("2025-08-06T14:00:00"),
      user: "이서연",
      action: "completed",
      target: "task-1-1",
      details: "최근 가짜뉴스 사례 5개 수집 완료"
    },
    {
      id: "log-3",
      timestamp: new Date("2025-08-07T09:15:00"),
      user: "박준혁",
      action: "started",
      target: "task-1-2",
      details: "전문가 인터뷰 질문 준비 시작"
    },
    {
      id: "log-4",
      timestamp: new Date("2025-08-08T16:45:00"),
      user: "김민수",
      action: "commented",
      target: "task-2-1",
      details: "분석 틀 공유했습니다. 확인 부탁드려요!"
    },
    {
      id: "log-5",
      timestamp: new Date("2025-08-09T10:00:00"),
      user: "선생님",
      action: "reviewed",
      target: "phase-1",
      details: "1단계 검토 완료 - 잘 진행되고 있습니다"
    },
    {
      id: "log-6",
      timestamp: new Date("2025-08-09T14:30:00"),
      user: "이서연",
      action: "uploaded",
      target: "패턴분석_초안.xlsx",
      details: "분석 자료 초안 업로드"
    },
    {
      id: "log-7",
      timestamp: new Date("2025-08-10T11:00:00"),
      user: "홍길동",
      action: "started",
      target: "task-2-1",
      details: "가짜뉴스 공통 패턴 분석 작업 시작"
    },
    {
      id: "log-8",
      timestamp: new Date("2025-08-10T15:30:00"),
      user: "김민수",
      action: "updated",
      target: "task-2-2",
      details: "체크리스트 항목 선정 완료"
    }
  ],
  
  resources: [
    {
      id: "res-1",
      title: "한국언론진흥재단 - 팩트체크",
      type: "website",
      url: "https://factcheck.kpf.or.kr",
      description: "공식 팩트체크 플랫폼"
    },
    {
      id: "res-2",
      title: "미디어 리터러시 교육 자료",
      type: "document",
      url: "/resources/media-literacy.pdf",
      description: "교육부 제공 학습 자료"
    },
    {
      id: "res-3",
      title: "가짜뉴스 판별 가이드",
      type: "video",
      url: "https://youtube.com/watch?v=example",
      description: "전문가 설명 영상"
    },
    {
      id: "res-4",
      title: "Canva - 인포그래픽 제작",
      type: "tool",
      url: "https://canva.com",
      description: "무료 디자인 도구"
    }
  ]
}

// Helper functions
export function getPhaseProgress(phase: ProjectPhase): number {
  if (phase.tasks.length === 0) return 0
  const completed = phase.tasks.filter(t => t.status === 'completed').length
  return Math.round((completed / phase.tasks.length) * 100)
}

export function getProjectProgress(project: GroupProject): number {
  const totalTasks = project.phases.reduce((sum, phase) => sum + phase.tasks.length, 0)
  const completedTasks = project.phases.reduce(
    (sum, phase) => sum + phase.tasks.filter(t => t.status === 'completed').length,
    0
  )
  return Math.round((completedTasks / totalTasks) * 100)
}

export function getUpcomingDeadlines(project: GroupProject, days: number = 7): Task[] {
  const now = new Date()
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  
  const upcomingTasks: Task[] = []
  project.phases.forEach(phase => {
    phase.tasks.forEach(task => {
      if (task.status !== 'completed' && task.dueDate <= futureDate) {
        upcomingTasks.push(task)
      }
    })
  })
  
  return upcomingTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
}

export function getBlockedTasks(project: GroupProject): Task[] {
  const blockedTasks: Task[] = []
  const completedTaskIds = new Set<string>()
  
  project.phases.forEach(phase => {
    phase.tasks.forEach(task => {
      if (task.status === 'completed') {
        completedTaskIds.add(task.id)
      }
    })
  })
  
  project.phases.forEach(phase => {
    phase.tasks.forEach(task => {
      if (task.status !== 'completed' && task.dependencies.length > 0) {
        const hasUncompletedDependencies = task.dependencies.some(
          depId => !completedTaskIds.has(depId)
        )
        if (hasUncompletedDependencies) {
          blockedTasks.push(task)
        }
      }
    })
  })
  
  return blockedTasks
}