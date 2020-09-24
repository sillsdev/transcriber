// WARNING: This file is generated using ToReducer.xsl. Changes made here may be lost.
import LocalizedStrings from 'react-localization';
import { FETCH_LOCALIZATION, SET_LANGUAGE } from './types';
import { ILocalizedStrings } from './model';

const initialState = {
	"loaded": false,
	"lang": 'en',
	"shared": new LocalizedStrings({
		"en": {
			"lastEdit": "Last save {0}",
			"NoSaveOffline": "Unable to save while offline.",
			"transcriber": "Transcriber",
			"editor": "Editor",
			"admin": "Owner",
			"uploadMediaSingular": "Upload Media",
			"uploadMediaPlural": "Upload Media",
		}
	}),
	"planActions": new LocalizedStrings({
		"en": {
			"assign": "Assign",
			"transcribe": "Transcribe",
			"delete": "Delete",
			"playpause": "Play / Pause",
		}
	}),
	"access": new LocalizedStrings({
		"en": {
			"accessFirst": "Welcome to SIL Transcriber. A project is created online at the {0} admin site. Export a Portable Transcriber Format (PTF) file and import it here.",
			"accessSilTranscriber": "Click your avatar to transcribe or review.",
			"login": "Online Login",
			"importProject": "Import PTF File",
		}
	}),
	"electronImport": new LocalizedStrings({
		"en": {
			"importProject": "Import Project",
			"importError": "Import Error",
			"invalidProject": "Import File does not contain current project.",
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
			"chooseUser": "Choose Member",
			"name": "Name",
			"email": "Email",
			"locale": "Locale",
			"phone": "Phone",
			"timezone": "Timezone",
			"cancel": "Cancel",
			"continue": "Continue",
			"role": "Role",
			"invite": "Invite",
			"offline": "Offline Desktop Member",
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
	"planSheet": new LocalizedStrings({
		"en": {
			"action": "Action",
			"move": "Move",
			"copy": "Copy",
			"attachMedia": "Attach Media",
			"addSection": "Add {0}",
			"addPassage": "Add Passage",
			"inlineToggle": "Condensed",
			"save": "Save",
			"refErr": "This project contains invalid references and will not sync to Paratext properly.",
			"saving": "Saving...",
			"selectRows": "Please select row(s) to {0}.",
			"confirm": "{0} {1} Item(s). Are you sure?",
			"sectionAbove": "Insert {0} above",
			"passageBelow": "Insert passage below {0}",
			"passageBelowSection": "Insert new passage 1",
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
			"title": "Title",
			"passage": "Passage",
			"book": "Book",
			"reference": "Reference",
			"description": "Description",
			"action": "Action",
			"loadingTable": "Loading data",
			"saving": "Saving...",
			"pasteNoRows": "No Rows in clipboard.",
			"pasteInvalidColumnsScripture": "Invalid number of columns ({0}). Expecting 6 columns.",
			"pasteInvalidColumnsGeneral": "Invalid number of columns ({0}). Expecting 5 columns.",
			"pasteInvalidSections": "Invalid {0} number(s):",
			"pasteInvalidPassages": "Invalid passage numbers:",
			"saveFirst": "You must save changes first!",
		}
	}),
	"assignmentTable": new LocalizedStrings({
		"en": {
			"title": "Assignments",
			"sectionstate": "State",
			"passages": "Passages",
			"passagestate": "State",
			"user": "Member",
			"role": "Role",
			"assignSec": "Assign {0}",
			"removeSec": "Remove Assignment",
			"delete": "Delete",
			"filter": "Filter",
			"selectRowsToAssign": "Please select row(s) to assign.",
			"selectRowsToRemove": "Please select row(s) to remove assignment.",
			"showHideFilter": "Show/Hide filter rows",
		}
	}),
	"assignSection": new LocalizedStrings({
		"en": {
			"title": "Assign {0} to Members",
			"users": "Members",
			"role": "Role",
			"assignAs": "Assign As",
			"close": "Close",
		}
	}),
	"planTabs": new LocalizedStrings({
		"en": {
			"sectionsPassages": "{0} & Passages",
			"passageStatus": "{1} of {2} passages",
			"sectionStatus": "{1} of {2} {0}",
			"mediaStatus": "{1} of {2} media files",
			"media": "Media",
			"assignments": "Assignments",
			"transcriptions": "Transcriptions",
			"associations": "Associations",
		}
	}),
	"mediaTab": new LocalizedStrings({
		"en": {
			"action": "Action",
			"delete": "Delete",
			"download": "Download",
			"changeVersion": "Change Version",
			"attachPassage": "Attach Passage",
			"uploadComplete": "{0} of {1} files uploaded successfully.",
			"planName": "Plan",
			"fileName": "File Name",
			"book": "Book",
			"reference": "Reference",
			"duration": "Length (s)",
			"size": "Size (KB)",
			"version": "Version",
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
			"NoLoadOffline": "Unable to load project data offline.",
			"silTranscriberAdmin": "SIL Transcriber Admin",
			"silTranscriber": "SIL Transcriber",
			"online": "Online Status",
			"search": "Search…",
			"usersAndGroups": "Members and Roles",
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
			"loadingTranscriber": "Loading SIL Transcriber",
			"projectSummary": "Project Summary",
			"addProject": "Add Project",
			"export": "Export",
			"import": "Import",
			"loadingTable": "Busy...please wait.",
			"resetTitle": "Remove All Local Data",
			"resetDesc": "After the program exits, enter this command in a terminal window: {0}/resources/resetData.sh",
			"cancel": "Cancel",
			"logout": "Log Out",
			"myAccount": "My Account",
			"orgRole": "Team Role:",
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
		}
	}),
	"emailUnverified": new LocalizedStrings({
		"en": {
			"emailUnverified": "Your email is unverified.",
			"verify": "Please verify by clicking on the link in the authorization email sent to your account.",
			"resend": "Resend the authorization email",
			"verified": "I'm verified!  Carry on!",
		}
	}),
	"import": new LocalizedStrings({
		"en": {
			"import": "Import",
			"continue": "Continue?",
			"close": "Close",
			"importProject": "Import Project",
			"expiredToken": "Your log in token has expired and can't be automatically renewed.  Please log out and login again.",
			"error": "Import Error",
			"onlineChangeReport": "Online changes made since data provided to offline member:",
			"noFile": "Please select file to be uploaded.",
			"importPending": "Import In Progress...",
			"invalidITF": "Not a valid Incremental Transcriber File (ITF).",
			"invalidProject": "Import File does not contain current project.",
			"importComplete": "Import Complete",
			"plan": "Project",
			"passage": "Passage",
			"other": "Other",
			"old": "Previous Value",
			"imported": "Imported Value",
			"transcription": "Transcription",
			"state": "State",
			"unassigned": "unassigned",
			"fontsize": "Font Size",
			"username": "Name",
			"given": "Given Name",
			"family": "Family Name",
			"phone": "Phone",
			"timezone": "Time zone",
			"locale": "Preferred Language",
			"filter": "Filter",
			"showHideFilter": "Show/Hide filter rows",
		}
	}),
	"transcriptionTab": new LocalizedStrings({
		"en": {
			"sectionstate": "State",
			"passages": "Passages",
			"filter": "Filter",
			"plan": "Plan",
			"elan": "Elan",
			"export": "Export",
			"copyTranscriptions": "Copy Transcriptions",
			"copyTip": "Copy transcriptions to Clipboard",
			"showHideFilter": "Show/Hide filter rows",
			"cantCopy": "Unable to copy to clipboard",
			"updated": "Updated",
			"exportProject": "Export Project",
			"electronBackup": "Backup All Projects",
			"exportType": "Which export type?",
			"exportExplanation": "Export the full project to store locally or share with another offline member. Export incremental file to import changes into online app.",
			"exportPTFtype": "Export Project (ptf)",
			"exportITFtype": "Incremental Changes (itf)",
			"cancel": "Cancel",
			"exportingProject": "Exporting...{0}%",
			"error": "Export Error",
			"downloading": "Creation complete. Downloading {0}",
			"expiredToken": "Your login token has expired and can't be automatically renewed.  Please log out and login again.",
			"exportTooLarge": "The project cannot be exported.  The export file is too large.",
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
			"users": "Members",
			"groups": "Groups",
			"roles": "Roles",
			"invitations": "Invitations",
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
			"case1": "If the project does not exist, click the plus button in the Navigation pane to create it.",
			"case2": "Existing projects can be associated with this group in Settings.",
			"assignedSections": "  Assigned {0}: ",
			"projectPlans": "Project Plans",
			"invalidRole": "Invalid Role. Member not added.",
			"loadingTable": "Loading data",
			"noDeleteInfo": "This role is included in a higher role and cannot be deleted.",
			"noDeleteAllUsersInfo": "Cannot delete members from the All Members group",
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
			"addInvite": "Invite Member",
			"newInviteTask": "Enter the email address of the member to invite.",
			"email": "Email",
			"role": "Team Role",
			"organization": "Team",
			"selectOrgRole": "Select team role",
			"allusersgroup": "All Members Group",
			"groups": "Project",
			"group": "Group",
			"allUsersProjects": "Projects",
			"additionalgroup": "Optional additional Group",
			"groupRole": "Project Role",
			"selectProjectRole": "Select project role",
			"otherGroupProjects": "Projects",
			"noProjects": "No Projects are associated with this group.",
			"selectTeamRole": "Select Team Role",
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
			"adminDetail": "(Manage + Review + Transcribe)",
			"transcriberDetail": "(Transcribe)",
			"editorDetail": "(Review + Transcribe)",
		}
	}),
	"invitationTable": new LocalizedStrings({
		"en": {
			"email": "Email",
			"role": "Team Role",
			"allUsers": "All Members",
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
	"mediaUpload": new LocalizedStrings({
		"en": {
			"title": "Upload Media",
			"PTFtitle": "Upload complete Project Data from PTF",
			"ITFtitle": "Upload Change Data from Desktop Extension",
			"task": "You can upload audio files in .mp3, .m4a, .wav or .ogg format.",
			"PTFtask": "Upload a Portable Transcriber File (ptf).",
			"ITFtask": "Upload an Incremental Transcriber File (itf file) exported from the Desktop Extension.",
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
			"tasks": "Tasks",
			"filter": "Filter",
			"plan": "Plan",
			"project": "Project",
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
			"emptyBook": "Passage {0}.{1}: Book is missing.",
			"bookNotInParatext": "Passage {0}.{1}: Paratext project does not contain book {2}.",
			"chapterSpan": "Passage {0}.{1} {2}: Passage must not span chapters.",
			"invalidReference": "Passage {0}.{1} {2}: Invalid Reference",
			"bookNotFound": "Book not included in this project",
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
			"userExists": "This offline member exists.",
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
			"deleteUser": "Delete Member",
			"deleteExplained": "Deleting your member will block you from using the program and remove references to your work.",
			"cancel": "Cancel",
			"silTranscriberAdmin": "SIL Transcriber Admin",
			"silTranscriber": "SIL Transcriber",
			"userProfile": "Member profile",
			"completeProfile": "Complete Member Profile",
			"addOfflineUser": "Add Offline Desktop Member",
			"sendNews": "Receive SIL Transcriber and Language Technology news",
			"sendDigest": "Receive daily digests",
			"role": "Team Role",
			"checkingParatext": "Checking for Paratext account...",
			"paratextLinked": "Linked to Paratext",
			"paratextNotLinked": "Link to Paratext",
			"paratextLinking": "Linking to Paratext",
			"linkingExplained": "Log out and log in with Paratext button",
			"installParatext": "Install Paratext to be able to sync.",
			"logout": "Logout",
			"close": "Close",
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
			"section": "{0} {1}.{2}",
			"assign": "Assign {0}",
			"unassign": "Unassign {0}",
		}
	}),
	"control": new LocalizedStrings({
		"en": {
			"contentType": "Content Type",
			"scripture": "Scripture Transcription",
			"other": "General Transcription",
		}
	}),
	"template": new LocalizedStrings({
		"en": {
			"templateCodes": "Template Codes",
			"projectCode": "Project Code",
			"language": "Language BCP47 code",
			"book": "Paratext book identifier",
			"passage": "Passage number(within {0})",
			"chapter": "Chapter number",
			"beginning": "Starting verse number",
			"end": "Ending verse number",
			"fileTemplate": "File Name Template",
			"apply": "Apply",
		}
	}),
	"cards": new LocalizedStrings({
		"en": {
			"uploadProgress": "Upload Progress",
			"projectCreated": "Project Created",
			"mediaUploaded": "Media Uploaded",
			"passagesCreated": "Passages Created",
			"newProject": "New Project",
			"connectParatext": "Connect a Paratext Project",
			"import": "Import PTF File",
			"personalProjects": "Personal Projects",
			"language": "Language: {0}",
			"sectionStatus": "{0} {1}",
			"settings": "Settings",
			"delete": "Delete",
			"addTeam": "Add Team",
			"teamSettings": "Team Settings",
			"teamName": "Team Name",
			"cancel": "Cancel",
			"add": "Add",
			"save": "Save",
			"deleteTeam": "Delete Team",
			"explainTeamDelete": "Deleting the team will delete all projects of the team.",
			"members": "Members ({0})",
			"sync": "Sync ({0})",
		}
	}),
	"vProject": new LocalizedStrings({
		"en": {
			"editorSettings": "Editor Settings",
			"rightToLeft": "Right-to-Left",
			"font": "Font",
			"fontSize": "Font Size",
			"preview": "Preview",
			"description": "Description",
			"newProject": "{0} Project",
			"new": "New",
			"edit": "Edit",
			"cancel": "Cancel",
			"add": "Add",
			"save": "Save",
			"advanced": "Advanced",
			"layout": "Layout",
			"organizedBy": "Term for organizing layout",
			"sections": "Section/Sections",
			"sets": "Set/Sets",
			"stories": "Story/Stories",
			"scenes": "Scene/Scenes",
			"pericopes": "Pericope/Pericopes",
			"correctformat": "Please enter in the format: singular/plural",
			"projectName": "Project Name",
			"flat": "Flat",
			"hierarchical": "Hierarchical",
			"tags": "Tags",
			"training": "Training",
			"testing": "Testing",
			"backtranslation": "Back Translation",
			"other": "Other",
			"type": "Project Type",
			"language": "Language",
			"renderRecommended": "Recommended for Render",
		}
	}),
	"uploadProgress": new LocalizedStrings({
		"en": {
			"progressTitle": "Progress",
			"cancel": "Cancel",
			"canceling": "Canceling...",
		}
	}),
	"projButtons": new LocalizedStrings({
		"en": {
			"importExport": "Import / Export",
			"integrations": "Paratext Integration",
			"import": "Import",
			"export": "Export",
			"integrationsTitle": "{0} Integrations",
			"exportTitle": "{0} Export",
			"importTitle": "{0} Import",
		}
	}),
};

export default function (state = initialState, action: any): ILocalizedStrings {
	switch (action.type) {
		case FETCH_LOCALIZATION:
			return {
				...state,
				"loaded": true,
				"shared" : new LocalizedStrings(action.payload.data.shared),
				"planActions" : new LocalizedStrings(action.payload.data.planActions),
				"access" : new LocalizedStrings(action.payload.data.access),
				"electronImport" : new LocalizedStrings(action.payload.data.electronImport),
				"usertable" : new LocalizedStrings(action.payload.data.usertable),
				"alert" : new LocalizedStrings(action.payload.data.alert),
				"planSheet" : new LocalizedStrings(action.payload.data.planSheet),
				"scriptureTable" : new LocalizedStrings(action.payload.data.scriptureTable),
				"assignmentTable" : new LocalizedStrings(action.payload.data.assignmentTable),
				"assignSection" : new LocalizedStrings(action.payload.data.assignSection),
				"planTabs" : new LocalizedStrings(action.payload.data.planTabs),
				"mediaTab" : new LocalizedStrings(action.payload.data.mediaTab),
				"passageMedia" : new LocalizedStrings(action.payload.data.passageMedia),
				"main" : new LocalizedStrings(action.payload.data.main),
				"emailUnverified" : new LocalizedStrings(action.payload.data.emailUnverified),
				"import" : new LocalizedStrings(action.payload.data.import),
				"transcriptionTab" : new LocalizedStrings(action.payload.data.transcriptionTab),
				"transcriptionShow" : new LocalizedStrings(action.payload.data.transcriptionShow),
				"groupTabs" : new LocalizedStrings(action.payload.data.groupTabs),
				"groupSettings" : new LocalizedStrings(action.payload.data.groupSettings),
				"shapingTable" : new LocalizedStrings(action.payload.data.shapingTable),
				"treeChart" : new LocalizedStrings(action.payload.data.treeChart),
				"languagePicker" : new LocalizedStrings(action.payload.data.languagePicker),
				"activityState" : new LocalizedStrings(action.payload.data.activityState),
				"invite" : new LocalizedStrings(action.payload.data.invite),
				"invitationTable" : new LocalizedStrings(action.payload.data.invitationTable),
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
				"template" : new LocalizedStrings(action.payload.data.template),
				"cards" : new LocalizedStrings(action.payload.data.cards),
				"vProject" : new LocalizedStrings(action.payload.data.vProject),
				"uploadProgress" : new LocalizedStrings(action.payload.data.uploadProgress),
				"projButtons" : new LocalizedStrings(action.payload.data.projButtons),
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
