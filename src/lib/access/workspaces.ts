import { membershipLanes, type NormalizedMembership } from "./membership.ts";
import type { Lane } from "./permissions.ts";

type MembershipLike = {
  organizationId: string;
  organizationName: string;
  membership: NormalizedMembership;
};

export type Workspace<M extends MembershipLike = MembershipLike> = M & { lane: Lane };

/** Each active membership opens one workspace per lane it grants in its organization. */
export function listWorkspaces<M extends MembershipLike>(memberships: M[]): Workspace<M>[] {
  return memberships.flatMap((membership) =>
    membershipLanes(membership.membership).map((lane) => ({ ...membership, lane })),
  );
}

/**
 * Workspace for a lane: the selected organization when it opens that lane,
 * otherwise the only organization that does. Null when ambiguous or absent.
 */
export function resolveWorkspace<M extends MembershipLike>(
  memberships: M[],
  selectedOrganizationId: string | null,
  lane: Lane,
): Workspace<M> | null {
  const candidates = listWorkspaces(memberships).filter((workspace) => workspace.lane === lane);
  const selected = candidates.find((workspace) => workspace.organizationId === selectedOrganizationId);
  if (selected) return selected;
  return candidates.length === 1 ? (candidates[0] ?? null) : null;
}
