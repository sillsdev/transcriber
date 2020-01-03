// WARNING: This file is generated using ToReducer.xsl. Changes made here may be lost.
import LocalizedStrings from 'react-localization';
import { FETCH_LOCALIZATION, SET_LANGUAGE } from './types';
import { ILocalizedStrings } from './model';

const initialState = {
	"loaded": false,
	"lang": 'en',
	"access": new LocalizedStrings({
		"en": {
			"silTranscriberAccess": "SIL Transcriber Access",
			"accessSilTranscriber": "Access SIL Transcriber",
			"createAccount": "Create an Account",
			"accessExistingAccount": "Access with existing Account",
		}
	}),
	"snackbar": new LocalizedStrings({
		"en": {
			"undo": "UNDO",
		}
	}),
	"usertable": new LocalizedStrings({
		"en": {
			"silTranscriberAdmin": "SIL Transcriber Admin",
			"chooseUser": "Choose User",
			"name": "Name",
			"email": "Email",
			"locale": "Locale",
			"phone": "Phone",
			"timezone": "Timezone",
			"cancel": "Cancel",
			"continue": "Continue",
			"role": "Role",
			"invite": "Invite",
			"action": "Action",
			"delete": "Delete",
			"filter": "Filter",
			"selectRows": "Please select row(s) to {0}.",
		}
	}),
	"alert": new LocalizedStrings({
		"en": {
			"confirmation": "Confirmation",
			"areYouSure": "Are you sure?",
			"no": "No",
			"yes": "Yes",
		}
	}),
	"projectTable": new LocalizedStrings({
		"en": {
			"silTranscriberAdmin": "SIL Transcriber Admin",
			"chooseProject": "Choose Project",
			"name": "Name",
			"description": "Description",
			"language": "Language",
			"delete": "Delete",
		}
	}),
	"chart": new LocalizedStrings({
		"en": {
			"passagesCompleted": "Passages Completed",
			"totalTransactions": "Total Transactions",
		}
	}),
	"projectSettings": new LocalizedStrings({
		"en": {
			"general": "General",
			"name": "Name",
			"description": "Description",
			"projectType": "Project Type",
			"selectProjectType": "Please select your project type",
			"language": "Language",
			"transcriptionLanguage": "Transcription Language",
			"preferredLanguageName": "Preferred Language Name",
			"uiLanguagInUserProfile": "(User interface languages are set in the user profile.)",
			"textEditor": "Text Editor",
			"defaultFont": "Default Font",
			"selectDefaultFont": "Please select the preferred default font",
			"needFont": "Need Font",
			"addMissingFont": "Can't find the font you need?",
			"defaultFontSize": "Default Font Size",
			"selectFontSize": "Please select the default font size",
			"rightToLeft": "Right to left?",
			"add": "Add a Plan",
			"upload": "Upload Media and Transcribe",
			"nextSteps": "Next Steps",
			"configure": "Configure a Collaborative Project",
			"startNow": "Start Transcribing Now",
			"dangerZone": "Danger Zone",
			"deleteProject": "Delete this Project",
			"deleteExplained": "All plans, sections, passages, and media files will be removed.",
			"delete": "DELETE",
			"save": "Save",
			"group": "Group",
			"preview": "Preview",
			"selectProjectGroup": "Select project group. Each project relates to a single group. Group members can work on the project.",
			"notAdminInGroup": "You are not an admin in this group, so you will be unable to manage the project.",
			"defaultPlanName": "Simple Plan",
			"defaultSectionName": "Section 1",
			"defaultReference": "Text 1",
		}
	}),
	"planTable": new LocalizedStrings({
		"en": {
			"addPlan": "Add Plan",
			"name": "Name",
			"type": "Type",
			"sections": "Sections",
			"taks": "Passages",
			"action": "Action",
			"filter": "Filter",
			"silTranscriberAdmin": "SIL Transcriber Admin",
			"choosePlan": "Choose a Project Plan",
			"loadingTable": "Loading data",
		}
	}),
	"planSheet": new LocalizedStrings({
		"en": {
			"action": "Action",
			"delete": "Delete",
			"move": "Move",
			"copy": "Copy",
			"attachMedia": "Attach Media",
			"addSection": "Add Section",
			"addPassage": "Add Passage",
			"save": "Save",
			"saving": "Saving",
			"selectRows": "Please select row(s) to {0}.",
			"confirm": "{0} {1} Item(s). Are you sure?",
			"sectionAbove": "Insert section above",
			"passageAbove": "Insert passage above",
		}
	}),
	"scriptureTable": new LocalizedStrings({
		"en": {
			"section": "Section",
			"title": "Title",
			"passage": "Passage",
			"book": "Book",
			"reference": "Reference",
			"description": "Description",
			"loadingTable": "Loading data",
		}
	}),
	"assignmentTable": new LocalizedStrings({
		"en": {
			"title": "Assignments",
			"section": "Section",
			"sectionstate": "State",
			"passages": "Passages",
			"passagestate": "State",
			"user": "User",
			"role": "Role",
			"assignSec": "Assign Section",
			"removeSec": "Remove Assignment",
			"delete": "Delete",
			"filter": "Filter",
			"transcriber": "Transcriber",
			"reviewer": "Reviewer",
			"selectRowsToAssign": "Please select row(s) to assign.",
			"selectRowsToRemove": "Please select row(s) to remove assignment.",
		}
	}),
	"assignSection": new LocalizedStrings({
		"en": {
			"title": "Assign Sections to Users",
			"sections": "Sections",
			"users": "Users",
			"reviewer": "Reviewer",
			"transcriber": "Transcriber",
			"role": "Role",
			"assignAs": "Assign As",
			"close": "Close",
		}
	}),
	"planTabs": new LocalizedStrings({
		"en": {
			"sectionsPassages": "Sections & Passages",
			"media": "Media",
			"assignments": "Assignments",
			"transcriptions": "Transcriptions",
		}
	}),
	"planAdd": new LocalizedStrings({
		"en": {
			"name": "Name",
			"addPlan": "Add Plan",
			"newPlanTask": "Type the name of the plan, which could be the name of a book of the Bible, a story, a lectionary and so on.",
			"planType": "Type",
			"selectPlanType": "Choose the plan type.",
			"cancel": "Cancel",
			"add": "Add",
			"save": "Save",
			"newPlan": "New Plan",
			"selectAPlanType": "Please select a plan type",
			"editPlan": "Edit Plan Details",
			"scripture": "Scripture Transcription",
			"other": "General Transcription",
		}
	}),
	"mediaTab": new LocalizedStrings({
		"en": {
			"action": "Action",
			"delete": "Delete",
			"download": "Download",
			"changeVersion": "Change Version",
			"attachPassage": "Attach Passage",
			"uploadMedia": "Upload Media",
			"uploadComplete": "Upload complete.",
			"planName": "Plan",
			"fileName": "File Name",
			"sectionId": "Section Id",
			"sectionName": "Section Name",
			"book": "Book",
			"reference": "Reference",
			"duration": "Length (s)",
			"size": "Size (KB)",
			"version": "Version",
			"section": "Section",
			"date": "Date",
			"filter": "Filter",
			"selectFiles": "Please select files to be uploaded.",
			"selectRows": "Please select row(s) to {0}.",
			"unsupported": "File {0} is an unsupported file type.",
			"loadingTable": "Loading data",
		}
	}),
	"passageMedia": new LocalizedStrings({
		"en": {
			"attachAvailableMedia": "Attach available media files to passages (with no current media).",
			"attachMediaToPassages": "Attach Media to Passages",
			"choosePassage": "Choose Your Passage ({0} without attachments)",
			"availableMedia": "Available Media ({0})",
			"attachments": "Attachments ({0}) Select if you want to detach the media from the passage.",
			"close": "Close",
		}
	}),
	"main": new LocalizedStrings({
		"en": {
			"silTranscriberAdmin": "SIL Transcriber Admin",
			"silTranscriber": "SIL Transcriber",
			"search": "Search…",
			"organization": "Org Details",
			"usersAndGroups": "Users and Groups",
			"passages": "Passages",
			"media": "Media",
			"myTasks": "My Tasks",
			"todo": "To Do",
			"allTasks": "All Tasks",
			"tasks": "Tasks",
			"plans": "Plans",
			"team": "Team",
			"settings": "Settings",
			"integrations": "Integrations",
			"project": "Project",
			"loadingTranscriberAdmin": "Loading SIL Transcriber Admin",
			"loadingTranscriber": "Loading SIL Transcriber",
			"projectSummary": "Project Summary",
			"addProject": "Add Project",
			"export": "Export",
			"logout": "Log Out",
			"myAccount": "My Account",
			"orgRole": "Organizational Role:",
			"projRole": "Role in Project:",
			"owner": "Owner",
			"clearCache": "Clear cache",
			"helpCenter": "Help Center",
			"reportIssue": "Report an Issue",
			"version": "Version: ",
			"planUnsaved": "Plan Unsaved",
			"loseData": "Do you want to leave this page and lose your changes?",
			"newOrganization": "Add Organization",
			"admin": "Admin",
			"transcribe": "Transcribe",
			"switchToAdmin": "Open project in Admin",
			"switchToApp": "Open project in App",
			"crashMessage": "Something went wrong. The developers need to address this issue.",
			"apiError": "API Error:",
			"reports": "Reports",
			"sessionExpiring": "Session Expiring",
			"sessionExpireTask": "Your session will expire in {0} seconds. Would you like to continue?",
			"exit": "Exit",
			"continue": "Continue",
			"myWorkbench": "My Workbench",
		}
	}),
	"transcriptionTab": new LocalizedStrings({
		"en": {
			"section": "Section",
			"sectionstate": "State",
			"passages": "Passages",
			"filter": "Filter",
			"transcriber": "Transcriber",
			"reviewer": "Reviewer",
			"plan": "Plan",
			"elan": "Elan",
			"export": "Export",
		}
	}),
	"transcriptionShow": new LocalizedStrings({
		"en": {
			"transcription": "Transcription",
			"transcriptionDisplay": "This display allows you to review the transcription that is stored.",
			"close": "Close",
		}
	}),
	"groupTabs": new LocalizedStrings({
		"en": {
			"users": "Users",
			"groups": "Groups",
			"invitations": "Invitations",
		}
	}),
	"groupTable": new LocalizedStrings({
		"en": {
			"name": "Name",
			"abbr": "Abbreviation",
			"owner": "Owner",
			"projects": "Projects",
			"members": "Members",
			"filter": "Filter",
			"action": "Action",
			"delete": "Delete",
			"addGroup": "Add Group",
			"selectRows": "Please select row(s) to {0}.",
		}
	}),
	"groupAdd": new LocalizedStrings({
		"en": {
			"newGroup": "New Group",
			"cancel": "Cancel",
			"add": "Add",
			"save": "Save",
			"editGroup": "Edit Group",
			"addGroup": "Add Group",
			"newGroupTask": "Type the name and abbreviation of the group.",
			"name": "Name",
			"abbr": "Abbreviation",
		}
	}),
	"groupSettings": new LocalizedStrings({
		"en": {
			"name": "Name",
			"abbreviation": "Abbreviation",
			"save": "Save",
			"projects": "Projects",
			"owners": "Owners",
			"reviewers": "Reviewers",
			"transcribers": "Transcribers",
			"ownersDetail": "(Manage + Review + Transcribe)",
			"reviewersDetail": "(Review + Transcribe)",
			"transcribersDetail": "(Transcribe)",
			"addGroupMember": "Choose {0}",
			"addMemberInstruction": "Choose a person who will act as a {0} for projects in this group.",
			"cancel": "Cancel",
			"add": "Ok",
			"delete": "Delete",
			"choose": "Choose...",
			"allReviewersCanTranscribe": "All Reviewers are allowed to transcribe.",
			"groupExplain": "Groups connect organization members to a project.",
			"case1": "If the project does not exist, click the plus button in the Navigation pane to create it.",
			"case2": "Existing projects can be associated with this group in Settings.",
			"assignedSections": "  Assigned Sections: ",
			"projectPlans": "Project Plans",
			"invalidRole": "Invalid Role. User not added.",
			"loadingTable": "Loading data",
			"noDeleteInfo": "This role is included in a higher role and cannot be deleted.",
			"noDeleteAllUsersInfo": "Cannot delete users from the All Users group",
		}
	}),
	"shapingTable": new LocalizedStrings({
		"en": {
			"NoColumns": "No columns visible",
		}
	}),
	"treeChart": new LocalizedStrings({
		"en": {
			"noData": "No Transcription Data Yet",
		}
	}),
	"languagePicker": new LocalizedStrings({
		"en": {
			"font": "Font",
			"script": "Script",
			"language": "Language",
			"selectLanguage": "Choose Language Details",
			"findALanguage": "Find a language by name, code, or country",
			"codeExplained": "Code Explained",
			"subtags": "Subtags",
			"details": "Details",
			"languageOf": "A Language of $1$2.",
			"inScript": " in the $1 script",
			"select": "Save",
			"cancel": "Cancel",
		}
	}),
	"activityState": new LocalizedStrings({
		"en": {
			"noMedia": "No Media",
			"transcribeReady": "Ready For Transcription",
			"transcribing": "Transcribing",
			"needsNewRecording": "Recording Problem",
			"transcribed": "Transcribed",
			"reviewing": "Reviewing",
			"needsNewTranscription": "Needs Changes",
			"approved": "Approved (not synced)",
			"synced": "Synced",
			"done": "Done",
		}
	}),
	"invite": new LocalizedStrings({
		"en": {
			"editInvite": "Edit Invite",
			"addInvite": "Invite User",
			"newInviteTask": "Enter the email address of the user to invite.",
			"email": "Email",
			"role": "Role",
			"organization": "Organization",
			"selectOrgRole": "Select Organizational Role",
			"allusersgroup": "All Users Group",
			"groups": "Groups",
			"group": "Group",
			"additionalgroup": "Optional additional Group",
			"groupRole": "Group Role",
			"selectGroupRole": "Select Group Role",
			"cancel": "Cancel",
			"send": "Send",
			"save": "Save",
			"invalidEmail": "Invalid email address",
			"alreadyInvited": "Already invited!",
			"resend": "Resend",
			"sil": "SIL International",
			"silTranscriber": "SIL Transcriber",
			"invitation": "has invited you to join",
			"instructions": "Please click the following link to accept the invitation:",
			"questions": "Questions? Contact",
			"join": "Join",
			"emailsubject": "SIL Transcriber Invitation",
			"admin": "Owner",
			"adminDetail": "(Manage + Review + Transcribe)",
			"transcriber": "Transcriber",
			"transcriberDetail": "(Transcribe)",
			"reviewer": "Reviewer",
			"reviewerDetail": "(Review + Transcribe)",
		}
	}),
	"invitationTable": new LocalizedStrings({
		"en": {
			"email": "Email",
			"role": "Role",
			"allUsers": "All Users",
			"group": "Group",
			"accepted": "Accepted",
			"invite": "Invite",
			"action": "Action",
			"delete": "Delete",
			"filter": "Filter",
			"selectRows": "Please select row(s) to {0}.",
			"noData": "No invitations",
		}
	}),
	"orgSettings": new LocalizedStrings({
		"en": {
			"add": "Add",
			"name": "Name",
			"description": "Description",
			"website": "Website",
			"logo": "Logo",
			"publicByDefault": "Public By Default",
			"save": "Save",
			"cancel": "Cancel",
			"deleteOrg": "Delete Organization",
			"deleteExplained": "Deleting this organization will prevent any members of the organization from doing work on any of the projects or plans in this organization.",
		}
	}),
	"mediaUpload": new LocalizedStrings({
		"en": {
			"title": "Upload Media",
			"task": "You can upload audio files in .mp3, .m4a or .wav format.",
			"dragDrop": "Drag and drop files here, or click here to browse for the files.",
			"cancel": "Cancel",
			"upload": "Upload",
		}
	}),
	"myTask": new LocalizedStrings({
		"en": {
			"todo": "To Do",
			"history": "History",
		}
	}),
	"toDoTable": new LocalizedStrings({
		"en": {
			"filter": "Filter",
			"plan": "Plan",
			"section": "Section",
			"passage": "Passage",
			"state": "State",
			"action": "Action",
			"transcriber": "Transcribe",
			"reviewer": "Review",
			"view": "View",
			"length": "Duration",
			"assigned": "Assigned",
			"yes": "Yes",
			"no": "No",
			"loadingTable": "Loading data",
			"title": "Title",
			"description": "Description",
			"duration": "Duration",
		}
	}),
	"integration": new LocalizedStrings({
		"en": {
			"sync": "Sync",
			"paratextAssociation": "Paratext association",
			"selectProject": "Select Paratext Project",
			"noProject": "You are not a member of a",
			"ParatextProject": "Paratext Project",
			"projectsPending": "Querying projects...",
			"countPending": "Querying count...",
			"usernamePending": "Querying username...",
			"offline": "Offline",
			"expiredToken": "Your login token has expired and can't be automatically renewed.  Please logout and login again.",
			"expiredParatextToken": "Your paratext login has expired and can't be automatically renewed.  Please logout and login again.",
			"invalidParatextLogin": "You must login with a valid paratext login to sync projects.",
			"questionOnline": "Are you connected to the Internet?",
			"yes": "Yes",
			"no": "No",
			"questionProject": "Are you connected to a",
			"removeProject": "Remove Project Association",
			"questionAccount": "Do you have a Paratext Account?",
			"questionPermission": "Do you have permission to edit the Paratext project text?",
			"allCriteria": "You must satisfy all criteria to sync.",
			"projectError": "Project Query error:",
			"usernameError": "Username error:",
			"syncPending": "Syncing...",
			"syncError": "Sync error:",
			"syncComplete": "Sync Complete!",
			"countError": "Count query error: ",
			"countReady": "Passages ready to sync: ",
			"paratext": "Paratext",
			"render": "Render",
			"onestory": "One Story",
		}
	}),
	"transcriber": new LocalizedStrings({
		"en": {
			"submit": "Submit",
			"reject": "Reject",
			"save": "Save",
			"close": "Close",
			"settingsTip": "Settings",
			"backTip": "Skip back (F2)",
			"aheadTip": "Skip ahead (F4)",
			"playTip": "Pause (ESC)",
			"pauseTip": "Play (ESC)",
			"rejectTranscriptionTip": "Audio recording is unusable",
			"rejectReviewTip": "Transcription requires changes.",
			"submitTranscriptionTip": "Mark this transcription as complete.",
			"submitReviewTip": "Mark this review as complete.",
			"saveTip": "Save transcription changes without marking as complete.",
			"saveReviewTip": "Save position in recording without marking as complete.",
		}
	}),
	"profile": new LocalizedStrings({
		"en": {
			"name": "Full Name",
			"given": "Given Name",
			"family": "Family Name",
			"email": "Email",
			"phone": "Phone",
			"timezone": "Time zone",
			"locale": "Preferred Language",
			"locked": "Locked",
			"add": "Next",
			"save": "Save",
			"deleteUser": "Delete User",
			"deleteExplained": "Deleting your user will block you from using the program and remove references to your work.",
			"cancel": "Cancel",
			"silTranscriberAdmin": "SIL Transcriber Admin",
			"silTranscriber": "SIL Transcriber",
			"userProfile": "User profile",
			"completeProfile": "Complete User Profile",
			"sendNews": "Recieve SIL Transcriber and Language Technology news",
			"sendDigest": "Recieve daily digests",
		}
	}),
	"deleteExpansion": new LocalizedStrings({
		"en": {
			"dangerZone": "Danger Zone",
			"advanced": "Advanced",
			"delete": "Delete",
		}
	}),
	"taskItem": new LocalizedStrings({
		"en": {
			"noMedia": "No Audio",
			"needsNewRecording": "Needs New Audio",
			"needsNewTranscription": "Needs Corrections",
			"inProgress": "In Progress",
			"transcribe": "Transcribe",
			"review": "Review",
			"sync": "Sync",
			"done": "Done",
			"section": "Section {0}.{1}",
		}
	}),
	"control": new LocalizedStrings({
		"en": {
			"contentType": "Content Type",
			"scripture": "Scripture Transcription",
			"other": "General Transcription",
		}
	}),
};

