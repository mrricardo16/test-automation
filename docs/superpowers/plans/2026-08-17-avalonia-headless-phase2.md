# Avalonia Headless Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add an independent net8.0 Avalonia Headless + xUnit v3 fixture that passes TC-AVA-ENV-001 without referencing any real Avalonia business project, while keeping Phase 1 Playwright green.

**Architecture:** Create one standalone test project under tests/avalonia/headless. Build the UI in C# with a Window, TextBox, Button, and TextBlock; bind them to a small ViewModel and ICommand; initialize Avalonia with AvaloniaTestApplication and UseHeadless; run one AvaloniaFact test on the Avalonia UI thread. Reserve tests/avalonia/e2e for the later Phase 2B real-project integration boundary.

**Tech Stack:** .NET SDK 8.0.100, net8.0, Avalonia.Headless.XUnit 12.1.0, Avalonia.Themes.Fluent 12.1.0, xunit.v3 3.2.2, Microsoft.NET.Test.Sdk 18.8.1, PowerShell, Git.

## Global Constraints

- Do not reference or modify any real Avalonia business project.
- Do not install Appium, WinAppDriver, Android SDK, Java, CI/CD tools, or global .NET tools.
- Reuse the existing .NET SDK installations.
- Keep all Avalonia package versions on the 12.1.0 line.
- Use net8.0; do not retarget to net10.0.
- Create the TestCase before the formal test implementation.
- Do not use Thread.Sleep, Task.Delay, screen coordinates, real desktop sessions, or external services.
- Do not catch and suppress infrastructure exceptions or remove assertions.
- Preserve UTF-8 for all edited Markdown, C#, XML, JSON, and text files.
- Keep bin, obj, TestResults, node_modules, browser binaries, secrets, and generated reports out of Git.
- Run dotnet test, npm ci, npm test, git diff --check, and remote synchronization verification before claiming completion.

---

### Task 1: Add the Phase 2 TestCase and directory boundaries

Files:
- Create: test-cases/avalonia/README.md
- Create: test-cases/avalonia/TC-AVA-ENV-001.md
- Create: tests/avalonia/e2e/README.md
- Modify: .gitignore

Interfaces:
- TC-AVA-ENV-001.md is the source record for the formal C# test.
- The e2e README is the only Phase 2B placeholder; it must not contain Appium code or package setup.

- [ ] Step 1: Create test-cases/avalonia/README.md using the existing TestCase convention.

    State that all formal Avalonia cases use the fields TestCaseId, Module, Title, Priority, TestType, Preconditions, Steps, ExpectedResult, AutomationType, AutomationFramework, RequirementSource, and Notes, and that AUTO, AUTO_PARTIAL, and MANUAL remain the only AutomationType values.

- [ ] Step 2: Create TC-AVA-ENV-001.md with these values.

    TestCaseId: TC-AVA-ENV-001
    Module: AVALONIA
    Title: Verify Avalonia Headless basic UI interaction capability
    Priority: P0
    TestType: Avalonia Headless
    Preconditions: .NET 8 SDK is available and the standalone test project restores successfully
    Steps: Create the Headless Avalonia application; create TestWindow; verify Window and TextBox/Button/TextBlock control tree; focus TextBox; inject hello; trigger Submit; read TextBlock
    ExpectedResult: Window and controls initialize; TextBox binding updates InputText; SubmitCommand executes; TextBlock displays hello
    AutomationType: AUTO
    AutomationFramework: Avalonia.Headless + xUnit
    RequirementSource: 2026-08-17 Phase 2 Avalonia Headless infrastructure request
    Notes: Independent fixture only. No real business project, external service, Appium, or desktop session.

- [ ] Step 3: Create tests/avalonia/e2e/README.md.

    State that this directory is reserved for Phase 2B / Phase 2.5 real Avalonia project Headless integration. It must first inspect the business project's TargetFramework, Avalonia version, XAML, ViewModels, DI, resources, and services. It must not modify the business project and must classify candidate cases before implementation. Appium remains out of scope.

- [ ] Step 4: Extend .gitignore with explicit nested .NET output rules.

    **/bin/
    **/obj/
    **/TestResults/
    TestResults/
    *.trx

