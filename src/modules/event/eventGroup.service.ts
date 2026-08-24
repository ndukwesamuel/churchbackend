// services/eventGroup.service.ts
import mongoose from "mongoose";
import type { IEventGroup } from "./eventGroup.interface";
import type { IEventRegistration } from "./eventRegistration.interface";
import eventModel from "./event.model";
import eventGroupModel from "./eventGroup.model";
import eventRegistrationModel from "./eventRegistration.model";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

class EventGroupService {
  // Create N groups at once, named "Group <n>". Numbering continues after
  // whatever groups already exist for the event, so calling this twice
  // (e.g. 3 groups, then 2 more) doesn't collide with the first batch.
  async createGroups(
    eventId: string,
    churchId: string,
    count: number,
  ): Promise<IEventGroup[]> {
    const event = await eventModel.findOne({ _id: eventId, churchId });
    if (!event) {
      throw new Error("Event not found");
    }
    if (!Number.isInteger(count) || count < 1) {
      throw new Error("Count must be a positive integer");
    }

    const existingCount = await eventGroupModel.countDocuments({
      eventId,
      churchId,
    });

    const groups = await eventGroupModel.insertMany(
      Array.from({ length: count }, (_, i) => ({
        eventId,
        churchId,
        name: `Group ${existingCount + i + 1}`,
      })),
    );
    return groups as unknown as IEventGroup[];
  }

