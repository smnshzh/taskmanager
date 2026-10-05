CREATE TABLE "MeetingMinute" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "heldAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "agenda" TEXT NOT NULL,
    "notes" TEXT,
    "secretaryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MeetingMinute_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MeetingAttendee" (
    "meetingMinuteId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MeetingAttendee_pkey" PRIMARY KEY ("meetingMinuteId", "memberId")
);

CREATE TABLE "MeetingDecision" (
    "id" TEXT NOT NULL,
    "meetingMinuteId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MeetingDecision_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Task" ADD COLUMN "meetingDecisionId" TEXT;

CREATE UNIQUE INDEX "MeetingMinute_code_key" ON "MeetingMinute"("code");
CREATE INDEX "MeetingMinute_heldAt_idx" ON "MeetingMinute"("heldAt");
CREATE INDEX "MeetingMinute_secretaryId_createdAt_idx" ON "MeetingMinute"("secretaryId", "createdAt");
CREATE INDEX "MeetingAttendee_memberId_createdAt_idx" ON "MeetingAttendee"("memberId", "createdAt");
CREATE INDEX "MeetingDecision_meetingMinuteId_createdAt_idx" ON "MeetingDecision"("meetingMinuteId", "createdAt");
CREATE INDEX "MeetingDecision_deadline_idx" ON "MeetingDecision"("deadline");
CREATE INDEX "Task_meetingDecisionId_idx" ON "Task"("meetingDecisionId");

ALTER TABLE "MeetingMinute" ADD CONSTRAINT "MeetingMinute_secretaryId_fkey" FOREIGN KEY ("secretaryId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MeetingAttendee" ADD CONSTRAINT "MeetingAttendee_meetingMinuteId_fkey" FOREIGN KEY ("meetingMinuteId") REFERENCES "MeetingMinute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MeetingAttendee" ADD CONSTRAINT "MeetingAttendee_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MeetingDecision" ADD CONSTRAINT "MeetingDecision_meetingMinuteId_fkey" FOREIGN KEY ("meetingMinuteId") REFERENCES "MeetingMinute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_meetingDecisionId_fkey" FOREIGN KEY ("meetingDecisionId") REFERENCES "MeetingDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
