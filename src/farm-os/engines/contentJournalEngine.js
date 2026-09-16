// Content journal engine — pure functions only.

export const STAGES = ["idea", "captured", "editing", "published"];

export const STAGE_LABEL = {
  idea: "Idea",
  captured: "Captured",
  editing: "Editing",
  published: "Published",
};

/**
 * The next stage in the lifecycle, or null if already published —
 * there's nothing after published, so the UI shouldn't offer to advance it.
 */
export function nextStage(stage) {
  const index = STAGES.indexOf(stage);
  if (index === -1 || index === STAGES.length - 1) return null;
  return STAGES[index + 1];
}