- [ ] Step 5: Validate UTF-8, whitespace, and commit.

    $utf8=[Text.UTF8Encoding]::new($false,$true)
    Get-ChildItem test-cases/avalonia,tests/avalonia/e2e -File -Recurse | ForEach-Object {
      [void]$utf8.GetString([IO.File]::ReadAllBytes($_.FullName))
    }
    git add test-cases/avalonia tests/avalonia/e2e/README.md .gitignore
    git diff --cached --check
    git commit -m "test: define Avalonia headless TestCase boundary"

### Task 2: Create the independent net8.0 Avalonia Headless project

Files:
- Create: tests/avalonia/headless/AutomatedTesting.Avalonia.Headless.csproj
- Create: tests/avalonia/headless/App.cs
- Create: tests/avalonia/headless/TestViewModel.cs
- Create: tests/avalonia/headless/TestWindow.cs
- Create: tests/avalonia/headless/AvaloniaTestAssembly.cs

Interfaces:
- The project exposes App, TestWindow, TestViewModel, and TestAppBuilder to the formal test.
- The project must not contain a ProjectReference to any business project.

- [ ] Step 1: Create the project file with pinned compatible packages.

    <Project Sdk="Microsoft.NET.Sdk">
      <PropertyGroup>
        <TargetFramework>net8.0</TargetFramework>
        <IsPackable>false</IsPackable>
        <Nullable>enable</Nullable>
        <ImplicitUsings>enable</ImplicitUsings>
      </PropertyGroup>
      <ItemGroup>
        <PackageReference Include="Avalonia.Headless.XUnit" Version="12.1.0" />
        <PackageReference Include="Avalonia.Themes.Fluent" Version="12.1.0" />
        <PackageReference Include="Microsoft.NET.Test.Sdk" Version="18.8.1" />
        <PackageReference Include="xunit.v3" Version="3.2.2" />
      </ItemGroup>
    </Project>

- [ ] Step 2: Create App.cs.

    using Avalonia;
    using Avalonia.Controls.ApplicationLifetimes;
    using Avalonia.Headless;
    using Avalonia.Headless.XUnit;
    using Avalonia.Themes.Fluent;

    namespace AutomatedTesting.Avalonia.Headless;

    public sealed class App : Application
    {
        public override void Initialize()
        {
            Styles.Add(new FluentTheme());
        }
    }

    public static class TestAppBuilder
    {
        public static Avalonia.AppBuilder BuildAvaloniaApp()
        {
            return Avalonia.AppBuilder.Configure<App>()
                .UseHeadless(new AvaloniaHeadlessPlatformOptions());
        }
    }

- [ ] Step 3: Create AvaloniaTestAssembly.cs.

    using Avalonia.Headless.XUnit;

    [assembly: AvaloniaTestApplication(
        typeof(AutomatedTesting.Avalonia.Headless.TestAppBuilder))]

- [ ] Step 4: Create TestViewModel.cs.

    using System.ComponentModel;
    using System.Runtime.CompilerServices;
    using System.Windows.Input;

    namespace AutomatedTesting.Avalonia.Headless;

    public sealed class TestViewModel : INotifyPropertyChanged
    {
        private string _inputText = string.Empty;
        private string _statusText = string.Empty;

        public TestViewModel()
        {
            SubmitCommand = new RelayCommand(() => StatusText = InputText);
        }

        public event PropertyChangedEventHandler? PropertyChanged;

        public string InputText
        {
            get => _inputText;
            set
            {
                if (_inputText == value)
                {
                    return;
                }

                _inputText = value;
                OnPropertyChanged();
            }
        }

        public string StatusText
        {
            get => _statusText;
            private set
            {
                if (_statusText == value)
                {
                    return;
                }

                _statusText = value;
                OnPropertyChanged();
            }
        }

        public ICommand SubmitCommand { get; }

        private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        private sealed class RelayCommand : ICommand
        {
            private readonly Action _execute;

            public RelayCommand(Action execute)
            {
                _execute = execute;
            }

            public event EventHandler? CanExecuteChanged;

            public bool CanExecute(object? parameter) => true;

            public void Execute(object? parameter) => _execute();
        }
    }

