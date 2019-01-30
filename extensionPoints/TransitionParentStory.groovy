//  TransitionParentStory.groovy
//  This module will be attached to a post-function for the sub-task "To Do" -> "In Progress" transition.  
//  It will check the parent story status.  If it is still in "To Do", it will also trigger a transition
//  to "In Progress".
//
//  Installation:
//  Install on jira.trustvesta.com at /var/atlassian/application-data/jira/scripts/TransitionParentStory.groovy


import com.atlassian.jira.component.ComponentAccessor
import com.atlassian.jira.issue.Issue

def transitionID = 21; // "In Progress" transition

if (issue.getIssueType().getName() == "Sub-task") {

    // get parent Story issue
    Issue parent = issue.getParentObject()
	
    if (parent.getIssueType().getName() == "Story")  {
		def user = ComponentAccessor.getJiraAuthenticationContext().getLoggedInUser()
		def issueService = ComponentAccessor.getIssueService()
		def issueInputParameters = issueService.newIssueInputParameters()
		
		// For now, remove defining a comment since it is not working
		// https://jira.atlassian.com/browse/JRASERVER-23814
		// issueInputParameters.with {
		//	 setComment("*Auto transition to In Progress due to sub-task transition.")
		// }
		
		def parentStatus = parent.status.getName();
		// If the parent is not in "To Do", then nothing to do
        if (parentStatus != "To Do") {
			return
		}
		
		def validationResult = issueService.validateTransition(user, parent.id, transitionID, issueInputParameters)
		if (validationResult.isValid()) {
			def issueResult = issueService.transition(user, validationResult)
			if (! issueResult.isValid()) {
				log.warn("Failed to transition parent story ${parent.key}, errors: ${issueResult.errorCollection}")
			}
		} else {
			log.warn("Could not transition parent story ${parent.key}, errors: ${validationResult.errorCollection}")
		}
    }
}
