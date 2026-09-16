// Crop rotation engine — pure functions only.
// Rules themselves are data (crop_rotation_rules table); this just filters
// and ranks them, optionally against how many days are left in the season.

/**
 * Suggestions for what to plant after `fromSpeciesId`, ranked by priority
 * (highest first). If `daysRemainingInSeason` is given, candidates whose
 * typical duration wouldn't fit are excluded rather than silently shown
 * as if they'd fit — this is a "what should I do" recommendation, so a
 * suggestion that can't actually finish in time isn't a real suggestion.
 */
export function recommendationsFor(rules = [], fromSpeciesId, daysRemainingInSeason = null) {
  return rules
    .filter((r) => r.from_species_id === fromSpeciesId)
    .filter(
      (r) =>
        daysRemainingInSeason == null ||
        !r.typical_duration_days ||
        r.typical_duration_days <= daysRemainingInSeason
    )
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}
