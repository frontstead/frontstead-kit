# Classification and listing collections

`@frontstead/portal-config` owns the validated classification definitions and collection predicate AST. Generic runtime defaults are neutral. Provider field mappings normalize MLS data onto `Property.normalizedAttributes`; tag decisions and geographic memberships are persisted against `Property` with evidence, confidence, classifier version, config hash, positive/negative decisions, and manual-override protection.

PostgreSQL is authoritative for collection membership. Typesense may produce search candidates, but active status, IDX display permission, MLS board scope, portal activation/suspension and approval readiness, and collection exclusions are re-applied in PostgreSQL. `EXCLUDE` overrides both predicates and `INCLUDE`; `INCLUDE` bypasses only the predicate.

## Reclassification

There is no automatic full-reclassification scheduler. MLS ingestion classifies each new or changed property with the same engine. Run explicit resumable keyset jobs for config changes:

```sh
npm run classify --workspace=db -- check <accountId>
npm run classify --workspace=db -- diff <accountId>
npm run classify --workspace=db -- apply <accountId>
npm run classify --workspace=db -- apply <accountId> --cursor=<propertyId>
```

Each command creates a `ClassificationRun` with mode, status, version, config hash, cursor, counts, and errors. `apply` never overwrites rows marked `manualOverride`.

## Migration

`20260727180000_replace_segments_with_classification_foundation` is intentionally destructive. It drops `PortalSegment` and `Segment` without copying their data, then creates the area, classification, collection, override, and run structures. Back up or export Segment data before applying if a deployment unexpectedly needs it.
