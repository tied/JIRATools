// GrandparentEpic.groovy
// Used to create the custom scripted field "Grandparent Epic"
// in JIRA.  This script can then be associated to the custom
// field via ScriptRunner's Scripted Fields tool.

import com.atlassian.jira.component.ComponentAccessor
import com.atlassian.jira.issue.CustomFieldManager
import com.atlassian.jira.issue.fields.CustomField
import com.atlassian.jira.issue.Issue

def grandParentEpic = null

if (issue.getIssueType().getName() == "Sub-task") {

    // get parent Story issue
    Issue parent = issue.getParentObject()

    if (parent.getIssueType().getName() == "Story") {
        CustomFieldManager customFieldManager = ComponentAccessor.getCustomFieldManager()
        CustomField epicLink = customFieldManager.getCustomFieldObjectByName("Epic Link")
        def parentEpic = parent.getCustomFieldValue(epicLink) as Issue
        grandParentEpic = parentEpic.summary
    }
}

return grandParentEpic
