# Skill Observation Log

Observations captured during task-oriented work.

**Status key:** OPEN = not yet actioned | ACTIONED (YYYY-MM-DD) = skill updated/created | DECLINED (YYYY-MM-DD) = user decided not to pursue

---

## 2026-07-30
Checkpoint after Todo 3 (2026-07-30): no reusable skill observations identified.


### Observation 1: Verify published native dependency compatibility before installation

**Status:** OPEN
**Date:** 2026-07-30
**Session context:** Cross-platform desktop and Expo mobile scaffolding validation
**Skill:** New skill candidate: cross-platform workspace validation
**Type:** open-source
**Phase/Area:** Dependency preflight

**Issue:** A guessed Expo Router version prevented workspace installation and masked all JavaScript validation until registry metadata identified the compatible Expo SDK release set.

**Suggested improvement:** Add a dependency-preflight step for native/mobile scaffolds that verifies every exact pin and its SDK compatibility manifest before the first workspace install.

**Principle:** Validate package availability and ecosystem compatibility together; a syntactically valid manifest is not evidence that an installable dependency graph exists.


### Observation 2: Separate build health from rendered UI validation

**Status:** OPEN
**Date:** 2026-07-30
**Session context:** Responsive React operations-console repair and final frontend verification
**Skill:** New skill candidate: frontend UI repair and verification
**Type:** open-source
**Phase/Area:** Validation evidence

**Issue:** Static lint/build checks and an HTTP 200 response established source and server health, but the environment lacked a browser or screenshot tool for rendered visual and interaction review.

**Suggested improvement:** Require UI-verification summaries to distinguish source/build, endpoint reachability, and browser-rendered checks, and explicitly disclose any unavailable visual evidence.

**Principle:** Report validation at the fidelity actually observed; a successful build and reachable route do not prove every rendered interaction.


### Observation 3: Completion checkpoint — no additional reusable observations

**Status:** OPEN
**Date:** 2026-07-30
**Session context:** Final completion of the Noa web UI audit and repair task
**Skill:** task-observer
**Type:** open-source
**Phase/Area:** Completion checkpoint

**Issue:** No additional reusable workflow observation accumulated after the final validation-evidence observation.

**Suggested improvement:** No skill change proposed at this checkpoint.

**Principle:** Completion checkpoints should explicitly record when no further generalisable learning emerged.


### Observation 4: Treat persistent previews as a separate deployment state

**Status:** OPEN
**Date:** 2026-07-30
**Session context:** Replacing a React chat-composer control with an end-to-end conversation-effort setting
**Skill:** New skill candidate: frontend UI repair and verification
**Type:** open-source
**Phase/Area:** Live-preview validation

**Issue:** The edited source and production bundle contained the new UI, while the available persistent page preview continued to show the prior control. Automated fetching of the served source module returned HTTP 200 with an empty body, so it could not resolve whether the preview was cached or served by a separate runtime.

**Suggested improvement:** Add a final preview-state check that separately reports source, bundle, served-module, and browser-session evidence; when the session cannot be programmatically reloaded, give the user one explicit hard-refresh action instead of implying the visible tab is current.

**Principle:** A browser tab, a development server, and a built bundle are independent states; validate and communicate each one separately.

### Observation 5: Gate direct native releases on signing prerequisites

**Status:** OPEN
**Date:** 2026-07-30
**Session context:** Configuring direct Android APK and Windows installer distribution
**Skill:** New skill candidate: cross-platform workspace validation
**Type:** open-source
**Phase/Area:** Native release configuration

**Issue:** A release APK can compile even when it is unsigned or signed with a development key unless the build configuration explicitly rejects missing signing material. Local hosts may also lack the JDK required to verify Android packaging.

**Suggested improvement:** Add a release-preflight step that treats signing credentials, a readable keystore, target ABI, and host toolchain availability as required build inputs, then make CI fail before publishing if any are absent.

**Principle:** A distributable native binary is not validated by compilation alone; its signing provenance and target-platform constraints must be verified before publication.

### Observation 6: Bound retries when terminal execution is non-deterministic

**Status:** OPEN
**Date:** 2026-07-30
**Session context:** Validating cross-platform release artifacts in an interrupted terminal session
**Skill:** New skill candidate: cross-platform workspace validation
**Type:** open-source
**Phase/Area:** Validation recovery

**Issue:** Repeated command retries produced delayed or interleaved output while local dependency restoration and toolchain checks were failing for environmental reasons, obscuring the difference between repository failures and terminal-session failures.

**Suggested improvement:** After one retry with a concrete changed condition, stop shell retries; preserve the successful static evidence, identify external prerequisites precisely, and route reproducible binary builds to CI instead of continuing local terminal loops.

**Principle:** Validation should change method after evidence of infrastructure failure; repeated identical execution attempts do not improve confidence.

Checkpoint after Todo 3 (2026-07-30): tag-push release automation was verified; no additional reusable skill observations identified.


### Observation 7: Align native entrypoints with the active application architecture

**Status:** OPEN
**Date:** 2026-07-30
**Session context:** Repairing a failed signed Expo Android release build
**Skill:** New skill candidate: cross-platform workspace validation
**Type:** open-source
**Phase/Area:** Mobile build preflight

**Issue:** The native release build bundled a legacy application entry point even though the active mobile application had moved to a router-based directory structure. The manifest omitted the router and local workspace client dependencies, so dependency installation could not make the intended application runnable.

**Suggested improvement:** Add a native release preflight that verifies the configured entry point, source-tree architecture, package manifest dependencies, and lockfile all agree before expensive Gradle packaging begins.

**Principle:** A mobile release pipeline must validate its entry point and declared dependency graph against the app architecture; successful toolchain setup cannot compensate for stale application wiring.


### Observation 8: Cancel stale artifacts when an architecture decision changes

**Status:** OPEN
**Date:** 2026-07-30
**Session context:** Converting an in-progress Expo Android release to a conventional React Native target
**Skill:** New skill candidate: cross-platform workspace validation
**Type:** open-source
**Phase/Area:** Build orchestration

**Issue:** A release build was already running when the product direction changed from an Expo app to a plain React Native target. Allowing that process to finish would have produced valid-looking artifacts for the wrong architecture.

**Suggested improvement:** Require release workflows to record the application architecture they package and cancel obsolete builds before changing entrypoints, native configuration, or dependency graphs.

**Principle:** A successful binary is not a valid deliverable when it was built from superseded architecture; cancel stale work before implementation changes.