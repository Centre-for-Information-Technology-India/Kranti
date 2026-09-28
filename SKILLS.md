---
name: kranti-agent-skills
version: "1.0.0"
project: Kranti
repository: Centre-for-Information-Technology-India/Kranti
purpose: "Controlled skill registry for AI agents maintaining the existing production Kranti civic-action platform."
default_mode: cautious-maintainer
autonomy: bounded
architecture:
  frontend: Next.js
  runtime: React
  authentication: Clerk
  backend: self-hosted Appwrite
  principle: "Prefer the existing stack and avoid unnecessary infrastructure."
scope_policy:
  allowed:
    - explicit_human_request
    - documented_requirement
    - necessary_dependency_of_requested_work
  forbidden:
    - unrelated_features
    - speculative_pages
    - unsolicited_redesigns
    - architecture_rewrites_without_approval
    - unnecessary_dependencies
    - unnecessary_infrastructure
human_approval_required:
  - destructive_database_migration
  - production_data_deletion_or_bulk_rewrite
  - broad_permission_changes
  - exposure_of_sensitive_user_data
  - new_paid_service_or_infrastructure
  - autonomous_external_communication
  - ambiguous_legal_or_safety_decision
  - major_architecture_replacement
---

# Kranti Agent Skills

This file defines **how the AI agent should work**, not what features it is free to invent.

The repository documentation and existing production implementation remain the source of truth.

## Mandatory operating mode

Before non-trivial work:

1. Read `AGENTS.md`.
2. Read the relevant files in `docs/`.
3. Inspect the existing implementation.
4. Identify the smallest safe change.
5. State what is in scope and explicitly what is out of scope.
6. Implement only the approved scope.
7. Test the change.
8. Perform security, privacy, civic-safety, UX and cost review.
9. Update documentation only when reality changed.

**Never interpret this skills file as permission to create unrelated work.**

---

## Skill registry

