import type { ComponentType } from "react";
import BidRig from "./BidRig";
import BugistanRig from "./BugistanRig";
import FocusFlowRig from "./FocusFlowRig";
import FoliumRig from "./FoliumRig";
import GraphForgeRig from "./GraphForgeRig";
import HireMeRig from "./HireMeRig";
import NeuraCacheRig from "./NeuraCacheRig";
import ProfileRig from "./ProfileRig";
import RoutineRig from "./RoutineRig";

/** Each project's working drawing, by the project's slug. */
export const PROJECT_RIGS: Record<string, ComponentType<{ className?: string }>> = {
  folium: FoliumRig,
  "bid-response-engine": BidRig,
  "hireme-agent": HireMeRig,
  focusflow: FocusFlowRig,
  graphforge: GraphForgeRig,
  "animated-github-profile": ProfileRig,
  neuracache: NeuraCacheRig,
  "routine-dashboard": RoutineRig,
  bugistan: BugistanRig,
};
