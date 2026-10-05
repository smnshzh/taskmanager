# ADR 0002: Meeting decisions and task ownership

Status: accepted.

## Context

A meeting minute can contain several decisions. Each decision can have one or
more responsible members, while the existing `Task` contract intentionally has
one assignee. Existing task APIs, notifications, filters, and status workflows
depend on that contract.

## Decision

- `MeetingMinute` stores the title, Tehran-aware meeting time, location,
  agenda, notes, and the authenticated creator as secretary.
- `MeetingAttendee` stores the selected active members. The secretary is always
  included by the service.
- `MeetingDecision` stores one decision text, deadline, and priority.
- One standard `Task` with source `MEETING` is created for every responsible
  member and linked to the shared decision through `meetingDecisionId`.
- Creation of the minute, attendees, decisions, tasks, audit record, task logs,
  and notification outbox records happens in one database transaction.

This preserves the single-assignee task model while allowing a decision to
have multiple owners with independently trackable statuses.

## Access and security

All authenticated roles receive explicit `meeting:view` and `meeting:create`
permissions. The secretary ID is derived from the authenticated session and is
never accepted from the request body. Member responses use explicit safe
selections and do not expose credentials.

## Rollback

The feature is additive. Application rollback can ignore the new tables and
nullable Task foreign key. Do not drop the tables during an emergency rollback;
retain them until the linked task history has been reviewed and exported.
