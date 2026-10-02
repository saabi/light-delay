-- Screenplay element kinds gain parenthetical and transition (Studio Write editor model).
-- Element kind remains immutable per stable identity; only the allowed set grows.
ALTER TABLE authoring_elements DROP CONSTRAINT authoring_elements_kind_check;
ALTER TABLE authoring_elements ADD CONSTRAINT authoring_elements_kind_check CHECK (
  kind IN ('scene-heading', 'action', 'character', 'parenthetical', 'dialogue', 'transition')
);
