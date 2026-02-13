## Ticket

- **ID**: AGENTS-0003
- **Title**: Fix QA artifact validation to accept substantive QA reports
- **Owner**: Implementation agent
- **Type**: Bug
- **Priority**: P1

## Linkage (for tracking)

- **Fixes**: AGENTS-0002 (QA workflow blocked by overly strict validation)
- **Category**: Process

## Goal (one sentence)

Fix the backend validation in `POST /api/artifacts/insert-qa` to properly recognize substantive QA report content and accept legitimate QA reports instead of rejecting them as "placeholder text".

## Human-verifiable deliverable (UI-only)

From the HAL UI, after running a QA workflow that calls `insert_qa_artifact` with a comprehensive QA report (like the example below), the ticket's **Artifacts** panel shows the QA artifact with the full report content visible and readable. The artifact is not rejected with a "placeholder text" error.

## Acceptance criteria (UI-only)

- [ ] Running `insert_qa_artifact` with the sample QA report content (provided below) successfully creates a QA artifact in Supabase
- [ ] The QA artifact appears in the HAL UI Artifacts panel for the target ticket
- [ ] Opening the artifact displays the full QA report content (not truncated or empty)
- [ ] The validation accepts QA reports that contain analysis, findings, recommendations, and conclusions (not just code)
- [ ] The validation still rejects actual placeholder text (e.g., "TODO", "placeholder", empty content, single words)

## Constraints

- Keep this fix focused on the validation logic only—do not change the tool implementation in hal-agents
- The validation should distinguish between QA artifacts (`agent_type = "qa"`) and implementation artifacts
- QA reports contain analysis and findings, not implementation code, so validation rules should differ
- Maintain backward compatibility with existing implementation artifact validation

## Non-goals

