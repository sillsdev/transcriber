// WARNING: This file is generated using ToReducer.xsl. Changes made here may be lost.
import LocalizedStrings from 'react-localization';
import { FETCH_LOCALIZATION, SET_LANGUAGE } from './types';
import { ILocalizedStrings } from './model';

const initialState = {
	"loaded": false,
	"lang": 'en',
	"access": new LocalizedStrings({
		"en": {
			"availableOfflineUsers": "Available Offline Users",
			"availableOnlineUsers": "Available Online Users",
			"cancel": "Cancel",
			"createUser": "Add a new user",
			"logIn": "Log In",
			"screenTitle": "I want to work...",
			"importSnapshot": "Import Project",
			"withInternet": "With an Internet connection",
			"withoutInternet": "Without an Internet connection",
			"mustBeOnline": "You must be connected to the Internet to Log In!",
			"importProject": "ImportProject",
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
			"title": "Assign {0}",
			"users": "Members",
		}
	}),
	"audioDownload": new LocalizedStrings({
		"en": {
			"downloadMedia": "Download Audio",
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
			"import": "Import Project",
			"language": "Language: {0}",
			"mediaUploaded": "Audio Uploaded",
			"members": "Members ({0})",
			"newProject": "New Project",
			"passagesCreated": "Passages Created",
			"personalProjects": "Personal Projects",
			"projectCreated": "Project Created",
			"save": "Save",
			"nameInUse": "Name in use",
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
			"project": "Project",
			"members": "Members",
			"userWontSeeProject": "You are not a member of this project team. This project will not be accessible after import.",
			"importProject": "Import Project",
			"invalidProject": "Import File does not contain current project.",
			"lastExported": "Current data in project {name0} was last exported {date0}.",
			"neverExported": "Current data in project {name0} has never been exported to an itf file to preserve changes.",
			"projectImported": "Project {name0} was previously imported with a newer file: {date1} ",
			"ptfError": "Not a valid Portable Transcriber File",
		}
	}),
	"emailUnverified": new LocalizedStrings({
		"en": {
			"emailUnverified": "Your email is unverified.",
			"logout": "Logout",
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
			"copy": "Copy Report",
			"copyfail": "Copy Failed",
			"error": "Import Error",
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
			"countError": "Count query error: ",
			"countPending": "Querying count...",
			"invalidReferences": "{0} passages have invalid book or reference.",
			"countReady": "Passages ready to sync: ",
			"emptyBook": "Passage {0}.{1}: Book is missing.",
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
			"admin": "Admin",
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
			"member": "Member",
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
			"flatSample": "Scripture flat sample spreadsheet",
			"hierarchicalSample": "Scripture hierarchical sample spreadsheet",
			"genFlatSample": "General flat sample spreadsheet",
			"genHierarchicalSample": "General hierarchical sample spreadsheet",
			"reportWhenOnline": "You must be online to report an problem.",
			"import": "Import",
			"integrations": "Integrations",
			"inviteError": "Invitation not accepted.  You must login with the email that the invitation was sent to.",
			"loadingTable": "Busy...please wait.",
			"loadingTranscriber": "Loading {0}",
			"logout": "Log Out",
			"logoutRequired": "Log out of other tab required",
			"media": "Audio",
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
			"updateAvailable": "Update available: Version {0} was released {1}",
			"about": "About",
			"version": "Version: {0} - {1}",
			"copyClipboard": "Copy Version to Clipboard",
			"team": "Team",
			"reliesOn": "{0} relies on other works",
			"thanks": "Thanks to",
			"cantCopy": "Unable to copy to clipboard",
		}
	}),
	"mediaActions": new LocalizedStrings({
		"en": {
			"attach": "Associate",
			"detach": "Disassociate",
			"download": "Download",
			"delete": "Delete",
			"play": "Play",
			"stop": "Stop",
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
			"deleteConfirm": "Delete {0}? Are you sure?",
			"detach": "Detach",
			"duration": "Length (s)",
			"fileAttached": "File already attached",
			"actions": "Actions",
			"fileName": "File Name",
			"filter": "Filter",
			"loadingTable": "Loading data",
			"matchAdded": "Match complete: {0} new associations",
			"mediaAssociations": "Audio Associations",
			"noMatch": "Match complete: no new associations",
			"none": "None",
			"noPassageAttached": "{0} has no passage attached",
			"passageAttached": "Passage already attached",
			"planName": "Plan",
			"proposed": "Proposed",
			"reference": "Reference",
			"associated": "Associated",
			"alreadyAssociated": "Show Passages Already Associated",
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
			"invalidFile": "Not valid for this operation: {0} ",
			"ITFtask": "Upload an Incremental Transcriber File (itf file) exported from the Desktop app.",
			"ITFtitle": "Upload Change Data from Desktop app.",
			"PTFtask": "Upload a Portable Transcriber File (ptf).",
			"PTFtitle": "Upload complete Project Data from PTF",
			"task": "You can upload audio files in .mp3, .m4a, .wav or .ogg format.",
			"title": "Upload Audio",
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
			"recordAudio": "Record/Edit Audio",
			"transcribe": "Transcribe",
		}
	}),
	"planSheet": new LocalizedStrings({
		"en": {
			"action": "Action",
			"audio": "Audio",
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
			"media": "Audio",
			"mediaStatus": "{1} of {2} associations",
			"passageStatus": "{1} of {2} passages",
			"sectionsPassages": "{0} & Passages",
			"sectionStatus": "{1} of {2} {0}",
			"transcriptions": "Transcriptions",
		}
	}),
	"profile": new LocalizedStrings({
		"en": {
			"add": "Add",
			"addMember": "Complete User Profile",
			"cancel": "Cancel",
			"checkingParatext": "Checking for Paratext account...",
			"nameNotEmail": "Please choose a name other than your email address.",
			"notLinked": "Not linked to Paratext",
			"close": "Close",
			"completeProfile": "Complete User Profile",
			"deleteExplained": "Deleting your user will block you from using the program and remove references to your work.",
			"deleteUser": "Delete User",
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
			"timezone": "Time zone",
			"userExists": "This offline user exists.",
			"userProfile": "User profile",
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
	"projectSolution": new LocalizedStrings({
		"en": {
			"selectType": "I want to set up this kind of project...",
			"audioProduct": "Audio Product",
			"textProduct": "Text Product",
			"other": "Other",
			"general": "General Transcription",
			"generalTip": "General Transcription can cover a wide range of working scenarios and product solutions.",
			"obt": "Oral Bible Translation - OBT",
			"obtTip": "Oral Bible translation produces an audio product using oral methods.",
			"storying": "Storying",
			"storyingTip": "Storying will restructure Scripture content to produce a product that is easier to remember and understand.",
			"adaptation": "Oral Adaptation",
			"adaptationTip": "The Adaptation solution is a hybrid of oral drafting and a traditional text based adaptation solution.",
			"drafting": "Oral Drafting for Scripture",
			"draftingTip": "Oral drafting uses audio recordings to achieve a natural sounding written translation.",
			"blank": "Blank Project",
			"paratextIntegration": "Integrated with Paratext",
			"oneStoryIntegration": "Integrated with OneStory Editor",
			"newProject": "New Project",
			"uploadAudio": "Upload Audio",
			"startRecording": "Start Recording",
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
			"avg": "Avg",
			"count": "Count",
			"max": "Max",
			"min": "Min",
			"noColumns": "No columns visible",
			"noData": "No data",
			"sum": "Sum",
		}
	}),
	"shared": new LocalizedStrings({
		"en": {
			"admin": "Owner",
			"editor": "Editor",
			"lastEdit": "Last save {0}",
			"NoSaveOffline": "Unable to save while offline.",
			"bookNotInParatext": "Passage {0}.{1}: Paratext project does not contain book {2}.",
			"paratextchapterSpan": "Passage {0}.{1} {2}: Passage must not span chapters.",
			"invalidReference": "Passage {0}.{1} {2}: Invalid Reference",
			"BookNotSet": "Book was not set for Section {0} Passage {1}",
			"expiredParatextToken": "Your paratext login has expired and can't be automatically renewed.  Please log out and login again.",
			"expiredToken": "Your login token has expired and can't be automatically renewed.  Please log out and login again.",
			"invalidParatextLogin": "You must login with a valid paratext login.",
			"transcriber": "Transcriber",
			"uploadMediaPlural": "Upload Audio",
			"uploadMediaSingular": "Upload Audio",
			"importMediaSingular": "Import Audio",
			"mediaAttached": "Audio Attached",
			"part": "Part {0}",
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
			"comment": "Comment",
			"done": "Completed",
			"historyTip": "History [{0}]",
			"incomplete": "Incomplete transcripiton",
			"invalidReference": "Book or Reference is invalid.",
			"addNote": "Add Note",
			"needsNewRecording": "Rejected recording",
			"needsNewTranscription": "Rejected transcription",
			"noMedia": "Created task",
			"pullParatextCaption": "Paratext",
			"pullParatextStart": "Getting transcription from Paratext",
			"pullParatextStatus": "Transcription pulled from Paratext",
			"pullParatextTip": "Pull transcription from Paratext",
			"reject": "Reject",
			"reopen": "Reopen",
			"reviewing": "Started to review",
			"save": "Save",
			"saveReviewTip": "Save position and comment",
			"saveTip": "Save changes and comment",
			"saving": "Saving...",
			"submit": "Submit",
			"submitReviewTip": "Submit as complete",
			"submitTranscriptionTip": "Submit for review",
			"transcribing": "Started to transcribe",
			"updateByOther": "Transcription updated by another person or process.",
			"congratulation": "Congratulations",
			"noMoreTasks": "You have no more tasks to work on!",
		}
	}),
	"transcribeAddNote": new LocalizedStrings({
		"en": {
			"cancel": "Cancel",
			"save": "Save",
			"addNoteTitle": "Add Note",
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
			"export": "Export",
			"exportExplanation": "Export the full project to store locally or share with another offline member. Export incremental file to import changes into online app.",
			"exportingProject": "Exporting...{0}%",
			"downloadingProject": "Downloading...{0}%",
			"exportITFtype": "Incremental Changes (itf)",
			"exportProject": "Export Project",
			"downloadProject": "Download Project",
			"exportPTFtype": "Export Project (ptf)",
			"exportTooLarge": "The project cannot be exported.  The export file is too large.",
			"exportType": "Which export type?",
			"filter": "Filter",
			"passages": "Passages",
			"plan": "Plan",
			"sectionstate": "State",
			"showHideFilter": "Show/Hide filter rows",
			"updated": "Updated",
			"incompletePlan": "Plan is incomplete: attach audio to passages.",
		}
	}),
	"treeChart": new LocalizedStrings({
		"en": {
			"contributions": "Contributions toward",
			"noData": "No Transcription Data Yet",
			"status": "Status of",
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
			"addMember": "Add Member",
			"addNewUser": "Add New User",
			"selectUser": "Select User",
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
			"nameInUse": "Name in use",
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
	"wsAudioPlayer": new LocalizedStrings({
		"en": {
			"aheadTip": "Ahead {jump} {1} [{0}]",
			"backTip": "Rewind {jump} {1} [{0}]",
			"beginningTip": "Go to Beginning [{0}]",
			"deleteRegion": "Delete Region",
			"endTip": "Go to End [{0}]",
			"fasterTip": "Faster [{0}]",
			"insertoverwrite": "Insert/Overwrite",
			"loopoff": "Loop Off",
			"loopon": "Loop On",
			"pauseTip": "Pause [{0}]",
			"pauseRecord": "Pause",
			"playTip": "Play [{0}]",
			"record": "Record [{0}]",
			"resume": "Resume",
			"seconds": "Seconds",
			"silence": "Silence",
			"slowerTip": "Slower [{0}])",
			"stop": "Stop [{0}]",
			"timerTip": "Timestamp [{0}]",
		}
	}),
	"passageRecord": new LocalizedStrings({
		"en": {
			"fileName": "Name",
			"fileType": "File Type",
			"loadfile": "Load Existing File",
			"loading": "Loading...",
			"save": "Save",
			"cancel": "Cancel",
			"title": "Record/Edit Audio",
			"defaultFilename": "MyRecording",
		}
	}),
	"hotKey": new LocalizedStrings({
		"en": {
			"altKey": "Alt",
			"ctrlKey": "Ctrl",
			"endKey": "End",
			"homeKey": "Home",
			"or": "or",
			"spaceKey": "Space",
		}
	}),
};

const localizationReducer = function (state = initialState, action: any): ILocalizedStrings {
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
				"audioDownload" : new LocalizedStrings(action.payload.data.audioDownload),
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
				"mediaActions" : new LocalizedStrings(action.payload.data.mediaActions),
				"mediaTab" : new LocalizedStrings(action.payload.data.mediaTab),
				"mediaUpload" : new LocalizedStrings(action.payload.data.mediaUpload),
				"passageMedia" : new LocalizedStrings(action.payload.data.passageMedia),
				"planActions" : new LocalizedStrings(action.payload.data.planActions),
				"planSheet" : new LocalizedStrings(action.payload.data.planSheet),
				"planTabs" : new LocalizedStrings(action.payload.data.planTabs),
				"profile" : new LocalizedStrings(action.payload.data.profile),
				"projButtons" : new LocalizedStrings(action.payload.data.projButtons),
				"projectSolution" : new LocalizedStrings(action.payload.data.projectSolution),
				"scriptureTable" : new LocalizedStrings(action.payload.data.scriptureTable),
				"shapingTable" : new LocalizedStrings(action.payload.data.shapingTable),
				"shared" : new LocalizedStrings(action.payload.data.shared),
				"taskItem" : new LocalizedStrings(action.payload.data.taskItem),
				"template" : new LocalizedStrings(action.payload.data.template),
				"toDoTable" : new LocalizedStrings(action.payload.data.toDoTable),
				"transcriber" : new LocalizedStrings(action.payload.data.transcriber),
				"transcribeAddNote" : new LocalizedStrings(action.payload.data.transcribeAddNote),
				"transcribeReject" : new LocalizedStrings(action.payload.data.transcribeReject),
				"transcriptionShow" : new LocalizedStrings(action.payload.data.transcriptionShow),
				"transcriptionTab" : new LocalizedStrings(action.payload.data.transcriptionTab),
				"treeChart" : new LocalizedStrings(action.payload.data.treeChart),
				"uploadProgress" : new LocalizedStrings(action.payload.data.uploadProgress),
				"usertable" : new LocalizedStrings(action.payload.data.usertable),
				"vProject" : new LocalizedStrings(action.payload.data.vProject),
				"wsAudioPlayer" : new LocalizedStrings(action.payload.data.wsAudioPlayer),
				"passageRecord" : new LocalizedStrings(action.payload.data.passageRecord),
				"hotKey" : new LocalizedStrings(action.payload.data.hotKey),
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

export default localizationReducer;
