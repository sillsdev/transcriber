// WARNING: This file is generated using ToReducer.xsl. Changes made here may be lost.
import LocalizedStrings from 'react-localization';
import { FETCH_LOCALIZATION, SET_LANGUAGE } from './types';
import { ILocalizedStrings } from './model';

const initialState = {
	"loaded": false,
	"lang": 'en',
	"access": new LocalizedStrings({
		"en": {
			"availableUsers": "Other Users",
			"back": "Back",
			"cancel": "Cancel",
			"createUser": "Add a new user",
			"currentUser": "Current User",
			"importSnapshot": "Import Audio Project",
			"logIn": "Log In",
			"logout": "Log Out",
			"mustBeOnline": "You must be connected to the Internet to Log In!",
			"noOnlineUsers1": "To allow offline use:",
			"noOnlineUsers2": "Log in and select Offline Available in the audio project card menu and then log out. Or, click IMPORT AUDIO PROJECT to import an audio project your admin exported.",
			"noOnlineUsers3": "To create an online audio project for working alone:",
			"noOnlineUsers4": "Create a personal audio project.",
			"offlineUsers": "Offline Users",
			"title": "User List",
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
			"delete": "Continue with Delete?",
			"no": "No",
			"yes": "Yes",
		}
	}),
	"artifactType": new LocalizedStrings({
		"en": {
			"backtranslation": "Back Translation",
			"comment": "Comment",
			"resource": "Resource",
			"testing": "Testing",
			"vernacular": "Vernacular",
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
	"audacityManager": new LocalizedStrings({
		"en": {
			"audacityProject": "Audacity Project",
			"badProjName": "Invalid Audacity project name",
			"badProjPath": "Expected full Audacity project path name",
			"browse": "Browse",
			"checkDownload": "Exit to download media file before creating Audacity",
			"close": "Close",
			"closeAudacity": "Audacity is current running. Close before using this function.",
			"create": "Create",
			"exportFirst": "Open Audacity and use File:Export before importing",
			"import": "Import",
			"installError": "Audacity install error",
			"loadingAudio": "Use File:Import in Audacity to load current audio if desired.",
			"missingImport": "Missing import file: {0}",
			"missingProject": "Missing file. Use Browse to search for it or Create to make a new file.",
			"open": "Open",
			"saveFirst": "Save before editing",
			"tip": "If you have an existing Audacity project you want to link to this passage, click BROWSE.  To create a new Audacity project with an automatically created name, click CREATE.",
			"title": "Audacity Manager",
			"unlink": "Unlink",
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
			"explainTeamDelete": "Deleting the team will delete all audio projects of the team.",
			"import": "Import Audio Project",
			"language": "Language: {0}",
			"mediaUploaded": "Audio Uploaded",
			"members": "Members ({0})",
			"nameInUse": "Name in use",
			"newProject": "New Audio Project",
			"offline": "Offline",
			"offlineAvail": "Offline Available",
			"passagesCreated": "Passages Created",
			"personalProjects": "Personal Audio Projects",
			"projectCreated": "Audio Project Created",
			"save": "Save",
			"sectionStatus": "{0} {1}",
			"settings": "Settings",
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
			"importProject": "Import Audio Project",
			"invalidProject": "Import File does not contain current audio project.",
			"lastExported": "Current data in audio project {name0} was last exported {date0}.",
			"members": "Members",
			"neverExported": "Current data in audio project {name0} has never been exported to an itf file to preserve changes.",
			"project": "Audio Project",
			"projectImported": "Audio Project {name0} was previously imported with a newer file: {date1} ",
			"ptfError": "Not a valid Portable Transcriber File",
			"userWontSeeProject": "You are not a member of this audio project team. This audio project will not be accessible after import.",
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
	"grid": new LocalizedStrings({
		"en": {
			"all": "All",
			"avg": "Avg",
			"contains": "Contains",
			"count": "Count",
			"endsWith": "Ends with",
			"equal": "Equals",
			"filterPlaceholder": "Filter...",
			"greaterThan": "Greater than",
			"greaterThanOrEqual": "Greater than or equal to",
			"groupByColumn": "Drag a column header here to group by that column",
			"lessThan": "Less than",
			"lessThanOrEqual": "Less than or equal to",
			"max": "Max",
			"min": "Min",
			"noColumns": "No columns visible",
			"noData": "No data",
			"notcontains": "Does not contain",
			"notEqual": "Does not equal",
			"pageInfo": "Rows {from} to {to} ({count} Rows)",
			"rowsPerPage": "Rows per Page",
			"startsWith": "Starts with",
			"sum": "Sum",
		}
	}),
	"groupSettings": new LocalizedStrings({
		"en": {
			"add": "Ok",
			"addGroupMember": "Choose {0}",
			"addMemberInstruction": "Choose a person who will act as a {0} for audio projects in this group.",
			"allReviewersCanTranscribe": "All Editors are allowed to transcribe.",
			"assignedSections": "  Assigned {0}: ",
			"cancel": "Cancel",
			"delete": "Delete",
			"editors": "Editors",
			"editorsDetail": "(Review + Transcribe)",
			"loadingTable": "Loading data",
			"name": "Name",
			"noDeleteAdmin": "The only Administrator cannot be deleted.",
			"noDeleteAllUsersInfo": "Cannot delete members from the All Members group",
			"noDeleteInfo": "This role is included in a higher role and cannot be deleted.",
			"owners": "Owners",
			"ownersDetail": "(Manage + Review + Transcribe)",
			"projectPlans": "Audio Project Plans",
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
	"hotKey": new LocalizedStrings({
		"en": {
			"altKey": "Alt",
			"ctrlKey": "Ctrl",
			"downArrow": "Down Arrow",
			"endKey": "End",
			"homeKey": "Home",
			"or": "or",
			"leftArrow": "Left Arrow",
			"rightArrow": "Right Arrow",
			"spaceKey": "Space",
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
			"importProject": "Import Audio Project",
			"importSync": "Syncing offline changes",
			"invalidITF": "Not a valid Incremental Transcriber File (ITF).",
			"invalidProject": "Import File does not contain current audio project.",
			"locale": "Preferred Language",
			"noFile": "Please select file to be uploaded.",
			"old": "Previous Value",
			"onlineChangeReport": "Changes made since data provided to offline member:",
			"other": "Other",
			"passage": "Passage",
			"phone": "Phone",
			"plan": "Audio Project",
			"projectDeleted": "Audio Project {0} has been deleted online.",
			"projectNotFound": "ITF does not contain current audio project.  It contains audio project {0}.",
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
			"countReady": "Passages ready to sync: ",
			"emptyBook": "Passage {0}.{1}: Book is missing.",
			"invalidReferences": "{0} passages have invalid book or reference.",
			"no": "No",
			"noProject": "You are not a member of a {lang0} Paratext Project.",
			"offline": "Offline",
			"onestory": "One Story",
			"paratext": "Paratext",
			"paratextAssociation": "Paratext association",
			"paratextLocal": "Paratext Local",
			"projectError": "Audio Project Query error:",
			"projectsPending": "Querying Paratext projects...",
			"questionAccount": "Do you have a Paratext Account?",
			"questionInstalled": "Is Paratext installed locally?",
			"questionOnline": "Are you connected to the Internet?",
			"questionPermission": "Do you have permission to edit the Paratext project text?",
			"questionProject": "Are you connected to a {lang0} Paratext project?",
			"removeProject": "Remove Paratext Project Association",
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
			"allUsersProjects": "Audio Projects",
			"alreadyInvited": "Already invited!",
			"cancel": "Cancel",
			"detail": "{0} Detail",
			"editInvite": "Edit Invite",
			"email": "Email",
			"emailsubject": "{0} Invitation",
			"groupRole": "Audio Project Role",
			"groups": "Audio Project",
			"instructions": "Please click the following link to accept the invitation:",
			"invalidEmail": "Invalid email address",
			"invitation": "has invited you to join",
			"join": "Join",
			"member": "Member",
			"newInviteTask": "Enter the email address of the member to invite.",
			"noProjects": "No audio projects are associated with this group.",
			"organization": "Team",
			"questions": "Questions? Contact",
			"resend": "Resend",
			"role": "Team Role",
			"save": "Save",
			"selectProjectRole": "Select audio project role.",
			"selectTeamRole": "Select team role.",
			"send": "Send",
			"sil": "SIL International",
		}
	}),
	"languagePicker": new LocalizedStrings({
		"en": {
			"cancel": "Cancel",
			"codeExplained": "Code Explained",
			"details": "Details",
			"findALanguage": "Find a language by name, code, or country",
			"font": "Font",
			"inScript": " in the $1 script",
			"language": "Language",
			"languageOf": "A Language of $1$2.",
			"phonetic": "Phonetic",
			"script": "Script",
			"select": "Save",
			"selectLanguage": "Choose Language Details",
			"subtags": "Subtags",
		}
	}),
	"main": new LocalizedStrings({
		"en": {
			"about": "About",
			"admin": "Admin",
			"apiError": "API Error:",
			"cancel": "Cancel",
			"cantCopy": "Unable to copy to clipboard",
			"clearCache": "Clear cache",
			"clearLogout": "Log Out and Force Data Reload",
			"continue": "Continue",
			"continueCurrentUser": "Continue as current user",
			"copyClipboard": "Copy Version to Clipboard",
			"crashMessage": "Something went wrong. The developers need to address this issue.",
			"deletedInvitation": "Invitation is no longer valid.",
			"details": "Details",
			"developer": "Developer mode",
			"exit": "Exit",
			"export": "Export",
			"flatSample": "Scripture flat sample spreadsheet",
			"genFlatSample": "General flat sample spreadsheet",
			"genHierarchicalSample": "General hierarchical sample spreadsheet",
			"helpCenter": "Help Center",
			"helpSpreadsheet": "View spreadsheet convention",
			"hierarchicalSample": "Scripture hierarchical sample spreadsheet",
			"import": "Import",
			"integrations": "Integrations",
			"inviteError": "Invitation not accepted.  You must login with the email that the invitation was sent to.",
			"loadingTable": "Busy...please wait.",
			"loadingTranscriber": "Loading {0}",
			"logout": "Log Out",
			"media": "Audio",
			"myAccount": "My Account",
			"NoLoadOffline": "Unable to load audio project data offline.",
			"owner": "Owner",
			"passages": "Passages",
			"project": "Audio Project",
			"projRole": "Role in Audio Project:",
			"reliesOn": "{0} relies on other works",
			"reportIssue": "Report an Issue",
			"reports": "Reports",
			"reportWhenOnline": "You must be online to report an problem.",
			"saveFirst": "Do you want to save before leaving this page?",
			"saving": "Saving...",
			"sessionExpireTask": "Your session will expire in {0} seconds. Would you like to continue?",
			"sessionExpiring": "Session Expiring",
			"settings": "Settings",
			"switchTo": "Switch to:",
			"switchUser": "Switch User",
			"tasks": "Tasks",
			"team": "Team",
			"terms": "Terms of Use",
			"privacy": "Privacy Policy",
			"thanks": "Thanks to",
			"transcribe": "Transcribe",
			"UnsavedData": "Unsaved Data",
			"updateAvailable": "Update available: Version {0} was released {1}",
			"version": "Version: {0} - {1}",
		}
	}),
	"mediaActions": new LocalizedStrings({
		"en": {
			"attach": "Associate",
			"delete": "Delete",
			"detach": "Disassociate",
			"download": "Download",
			"play": "Play",
			"stop": "Stop",
		}
	}),
	"mediaTab": new LocalizedStrings({
		"en": {
			"action": "Action",
			"actions": "Actions",
			"all": "All",
			"alreadyAssociated": "Show Passages Already Associated",
			"associated": "Associated",
			"autoMatch": "Auto Match",
			"availablePassages": "Available Passages",
			"book": "Book",
			"choosePassage": "Choose Passage",
			"date": "Date",
			"delete": "Delete",
			"deleteConfirm": "Delete {0}? Are you sure?",
			"detach": "Detach",
			"duration": "Length (s)",
			"fileAttached": "File already attached",
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
			"versionHistory": "Version History",
			"viewAssociations": "View Associations",
		}
	}),
	"mediaUpload": new LocalizedStrings({
		"en": {
			"addNewType": "Add New Type",
			"artifactType": "Artifact Type",
			"cancel": "Cancel",
			"dragDropMultiple": "Drag and drop files here, or click here to browse for the files.",
			"dragDropSingle": "Drag and drop a file here, or click here to browse for the file.",
			"invalidFile": "Not valid for this operation: {0} ",
			"ITFtask": "Upload an Incremental Transcriber File (itf file) exported from the Desktop app.",
			"ITFtitle": "Upload Change Data from Desktop app.",
			"newArtifactType": "New Artifact Type",
			"PTFtask": "Upload a Portable Transcriber File (ptf).",
			"PTFtitle": "Upload complete Audio Project Data from PTF",
			"task": "You can upload audio files in .mp3, .m4a, .wav or .ogg format.",
			"title": "Upload Audio",
			"upload": "Upload",
		}
	}),
	"newProject": new LocalizedStrings({
		"en": {
			"audioProduct": "Audio Product",
			"blank": "Blank Audio Project",
			"blankFactor1": "Best option if multiple pre-recorded audio files are available",
			"blankFactor2": "Best option if passage list is available in a spreadsheet",
			"blankTip": "All settings are manually chosen.",
			"configure": "Configure",
			"general": "General Transcription",
			"generalFactor1": "Free-form references",
			"generalFactor2": "No Paratext sync expected or allowed",
			"generalTip": "General transcription can cover a wide range of working scenarios and product solutions.",
			"keyFactors": "Key Factors",
			"likeTemplate": "These options present different templates for getting started. Choices made here can be changed in the Edit Audio Project Settings dialog.",
			"newProject": "New Audio Project",
			"other": "Other",
			"paratextIntegration": "Integrated with Paratext",
			"scripture": "Scripture Transcription",
			"scriptureFactor1": "Uses Scripture Referencing: book, chapter, and verse",
			"scriptureFactor2": "Workflow syncs with Paratext for checking",
			"scriptureTip": "The final product may be audio or text and the content type may be translation, stories, drafting or adapation.",
			"startRecording": "Start Recording",
			"textProduct": "Text Product",
			"uploadAudio": "Upload Audio",
		}
	}),
	"passageMedia": new LocalizedStrings({
		"en": {
			"close": "Close",
		}
	}),
	"passageRecord": new LocalizedStrings({
		"en": {
			"cancel": "Cancel",
			"defaultFilename": "MyRecording",
			"fileName": "Name",
			"fileType": "File Type",
			"loadfile": "Load Existing File",
			"loading": "Loading...",
			"save": "Save",
			"title": "Record/Edit Audio",
		}
	}),
	"planActions": new LocalizedStrings({
		"en": {
			"assign": "Assign",
			"delete": "Delete",
			"resources": "Resources",
			"launchAudacity": "Launch Audacity",
			"playpause": "Play/Stop",
			"recordAudio": "Record/Edit Audio",
			"transcribe": "Transcribe",
		}
	}),
	"planSheet": new LocalizedStrings({
		"en": {
			"action": "Action",
			"addPassage": "Add Passage",
			"addSection": "Add {0}",
			"audio": "Audio",
			"bookSelect": "Select Book...",
			"confirm": "{0} {1} Item(s). Are you sure?",
			"nonNumber": "Do not change to non-number.",
			"passageBelow": "Insert passage below {0}",
			"pasting": "Pasting",
			"refErr": "This audio project contains invalid references and will not sync to Paratext properly. (A valid reference would be 3:2-5 or similar.)",
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
			"nameNotEmail": "Please choose a name other than your email address.",
			"next": "Next",
			"notLinked": "Not linked to Paratext",
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
	"projectDownload": new LocalizedStrings({
		"en": {
			"download": "Download?",
			"downloadLater": "Download Later",
			"downloadMb": "Download {0}MB of offline audio project files?",
		}
	}),
	"scriptureTable": new LocalizedStrings({
		"en": {
			"action": "Action",
			"book": "Book",
			"description": "Description",
			"installAudacity": "Install {Audacity} to use this feature.",
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
	"sectionResources": new LocalizedStrings({
		"en": {
			"close": "Close",
			"role": "Role",
			"title": "Assign {0}",
			"users": "Members",
		}
	}),
	"shared": new LocalizedStrings({
		"en": {
			"admin": "Admin",
			"bookNotInParatext": "Passage {0}.{1}: Paratext project does not contain book {2}.",
			"BookNotSet": "Book was not set for Section {0} Passage {1}",
			"cancel": "Cancel",
			"editor": "Editor",
			"expiredParatextToken": "Your paratext login has expired and can't be automatically renewed.  Please log out and login again.",
			"expiredToken": "Your login token has expired and can't be automatically renewed.  Please log out and login again.",
			"fileNotFound": "The audio file has not been downloaded or has been deleted.",
			"importMediaSingular": "Import Audio",
			"invalidParatextLogin": "You must login with a valid paratext login.",
			"invalidReference": "Passage {0}.{1} {2}: Invalid Reference",
			"lastEdit": "Last save {0}",
			"mediaAttached": "Audio Attached",
			"mediaDetached": "Audio Detached",
			"member": "Member",
			"no": "No",
			"NoSaveOffline": "Unable to save while offline.",
			"owner": "Owner",
			"paratextchapterSpan": "Passage {0}.{1} {2}: Passage must not span chapters.",
			"part": "Part {0}",
			"referenceNotFound": "Reference does not exist in Paratext chapter, or reference is within a larger verse range.",
			"save": "Save",
			"transcriber": "Transcriber",
			"uploadMediaPlural": "Upload Audio",
			"uploadMediaSingular": "Upload Audio",
			"yes": "Yes",
		}
	}),
	"spelling": new LocalizedStrings({
		"en": {
			"addToDict": "Add to dictionary",
			"close": "Close",
			"custom": "Custom",
			"dictionaries": "Dictionaries",
			"restart": "To load or unload dictionaries requires this app to be restarted. Loading dictionaries that have not been loaded before will require this device to have a connection to the Internet. Do you want to restart this desktop app now?",
			"restartApp": "Restart",
			"spellingLangs": "Spell Checking Languages",
			"spellingLangsTip": "Choose spell checking languages",
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
			"project": "Audio Project",
			"state": "State",
			"tasks": "Tasks",
			"title": "Title",
			"transcriber": "Transcribe",
			"yes": "Yes",
		}
	}),
	"transcribeAddNote": new LocalizedStrings({
		"en": {
			"addNoteTitle": "Add Note",
			"cancel": "Cancel",
			"save": "Save",
		}
	}),
	"transcriber": new LocalizedStrings({
		"en": {
			"addNote": "Add Note",
			"comment": "Comment",
			"congratulation": "Congratulations",
			"done": "Completed",
			"historyTip": "History [{0}]",
			"incomplete": "Incomplete transcripiton",
			"invalidReference": "Book or Reference is invalid.",
			"needsNewRecording": "Rejected recording",
			"needsNewTranscription": "Rejected transcription",
			"noMedia": "Created task",
			"noMoreTasks": "You have no more tasks to work on!",
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
			"downloadingProject": "Downloading...{0}%",
			"downloadProject": "Download Audio Project",
			"elan": "ELAN",
			"electronBackup": "Back up All Audio Projects",
			"error": "Export Error",
			"export": "Export",
			"exportExplanation": "Export the full audio project to store locally or share with another offline member. Export incremental file to import changes into online app.",
			"exportingProject": "Exporting...{0}%",
			"exportITFtype": "Incremental Changes (itf)",
			"exportProject": "Export Audio Project",
			"exportPTFtype": "Export Audio Project (ptf)",
			"exportTooLarge": "The audio project cannot be exported.  The export file is too large.",
			"exportType": "Which export type?",
			"filter": "Filter",
			"incompletePlan": "Plan is incomplete: attach audio to passages.",
			"passages": "Passages",
			"plan": "Plan",
			"sectionstate": "State",
			"showHideFilter": "Show/Hide filter rows",
			"updated": "Updated",
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
	"userListMode": new LocalizedStrings({
		"en": {
			"logOut": "Log Out",
			"switchUser": "Work Online",
			"workOffline": "Work Offline",
		}
	}),
	"usertable": new LocalizedStrings({
		"en": {
			"action": "Action",
			"addMember": "Add Member",
			"addNewUser": "Add New User",
			"cancel": "Cancel",
			"continue": "Continue",
			"delete": "Delete",
			"email": "Email",
			"filter": "Filter",
			"invite": "Invite",
			"locale": "Locale",
			"name": "Name",
			"phone": "Phone",
			"role": "Team Role",
			"selectRows": "Please select row(s) to {0}.",
			"selectUser": "Select User",
			"showHideFilter": "Show/Hide filter rows",
			"timezone": "Timezone",
		}
	}),
	"viewMode": new LocalizedStrings({
		"en": {
			"audioProject": "Audio Project",
			"transcribe": "Transcribe",
		}
	}),
	"vProject": new LocalizedStrings({
		"en": {
			"add": "Add",
			"advanced": "Advanced",
			"backtranslation": "Back Translation",
			"cancel": "Cancel",
			"configure": "Configure",
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
			"newProject": "{0} Audio Project Settings",
			"organizedBy": "Term for organizing layout",
			"other": "Other",
			"pericopes": "Pericope/Pericopes",
			"preview": "Preview",
			"projectName": "Audio Project Name",
			"renderCustomize": "including Render customization",
			"renderRecommended": "Recommended for Render",
			"rightToLeft": "Right-to-Left",
			"save": "Save",
			"scenes": "Scene/Scenes",
			"sections": "Section/Sections",
			"sets": "Set/Sets",
			"spellCheck": "Spell Check",
			"stories": "Story/Stories",
			"tags": "Tags",
			"testing": "Testing",
			"training": "Training",
			"type": "Audio Project Type",
		}
	}),
	"welcome": new LocalizedStrings({
		"en": {
			"alone": "Work Alone",
			"aloneFactor": "Audio Projects cannot be changed to team audio projects later",
			"import": "Import Audio Project",
			"keyFactor": "Key Factor(s)",
			"offline": "Work Offline",
			"online": "Work Online",
			"quickFamily": "User",
			"quickGiven": "Initial",
			"quickName": "Initial User",
			"setupFactor": "Requires Internet connection",
			"setupFactor2": "Supports audio projects that are offline available",
			"setupFactor2Help": "Select the Offline Available option on the audio project card menu.",
			"setupTeam": "Set up a team audio project",
			"setupTeamTip": "Set up the audio project, dividing work into passages that can be assigned to various transcribers and editors.  Transcribers and editors can work online or offline by downloading or importing the audio project.",
			"team": "Work in a team audio project",
			"teamFactor": "Audio Project has been set up online",
			"teamTip": "A audio project has been set up online.  Transcribers and editors can work online, offline by selecting the Offline Available option on the audio project card menu, or offline by importing it.",
			"title": "Getting Started",
		}
	}),
	"wsAudioPlayer": new LocalizedStrings({
		"en": {
			"aheadTip": "Ahead {jump} {1} [{0}]",
			"backTip": "Rewind {jump} {1} [{0}]",
			"beginningTip": "Go to Beginning [{0}]",
			"prevRegion": "Previous Region [{0}]",
			"nextRegion": "Next Region [{0}]",
			"deleteRecording": "Delete Entire Recording",
			"deleteRegion": "Delete Region",
			"endTip": "Go to End [{0}]",
			"fasterTip": "Faster [{0}]",
			"insertoverwrite": "Insert/Overwrite",
			"loopoff": "Loop Off",
			"loopon": "Loop On",
			"pauseRecord": "Pause",
			"pauseTip": "Pause [{0}]",
			"playTip": "Play [{0}]",
			"record": "Record [{0}]",
			"resume": "Resume",
			"seconds": "seconds",
			"silence": "Silence",
			"slowerTip": "Slower [{0}]",
			"stop": "Stop [{0}]",
			"timerTip": "Timestamp [{0}]",
			"undoTip": "Undo",
		}
	}),
	"wsAudioPlayerSegment": new LocalizedStrings({
		"en": {
			"apply": "Apply",
			"autoSegment": "Auto Segment [{0}]",
			"close": "Close",
			"removeAll": "Clear Segments",
			"removeSegment": "Remove Next Boundary [{0}]",
			"segmentsCreated": "{0} segments created",
			"segmentLength": "Minimum Segment Length (sec)",
			"segmentNumber": "{0} segments",
			"segmentSettings": "Auto Segment Parameters",
			"silenceLength": "Minimum Length of Silence (100ths second)",
			"silenceThreshold": "Silence Threshold (1000th dB)",
			"splitSegment": "Add/Remove Boundary [Double Click/{0}]",
		}
	}),
	"wsAudioPlayerZoom": new LocalizedStrings({
		"en": {
			"fitToWidth": "Fit to Width",
			"zoomIn": "Zoom In [{0}]",
			"zoomOut": "Zoom Out [{0}]",
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
				"artifactType" : new LocalizedStrings(action.payload.data.artifactType),
				"assignmentTable" : new LocalizedStrings(action.payload.data.assignmentTable),
				"assignSection" : new LocalizedStrings(action.payload.data.assignSection),
				"audacityManager" : new LocalizedStrings(action.payload.data.audacityManager),
				"audioDownload" : new LocalizedStrings(action.payload.data.audioDownload),
				"cards" : new LocalizedStrings(action.payload.data.cards),
				"control" : new LocalizedStrings(action.payload.data.control),
				"deleteExpansion" : new LocalizedStrings(action.payload.data.deleteExpansion),
				"electronImport" : new LocalizedStrings(action.payload.data.electronImport),
				"emailUnverified" : new LocalizedStrings(action.payload.data.emailUnverified),
				"grid" : new LocalizedStrings(action.payload.data.grid),
				"groupSettings" : new LocalizedStrings(action.payload.data.groupSettings),
				"groupTabs" : new LocalizedStrings(action.payload.data.groupTabs),
				"hotKey" : new LocalizedStrings(action.payload.data.hotKey),
				"import" : new LocalizedStrings(action.payload.data.import),
				"integration" : new LocalizedStrings(action.payload.data.integration),
				"invitationTable" : new LocalizedStrings(action.payload.data.invitationTable),
				"invite" : new LocalizedStrings(action.payload.data.invite),
				"languagePicker" : new LocalizedStrings(action.payload.data.languagePicker),
				"main" : new LocalizedStrings(action.payload.data.main),
				"mediaActions" : new LocalizedStrings(action.payload.data.mediaActions),
				"mediaTab" : new LocalizedStrings(action.payload.data.mediaTab),
				"mediaUpload" : new LocalizedStrings(action.payload.data.mediaUpload),
				"newProject" : new LocalizedStrings(action.payload.data.newProject),
				"passageMedia" : new LocalizedStrings(action.payload.data.passageMedia),
				"passageRecord" : new LocalizedStrings(action.payload.data.passageRecord),
				"planActions" : new LocalizedStrings(action.payload.data.planActions),
				"planSheet" : new LocalizedStrings(action.payload.data.planSheet),
				"planTabs" : new LocalizedStrings(action.payload.data.planTabs),
				"profile" : new LocalizedStrings(action.payload.data.profile),
				"projButtons" : new LocalizedStrings(action.payload.data.projButtons),
				"projectDownload" : new LocalizedStrings(action.payload.data.projectDownload),
				"scriptureTable" : new LocalizedStrings(action.payload.data.scriptureTable),
				"sectionResources" : new LocalizedStrings(action.payload.data.sectionResources),
				"shared" : new LocalizedStrings(action.payload.data.shared),
				"spelling" : new LocalizedStrings(action.payload.data.spelling),
				"taskItem" : new LocalizedStrings(action.payload.data.taskItem),
				"template" : new LocalizedStrings(action.payload.data.template),
				"toDoTable" : new LocalizedStrings(action.payload.data.toDoTable),
				"transcribeAddNote" : new LocalizedStrings(action.payload.data.transcribeAddNote),
				"transcriber" : new LocalizedStrings(action.payload.data.transcriber),
				"transcribeReject" : new LocalizedStrings(action.payload.data.transcribeReject),
				"transcriptionShow" : new LocalizedStrings(action.payload.data.transcriptionShow),
				"transcriptionTab" : new LocalizedStrings(action.payload.data.transcriptionTab),
				"treeChart" : new LocalizedStrings(action.payload.data.treeChart),
				"uploadProgress" : new LocalizedStrings(action.payload.data.uploadProgress),
				"userListMode" : new LocalizedStrings(action.payload.data.userListMode),
				"usertable" : new LocalizedStrings(action.payload.data.usertable),
				"viewMode" : new LocalizedStrings(action.payload.data.viewMode),
				"vProject" : new LocalizedStrings(action.payload.data.vProject),
				"welcome" : new LocalizedStrings(action.payload.data.welcome),
				"wsAudioPlayer" : new LocalizedStrings(action.payload.data.wsAudioPlayer),
				"wsAudioPlayerSegment" : new LocalizedStrings(action.payload.data.wsAudioPlayerSegment),
				"wsAudioPlayerZoom" : new LocalizedStrings(action.payload.data.wsAudioPlayerZoom),
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
