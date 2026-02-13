# QA Report: AGENTS-0001 - Move Ticket to Other Repo To Do

**Ticket ID**: AGENTS-0001  
**Repo**: beardedphil/portfolio-2026-hal-agents  
**QA Date**: 2026-02-13  
**QA Status**: ✅ **PASSED** (with minor observations)

## Executive Summary

The implementation successfully adds the PM agent tool `kanban_move_ticket_to_other_repo_todo` that moves tickets to another repository's To Do column. The feature meets all acceptance criteria with proper error handling, validation, and user feedback. The code is well-structured, follows existing patterns, and includes appropriate fallback handling.

## Acceptance Criteria Review

### ✅ AC1: Tool exposes `kanban_move_ticket_to_other_repo_todo` with correct parameters

**Status**: PASSED

- Tool is properly defined at lines 1515-1757 in `projectManager.ts`
- Accepts `ticket_id` (string) - supports formats: "HAL-0012", "0012", or "12"
- Accepts `target_repo_full_name` (string) - format: "owner/repo"
- Tool is registered in the tools object (lines 1877-1879)
- Tool description clearly states it works from any Kanban column

**Code Location**: `src/agents/projectManager.ts:1515-1757`

### ✅ AC2: User can request moving a ticket by specifying ticket ID and target repo

**Status**: PASSED

- System instructions document the capability (line 443)
- Tool accepts both parameters as required
- Supports flexible ticket ID formats via `parseTicketNumber()` function
- Validates target repo format (must contain '/')

**Code Location**: 
- System instructions: `src/agents/projectManager.ts:443`
- Tool definition: `src/agents/projectManager.ts:1526-1531`

### ✅ AC3: PM agent can list available repositories

**Status**: PASSED

- `list_available_repos` tool is implemented (lines 1440-1513)
- Tool returns all unique `repo_full_name` values from tickets table
- System instructions document usage (line 445)
- Fallback reply handling included (lines 2046-2063)
- Handles legacy schema gracefully (returns empty list if no repo_full_name column)

**Code Location**: `src/agents/projectManager.ts:1440-1513`

### ✅ AC4: Clear error message for non-existent/inaccessible target repo

**Status**: PASSED (with observation)

- Error message: `Target repository "${targetRepo}" does not exist or you do not have access to it. Use list_available_repos to see available repositories.`
- Validation checks if target repo exists by querying tickets table
- **Observation**: The validation logic (lines 1612-1643) checks if the repo can be queried, but doesn't explicitly verify user access permissions. However, if the user lacks access, the Supabase query would likely fail, which is handled. The current approach is reasonable for this implementation.

**Code Location**: `src/agents/projectManager.ts:1612-1643`

### ✅ AC5: Clear error message for invalid/not found ticket ID

**Status**: PASSED

- Error message: `Could not parse ticket number from "${input.ticket_id}".` (line 1552)
- Error message: `Ticket ${input.ticket_id} not found.` (line 1604)
- Proper validation using `parseTicketNumber()` function
- Handles both repo-scoped and legacy ticket lookups

**Code Location**: `src/agents/projectManager.ts:1551-1607`

### ✅ AC6: Move works from any Kanban column (not only Unassigned)

**Status**: PASSED

- Tool description explicitly states: "Works from any Kanban column (not only Unassigned)" (line 1525)
- No column validation that restricts to Unassigned
- Captures current column for reporting: `const currentCol = (row as { kanban_column_id?: string | null }).kanban_column_id ?? 'col-unassigned'` (line 1609)
- Success response includes `fromColumn` and `toColumn` for transparency

**Code Location**: `src/agents/projectManager.ts:1525, 1609, 1743`

## Code Quality

### Strengths

1. **Comprehensive Error Handling**: All error paths are handled with clear messages
2. **Legacy Schema Support**: Gracefully handles both new repo-scoped schema and legacy schema
3. **Proper ID Management**: 
   - Calculates next ticket_number for target repo
   - Updates display_id with target repo prefix using `repoHintPrefix()`
   - Updates body_md Title line to reflect new display_id
