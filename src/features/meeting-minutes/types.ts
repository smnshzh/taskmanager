export type MeetingMemberOption = {
  id: string;
  name: string;
  handle: string;
  groupId: string | null;
  groupName: string | null;
};

export type MeetingTaskSummary = {
  id: string;
  code: string;
  status: string;
  assigneeId: string;
  assigneeName: string;
  groupName: string;
};

export type MeetingDecisionSummary = {
  id: string;
  text: string;
  deadline: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  tasks: MeetingTaskSummary[];
};

export type MeetingMinuteSummary = {
  id: string;
  code: string;
  title: string;
  heldAt: string;
  location: string | null;
  agenda: string;
  notes: string | null;
  secretary: MeetingMemberOption;
  attendees: MeetingMemberOption[];
  decisions: MeetingDecisionSummary[];
  createdAt: string;
  updatedAt: string;
};

export type MeetingMinutesResponse = {
  data: MeetingMinuteSummary[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    members: MeetingMemberOption[];
  };
};
