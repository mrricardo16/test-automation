# Source/Runtime Alignment Gate

Run `SOURCE_RUNTIME_ALIGNMENT` before PASS/FAIL aggregation. Compare source-derived Expected and its `ExpectedBasis` with supplied Runtime Actual and evidence. Runtime confirms Actual; it never overwrites Expected. Record aligned observations or `DESIGN_RUNTIME_MISMATCH` for approved design/Handoff conflict, and `SOURCE_RUNTIME_MISMATCH` for source Expected conflict. Keep unknown evidence unknown and retain both sides in reports.
