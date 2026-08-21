# Root cause analysis

After an executed FAIL, reread only related source and trace entry/Controller/Handler → Service → Validation → Data/External Dependency. Separate Runtime Evidence from SourceEvidence. Use only `ROOT_CAUSE_CONFIRMED` when evidence closes the path, `ROOT_CAUSE_PROBABLE` when a branch/dependency remains unverified, or `ROOT_CAUSE_UNKNOWN` when evidence is insufficient. Report scope and development investigation in the linked `defect-feedback/<DefectId>.md` record; do not modify product or declare a repaired PASS.
