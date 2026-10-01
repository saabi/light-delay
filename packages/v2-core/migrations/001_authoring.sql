-- M2.5 authoring persistence. Authoritative content is scoped by document and version.
CREATE TABLE authoring_projects (
  project_id text PRIMARY KEY,
  name text NOT NULL,
  history_contract_version integer NOT NULL DEFAULT 1 CHECK (history_contract_version > 0),
  initial_revision jsonb NOT NULL,
  head_number bigint NOT NULL DEFAULT 0 CHECK (head_number >= 0)
);

CREATE TABLE authoring_documents (
  project_id text NOT NULL REFERENCES authoring_projects(project_id),
  document_id text NOT NULL,
  kind text NOT NULL CHECK (kind ~ '^[a-z][a-z-]*$'),
  title text NOT NULL,
  PRIMARY KEY (project_id, document_id)
);

CREATE TABLE authoring_versions (
  project_id text NOT NULL REFERENCES authoring_projects(project_id),
  version_id text NOT NULL,
  label text NOT NULL,
  PRIMARY KEY (project_id, version_id)
);

CREATE TABLE authoring_elements (
  project_id text NOT NULL,
  element_id text NOT NULL,
  document_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('scene-heading', 'action', 'character', 'dialogue')),
  created_in_revision bigint NOT NULL CHECK (created_in_revision >= 0),
  PRIMARY KEY (project_id, element_id),
  FOREIGN KEY (project_id, document_id) REFERENCES authoring_documents(project_id, document_id)
);

CREATE TABLE authoring_scopes (
  project_id text NOT NULL,
  document_id text NOT NULL,
  version_id text NOT NULL,
  document_version bigint NOT NULL CHECK (document_version >= 0),
  content jsonb NOT NULL,
  PRIMARY KEY (project_id, document_id, version_id),
  FOREIGN KEY (project_id, document_id) REFERENCES authoring_documents(project_id, document_id),
  FOREIGN KEY (project_id, version_id) REFERENCES authoring_versions(project_id, version_id)
);

CREATE TABLE authoring_revisions (
  project_id text NOT NULL REFERENCES authoring_projects(project_id),
  number bigint NOT NULL CHECK (number >= 0),
  change_set_id text,
  record jsonb NOT NULL,
  PRIMARY KEY (project_id, number),
  UNIQUE (project_id, change_set_id),
  CHECK ((number = 0 AND change_set_id IS NULL) OR (number > 0 AND change_set_id IS NOT NULL))
);

CREATE TABLE authoring_change_sets (
  project_id text NOT NULL,
  change_set_id text NOT NULL,
  revision_number bigint NOT NULL,
  schema_version integer NOT NULL CHECK (schema_version > 0),
  record jsonb NOT NULL,
  PRIMARY KEY (project_id, change_set_id),
  UNIQUE (project_id, revision_number),
  FOREIGN KEY (project_id, revision_number) REFERENCES authoring_revisions(project_id, number)
);

CREATE TABLE authoring_checkpoints (
  project_id text NOT NULL,
  revision_number bigint NOT NULL,
  document_id text NOT NULL,
  version_id text NOT NULL,
  document_version bigint NOT NULL CHECK (document_version >= 0),
  content jsonb NOT NULL,
  PRIMARY KEY (project_id, revision_number, document_id, version_id),
  FOREIGN KEY (project_id, revision_number) REFERENCES authoring_revisions(project_id, number),
  FOREIGN KEY (project_id, document_id, version_id) REFERENCES authoring_scopes(project_id, document_id, version_id)
);

CREATE TABLE authoring_drafts (
  project_id text NOT NULL REFERENCES authoring_projects(project_id),
  draft_id text NOT NULL,
  document_id text NOT NULL,
  version_id text NOT NULL,
  owner_kind text NOT NULL,
  owner_id text NOT NULL,
  base_project_revision bigint NOT NULL CHECK (base_project_revision >= 0),
  base_document_version bigint NOT NULL CHECK (base_document_version >= 0),
  record jsonb NOT NULL,
  PRIMARY KEY (project_id, draft_id),
  FOREIGN KEY (project_id, document_id, version_id) REFERENCES authoring_scopes(project_id, document_id, version_id)
);

CREATE TABLE authoring_proposals (
  project_id text NOT NULL REFERENCES authoring_projects(project_id),
  proposal_id text NOT NULL,
  document_id text NOT NULL,
  version_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  change_set_id text,
  record jsonb NOT NULL,
  PRIMARY KEY (project_id, proposal_id),
  UNIQUE (project_id, change_set_id),
  CHECK ((status = 'accepted') = (change_set_id IS NOT NULL)),
  FOREIGN KEY (project_id, document_id, version_id) REFERENCES authoring_scopes(project_id, document_id, version_id),
  FOREIGN KEY (project_id, change_set_id) REFERENCES authoring_change_sets(project_id, change_set_id)
);
