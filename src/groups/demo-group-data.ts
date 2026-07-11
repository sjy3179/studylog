export const DEMO_GROUP = {
  id: 'demo-group-1',
  name: '시험기간 집중반',
  description: '각자의 목표를 향해 공부하는 UI 데모 그룹입니다.',
  todayTotalMinutes: 842,
  members: [
    {
      id: 'me',
      name: '나',
      status: 'STUDYING',
      subject: '수학',
      effectiveStudyMinutes: 148,
      goalProgress: 74,
    },
    {
      id: 'member-2',
      name: '민준',
      status: 'BREAK',
      subject: '영어',
      effectiveStudyMinutes: 126,
      goalProgress: 63,
    },
    {
      id: 'member-3',
      name: '서연',
      status: 'OFFLINE',
      subject: null,
      effectiveStudyMinutes: 94,
      goalProgress: 47,
    },
  ],
} as const
