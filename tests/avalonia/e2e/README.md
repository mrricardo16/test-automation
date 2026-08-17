# Avalonia E2E Boundary

This directory is reserved for Phase 2B / Phase 2.5: real Avalonia project Headless integration.

That future phase must first inspect the real project's TargetFramework, Avalonia version, XAML, ViewModels, DI, resources, and service dependencies. It must classify candidate cases as directly Headless-testable, requiring a Test Double or Mock, requiring Appium E2E, or requiring manual execution.

The real business project must remain read-only by default. Product-side AutomationId or testability changes are recommendations only unless separately authorized.

No Appium package, driver, desktop E2E test, or real business project reference belongs in the current Phase 2 fixture.