- Changing the `insert_qa_artifact` tool in hal-agents (that's already correct)
- Modifying the HAL UI (validation happens server-side)
- Adding new API endpoints (use existing `POST /api/artifacts/insert-qa`)

## Implementation notes (optional)

**Current Issue**:
The backend validation in `POST /api/artifacts/insert-qa` is rejecting comprehensive QA reports (11,453+ characters with detailed analysis) as "placeholder text". The error message is:
```
Artifact body appears to contain only placeholder text. Artifacts must include actual implementation details, not placeholders.
```

**Root Cause**:
The validation logic appears to be designed for implementation artifacts (which contain code, file paths, etc.) and doesn't recognize QA report content (analysis, findings, recommendations) as substantive.

**Suggested Approach**:
1. Locate the validation logic in the HAL backend (likely in the route handler for `POST /api/artifacts/insert-qa`)
2. Review how it determines "placeholder text" vs substantive content
3. Adjust validation to:
   - For `agent_type = "qa"`: Accept content that contains analysis, findings, recommendations, structured sections (headers, lists, detailed text)
   - For implementation artifacts: Keep existing validation rules
4. Test with the sample QA report provided below

**Sample QA Report Content** (should be accepted):
The following is a complete, substantive QA report that was incorrectly rejected. This content should pass validation:

---

# QA Report: AGENTS-0002 - QA Artifact Creation via HAL API

**Ticket ID**: AGENTS-0002  
**Repo**: beardedphil/portfolio-2026-hal-agents  
**QA Date**: 2026-02-13  
**QA Status**: ✅ **PASSED** (with observations and recommendations)

## Executive Summary

The implementation provides the `insert_qa_artifact` tool in `qaTools.ts` that enables QA workflows to create or update QA artifacts in Supabase via HAL's `POST /api/artifacts/insert-qa` endpoint. The tool implementation is correct and follows the expected pattern. However, the tool is a library function that must be integrated into QA workflows to be fully functional. The implementation meets the core requirements, but verification of end-to-end behavior requires integration testing with the HAL API endpoint.

## Acceptance Criteria Review

### ✅ AC1: Running the hal-agents QA flow results in a QA artifact with `agent_type = "qa"`

**Status**: PASSED (with verification needed)

**Implementation Review**:
- The `insert_qa_artifact` tool is properly defined in `src/agents/qaTools.ts` (lines 31-74)
- Tool correctly calls `POST /api/artifacts/insert-qa` endpoint (line 50)
- Tool accepts required parameters: `ticket_id`, `title`, `body_md`
- The `agent_type = "qa"` assignment is expected to be handled by the backend endpoint (not visible in this codebase)

**Code Location**: `src/agents/qaTools.ts:31-74`

**Verification Notes**:
- The tool implementation is correct
- Backend endpoint behavior (setting `agent_type = "qa"`) must be verified via integration testing
- Tool is exported via `createQaTools()` function but usage in QA workflows is not visible in this repository (may be in HAL superrepo)

### ⚠️ AC2: Artifact title is exactly "QA Report for ticket KANBAN-0001"

**Status**: PARTIAL PASS (depends on caller)

**Implementation Review**:
- Tool accepts `title` as a string parameter (line 36)
- Tool description provides example: "QA report for ticket 0076" (line 36)
- **Issue**: Tool does not enforce the exact title format "QA Report for ticket {TICKET_ID}"
- Title format depends on how the tool is called by QA workflows

**Code Location**: `src/agents/qaTools.ts:36`

**Recommendations**:
1. Update tool description to specify exact format: "QA Report for ticket {ticket_id}" (note capitalization)
2. Consider adding validation or normalization to ensure consistent title format
3. Document the expected title format in tool description for QA workflow implementers

**Risk**: Low - QA workflows can format the title correctly when calling the tool, but there's no enforcement.

### ✅ AC3: Artifact body contains substantive QA report content

**Status**: PASSED (with backend validation expected)

**Implementation Review**:
- Tool accepts `body_md` parameter for full markdown content (line 37)
- Tool passes `body_md` to the backend endpoint (line 44)
- Backend endpoint should validate that content is substantive (not empty/placeholder)

**Code Location**: `src/agents/qaTools.ts:37, 44`

**Verification Notes**:
- Tool correctly accepts and forwards body content
- Backend endpoint validation for substantive content must be verified via integration testing
- Tool does not perform client-side validation (appropriate - validation should be server-side)

### ✅ AC4: Re-running updates/replaces existing QA report (exactly one artifact)

**Status**: PASSED (with backend verification needed)

**Implementation Review**:
- Tool calls the same endpoint for both insert and update operations
- Response includes `action` field (line 65) which likely indicates "inserted" vs "updated"
- Backend endpoint is responsible for duplicate prevention logic

**Code Location**: `src/agents/qaTools.ts:50-66`

**Verification Notes**:
- Tool correctly calls the endpoint which should handle upsert logic
- Backend endpoint behavior (ensuring exactly one QA artifact per ticket) must be verified
- The `action` field in response suggests backend tracks whether artifact was inserted or updated

### ⚠️ AC5: Clear failure message if endpoint rejects artifact

**Status**: PARTIAL PASS (error handling exists, visibility depends on integration)

**Implementation Review**:
- Tool has comprehensive error handling:
  - Catches network/fetch errors (lines 67-72)
  - Handles API error responses (lines 57-59)
  - Returns structured error objects with `success: false` and `error` message
- Error messages are descriptive:
  - `result.error || 'Failed to insert QA artifact'` (line 58)
  - Exception messages are captured (line 70)

**Code Location**: `src/agents/qaTools.ts:56-72`

**Observations**:
- Error handling is well-implemented in the tool
- Error visibility depends on how QA workflows consume tool results
- If tool is called via AI SDK, errors should be visible in tool call results
- For cloud agents using tool call contract, errors need to be surfaced in user-visible output

**Recommendations**:
1. Verify that QA workflows surface tool errors to users (not just in devtools)
2. Consider adding more specific error messages for common failure scenarios
3. Document expected error handling behavior for QA workflow implementers

## Code Quality

### Strengths

1. **Clean API Design**: Tool follows consistent pattern with other tools in the file
2. **Proper Error Handling**: Comprehensive try-catch with meaningful error messages
3. **Type Safety**: Uses Zod for parameter validation
4. **Backward Compatibility**: Supports optional Supabase credentials in request body
5. **Consistent Pattern**: Follows same structure as `insert_implementation_artifact` tool
6. **Response Structure**: Returns useful information (`artifact_id`, `action`) for workflow tracking

### Code Structure

```typescript
tools.insert_qa_artifact = tool({
  description: '...',
  parameters: z.object({
    ticket_id: z.string(),
    title: z.string(),
    body_md: z.string(),
  }),
  execute: async (input) => {
    // Proper error handling
    // Correct API call
    // Structured response
  },
})
```

### Observations & Recommendations

1. **Title Format Enforcement**: 
   - **Current**: Tool accepts any title string
   - **Recommendation**: Update tool description to specify exact format: "QA Report for ticket {ticket_id}" (with proper capitalization)
   - **Alternative**: Add optional validation/normalization helper

2. **Error Message Clarity**:
   - **Current**: Generic "Failed to insert QA artifact" fallback
   - **Recommendation**: Consider more specific error messages based on response status codes or error types

3. **Integration Points**:
   - Tool is properly exported via `createQaTools()`
   - Usage in QA workflows is not visible in this repository
   - Integration testing with HAL API endpoint is required for full verification

4. **Documentation**:
   - Tool description is clear but could specify exact title format requirement
   - Consider adding JSDoc comments with usage examples

## Testing Recommendations

### Unit Testing (Tool Level)

1. ✅ **Happy Path**: Call tool with valid parameters, verify correct API call
2. ✅ **Error Handling**: Test network failures, API errors, invalid responses
3. ✅ **Parameter Validation**: Verify Zod schema validation works correctly

### Integration Testing (Required)

1. ⚠️ **End-to-End QA Flow**: 
   - Run QA workflow for KANBAN-0001
   - Verify artifact appears in HAL UI Artifacts panel
   - Verify `agent_type = "qa"` is set correctly

2. ⚠️ **Title Format Verification**:
   - Verify artifact title is exactly "QA Report for ticket KANBAN-0001"
   - Test with different ticket ID formats

3. ⚠️ **Duplicate Prevention**:
   - Run QA flow twice for same ticket
   - Verify exactly one artifact exists (no duplicates)
   - Verify second run updates existing artifact

4. ⚠️ **Error Visibility**:
   - Test with invalid/non-substantive content
   - Verify error message appears in user-visible output (not just devtools)
   - Test with network failures

5. ⚠️ **Content Validation**:
   - Test with empty body_md
   - Test with placeholder content
   - Verify backend rejects non-substantive content appropriately

### Manual Testing Scenarios

1. **Basic QA Flow**:
   - Trigger QA workflow for KANBAN-0001
   - Verify artifact creation in HAL UI
   - Open artifact and verify content is readable

2. **Re-run QA Flow**:
   - Run QA workflow again for KANBAN-0001
   - Verify artifact is updated (not duplicated)
   - Verify updated content is visible

3. **Error Scenarios**:
   - Test with invalid ticket ID
   - Test with network connectivity issues
   - Verify error messages are user-visible

## Integration Points

1. **HAL API Endpoint**: `POST /api/artifacts/insert-qa`
   - Must handle `agent_type = "qa"` assignment
   - Must implement upsert logic (exactly one artifact per ticket)
   - Must validate substantive content
   - Must return clear error messages

2. **QA Workflow Integration**:
   - QA workflows must call `insert_qa_artifact` tool
   - QA workflows must format title as "QA Report for ticket {TICKET_ID}"
   - QA workflows must surface tool errors to users

3. **HAL UI**:
   - Must display artifacts with `agent_type = "qa"` in Artifacts panel
   - Must render markdown content correctly
   - Must show exactly one QA artifact per ticket

## Security Considerations

1. ✅ **Input Validation**: Tool uses Zod for parameter validation
2. ✅ **API Security**: Relies on HAL API endpoint for authentication/authorization
3. ✅ **Error Information**: Error messages don't expose sensitive system details
4. ✅ **Backward Compatibility**: Optional credentials support doesn't compromise security when not provided

## Performance Considerations

- ✅ Single API call per artifact operation
- ✅ Efficient error handling (no unnecessary retries)
- ✅ Proper use of async/await

## Known Limitations

1. **Title Format**: Tool doesn't enforce exact title format - relies on caller
2. **Content Validation**: Tool doesn't validate content substantiveness - relies on backend
3. **Error Visibility**: Tool returns errors but visibility depends on workflow integration
4. **Integration Testing**: Full end-to-end verification requires HAL API and UI access

## Integration Testing Results

### Endpoint Accessibility Test

**Test Date**: 2026-02-13  
**Endpoint**: `POST https://portfolio-2026-hal.vercel.app/api/artifacts/insert-qa`  
**Status**: ✅ Endpoint is accessible and responding

### Content Validation Test

**Test**: Attempted to insert QA report for AGENTS-0002 (11,453 characters, comprehensive analysis)

**Result**: ⚠️ **Validation Issue Detected**

```
Status: 400 Bad Request
Error: Artifact body appears to contain only placeholder text. 
       Artifacts must include actual implementation details, not placeholders.
```

**Analysis**:
- The endpoint validation is working (rejects non-substantive content)
- However, the validation appears to be designed for implementation artifacts, not QA reports
- A comprehensive QA report (11,453 characters with detailed analysis) was rejected as "placeholder text"
- This suggests the backend validation logic may need adjustment to recognize QA reports as substantive content

**Impact**:
- QA workflows may fail to insert artifacts if validation is too strict
- The validation logic should distinguish between QA artifacts and implementation artifacts
- QA reports contain analysis and findings, not implementation code, which may trigger false positives

**Recommendation**:
1. Review backend validation logic for `POST /api/artifacts/insert-qa` endpoint
2. Ensure validation recognizes QA report content as substantive (analysis, findings, recommendations)
3. Consider separate validation rules for `agent_type = "qa"` vs implementation artifacts
4. Test with actual QA report content to verify validation accepts legitimate QA reports

## Conclusion

**Overall Assessment**: ✅ **PASSED** (with backend validation adjustment needed)

The `insert_qa_artifact` tool implementation is correct and follows best practices. The tool properly calls the HAL API endpoint, handles errors appropriately, and provides a clean interface for QA workflows. Integration testing revealed that the endpoint is accessible and validation is working, but the validation logic may need adjustment to properly recognize QA report content.

### Key Findings

1. ✅ **Tool Implementation**: Correct and complete
2. ⚠️ **Title Format**: Not enforced by tool (depends on caller)
3. ✅ **Endpoint Accessibility**: Verified - endpoint is accessible and responding
4. ✅ **Error Handling**: Comprehensive - errors are clear and user-visible (AC5 satisfied)
5. ⚠️ **Backend Validation**: May be too strict for QA reports - comprehensive QA report (11,453 chars) was rejected as "placeholder text"

### Recommendations

1. **Immediate**: Update tool description to specify exact title format requirement
2. **Backend Validation**: Review and adjust validation logic in `POST /api/artifacts/insert-qa` to properly recognize QA report content as substantive
3. **Documentation**: Add usage examples and title format specification
4. **Validation Rules**: Consider separate validation rules for `agent_type = "qa"` artifacts vs implementation artifacts

### Sign-off

- **Code Review**: ✅ Complete
- **Tool Implementation**: ✅ Correct
- **Error Handling**: ✅ Comprehensive (AC5 satisfied - errors are user-visible)
- **Integration Testing**: ✅ Completed (endpoint accessible, validation working but may need adjustment)
- **Ready for Integration**: ⚠️ Pending backend validation adjustment for QA artifacts

---

**QA Completed By**: Auto (Cursor Agent)  
**Date**: 2026-02-13  
**Next Steps**: Integration testing with HAL API endpoint and QA workflow verification

---

**Note for Implementation**: The above QA report content (approximately 11,453 characters) is a complete, substantive QA report that should be accepted by the validation. It contains:
- Detailed analysis sections
- Code location references
- Findings and recommendations
- Testing scenarios
- Integration points
- Security and performance considerations
- Conclusion with sign-off

This is NOT placeholder text and should pass validation for `agent_type = "qa"` artifacts.
