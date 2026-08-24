# Permission Boundary

- PRODUCT_SOURCE_READ = FORBIDDEN
- WHITEBOX_INTERNAL_READ = FORBIDDEN
- HANDOFF_READ = ALLOWED
- RUNTIME_ACCESS = ALLOWED only for an explicitly authorized future run

The project stores sanitized Handoff references and black-box evidence only. Product source, DLL/PDB, source maps, database internals, and source-assisted diagnosis are outside this project.
