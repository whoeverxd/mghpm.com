import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeMembership } from "./membership.ts";
import { listWorkspaces, resolveWorkspace } from "./workspaces.ts";

type Role = Parameters<typeof normalizeMembership>[0]["role"];

function entry(organizationId: string, organizationName: string, role: Role) {
  return { organizationId, organizationName, membership: normalizeMembership({ role, status: "active" }) };
}

const memberships = [
  entry("org-a", "Org A", "admin"),
  entry("org-b", "Org B", "owner"),
  entry("org-c", "Org C", "vendor"),
];

test("lists one workspace per lane with access", () => {
  assert.deepEqual(
    listWorkspaces(memberships).map((workspace) => [workspace.organizationId, workspace.lane]),
    [["org-a", "admin"], ["org-b", "owner"]],
  );
});

test("staff plus owner in one organization yields two workspaces", () => {
  const both = [
    {
      organizationId: "org-a",
      organizationName: "Org A",
      membership: normalizeMembership({ staffRole: "admin", portals: ["owner"], portalPersonIds: { owner: "p1" }, status: "active" }),
    },
  ];
  assert.deepEqual(
    listWorkspaces(both).map((workspace) => workspace.lane),
    ["admin", "owner"],
  );
});

test("resolves the workspace for a lane", () => {
  assert.equal(resolveWorkspace(memberships, null, "admin")?.organizationId, "org-a");
  assert.equal(resolveWorkspace(memberships, "org-b", "owner")?.organizationId, "org-b");
  assert.equal(resolveWorkspace(memberships, null, "tenant"), null);
});

test("prefers the selected organization when several match", () => {
  const two = [entry("org-a", "A", "admin"), entry("org-d", "D", "manager")];
  assert.equal(resolveWorkspace(two, null, "admin"), null);
  assert.equal(resolveWorkspace(two, "org-d", "admin")?.organizationId, "org-d");
  assert.equal(resolveWorkspace(two, "org-zzz", "admin"), null);
});