- [ ] Step 5: Create TestWindow.cs.

    using Avalonia.Controls;
    using Avalonia.Data;
    using Avalonia.Layout;

    namespace AutomatedTesting.Avalonia.Headless;

    public sealed class TestWindow : Window
    {
        public TestWindow()
        {
            DataContext = new TestViewModel();

            var inputTextBox = new TextBox
            {
                Name = "InputTextBox",
                Width = 240,
            };
            inputTextBox.Bind(
                TextBox.TextProperty,
                new Binding(nameof(TestViewModel.InputText))
                {
                    Mode = BindingMode.TwoWay,
                });

            var submitButton = new Button
            {
                Name = "SubmitButton",
                Content = "Submit",
            };
            submitButton.Bind(
                Button.CommandProperty,
                new Binding(nameof(TestViewModel.SubmitCommand)));

            var statusTextBlock = new TextBlock
            {
                Name = "StatusTextBlock",
            };
            statusTextBlock.Bind(
                TextBlock.TextProperty,
                new Binding(nameof(TestViewModel.StatusText)));

            Content = new StackPanel
            {
                Spacing = 8,
                Children =
                {
                    inputTextBox,
                    submitButton,
                    statusTextBlock,
                },
            };
        }
    }

### Task 3: Add the formal headless test and verify the fixture

Files:
- Create: tests/avalonia/headless/TC_AVA_ENV_001_HeadlessInteractionShouldWork.cs

Interfaces:
- Consumes TestWindow and TestViewModel from Task 2.
- Produces the passing TestCaseId-linked dotnet test.

- [ ] Step 1: Create the formal test.

    using Avalonia.Controls;
    using Avalonia.Headless.XUnit;
    using Avalonia.Input;
    using Xunit;

    namespace AutomatedTesting.Avalonia.Headless;

    public sealed class TC_AVA_ENV_001_HeadlessInteractionShouldWork
    {
        [AvaloniaFact]
        public void TC_AVA_ENV_001_HeadlessInteraction_ShouldUpdateBoundStatus()
        {
            var window = new TestWindow();
            var viewModel = Assert.IsType<TestViewModel>(window.DataContext);
            var panel = Assert.IsType<StackPanel>(window.Content);

            var textBox = Assert.IsType<TextBox>(
                panel.Children.Single(control => control.Name == "InputTextBox"));
            var button = Assert.IsType<Button>(
                panel.Children.Single(control => control.Name == "SubmitButton"));
            var statusText = Assert.IsType<TextBlock>(
                panel.Children.Single(control => control.Name == "StatusTextBlock"));

            window.Show();
            Assert.True(window.IsVisible);

            textBox.Focus();
            window.KeyTextInput("hello");

            Assert.Equal("hello", viewModel.InputText);
            Assert.Equal(string.Empty, statusText.Text);

            button.Focus();
            window.KeyReleaseQwerty(PhysicalKey.Space, RawInputModifiers.None);

            Assert.Equal("hello", viewModel.StatusText);
            Assert.Equal("hello", statusText.Text);

            window.Close();
        }
    }

- [ ] Step 2: Restore and run the focused project test.

    dotnet restore tests/avalonia/headless/AutomatedTesting.Avalonia.Headless.csproj
    dotnet test tests/avalonia/headless/AutomatedTesting.Avalonia.Headless.csproj --no-restore

    Expected: TC_AVA_ENV_001_HeadlessInteraction_ShouldUpdateBoundStatus passes. If restore or initialization fails, classify it as ERROR and inspect the actual compiler/runtime output before changing code.

- [ ] Step 3: Run the whole focused project again from the project root.

    dotnet test tests/avalonia/headless/AutomatedTesting.Avalonia.Headless.csproj

    Expected: the same one test passes with no Appium or desktop window.

- [ ] Step 4: Commit the fixture and test.

    git add tests/avalonia/headless
    git diff --cached --check
    git commit -m "feat: add Avalonia headless test fixture"

### Task 4: Update repository guidance and write the Phase 2 report

Files:
- Modify: AGENTS.md
- Modify: README.md
- Create: reports/avalonia-headless-initialization.md

Interfaces:
- AGENTS.md keeps all Phase 1 Playwright and status rules and adds the approved Avalonia rules.
- README.md exposes both npm test and the explicit dotnet test command.
- The report records actual environment, package, test, regression, and Appium results.

