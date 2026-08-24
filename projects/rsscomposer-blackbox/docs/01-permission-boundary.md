# Permission Boundary

- PRODUCT_SOURCE_READ = FORBIDDEN
- WHITEBOX_INTERNAL_READ = FORBIDDEN
- HANDOFF_READ = ALLOWED
- HANDOFF_INTEGRITY_METADATA_WRITE = AUTHORIZED_FOR_HANDOFF_SHA256_V1_REFREEZE_ONLY
- HANDOFF_BUSINESS_PAYLOAD_WRITE = FORBIDDEN
- RUNTIME_ACCESS = ALLOWED only for an explicitly authorized future run

The project stores sanitized Handoff references and black-box evidence only. Product source, DLL/PDB, source maps, database internals, and source-assisted diagnosis are outside this project.