export default function (state = initialState, action: any): ILocalizedStrings {
	switch (action.type) {
		case FETCH_LOCALIZATION:
			return {
				...state,
				"loaded": true,
				"access" : new LocalizedStrings(action.payload.data.access),
				"snackbar" : new LocalizedStrings(action.payload.data.snackbar),
				"usertable" : new LocalizedStrings(action.payload.data.usertable),
				"alert" : new LocalizedStrings(action.payload.data.alert),
				"projectTable" : new LocalizedStrings(action.payload.data.projectTable),
				"chart" : new LocalizedStrings(action.payload.data.chart),
				"projectSettings" : new LocalizedStrings(action.payload.data.projectSettings),
				"planTable" : new LocalizedStrings(action.payload.data.planTable),
				"planSheet" : new LocalizedStrings(action.payload.data.planSheet),
				"scriptureTable" : new LocalizedStrings(action.payload.data.scriptureTable),
				"assignmentTable" : new LocalizedStrings(action.payload.data.assignmentTable),
				"assignSection" : new LocalizedStrings(action.payload.data.assignSection),
				"planTabs" : new LocalizedStrings(action.payload.data.planTabs),
				"planAdd" : new LocalizedStrings(action.payload.data.planAdd),
				"mediaTab" : new LocalizedStrings(action.payload.data.mediaTab),
				"passageMedia" : new LocalizedStrings(action.payload.data.passageMedia),
				"main" : new LocalizedStrings(action.payload.data.main),
				"transcriptionTab" : new LocalizedStrings(action.payload.data.transcriptionTab),
				"transcriptionShow" : new LocalizedStrings(action.payload.data.transcriptionShow),
				"groupTabs" : new LocalizedStrings(action.payload.data.groupTabs),
				"groupTable" : new LocalizedStrings(action.payload.data.groupTable),
				"groupAdd" : new LocalizedStrings(action.payload.data.groupAdd),
				"groupSettings" : new LocalizedStrings(action.payload.data.groupSettings),
				"shapingTable" : new LocalizedStrings(action.payload.data.shapingTable),
				"treeChart" : new LocalizedStrings(action.payload.data.treeChart),
				"languagePicker" : new LocalizedStrings(action.payload.data.languagePicker),
				"activityState" : new LocalizedStrings(action.payload.data.activityState),
				"invite" : new LocalizedStrings(action.payload.data.invite),
				"invitationTable" : new LocalizedStrings(action.payload.data.invitationTable),
				"orgSettings" : new LocalizedStrings(action.payload.data.orgSettings),
				"mediaUpload" : new LocalizedStrings(action.payload.data.mediaUpload),
				"myTask" : new LocalizedStrings(action.payload.data.myTask),
				"toDoTable" : new LocalizedStrings(action.payload.data.toDoTable),
				"integration" : new LocalizedStrings(action.payload.data.integration),
				"transcriber" : new LocalizedStrings(action.payload.data.transcriber),
				"profile" : new LocalizedStrings(action.payload.data.profile),
				"deleteExpansion" : new LocalizedStrings(action.payload.data.deleteExpansion),
				"taskItem" : new LocalizedStrings(action.payload.data.taskItem),
				"control" : new LocalizedStrings(action.payload.data.control),
			};
		case SET_LANGUAGE:
			return {
				...state,
				lang: action.payload,
			};
		default:
			return state;
	}
}