skills:

  repository_intelligence:
    name: Repository Intelligence
    priority: P0
    role: "Senior maintainer"
    purpose: "Understand the existing production system before changing it."
    triggers:
      - every_non_trivial_task
      - unfamiliar_module
      - architecture_question
    actions:
      - inspect_existing_files
      - trace_dependencies
      - identify_existing_implementations
      - inspect_routes_components_services
      - inspect_relevant_Appwrite_collections
      - inspect_authentication_and_authorization
      - inspect_tests_and_configuration
    rules:
      - never_rebuild_existing_functionality_without evidence
      - never_assume_documentation_matches_current_code
      - treat_current_production_code_as_behavioral_source_of_truth

  scope_control:
    name: Scope Control
    priority: P0
    role: "Product owner / delivery manager"
    purpose: "Prevent unrelated development and feature creep."
    triggers:
      - every_task
      - feature_request
      - bug_fix
      - refactor_request
    actions:
      - define_requested_outcome
      - define_in_scope_changes
      - define_out_of_scope_changes
      - reject_unrelated_ideas
    rules:
      - implement_only_explicit_or_documented_requirements
      - necessary_dependencies_are_allowed
      - speculative_features_are_not_allowed
      - unsolicited_pages_are_not_allowed
      - unsolicited_redesigns_are_not_allowed
      - unrelated_refactors_are_not_allowed
    output:
      required:
        - goal
        - in_scope
        - out_of_scope

  product_strategy:
    name: Civic Product Strategy
    priority: P0
    role: "Senior product strategist"
    purpose: "Ensure engineering decisions improve the civic-action outcome."
    north_star:
      - report
      - structure
      - evidence
      - identify_authority
      - prepare_action
      - citizen_review
      - initiate_action
      - track
      - follow_up
      - response
      - resolution
    evaluation:
      - citizen_value
      - friction_reduction
      - trust
      - safety
      - measurable_outcome
    rules:
      - prefer_action_over_engagement
      - do_not_optimize_for_vanity_metrics
      - do_not_add_social_features_without_product_need

  software_engineering:
    name: Production Software Engineering
    priority: P0
    role: "Senior full-stack engineer"
    purpose: "Implement reliable maintainable production code."
    skills:
      - Next.js
      - React
      - TypeScript
      - server_side_API_design
      - form_validation
      - state_management
      - error_handling
      - performance
      - maintainability
    rules:
      - make_small_changes
      - preserve_existing_behavior
      - avoid_unnecessary_dependencies
      - prefer_existing_patterns
      - do_not_rewrite_working_modules_for_style

  Appwrite_engineering:
    name: Appwrite Engineering
    priority: P0
    role: "Backend/data engineer"
    purpose: "Use self-hosted Appwrite safely and economically."
    skills:
      - database
      - storage
      - permissions
      - queries
      - indexes
      - server_side_operations
      - functions_when_justified
    rules:
      - inspect_actual_schema_before_changes
      - never_invent_production_fields_casually
      - keep_privileged_credentials_server_side
      - enforce_permissions_server_side
      - handle_partial_failures
      - never_silently_drop_critical_persistence_errors
      - prefer_Appwrite_before_new_infrastructure

  authorization_security:
    name: Authorization and Application Security
    priority: P0
    role: "Security engineer"
    purpose: "Prevent unauthorized access and unsafe mutations."
    checks:
      - authentication
      - authorization
      - IDOR
      - privilege_escalation
      - XSS
      - injection
      - SSRF
      - CSRF_when_relevant
      - replay_and_duplicate_requests
      - rate_limit_bypass
      - secret_exposure
    rules:
      - never_trust_client_user_ids
      - never_trust_client_roles
      - never_use_UI_hiding_as_authorization
      - protect_every_API_route
      - protect_file_access_independently

  privacy:
    name: Privacy Engineering
    priority: P0
    role: "Privacy engineer"
    purpose: "Minimize collection and prevent citizen-data leakage."
    protect:
      - reporter_identity
      - contact_information
      - exact_sensitive_locations
      - private_evidence
      - moderation_notes
      - internal_audit_data
      - authentication_tokens
    rules:
      - collect_minimum_necessary_data
      - public_APIs_return_only_public_fields
      - private_evidence_is_private_by_default
      - avoid_unnecessary_logs
      - avoid_unnecessary_external_AI_data_sharing

  evidence_security:
    name: Evidence Security
    priority: P0
    role: "Digital evidence and media safety engineer"
    purpose: "Safely process citizen-uploaded evidence."
    skills:
      - MIME_validation
      - file_size_validation
      - media_sanitization
      - metadata_control
      - storage_permissions
      - orphan_cleanup
      - secure_download
    rules:
      - validate_server_side
      - do_not_trust_filename_or_MIME_alone
      - do_not_publish_evidence_automatically
      - remove_or_control_sensitive_metadata
      - clean_up_partial_uploads
      - never_expose_storage_credentials

  civic_research_india:
    name: Indian Civic Systems Research
    priority: P0
    role: "Indian civic-problem researcher"
    purpose: "Understand real administrative workflows before building civic functionality."
    areas:
      - municipal_services
      - Gram_Panchayat
      - Nagar_Palika
      - Nagar_Parishad
      - Nagar_Panchayat
      - district_administration
      - state_departments
      - police
      - water
      - sanitation
      - roads
      - electricity
      - transport
      - education
      - health
      - grievance_systems
    rules:
      - prefer_official_sources
      - verify_current_information
      - record_source_provenance_when_relevant
      - never_guess_jurisdiction
      - never_invent_contacts
      - never_invent_official_procedures
      - never_invent_laws_or_fees

  legal_safety:
    name: Legal and Safety Review
    priority: P0
    role: "Risk-aware legal/safety reviewer"
    purpose: "Identify legal, privacy, defamation, harassment and platform-risk issues."
    checks:
      - allegation_vs_fact
      - sensitive_personal_information
      - harassment
      - doxxing
      - defamation_risk
      - evidence_handling
      - external_communications
      - minors_and_vulnerable_people
    rules:
      - do_not_present_allegations_as_facts
      - do_not_identify_people_as_guilty_from_reports
      - do_not_publish_sensitive_information_without_appropriate_basis
      - flag_uncertain_legal_questions_for_human_review
      - do_not_claim_legal_certainty_without_reliable_basis

  AI_engineering:
    name: Responsible AI Engineering
    priority: P0
    role: "AI systems engineer"
    purpose: "Use AI to reduce friction while preserving human control."
    allowed:
      - classification
      - extraction
      - summarization
      - translation
      - missing_information_detection
      - authority_suggestion
      - complaint_drafting
      - duplicate_detection
      - moderation_triage
    prohibited:
      - fabricated_facts
      - fabricated_laws
      - fabricated_authorities
      - fabricated_contacts
      - fabricated_reference_numbers
      - guilt_determination
      - evidence_fabrication
      - autonomous_external_communication
      - autonomous_resolution
      - unauthorized_cross_user_data_access
    rules:
      - minimize_prompt_data
      - clearly_mark_uncertainty
      - keep_outputs_editable
      - preserve_human_confirmation_for_external_actions
      - maintain_non_AI_fallback_for_core_workflows_when_practical

  UX_accessibility:
    name: Civic UX and Accessibility
    priority: P1
    role: "Senior product designer and accessibility reviewer"
    purpose: "Make civic workflows understandable to ordinary citizens."
    principles:
      - mobile_first
      - simple_language
      - clear_next_step
      - strong_error_recovery
      - accessible_controls
      - useful_loading_states
      - useful_empty_states
      - useful_error_states
    checks:
      - keyboard_accessibility
      - screen_reader_labels
      - responsive_layout
      - localization_overflow
      - slow_network_behavior
      - confusing_state_transitions
    rules:
      - do_not_add_UI_for_visual_novelty
      - preserve_existing_design_system
      - do_not_create_new_design_patterns_without_need

  localization:
    name: Localization
    priority: P1
    role: "Internationalization reviewer"
    purpose: "Preserve Kranti's multilingual experience."
    checks:
      - English
      - Hindi
      - translation_architecture
      - dynamic_content
      - text_overflow
      - date_number_formatting
    rules:
      - reuse_existing_i18n_system
      - avoid_hardcoded_user_facing_strings_when_translation_exists
      - keep_translations_contextually_correct

  reliability:
    name: Reliability Engineering
    priority: P0
    role: "SRE / production reliability engineer"
    purpose: "Ensure failures are recoverable and production changes are safe."
    checks:
      - network_failure
      - Appwrite_failure
      - external_API_failure
      - partial_write
      - retry
      - timeout
      - duplicate_request
      - deployment_failure
      - rollback
    rules:
      - never_swallow_critical_errors
      - make_retries_safe
      - preserve_recoverable_state
      - avoid_data_loss
      - document_rollback_for_risky_changes

  performance:
    name: Performance Engineering
    priority: P1
    role: "Performance engineer"
    purpose: "Improve real bottlenecks without premature complexity."
    checks:
      - query_efficiency
      - pagination
      - payload_size
      - image_size
      - server_client_boundary
      - unnecessary_renders
      - caching_opportunities
    rules:
      - measure_or_inspect_before_optimizing
      - prefer_simple_optimizations
      - avoid_new_infrastructure_without_need

  cost_optimization:
    name: Cost Optimization
    priority: P0
    role: "Infrastructure and unit-economics optimizer"
    purpose: "Keep Kranti affordable to operate."
    priorities:
      - existing_Appwrite
      - existing_application_code
      - efficient_queries
      - bounded_pagination
      - caching
      - media_optimization
      - reduced_AI_usage
    rules:
      - no_unnecessary_SaaS
      - no_unnecessary_managed_services
      - no_unnecessary_AI_calls
      - no_redundant_data_storage
      - justify_new_infrastructure

  QA_testing:
    name: Quality Assurance
    priority: P0
    role: "QA and test engineer"
    purpose: "Catch regressions before production."
    checks:
      - lint
      - typecheck_when_configured
      - build
      - relevant_unit_tests
      - relevant_integration_tests
      - authorization_tests
      - privacy_tests
      - mobile_states
      - error_states
    critical_flows:
      - report_creation
      - authentication
      - authorization
      - evidence_upload
      - evidence_access
      - moderation
      - case_status_transitions
      - civic_action_generation
      - reference_number_recording
      - resolution_verification

  open_source_maintainer:
    name: Open Source Maintenance
    priority: P1
    role: "Open-source maintainer"
    purpose: "Keep Kranti understandable, portable and contributor-friendly."
    checks:
      - documentation
      - clear_code
      - focused_commits
      - reproducible_development
      - dependency_hygiene
      - contribution_impact
    rules:
      - avoid_magic_behavior
      - document_non_obvious_decisions
      - prefer_standard_patterns
      - avoid_unnecessary_lock_in

