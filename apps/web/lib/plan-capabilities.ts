import { WorkspaceProps } from "@/lib/types";

/** On self-hosted (no NEXT_PUBLIC_IS_DUB), grant all plan capabilities so Partners and other paid features work without Stripe. */
const isSelfHosted = !process.env.NEXT_PUBLIC_IS_DUB;

// Get the capabilities of a workspace based on the plan
export const getPlanCapabilities = (
  plan: WorkspaceProps["plan"] | undefined | string,
) => {
  if (isSelfHosted) {
    return {
      canAddFolder: true,
      canManageFolderPermissions: true,
      canManageCustomers: true,
      canCreateWebhooks: true,
      canManageProgram: true,
      canTrackConversions: true,
      canExportAuditLogs: true,
      canUseAdvancedRewardLogic: true,
      canMessagePartners: true,
      canSendEmailCampaigns: true,
      canDiscoverPartners: true,
      canManageFraudEvents: true,
      canUseGroupMoveRule: true,
    };
  }
  return {
    canAddFolder: !!plan && !["free"].includes(plan),
    canManageFolderPermissions: !!plan && !["free", "pro"].includes(plan), // default access level is write
    canManageCustomers: !!plan && !["free", "pro"].includes(plan),
    canCreateWebhooks: !!plan && !["free", "pro"].includes(plan),
    canManageProgram: !!plan && !["free", "pro"].includes(plan),
    canTrackConversions: !!plan && !["free", "pro"].includes(plan),
    canExportAuditLogs: !!plan && ["enterprise"].includes(plan),
    canUseAdvancedRewardLogic:
      !!plan && ["enterprise", "advanced"].includes(plan),
    canMessagePartners: !!plan && ["enterprise", "advanced"].includes(plan),
    canSendEmailCampaigns: !!plan && ["enterprise", "advanced"].includes(plan),
    canDiscoverPartners: !!plan && ["enterprise", "advanced"].includes(plan),
    canManageFraudEvents: !!plan && ["enterprise", "advanced"].includes(plan),
    canUseGroupMoveRule: !!plan && ["enterprise", "advanced"].includes(plan),
  };
};