- [ ] Step 1: Add the Avalonia rules to AGENTS.md without deleting existing rules.

    Add:
    Avalonia defaults to Headless before Appium.
    Headless tests must not depend on a real Desktop Session or screen coordinates.
    Headless UI behavior should be validated through ViewModel, Command, Binding, and Control State.
    Appium is only for Headless-incomplete real desktop E2E scenarios.
    Appium is prohibited in the current phase.
    Real business projects are read-only by default.
    Do not change product code to make tests pass.

- [ ] Step 2: Update README.md.

    Add Phase 2 Avalonia Headless Testing to the implemented capability list. Document:
    npm test for Web;
    dotnet test tests/avalonia/headless/AutomatedTesting.Avalonia.Headless.csproj for Avalonia Headless;
    Phase 2B / Phase 2.5 as deferred real-project integration;
    Avalonia Appium E2E as not implemented.

- [ ] Step 3: Collect actual verification evidence before writing the report.

    dotnet --version
    dotnet test tests/avalonia/headless/AutomatedTesting.Avalonia.Headless.csproj
    npm ci
    npm test
    git diff --check
    git status -sb
    dotnet list tests/avalonia/headless/AutomatedTesting.Avalonia.Headless.csproj package

- [ ] Step 4: Write reports/avalonia-headless-initialization.md.

    Include:
    Environment: actual .NET SDK, TargetFramework, Avalonia.Headless.XUnit, Avalonia.Themes.Fluent, xunit.v3, Microsoft.NET.Test.Sdk.
    Reused Environment: existing .NET SDK reused; no .NET SDK installation performed.
    Added Dependencies: only the pinned project package references.
    Test: TC-AVA-ENV-001 actual PASS/FAIL/ERROR and command.
    Regression: TC-WEB-ENV-001 actual PASS/FAIL/ERROR and npm ci result.
    Appium: Not installed. Not configured.
    Deferred Scope: Phase 2B / Phase 2.5 real Avalonia project integration only.

- [ ] Step 5: Validate UTF-8 and commit documentation.

    $utf8=[Text.UTF8Encoding]::new($false,$true)
    foreach ($file in @('AGENTS.md','README.md','reports/avalonia-headless-initialization.md')) {
      [void]$utf8.GetString([IO.File]::ReadAllBytes((Join-Path 'E:\automated-testing' $file)))
    }
    git add AGENTS.md README.md reports/avalonia-headless-initialization.md
    git diff --cached --check
    git commit -m "docs: record Avalonia headless phase 2 baseline"

### Task 5: Run final regression, safety checks, and push main

Files:
- No additional source files; verify all tracked content and remote state.

Interfaces:
- Leaves main synchronized with origin/main and both formal TestCases passing.

- [ ] Step 1: Run final tests.

    dotnet test tests/avalonia/headless/AutomatedTesting.Avalonia.Headless.csproj
    npm ci
    npm test

    Expected: the Avalonia and Web test commands both pass.

- [ ] Step 2: Run repository safety checks.

    git diff --check
    git status --short
    git ls-files | Select-String '(^|/)(bin|obj|TestResults|node_modules|artifacts|reports/playwright-report)(/|$)|\\.env$'
    git grep -n -I -E 'gho_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----' -- .
    Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notmatch '\\node_modules\\|\\artifacts\\|\\reports\\playwright-report\\|\\bin\\|\\obj\\|\\TestResults\\' } | ForEach-Object {
      $utf8=[Text.UTF8Encoding]::new($false,$true)
      [void]$utf8.GetString([IO.File]::ReadAllBytes($_.FullName))
    }

    Expected: no tracked generated output, no credential patterns, all remaining project files decode as UTF-8.

- [ ] Step 3: Push without force and verify synchronization.

    git push origin main
    git fetch origin main
    git status -sb
    git log -1 --oneline
    git rev-list --left-right --count origin/main...HEAD
    gh repo view mrricardo16/test-automation --json nameWithOwner,isPrivate,defaultBranchRef,url

    Expected: push succeeds, main is clean, divergence is 0 0, and the private remote exists with default branch main.