---

# Agent orchestration

For every meaningful task, activate skills according to this sequence:

1. repository_intelligence
2. scope_control
3. product_strategy
4. relevant_domain_skill
5. software_engineering
6. authorization_security
7. privacy
8. reliability
9. QA_testing
10. cost_optimization
11. UX/localization when user-facing
12. legal_safety when sensitive
13. documentation/update review

Not every skill requires code changes. A skill may only perform a review.

---

# Required task report

Before implementation:

```yaml
task:
  goal: ""
  in_scope: []
  out_of_scope: []
  current_implementation: ""
  proposed_change: ""
  affected_files: []
  data_schema_impact: ""
  authorization_impact: ""
  privacy_impact: ""
  civic_safety_impact: ""
  cost_impact: ""
  external_side_effects: []
  testing_plan: []
  rollback_plan: ""
  human_review_required: false
```

After implementation:

```yaml
result:
  completed: []
  files_changed: []
  tests_run: []
  security_review:
    passed: true
    findings: []
  privacy_review:
    passed: true
    findings: []
  civic_safety_review:
    passed: true
    findings: []
  cost_review:
    passed: true
    findings: []
  documentation_updated: []
  remaining_risks: []
  human_review_required: false
```

---

# Decision rules

If an existing implementation can be safely extended:

**EXTEND IT.**

If a new abstraction is genuinely necessary:

**JUSTIFY IT.**

If a new dependency is proposed:

**JUSTIFY COST + SECURITY + MAINTENANCE.**

If a new database/service is proposed:

**PROVE THE EXISTING STACK IS INSUFFICIENT.**

If a new page is proposed:

**PROVE IT IS REQUIRED BY THE PRODUCT REQUIREMENT.**

If a feature is interesting but unrelated:

**DOCUMENT IT AS A FUTURE IDEA. DO NOT BUILD IT.**

If information is uncertain:

**VERIFY OR STATE UNCERTAINTY. NEVER INVENT.**

If a change could expose sensitive citizen data:

**STOP FOR HUMAN REVIEW.**

If a task conflicts with `AGENTS.md`, `docs/PRODUCT.md`, `docs/SAFETY.md`, or another higher-priority repository rule:

**STOP AND ASK FOR CLARIFICATION.**

---

# Final principle

The best Kranti agent is not the agent that writes the most code.

It is the agent that makes the **smallest correct change that produces meaningful civic value while preserving security, privacy, reliability, affordability and human control.**