  // Create a single group with a custom name.
  async createGroup(
    eventId: string,
    churchId: string,
    name: string,
  ): Promise<IEventGroup> {
    const event = await eventModel.findOne({ _id: eventId, churchId });
    if (!event) {
      throw new Error("Event not found");
    }
    if (!name || !name.trim()) {
      throw new Error("Group name is required");
    }
    try {
      const group = await eventGroupModel.create({
        eventId,
        churchId,
        name: name.trim(),
      });
      return group;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error(`A group named "${name.trim()}" already exists for this event`);
      }
      throw error;
    }
  }

  // List groups for an event, with a count of how many registrants are
  // currently assigned to each.
  async getEventGroups(
    eventId: string,
    churchId: string,
  ): Promise<(IEventGroup & { memberCount: number })[]> {
    const groups = await eventGroupModel
      .find({ eventId, churchId })
      .sort({ name: 1 })
      .lean();

    // Aggregate member counts per group in one query rather than N.
    const memberCounts = await eventRegistrationModel.aggregate([
      { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
      { $group: { _id: "$groupId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(
      memberCounts.map((m) => [m._id ? m._id.toString() : null, m.count]),
    );

    return groups.map((g) => ({
      ...g,
      memberCount: countMap.get(g._id.toString()) || 0,
    })) as (IEventGroup & { memberCount: number })[];
  }

  // All groups for an event, each with its full list of members (not just
  // a count) — for a single-screen "who's in which group" view.
  async getGroupsWithMembers(
    eventId: string,
    churchId: string,
  ): Promise<
    (IEventGroup & { members: IEventRegistration[] })[]
  > {
    const groups = await eventGroupModel
      .find({ eventId, churchId })
      .sort({ name: 1 })
      .lean();

    const registrations = await eventRegistrationModel
      .find({ eventId, churchId, groupId: { $ne: null } })
      .sort({ groupCode: 1 })
      .lean();

    const membersByGroup = new Map<string, IEventRegistration[]>();
    for (const reg of registrations) {
      if (!reg.groupId) continue;
      const key = reg.groupId.toString();
      if (!membersByGroup.has(key)) membersByGroup.set(key, []);
      membersByGroup.get(key)!.push(reg as IEventRegistration);
    }

    return groups.map((g) => ({
      ...g,
      members: membersByGroup.get(g._id.toString()) || [],
    })) as (IEventGroup & { members: IEventRegistration[] })[];
  }

  // Matches a list of names (typically from an admin's spreadsheet, e.g. a
  // house/cell roster) against this event's registrants and assigns each
  // match to `groupId`. Per name:
  //  - no registrant with that exact name -> reported as "notFound"
  //  - more than one registrant shares that name -> reported as
  //    "ambiguous" (never guesses which one was meant)
  //  - registrant already in a DIFFERENT group -> left alone, reported as
  //    a "conflict" so the admin can resolve it manually
  //  - registrant unassigned, or already in this same group -> assigned
  //    (or left as a no-op) via the same path as a manual assignment, so
  //    it gets a tag exactly like one would
  async bulkAssignByNames(
    groupId: string,
    churchId: string,
    names: { row: number; fullName: string }[],
  ): Promise<{
    assigned: { row: number; name: string; registrationId: string; groupCode?: string | null }[];
    conflicts: { row: number; name: string; registrationId: string; currentGroup: string }[];
    notFound: { row: number; name: string }[];
    ambiguous: { row: number; name: string; count: number }[];
  }> {
    const group = await eventGroupModel.findOne({ _id: groupId, churchId });
    if (!group) {
      throw new Error("Group not found");
    }
    const eventId = group.eventId.toString();

    const assigned: { row: number; name: string; registrationId: string; groupCode?: string | null }[] = [];
    const conflicts: { row: number; name: string; registrationId: string; currentGroup: string }[] = [];
    const notFound: { row: number; name: string }[] = [];
    const ambiguous: { row: number; name: string; count: number }[] = [];

    for (const { row, fullName } of names) {
      const name = fullName.trim();
      if (!name) {
        notFound.push({ row, name: fullName });
        continue;
      }

      const matches = await eventRegistrationModel.find({
        eventId,
        churchId,
        registrantName: { $regex: `^${escapeRegExp(name)}$`, $options: "i" },
      });

      if (matches.length === 0) {
        notFound.push({ row, name });
        continue;
      }
      if (matches.length > 1) {
        ambiguous.push({ row, name, count: matches.length });
        continue;
      }

      const registration = matches[0];
      if (registration.groupId && registration.groupId.toString() !== groupId) {
        const existingGroup = await eventGroupModel
          .findById(registration.groupId)
          .select("name")
          .lean();
        conflicts.push({
          row,
          name,
          registrationId: registration._id.toString(),
          currentGroup: existingGroup?.name || "an unknown group",
        });
        continue;
      }

      const updated = await this.assignToGroup(
        registration._id.toString(),
        churchId,
        groupId,
      );
      assigned.push({
        row,
        name,
        registrationId: registration._id.toString(),
        groupCode: updated?.groupCode,
      });
    }

    return { assigned, conflicts, notFound, ambiguous };
  }

  async renameGroup(
    groupId: string,
    churchId: string,
    name: string,
  ): Promise<IEventGroup | null> {
    if (!name || !name.trim()) {
      throw new Error("Group name is required");
    }
    try {
      return await eventGroupModel.findOneAndUpdate(
        { _id: groupId, churchId },
        { $set: { name: name.trim() } },
        { new: true },
      );
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error(`A group named "${name.trim()}" already exists for this event`);
      }
      throw error;
    }
  }

  // Deletes a group and unassigns anyone currently in it — a deleted group
  // shouldn't leave registrations pointing at a groupId that no longer
  // exists.
  async deleteGroup(groupId: string, churchId: string): Promise<boolean> {
    const group = await eventGroupModel.findOne({ _id: groupId, churchId });
    if (!group) {
      return false;
    }
    await eventRegistrationModel.updateMany(
      { groupId, churchId },
      { $set: { groupId: null, groupCode: null } },
    );
    await eventGroupModel.deleteOne({ _id: groupId });
    return true;
  }

  // Assign (or unassign, when groupId is null) a registrant to a group.
  // On assignment, hands out a tag: the group name's first letter plus a
  // zero-padded sequence number scoped to that group (e.g. group
  // "Samheart" -> first person tagged S01, next S02, ...). The sequence
  // comes from an atomic $inc on the group's own counter, so two admins
  // assigning people into the same group at the same moment can never both
  // get the same number, and numbers are never reused once handed out
  // (even if that person is later removed from the group).
  async assignToGroup(
    registrationId: string,
    churchId: string,
    groupId: string | null,
  ) {
    const existing = await eventRegistrationModel.findOne({
      _id: registrationId,
      churchId,
    });
    if (!existing) {
      return null;
    }

    if (!groupId) {
      return eventRegistrationModel.findOneAndUpdate(
        { _id: registrationId, churchId },
        { $set: { groupId: null, groupCode: null } },
        { new: true },
      );
    }

    // Already tagged for this group — keep the existing tag rather than
    // burning another sequence number on a no-op reassignment.
    if (existing.groupId && existing.groupId.toString() === groupId) {
      return existing;
    }

    // `new: false` returns the group as it was BEFORE the increment, so
    // its nextSequence is exactly the number this person should get.
    const group = await eventGroupModel.findOneAndUpdate(
      { _id: groupId, churchId },
      { $inc: { nextSequence: 1 } },
      { new: false },
    );
    if (!group) {
      throw new Error("Group not found");
    }

    const seq = group.nextSequence || 1;
    const letter = group.name.trim().charAt(0).toUpperCase();
    const groupCode = `${letter}${String(seq).padStart(2, "0")}`;

    return eventRegistrationModel.findOneAndUpdate(
      { _id: registrationId, churchId },
      { $set: { groupId, groupCode } },
      { new: true },
    );
  }
}

export default new EventGroupService();
