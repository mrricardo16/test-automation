# TestCase design and Review Gate

Order is Baseline → Coverage → TestCase → Review Gate → automation. Every TestCase has TestCaseId, ModuleId, FeatureId, Title, Priority, TestLayer, Covers, SourceEvidence, ExpectedBasis, Preconditions, TestData, Steps, ExpectedResult, AutomationType, EvidenceRequirement, Cleanup, Status, Limitations. The Review Gate blocks missing/unknown expected (`UNKNOWN_EXPECTATION`), evidence, mapping, appropriate layer, safe data, cleanup, destructive approval, runtime prerequisite, or evidence requirement.
