// WARNING: This file is generated using ToReducer.xsl. Changes made here may be lost.
import LocalizedStrings from 'react-localization';
import { FETCH_LOCALIZATION, SET_LANGUAGE } from './types';
import { ILocalizedStrings } from './model';

const initialState = {
	"loaded": false,
	"lang": 'en',
	"access": new LocalizedStrings({
		"en": {
			"accessFirst": "Welcome to SIL Transcriber. A project is created online at the {0} admin site. Export a Portable Transcriber Format (PTF) file and import it here.",
			"accessSilTranscriber": "Click your avatar to transcriber or edit.",
			"importProject": "Import Portable Transcriber Data",
			"importError": "Import Error",
			"login": "Online Login",
		}
	}),
	"electronImport": new LocalizedStrings({
		"en": {
			"importPending": "Import In Progress...{0}%",
			"importComplete": "Import Complete",
			"importOldFile": "This file was not exported from the latest version.  Reexport your PTF file from the online version.",
			"ptfError": "Not a valid Portable Transcriber File",
			"itfError": "Not a valid Incremental Transcriber File",
			"importCreated": "Import file was created: {date0}.",
			"projectImported": "Project {name0} was previously imported with a newer file: {date1} ",
			"allDataOverwritten": "All {name0} data will be overwritten.",
			"neverExported": "Current data in project {name0} has never been exported.",
			"lastExported": "Current data in project {name0} was last exported {date0}.",
			"exportedLost": "Import file will not include latest exported data.",
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
			"offline": "Offline",
			"action": "Action",
			"delete": "Delete",
			"filter": "Filter",
			"selectRows": "Please select row(s) to {0}.",
			"showHideFilter": "Show/Hide filter rows",
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
			"myProject": "My Project",
			"general": "General",
			"name": "Name",
			"createdBy": "Created by {0}",
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
			"add": "Save",
			"upload": "Save and Upload Media",
			"nextSteps": "Select Next Step and Save",
			"configure": "Configure a Collaborative Project",
			"startNow": "Use Defaults to Start Transcribing",
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
			"scripture": "Scripture Transcription",
			"other": "General Transcription",
			"sections": "Sections",
			"createdBy": "Created By",
			"taks": "Passages",
			"action": "Action",
			"filter": "Filter",
			"silTranscriberAdmin": "SIL Transcriber Admin",
			"choosePlan": "Choose a Project Plan",
			"loadingTable": "Loading data",
			"showHideFilter": "Show/Hide filter rows",
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
			"saving": "Saving...",
			"selectRows": "Please select row(s) to {0}.",
			"confirm": "{0} {1} Item(s). Are you sure?",
			"sectionAbove": "Insert section above",
			"passageAbove": "Insert passage above",
			"tablePaste": "Paste Table",
			"bookSelect": "Select Book...",
			"nonNumber": "Do not change to non-number.",
			"pasting": "Pasting",
			"useCtrlV": "Select a column head and use CTRL-V to append table rows.",
			"resequence": "Resequence",
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
			"saving": "Saving...",
			"pasteNoRows": "No Rows in clipboard.",
			"pasteInvalidColumnsScripture": "Invalid number of columns ({0}). Expecting 6 columns.",
			"pasteInvalidColumnsGeneral": "Invalid number of columns ({0}). Expecting 5 columns.",
			"pasteInvalidSections": "Invalid section number(s):",
			"pasteInvalidPassages": "Invalid passage numbers:",
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
			"editor": "Editor",
			"selectRowsToAssign": "Please select row(s) to assign.",
			"selectRowsToRemove": "Please select row(s) to remove assignment.",
			"showHideFilter": "Show/Hide filter rows",
		}
	}),
	"assignSection": new LocalizedStrings({
		"en": {
			"title": "Assign Sections to Users",
			"sections": "Sections",
			"users": "Users",
			"editor": "Editor",
			"transcriber": "Transcriber",
			"role": "Role",
			"assignAs": "Assign As",
			"close": "Close",
		}
	}),
	"planTabs": new LocalizedStrings({
		"en": {
			"sectionsPassages": "Sections & Passages",
			"passageStatus": "{1} of {2} passages",
			"sectionStatus": "{1} of {2} sections",
			"mediaStatus": "{1} of {2} media files",
			"media": "Media",
			"assignments": "Assignments",
			"transcriptions": "Transcriptions",
			"associations": "Associations",
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
			"mediaAssociations": "Media Associations",
			"availablePassages": "Available Passages",
			"noMediaAttached": "No media files are checked",
			"noPassageDetach": "Passages are not used for detach",
			"noPassageAttached": "{0} has no passage attached",
			"fileAttached": "File already attached",
			"passageAttached": "Passage already attached",
			"save": "Save",
			"detach": "Detach",
			"autoMatch": "Auto Match",
			"showHideFilter": "Show/Hide filter rows",
			"matchAdded": "Match complete: {0} new associations",
			"noMatch": "Match complete: no new associations",
			"none": "None",
			"proposed": "Proposed",
			"all": "All",
			"viewAssociations": "View Associations",
			"saving": "Saving...",
			"savingComplete": "Saving complete.",
		}
	}),
	"passageMedia": new LocalizedStrings({
		"en": {
			"mediaAttached": "Media Attached",
			"mediaDetached": "Media Removed",
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
			"online": "Online Status",
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
			"addOrganization": "Add Organization",
			"projectSummary": "Project Summary",
			"addProject": "Add Project",
			"export": "Export",
			"import": "Import",
			"loadingTable": "Loading data",
			"logout": "Log Out",
			"myAccount": "My Account",
			"orgRole": "Organizational Role:",
			"projRole": "Role in Project:",
			"owner": "Owner",
			"clearCache": "Clear cache",
			"clearLogout": "Log Out and Force Data Reload",
			"inviteError": "Invitation not accepted.  You must login with the email that the invitation was sent to.",
			"deletedInvitation": "Invitation is no longer valid.",
			"logoutRequired": "Log out of other tab required",
			"helpCenter": "Help Center",
			"reportIssue": "Report an Issue",
			"developer": "Developer mode",
			"version": "Version: ",
			"UnsavedData": "Unsaved Data",
			"saveFirst": "Do you want to save before leaving this page?",
			"saving": "Saving...",
			"newOrganization": "Add Organization",
			"admin": "Admin",
			"goOnline": "SIL Transcriber Online",
			"transcribe": "Transcribe",
			"switchTo": "Switch to:",
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
			"defaultOrgDesc": "Default organization of ",
		}
	}),
	"import": new LocalizedStrings({
		"en": {
			"import": "Import",
			"importProject": "Import Project",
			"expiredToken": "Your log in token has expired and can't be automatically renewed.  Please log out and login again.",
			"error": "Import Error",
			"onlineChangeReport": "Online changes made since data provided to offline user:",
			"noFile": "Please select file to be uploaded.",
			"importPending": "Import In Progress...",
			"invalidITF": "Not a valid Incremental Transcriber File (ITF).",
			"invalidProject": "ITF File does not contain current project.",
			"importComplete": "Import Complete",
		}
	}),
	"transcriptionTab": new LocalizedStrings({
		"en": {
			"section": "Section",
			"sectionstate": "State",
			"passages": "Passages",
			"filter": "Filter",
			"transcriber": "Transcriber",
			"editor": "Editor",
			"plan": "Plan",
			"elan": "Elan",
			"export": "Export",
			"copyTranscriptions": "Copy Transcriptions",
			"copyTip": "Copy transcriptions to Clipboard",
			"showHideFilter": "Show/Hide filter rows",
			"cantCopy": "Unable to copy to clipboard",
			"exportProject": "Export Project",
			"electronBackup": "Backup All Projects",
			"exportType": "Which export type?",
			"exportExplanation": "Export the full project to store locally or share with another offline user. Export incremental file to import changes into online app.",
			"exportPTFtype": "Export Project (ptf)",
			"exportITFtype": "Incremental Changes (itf)",
			"cancel": "Cancel",
			"exportingProject": "Exporting...{0}%",
			"error": "Export Error",
			"downloading": "Creation complete. Downloading {0}",
			"expiredToken": "Your login token has expired and can't be automatically renewed.  Please log out and login again.",
		}
	}),
	"transcriptionShow": new LocalizedStrings({
		"en": {
			"transcription": "Transcription",
			"transcriptionDisplay": "This display allows you to review the transcription that is stored.",
			"close": "Close",
			"cantCopy": "Unable to copy to clipboard",
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
			"removeSelected": "{0} active projects depend on this group. Assign each project to some other group before deleting this group.",
			"addGroup": "Add Group",
			"selectRows": "Please select row(s) to {0}.",
			"showHideFilter": "Show/Hide filter rows",
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
			"editors": "Editors",
			"transcribers": "Transcribers",
			"ownersDetail": "(Manage + Review + Transcribe)",
			"editorsDetail": "(Review + Transcribe)",
			"transcribersDetail": "(Transcribe)",
			"addGroupMember": "Choose {0}",
			"addMemberInstruction": "Choose a person who will act as a {0} for projects in this group.",
			"cancel": "Cancel",
			"add": "Ok",
			"delete": "Delete",
			"choose": "Choose...",
			"allReviewersCanTranscribe": "All Editors are allowed to transcribe.",
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
			"noMedia": "No Recording",
			"transcribeReady": "Ready For Transcription",
			"transcribing": "Transcribing",
			"needsNewRecording": "Recording Needed",
			"transcribed": "Transcribed",
			"reviewing": "Reviewing",
			"needsNewTranscription": "Correction Needed",
			"approved": "Approved",
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
			"allUsersProjects": "Projects",
			"additionalgroup": "Optional additional Group",
			"groupRole": "Group Role",
			"otherGroupProjects": "Projects",
			"noProjects": "No Projects are associated with this group.",
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
			"editor": "Editor",
			"editorDetail": "(Review + Transcribe)",
		}
	}),
	"invitationTable": new LocalizedStrings({
		"en": {
			"email": "Email",
			"role": "Organization Role",
			"allUsers": "All Users",
			"group": "Group",
			"accepted": "Accepted",
			"invite": "Invite",
			"action": "Action",
			"delete": "Delete",
			"filter": "Filter",
			"selectRows": "Please select row(s) to {0}.",
			"noData": "No invitations",
			"showHideFilter": "Show/Hide filter rows",
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
			"PTFtitle": "Upload complete Project Data from PTF",
			"ITFtitle": "Upload Change Data from Offline Extension",
			"task": "You can upload audio files in .mp3, .m4a or .wav format.",
			"PTFtask": "Upload a Portable Transcriber File (ptf file).",
			"ITFtask": "Upload an Incremental Transcriber File (itf file) exported from the offline extension.",
			"dragDropMultiple": "Drag and drop files here, or click here to browse for the files.",
			"dragDropSingle": "Drag and drop a file here, or click here to browse for the file.",
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
			"editor": "Review",
			"view": "View",
			"length": "Duration",
			"assigned": "Assigned",
			"yes": "Yes",
			"no": "No",
			"loadingTable": "Loading data",
			"title": "Title",
			"description": "Description",
			"showHide": "Show or Hide filter rows",
		}
	}),
	"integration": new LocalizedStrings({
		"en": {
			"sync": "Sync",
			"paratextAssociation": "Paratext association",
			"selectProject": "Select Paratext Project",
			"noProject": "You are not a member of a {lang0} Paratext Project.",
			"projectsPending": "Querying projects...",
			"countPending": "Querying count...",
			"usernamePending": "Querying username...",
			"offline": "Offline",
			"expiredToken": "Your login token has expired and can't be automatically renewed.  Please log out and login again.",
			"expiredParatextToken": "Your paratext login has expired and can't be automatically renewed.  Please log out and login again.",
			"invalidParatextLogin": "You must login with a valid paratext login to sync projects.",
			"questionOnline": "Are you connected to the Internet?",
			"questionInstalled": "Is Paratext installed locally?",
			"yes": "Yes",
			"no": "No",
			"questionProject": "Are you connected to a {lang0} Paratext project?",
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
			"paratextLocal": "Paratext Local",
			"render": "Render",
			"onestory": "One Story",
			"showHideFilter": "Show/Hide filter rows",
		}
	}),
	"transcriber": new LocalizedStrings({
		"en": {
			"submit": "Submit",
			"reject": "Reject",
			"save": "Save",
			"reopen": "Reopen",
			"settingsTip": "Settings",
			"backTip": "Skip back ({0})",
			"aheadTip": "Skip ahead ({0})",
			"playTip": "Pause ({0})",
			"pauseTip": "Play ({0})",
			"slowerTip": "Slower ({0})",
			"fasterTip": "Faster ({0})",
			"historyTip": "History ({0})",
			"timerTip": "Timestamp ({0})",
			"comment": "Comment",
			"makeComment": "Make Comment",
			"rejectTranscriptionTip": "Audio recording is unusable",
			"rejectReviewTip": "Transcription requires changes.",
			"submitTranscriptionTip": "Submit for review",
			"submitReviewTip": "Submit as complete",
			"saveTip": "Save changes and comment",
			"saveReviewTip": "Save position and comment",
			"noMedia": "Created task",
			"transcribeReady": "Ready For Transcription",
			"transcribing": "Started to transcribe",
			"transcribed": "Submitted task for review",
			"reviewing": "Started to review",
			"approved": "Approved",
			"needsNewTranscription": "Rejected transcription",
			"done": "Completed",
			"needsNewRecording": "Rejected recording",
			"synced": "Completed",
			"incomplete": "Incomplete transcripiton",
			"saving": "Saving...",
		}
	}),
	"transcribeReject": new LocalizedStrings({
		"en": {
			"rejectTitle": "Rejection",
			"rejectReason": "Reject Reason",
			"needsAudio": "Recording Needed",
			"needsCorrection": "Correction Needed",
			"incomplete": "Incomplete",
			"comment": "Additional Comment",
			"cancel": "Cancel",
			"next": "Next",
		}
	}),
	"profile": new LocalizedStrings({
		"en": {
			"name": "Full Name",
			"userExists": "This offline user exists.",
			"given": "Given Name",
			"family": "Family Name",
			"email": "Email",
			"phone": "Phone",
			"timezone": "Time zone",
			"locale": "Preferred Language",
			"locked": "Locked",
			"next": "Next",
			"add": "Add",
			"save": "Save",
			"deleteUser": "Delete User",
			"deleteExplained": "Deleting your user will block you from using the program and remove references to your work.",
			"cancel": "Cancel",
			"silTranscriberAdmin": "SIL Transcriber Admin",
			"silTranscriber": "SIL Transcriber",
			"userProfile": "User profile",
			"completeProfile": "Complete User Profile",
			"addOfflineUser": "Add Offline User",
			"sendNews": "Receive SIL Transcriber and Language Technology news",
			"sendDigest": "Receive daily digests",
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
			"noMedia": "No Recording",
			"needsNewRecording": "Recording Needed",
			"incomplete": "Incomplete",
			"needsNewTranscription": "Correction Needed",
			"transcribing": "Transcribing",
			"reviewing": "Reviewing",
			"transcribe": "Transcribe",
			"review": "Review",
			"sync": "Sync Needed",
			"done": "Done",
			"section": "Section {0}.{1}",
			"assign": "Assign {0}",
			"unassign": "Unassign {0}",
			"transcriber": "Transcriber",
			"editor": "Editor",
		}
	}),
	"control": new LocalizedStrings({
		"en": {
			"contentType": "Content Type",
			"scripture": "Scripture Transcription",
			"other": "General Transcription",
		}
	}),
	"setup": new LocalizedStrings({
		"en": {
			"gettingStarted": "Getting Started",
			"electronTitle": "No Tasks Available",
			"addPlan": "Add a plan",
			"upload": "Upload media files",
			"attach": "Attach media to passages",
			"assign": "Optionally assign sections to transcribers",
			"offlineNote": "(Especially if transcribers are working offline)",
			"electronStep1": "Setup must be done online:",
			"electronStep2": "Configure the plan, upload media and attach passages",
			"electronStep4": "Re-export ptf file online and re-import here",
		}
	}),
	"notSetup": new LocalizedStrings({
		"en": {
			"welcome": "Welcome to SIL Transcriber",
			"notReady": "This organization and project are not setup and ready for work yet.",
			"electronNotReady": "This project must be set up online.  Please contact your project administrator for a ptf file that includes tasks.",
		}
	}),
	"template": new LocalizedStrings({
		"en": {
			"projectCode": "Project Code",
			"language": "Language BCP47 code",
			"book": "Paratext book identifier",
			"section": "Section number",
			"passage": "Passage number(within section)",
			"chapter": "Chapter number",
			"beginning": "Starting verse number",
			"end": "Ending verse number",
			"fileTemplate": "File Name Template",
			"apply": "Apply",
			"templateCodes": "Template Codes",
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
				"electronImport" : new LocalizedStrings(action.payload.data.electronImport),
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
				"import" : new LocalizedStrings(action.payload.data.import),
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
				"transcribeReject" : new LocalizedStrings(action.payload.data.transcribeReject),
				"profile" : new LocalizedStrings(action.payload.data.profile),
				"deleteExpansion" : new LocalizedStrings(action.payload.data.deleteExpansion),
				"taskItem" : new LocalizedStrings(action.payload.data.taskItem),
				"control" : new LocalizedStrings(action.payload.data.control),
				"setup" : new LocalizedStrings(action.payload.data.setup),
				"notSetup" : new LocalizedStrings(action.payload.data.notSetup),
				"template" : new LocalizedStrings(action.payload.data.template),
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