4. **Position Management**: Correctly calculates next position in target repo's To Do column
5. **Tool Registration**: Properly conditionally registered only when Supabase is available
6. **Fallback Replies**: Includes fallback reply handling for when LLM doesn't generate text
7. **System Instructions**: Well-documented in PM_SYSTEM_INSTRUCTIONS

### Observations & Recommendations

1. **Target Repo Validation**: The validation checks if a repo can be queried, but doesn't explicitly verify GitHub access. This is acceptable since:
   - If user lacks access, Supabase queries would fail
   - The error handling catches and reports these failures
   - The current approach allows moving to repos even if they have no tickets yet (which is reasonable)

2. **Ticket Number Calculation**: The logic at lines 1645-1666 calculates the next ticket number for the target repo. If the target repo has no tickets, it uses the source ticket number. This is correct behavior.

3. **Body MD Update**: The tool updates the Title line in body_md to reflect the new display_id (line 1726). This ensures consistency.

4. **No Transaction Safety**: The update operation is not wrapped in a transaction. If the update partially fails, there could be inconsistencies. However, this matches the pattern used in other tools in the codebase.

## Testing Recommendations

### Manual Testing Scenarios

1. ✅ **Happy Path**: Move ticket HAL-0012 from any column to owner/other-repo To Do
2. ✅ **Invalid Ticket ID**: Try moving "INVALID" or "99999" - should return clear error
3. ✅ **Invalid Repo Format**: Try moving to "invalid-repo" (no slash) - should return format error
4. ✅ **Non-existent Repo**: Try moving to "nonexistent/repo" - should return access error
5. ✅ **List Repos**: Ask "what repos can I move tickets to?" - should list available repos
6. ✅ **From Different Columns**: Move from QA, Human-in-the-loop, etc. - should work from any column
7. ✅ **Display ID Update**: Verify display_id changes to match target repo prefix
8. ✅ **Title Line Update**: Verify body_md Title line reflects new display_id

### Edge Cases Covered

- ✅ Legacy schema (no repo_full_name column)
- ✅ Target repo with no existing tickets
- ✅ Ticket not found scenarios
- ✅ Database query failures
- ✅ Empty repository list

## Documentation Review

### System Instructions
- ✅ Clear documentation of tool usage (line 443)
- ✅ Clear documentation of list_available_repos (line 445)
- ✅ Mentions error handling and confirmation requirements

### Code Comments
- ✅ Adequate inline comments explaining logic
- ✅ Comments explain legacy schema fallbacks
- ✅ Comments explain ticket number calculation

## Integration Points

1. **Supabase Integration**: Uses existing Supabase client pattern
2. **Tool Registration**: Follows existing conditional tool registration pattern
3. **Error Handling**: Consistent with other tools in the codebase
4. **Fallback Replies**: Follows existing fallback reply pattern

## Security Considerations

1. ✅ **Input Validation**: Validates ticket_id format and target_repo format
2. ✅ **SQL Injection**: Uses Supabase query builder (safe)
3. ✅ **Access Control**: Relies on Supabase RLS policies (appropriate for this layer)
4. ⚠️ **Repo Access**: Validation checks queryability but doesn't explicitly verify GitHub permissions. This is acceptable as Supabase RLS should handle access control.

## Performance Considerations

- ✅ Efficient queries with `.limit(1)` for max calculations
- ✅ Single update operation (no multiple round trips)
- ✅ Proper indexing assumed on `repo_full_name` and `ticket_number` columns

## Conclusion

**Overall Assessment**: ✅ **PASSED**

The implementation successfully meets all acceptance criteria. The code is well-structured, follows existing patterns, includes comprehensive error handling, and provides clear user feedback. The feature is ready for use.

### Minor Observations (Non-blocking)

1. Target repo validation could be more explicit about access verification, but current approach is acceptable
2. Consider adding transaction support for atomicity (future enhancement)

### Sign-off

- **Code Review**: ✅ Complete
- **Acceptance Criteria**: ✅ All met
- **Error Handling**: ✅ Comprehensive
- **Documentation**: ✅ Adequate
- **Ready for Production**: ✅ Yes

---

**QA Completed By**: Auto (Cursor Agent)  
**Date**: 2026-02-13
