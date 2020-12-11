// WARNING: This file is generated using ToReducer.xsl. Changes made here may be lost.
import LocalizedStrings from 'react-localization';
import { FETCH_LOCALIZATION, SET_LANGUAGE } from './types';
import { ILocalizedStrings } from './model';

const initialState = {
	"loaded": false,
	"lang": 'en',
	"access": new LocalizedStrings({
		"en": {
			"accessFirst": "Welcome to {0}. First, a project is created online at the {1} site. Then, export a Portable Transcriber Format (PTF) file and import it here.",
			"accessSilTranscriber": "To transcribe or review without the Internet, click your avatar. To transcribe, review, or do administrative tasks collaboratively, click 'Go Online'. To setup the program with users, project, and media files without using the Internet, click 'Import PTF file'. (PTF files can be exported while online.)",
			"goOnline": "Go Online",
			"importProject": "Import PTF File",
			"download": "Download?",
			"downloadLater": "Download Later",
			"downloadMb": "Download {0}MB of offline project files?",
		}
	}),
	"activityState": new LocalizedStrings({
		"en": {
			"approved": "Ready to Sync",
			"done": "Done",
			"incomplete": "Incomplete",
			"needsNewRecording": "Recording Needed",
			"needsNewTranscription": "Correction Needed",
			"noMedia": "No Recording",
			"review": "Review",
			"reviewing": "Reviewing",
			"synced": "Synced",
			"transcribe": "Transcribe",
			"transcribed": "Transcribed",
			"transcribeReady": "Ready to Transcribe",
			"transcribing": "Transcribing",
		}
	}),
	"alert": new LocalizedStrings({
		"en": {
			"areYouSure": "Are you sure?",
			"confirmation": "Confirmation",
			"no": "No",
			"yes": "Yes",
		}
	}),
	"assignmentTable": new LocalizedStrings({
		"en": {
			"assignSec": "Assign {0}",
			"delete": "Delete",
			"filter": "Filter",
			"passages": "Passages",
			"removeSec": "Remove Assignment",
			"role": "Role",
			"sectionstate": "State",
			"selectRowsToAssign": "Please select row(s) to assign.",
			"selectRowsToRemove": "Please select row(s) to remove assignment.",
			"showHideFilter": "Show/Hide filter rows",
			"title": "Assignments",
		}
	}),
	"assignSection": new LocalizedStrings({
		"en": {
			"close": "Close",
			"role": "Role",
			"title": "Assign {0} to Members",
			"users": "Members",
		}
	}),
	"cards": new LocalizedStrings({
		"en": {
			"add": "Add",
			"addTeam": "Add Team",
			"cancel": "Cancel",
			"connectParatext": "Connect a Paratext Project",
			"delete": "Delete",
			"deleteTeam": "Delete Team",
			"explainTeamDelete": "Deleting the team will delete all projects of the team.",
			"import": "Import PTF File",
			"language": "Language: {0}",
			"mediaUploaded": "Media Uploaded",
			"members": "Members ({0})",
			"newProject": "New Project",
			"passagesCreated": "Passages Created",
			"personalProjects": "Personal Projects",
			"projectCreated": "Project Created",
			"save": "Save",
			"sectionStatus": "{0} {1}",
			"settings": "Settings",
			"offlineAvail": "Offline Available",
			"offline": "Offline",
			"sync": "Sync ({0})",
			"teamName": "Team Name",
			"teamSettings": "Team Settings",
			"uploadProgress": "Upload Progress",
		}
	}),
	"control": new LocalizedStrings({
		"en": {
			"other": "General Transcription",
			"scripture": "Scripture Transcription",
		}
	}),
	"deleteExpansion": new LocalizedStrings({
		"en": {
			"advanced": "Advanced",
			"dangerZone": "Danger Zone",
			"delete": "Delete",
		}
	}),
	"electronImport": new LocalizedStrings({
		"en": {
			"allDataOverwritten": "All {name0} data will be overwritten.",
			"exportedLost": "Import file will not include latest exported data.",
			"importComplete": "Import Complete",
			"importCreated": "Import file was created: {date0}.",
			"importOldFile": "This file was not exported from the latest version.  Reexport your PTF file from the online version.",
			"importPending": "Import In Progress...{0}%",
			"importProject": "Import Project",
			"invalidProject": "Import File does not contain current project.",
			"lastExported": "Current data in project {name0} was last exported {date0}.",
			"neverExported": "Current data in project {name0} has never been exported.",
			"projectImported": "Project {name0} was previously imported with a newer file: {date1} ",
			"ptfError": "Not a valid Portable Transcriber File",
		}
	}),
	"emailUnverified": new LocalizedStrings({
		"en": {
			"emailUnverified": "Your email is unverified.",
			"resend": "Resend the authorization email",
			"verified": "I'm verified!  Carry on!",
			"verify": "Please verify by clicking on the link in the authorization email sent to your account.",
		}
	}),
	"groupSettings": new LocalizedStrings({
		"en": {
			"add": "Ok",
			"addGroupMember": "Choose {0}",
			"addMemberInstruction": "Choose a person who will act as a {0} for projects in this group.",
			"allReviewersCanTranscribe": "All Editors are allowed to transcribe.",
			"assignedSections": "  Assigned {0}: ",
			"cancel": "Cancel",
			"delete": "Delete",
			"editors": "Editors",
			"editorsDetail": "(Review + Transcribe)",
			"loadingTable": "Loading data",
			"name": "Name",
			"noDeleteAllUsersInfo": "Cannot delete members from the All Members group",
			"noDeleteInfo": "This role is included in a higher role and cannot be deleted.",
			"owners": "Owners",
			"ownersDetail": "(Manage + Review + Transcribe)",
			"projectPlans": "Project Plans",
			"save": "Save",
			"transcribers": "Transcribers",
			"transcribersDetail": "(Transcribe)",
		}
	}),
	"groupTabs": new LocalizedStrings({
		"en": {
			"groups": "Groups",
			"invitations": "Invitations",
			"roles": "Roles",
			"users": "Members",
		}
	}),
	"import": new LocalizedStrings({
		"en": {
			"close": "Close",
			"continue": "Continue?",
			"error": "Import Error",
			"expiredToken": "Your log in token has expired and can't be automatically renewed.  Please log out and login again.",
			"family": "Family Name",
			"filter": "Filter",
			"fontsize": "Font Size",
			"given": "Given Name",
			"import": "Import",
			"importComplete": "Import Complete",
			"imported": "Imported Value",
			"importPending": "Import In Progress...",
			"importProject": "Import Project",
			"importSync": "Syncing offline changes",
			"invalidITF": "Not a valid Incremental Transcriber File (ITF).",
			"invalidProject": "Import File does not contain current project.",
			"locale": "Preferred Language",
			"noFile": "Please select file to be uploaded.",
			"old": "Previous Value",
			"onlineChangeReport": "Online changes made since data provided to offline member:",
			"other": "Other",
			"passage": "Passage",
			"phone": "Phone",
			"plan": "Project",
			"projectDeleted": "Project {0} has been deleted online.",
			"projectNotFound": "ITF does not contain current project.  It contains project {0}.",
			"showHideFilter": "Show/Hide filter rows",
			"state": "State",
			"timezone": "Time zone",
			"transcription": "Transcription",
			"unassigned": "unassigned",
			"username": "Name",
		}
	}),
	"integration": new LocalizedStrings({
		"en": {
			"allCriteria": "You must satisfy all criteria to sync.",
			"bookNotFound": "Book not included in this project",
			"bookNotInParatext": "Passage {0}.{1}: Paratext project does not contain book {2}.",
			"chapterSpan": "Passage {0}.{1} {2}: Passage must not span chapters.",
			"countError": "Count query error: ",
			"countPending": "Querying count...",
			"countReady": "Passages ready to sync: ",
			"emptyBook": "Passage {0}.{1}: Book is missing.",
			"expiredParatextToken": "Your paratext login has expired and can't be automatically renewed.  Please log out and login again.",
			"expiredToken": "Your login token has expired and can't be automatically renewed.  Please log out and login again.",
			"invalidParatextLogin": "You must login with a valid paratext login to sync projects.",
			"invalidReference": "Passage {0}.{1} {2}: Invalid Reference",
			"no": "No",
			"noProject": "You are not a member of a {lang0} Paratext Project.",
			"offline": "Offline",
			"onestory": "One Story",
			"paratext": "Paratext",
			"paratextAssociation": "Paratext association",
			"paratextLocal": "Paratext Local",
			"projectError": "Project Query error:",
			"projectsPending": "Querying projects...",
			"questionAccount": "Do you have a Paratext Account?",
			"questionInstalled": "Is Paratext installed locally?",
			"questionOnline": "Are you connected to the Internet?",
			"questionPermission": "Do you have permission to edit the Paratext project text?",
			"questionProject": "Are you connected to a {lang0} Paratext project?",
			"removeProject": "Remove Project Association",
			"render": "Render",
			"selectProject": "Select Paratext Project",
			"showHideFilter": "Show/Hide filter rows",
			"sync": "Sync",
			"syncComplete": "Sync Complete!",
			"syncError": "Sync error:",
			"syncPending": "Syncing...",
			"usernameError": "Username error:",
			"usernamePending": "Querying username...",
			"yes": "Yes",
		}
	}),
	"invitationTable": new LocalizedStrings({
		"en": {
			"accepted": "Accepted",
			"action": "Action",
			"delete": "Delete",
			"email": "Email",
			"filter": "Filter",
			"invite": "Invite",
			"noData": "No invitations",
			"role": "Team Role",
			"selectRows": "Please select row(s) to {0}.",
			"showHideFilter": "Show/Hide filter rows",
		}
	}),
	"invite": new LocalizedStrings({
		"en": {
			"addInvite": "Invite Member",
			"allUsersProjects": "Projects",
			"alreadyInvited": "Already invited!",
			"cancel": "Cancel",
			"editInvite": "Edit Invite",
			"email": "Email",
			"emailsubject": "{0} Invitation",
			"groupRole": "Project Role",
			"groups": "Project",
			"instructions": "Please click the following link to accept the invitation:",
			"invalidEmail": "Invalid email address",
			"invitation": "has invited you to join",
			"join": "Join",
			"newInviteTask": "Enter the email address of the member to invite.",
			"noProjects": "No Projects are associated with this group.",
			"organization": "Team",
			"questions": "Questions? Contact",
			"resend": "Resend",
			"role": "Team Role",
			"save": "Save",
			"selectProjectRole": "Select project role",
			"selectTeamRole": "Select Team Role",
			"send": "Send",
			"sil": "SIL International",
		}
	}),
	"languagePicker": new LocalizedStrings({
		"en": {
			"font": "Font",
			"script": "Script",
			"language": "Language",
			"phonetic": "Phonetic",
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
	"main": new LocalizedStrings({
		"en": {
			"admin": "Admin",
			"apiError": "API Error:",
			"cancel": "Cancel",
			"clearCache": "Clear cache",
			"clearLogout": "Log Out and Force Data Reload",
			"continue": "Continue",
			"crashMessage": "Something went wrong. The developers need to address this issue.",
			"deletedInvitation": "Invitation is no longer valid.",
			"developer": "Developer mode",
			"exit": "Exit",
			"export": "Export",
			"helpCenter": "Help Center",
			"helpSpreadsheet": "View spreadsheet convention",
			"flatSample": "Download flat sample spreadsheet",
			"hierarchicalSample": "Download hierarchical sample spreadsheet",
			"reportWhenOnline": "You must be online to report an problem.",
			"import": "Import",
			"integrations": "Integrations",
			"inviteError": "Invitation not accepted.  You must login with the email that the invitation was sent to.",
			"loadingTable": "Busy...please wait.",
			"loadingTranscriber": "Loading {0}",
			"logout": "Log Out",
			"logoutRequired": "Log out of other tab required",
			"media": "Media",
			"myAccount": "My Account",
			"NoLoadOffline": "Unable to load project data offline.",
			"owner": "Owner",
			"passages": "Passages",
			"project": "Project",
			"projRole": "Role in Project:",
			"reportIssue": "Report an Issue",
			"reports": "Reports",
			"saveFirst": "Do you want to save before leaving this page?",
			"saving": "Saving...",
			"sessionExpireTask": "Your session will expire in {0} seconds. Would you like to continue?",
			"sessionExpiring": "Session Expiring",
			"settings": "Settings",
			"switchTo": "Switch to:",
			"tasks": "Tasks",
			"transcribe": "Transcribe",
			"UnsavedData": "Unsaved Data",
			"version": "Version: ",
		}
	}),
	"mediaTab": new LocalizedStrings({
		"en": {
			"action": "Action",
			"all": "All",
			"autoMatch": "Auto Match",
			"availablePassages": "Available Passages",
			"book": "Book",
			"date": "Date",
			"delete": "Delete",
			"detach": "Detach",
			"duration": "Length (s)",
			"fileAttached": "File already attached",
			"fileName": "File Name",
			"filter": "Filter",
			"loadingTable": "Loading data",
			"matchAdded": "Match complete: {0} new associations",
			"mediaAssociations": "Media Associations",
			"noMatch": "Match complete: no new associations",
			"none": "None",
			"noPassageAttached": "{0} has no passage attached",
			"passageAttached": "Passage already attached",
			"planName": "Plan",
			"proposed": "Proposed",
			"reference": "Reference",
			"save": "Save",
			"saving": "Saving...",
			"savingComplete": "Saving complete.",
			"selectFiles": "Please select files to be uploaded.",
			"selectRows": "Please select row(s) to {0}.",
			"showHideFilter": "Show/Hide filter rows",
			"size": "Size (KB)",
			"unsupported": "File {0} is an unsupported file type.",
			"uploadComplete": "{0} of {1} files uploaded successfully.",
			"version": "Version",
			"viewAssociations": "View Associations",
		}
	}),
	"mediaUpload": new LocalizedStrings({
		"en": {
			"cancel": "Cancel",
			"dragDropMultiple": "Drag and drop files here, or click here to browse for the files.",
			"dragDropSingle": "Drag and drop a file here, or click here to browse for the file.",
			"ITFtask": "Upload an Incremental Transcriber File (itf file) exported from the Desktop app.",
			"ITFtitle": "Upload Change Data from Desktop app.",
			"PTFtask": "Upload a Portable Transcriber File (ptf).",
			"PTFtitle": "Upload complete Project Data from PTF",
			"task": "You can upload audio files in .mp3, .m4a, .wav or .ogg format.",
			"title": "Upload Media",
			"upload": "Upload",
		}
	}),
	"passageMedia": new LocalizedStrings({
		"en": {
			"close": "Close",
		}
	}),
	"planActions": new LocalizedStrings({
		"en": {
			"assign": "Assign",
			"delete": "Delete",
			"playpause": "Play / Pause",
			"transcribe": "Transcribe",
		}
	}),
	"planSheet": new LocalizedStrings({
		"en": {
			"action": "Action",
			"addPassage": "Add Passage",
			"addSection": "Add {0}",
			"bookSelect": "Select Book...",
			"confirm": "{0} {1} Item(s). Are you sure?",
			"nonNumber": "Do not change to non-number.",
			"passageBelow": "Insert passage below {0}",
			"pasting": "Pasting",
			"refErr": "This project contains invalid references and will not sync to Paratext properly. (A valid reference would be 3:2-5 or similar.)",
			"resequence": "Resequence",
			"save": "Save",
			"saving": "Saving...",
			"sectionAbove": "Insert {0} above",
			"selectRows": "Please select row(s) to {0}.",
			"tablePaste": "Paste Spreadsheet",
			"useCtrlV": "Select a column head and use CTRL-V to append table rows.",
		}
	}),
	"planTabs": new LocalizedStrings({
		"en": {
			"assignments": "Assignments",
			"associations": "Associations",
			"media": "Media",
			"mediaStatus": "{1} of {2} media files",
			"passageStatus": "{1} of {2} passages",
			"sectionsPassages": "{0} & Passages",
			"sectionStatus": "{1} of {2} {0}",
			"transcriptions": "Transcriptions",
		}
	}),
	"profile": new LocalizedStrings({
		"en": {
			"add": "Add",
			"addOfflineUser": "Add Offline Desktop Member",
			"cancel": "Cancel",
			"checkingParatext": "Checking for Paratext account...",
			"nameNotEmail": "Please choose a name other than your email address.",
			"notLinked": "Not linked to Paratext",
			"close": "Close",
			"completeProfile": "Complete Member Profile",
			"deleteExplained": "Deleting your member will block you from using the program and remove references to your work.",
			"deleteUser": "Delete Member",
			"email": "Email",
			"family": "Family Name",
			"given": "Given Name",
			"installParatext": "Install Paratext to be able to sync.",
			"linkingExplained": "Log out and log in with Paratext button",
			"locale": "Preferred Language",
			"locked": "Locked",
			"logout": "Logout",
			"name": "Full Name",
			"next": "Next",
			"paratextLinked": "Linked to Paratext",
			"paratextLinking": "Linking to Paratext",
			"paratextNotLinked": "Link to Paratext",
			"phone": "Phone",
			"role": "Team Role",
			"save": "Save",
			"sendDigest": "Receive daily digests",
			"sendNews": "Receive {0} and Language Technology news",
			"timezone": "Time zone",
			"userExists": "This offline member exists.",
			"userProfile": "Member profile",
		}
	}),
	"projButtons": new LocalizedStrings({
		"en": {
			"export": "Export",
			"exportTitle": "{0} Export",
			"import": "Import",
			"importExport": "Import / Export",
			"integrations": "Paratext Integration",
			"integrationsTitle": "{0} Integrations",
			"reports": "Reports",
			"reportsTitle": "{0} Reports",
		}
	}),
	"scriptureTable": new LocalizedStrings({
		"en": {
			"action": "Action",
			"book": "Book",
			"description": "Description",
			"loadingTable": "Loading data",
			"passage": "Passage",
			"pasteInvalidColumnsGeneral": "Invalid number of columns ({0}). Expecting 5 columns.",
			"pasteInvalidColumnsScripture": "Invalid number of columns ({0}). Expecting 6 columns.",
			"pasteInvalidSections": "Invalid {0} number(s):",
			"pasteNoRows": "No Rows in clipboard.",
			"reference": "Reference",
			"saveFirst": "You must save changes first!",
			"saving": "Saving...",
			"title": "Title",
		}
	}),
	"shapingTable": new LocalizedStrings({
		"en": {
			"NoColumns": "No columns visible",
		}
	}),
	"shared": new LocalizedStrings({
		"en": {
			"admin": "Owner",
			"editor": "Editor",
			"lastEdit": "Last save {0}",
			"NoSaveOffline": "Unable to save while offline.",
			"transcriber": "Transcriber",
			"uploadMediaPlural": "Upload Media",
			"uploadMediaSingular": "Upload Media",
		}
	}),
	"taskItem": new LocalizedStrings({
		"en": {
			"assign": "Assign {0}",
			"section": "{0} {1}.{2}",
			"unassign": "Unassign {0}",
		}
	}),
	"template": new LocalizedStrings({
		"en": {
			"apply": "Apply",
			"beginning": "Starting verse number",
			"book": "Paratext book identifier",
			"chapter": "Chapter number",
			"end": "Ending verse number",
			"fileTemplate": "File Name Template",
			"language": "Language BCP47 code",
			"passage": "Passage number(within {0})",
			"templateCodes": "Template Codes",
		}
	}),
	"toDoTable": new LocalizedStrings({
		"en": {
			"action": "Action",
			"assigned": "Assigned",
			"description": "Description",
			"editor": "Review",
			"filter": "Filter",
			"length": "Duration",
			"loadingTable": "Loading data",
			"no": "No",
			"passage": "Passage",
			"plan": "Plan",
			"project": "Project",
			"state": "State",
			"tasks": "Tasks",
			"title": "Title",
			"transcriber": "Transcribe",
			"yes": "Yes",
		}
	}),
	"transcriber": new LocalizedStrings({
		"en": {
			"aheadTip": "Skip ahead ({0})",
			"backTip": "Skip back ({0})",
			"comment": "Comment",
			"done": "Completed",
			"fasterTip": "Faster ({0})",
			"historyTip": "History ({0})",
			"incomplete": "Incomplete transcripiton",
			"makeComment": "Make Comment",
			"needsNewRecording": "Rejected recording",
			"needsNewTranscription": "Rejected transcription",
			"noMedia": "Created task",
			"pauseTip": "Play ({0})",
			"playTip": "Pause ({0})",
			"reject": "Reject",
			"reopen": "Reopen",
			"reviewing": "Started to review",
			"save": "Save",
			"saveReviewTip": "Save position and comment",
			"saveTip": "Save changes and comment",
			"saving": "Saving...",
			"slowerTip": "Slower ({0})",
			"submit": "Submit",
			"submitReviewTip": "Submit as complete",
			"submitTranscriptionTip": "Submit for review",
			"timerTip": "Timestamp ({0})",
			"transcribing": "Started to transcribe",
			"updateByOther": "Transcription updated by another person or process.",
		}
	}),
	"transcribeReject": new LocalizedStrings({
		"en": {
			"cancel": "Cancel",
			"comment": "Additional Comment",
			"incomplete": "Incomplete",
			"needsAudio": "Recording Needed",
			"needsCorrection": "Correction Needed",
			"next": "Next",
			"rejectReason": "Reject Reason",
			"rejectTitle": "Rejection",
		}
	}),
	"transcriptionShow": new LocalizedStrings({
		"en": {
			"cantCopy": "Unable to copy to clipboard",
			"close": "Close",
			"transcription": "Transcription",
			"transcriptionDisplay": "This display allows you to review the transcription that is stored.",
		}
	}),
	"transcriptionTab": new LocalizedStrings({
		"en": {
			"cancel": "Cancel",
			"cantCopy": "Unable to copy to clipboard",
			"copyTip": "Copy transcriptions to Clipboard",
			"copyTranscriptions": "Copy Transcriptions",
			"downloading": "Creation complete. Downloading {0}",
			"elan": "Elan",
			"electronBackup": "Back up All Projects",
			"error": "Export Error",
			"expiredToken": "Your login token has expired and can't be automatically renewed.  Please log out and login again.",
			"export": "Export",
			"exportExplanation": "Export the full project to store locally or share with another offline member. Export incremental file to import changes into online app.",
			"exportingProject": "Exporting...{0}%",
			"exportITFtype": "Incremental Changes (itf)",
			"exportProject": "Export Project",
			"exportPTFtype": "Export Project (ptf)",
			"exportTooLarge": "The project cannot be exported.  The export file is too large.",
			"exportType": "Which export type?",
			"filter": "Filter",
			"passages": "Passages",
			"plan": "Plan",
			"sectionstate": "State",
			"showHideFilter": "Show/Hide filter rows",
			"updated": "Updated",
		}
	}),
	"treeChart": new LocalizedStrings({
		"en": {
			"noData": "No Transcription Data Yet",
		}
	}),
	"uploadProgress": new LocalizedStrings({
		"en": {
			"cancel": "Cancel",
			"canceling": "Canceling...",
			"progressTitle": "Progress",
		}
	}),
	"usertable": new LocalizedStrings({
		"en": {
			"action": "Action",
			"cancel": "Cancel",
			"continue": "Continue",
			"delete": "Delete",
			"email": "Email",
			"filter": "Filter",
			"invite": "Invite",
			"locale": "Locale",
			"name": "Name",
			"offline": "Offline Desktop Member",
			"phone": "Phone",
			"role": "Team Role",
			"selectRows": "Please select row(s) to {0}.",
			"showHideFilter": "Show/Hide filter rows",
			"timezone": "Timezone",
		}
	}),
	"vProject": new LocalizedStrings({
		"en": {
			"add": "Add",
			"advanced": "Advanced",
			"backtranslation": "Back Translation",
			"cancel": "Cancel",
			"correctformat": "Please enter in the format: singular/plural",
			"description": "Description",
			"edit": "Edit",
			"editorSettings": "Editor Settings",
			"flat": "Flat",
			"font": "Font",
			"fontSize": "Font Size",
			"hierarchical": "Hierarchical",
			"language": "Language",
			"layout": "Layout",
			"new": "New",
			"newProject": "{0} Project",
			"organizedBy": "Term for organizing layout",
			"other": "Other",
			"pericopes": "Pericope/Pericopes",
			"preview": "Preview",
			"projectName": "Project Name",
			"renderCustomize": "including Render customization",
			"renderRecommended": "Recommended for Render",
			"rightToLeft": "Right-to-Left",
			"save": "Save",
			"scenes": "Scene/Scenes",
			"sections": "Section/Sections",
			"sets": "Set/Sets",
			"stories": "Story/Stories",
			"tags": "Tags",
			"testing": "Testing",
			"training": "Training",
			"type": "Project Type",
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
				"activityState" : new LocalizedStrings(action.payload.data.activityState),
				"alert" : new LocalizedStrings(action.payload.data.alert),
				"assignmentTable" : new LocalizedStrings(action.payload.data.assignmentTable),
				"assignSection" : new LocalizedStrings(action.payload.data.assignSection),
				"cards" : new LocalizedStrings(action.payload.data.cards),
				"control" : new LocalizedStrings(action.payload.data.control),
				"deleteExpansion" : new LocalizedStrings(action.payload.data.deleteExpansion),
				"electronImport" : new LocalizedStrings(action.payload.data.electronImport),
				"emailUnverified" : new LocalizedStrings(action.payload.data.emailUnverified),
				"groupSettings" : new LocalizedStrings(action.payload.data.groupSettings),
				"groupTabs" : new LocalizedStrings(action.payload.data.groupTabs),
				"import" : new LocalizedStrings(action.payload.data.import),
				"integration" : new LocalizedStrings(action.payload.data.integration),
				"invitationTable" : new LocalizedStrings(action.payload.data.invitationTable),
				"invite" : new LocalizedStrings(action.payload.data.invite),
				"languagePicker" : new LocalizedStrings(action.payload.data.languagePicker),
				"main" : new LocalizedStrings(action.payload.data.main),
				"mediaTab" : new LocalizedStrings(action.payload.data.mediaTab),
				"mediaUpload" : new LocalizedStrings(action.payload.data.mediaUpload),
				"passageMedia" : new LocalizedStrings(action.payload.data.passageMedia),
				"planActions" : new LocalizedStrings(action.payload.data.planActions),
				"planSheet" : new LocalizedStrings(action.payload.data.planSheet),
				"planTabs" : new LocalizedStrings(action.payload.data.planTabs),
				"profile" : new LocalizedStrings(action.payload.data.profile),
				"projButtons" : new LocalizedStrings(action.payload.data.projButtons),
				"scriptureTable" : new LocalizedStrings(action.payload.data.scriptureTable),
				"shapingTable" : new LocalizedStrings(action.payload.data.shapingTable),
				"shared" : new LocalizedStrings(action.payload.data.shared),
				"taskItem" : new LocalizedStrings(action.payload.data.taskItem),
				"template" : new LocalizedStrings(action.payload.data.template),
				"toDoTable" : new LocalizedStrings(action.payload.data.toDoTable),
				"transcriber" : new LocalizedStrings(action.payload.data.transcriber),
				"transcribeReject" : new LocalizedStrings(action.payload.data.transcribeReject),
				"transcriptionShow" : new LocalizedStrings(action.payload.data.transcriptionShow),
				"transcriptionTab" : new LocalizedStrings(action.payload.data.transcriptionTab),
				"treeChart" : new LocalizedStrings(action.payload.data.treeChart),
				"uploadProgress" : new LocalizedStrings(action.payload.data.uploadProgress),
				"usertable" : new LocalizedStrings(action.payload.data.usertable),
				"vProject" : new LocalizedStrings(action.payload.data.vProject),
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
