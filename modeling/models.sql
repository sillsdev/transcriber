CREATE TYPE textdirection enum AS ('ltr', 'rtl);

CREATE TABLE project (
    id                      uuid NOT NULL DEFAULT uuid_generate_v4(),
    remoteid                uuid,
    name                    varchar(40),
    paratextshortname       varchar(40),
    paratextguid            varchar(40),
    languagebcp47           varchar(40),
    languagename            varchar(40),
    defaultfontfamily       varchar(40),
    fontfeatures            varchar(40),
    defaultfontsize         char(10) REFERENCES fontsizevalues(value),
    textdirection           textdirection,
    autosync                boolean,
    allowclaiming           boolean,
    projecttype             char(10) REFERENCES projecttypevalues(value),
    destination             char(10) REFERENCES destinationtypevalues(value)
);
CREATE TABLE projectset (
    project                 uuid,
    set                     uuid,
    PRIMARY KEY (project, set)
);
CREATE TABLE projectuser (
    project                 uuid,
    user                    uuid,
    PRIMARY KEY (project, user)
);
CREATE TABLE set (
    id                      uuid NOT NULL DEFAULT uuid_generate_v4(),
    remoteid                uuid,
    book                    integer CHECK (book > 0),
    index                   integer,
    settitle                varchar(40)
);
CREATE TABLE settask (
    set                     uuid,
    task                    uuid,
    PRIMARY KEY (set, task)
);
CREATE TABLE task (
    id                      uuid NOT NULL DEFAULT uuid_generate_v4(),
    remoteid                uuid,
    reference               varchar(40),
    book                    integer CHECK (book > 0),
    position                integer,
    state                   char(10) REFERENCES statevalues(value),
    hold                    boolean,
    title                   varchar(40),
    set                     uuid REFERENCES set (id),
    assignedto              uuid REFERENCES user (id),
    lasttranscriber         uuid REFERENCES user (id),
    lastreviewer            uuid REFERENCES user (id)
);
CREATE TABLE taskevent (
    task                    uuid,
    event                   uuid,
    PRIMARY KEY (task, event)
);
CREATE TABLE taskmedia (
    task                    uuid,
    media                   uuid,
    PRIMARY KEY (task, media)
);
CREATE TABLE media (
    id                      uuid NOT NULL DEFAULT uuid_generate_v4(),
    remoteid                uuid,
    number                  integer CHECK (number > 0),
    textquality             char(10) REFERENCES textqualityvalues(value),
    audioquality            char(10) REFERENCES audioqualityvalues(value),
    duration                integer,
    transcription           varchar(40),
    eafurl                  varchar(100),
    audiourl                varchar(100),
    task                    uuid REFERENCES task (id)
);
CREATE TABLE event (
    id                      uuid NOT NULL DEFAULT uuid_generate_v4(),
    remoteid                uuid,
    historyentry            integer CHECK (historyEntry > 0),
    datetime                timestamp,
    action                  char(10) REFERENCES eventactionvalues(value),
    comment                 varchar(40),
    set                     uuid REFERENCES set (id),
    assigneduser            uuid REFERENCES user (id),
    agent                   uuid REFERENCES user (id)
);
CREATE TABLE book (
    id                      uuid NOT NULL DEFAULT uuid_generate_v4(),
    remoteid                uuid,
    shortname               varchar(40),
    abbr                    varchar(40),
    longname                varchar(40),
    index                   integer CHECK (index >= 0),
    booktype                varchar(10) REFERENCES booktypevalues(value)
);
CREATE TABLE bookset (
    book                    uuid,
    set                     uuid,
    PRIMARY KEY (book, set)
);
CREATE TABLE user (
    id                      uuid NOT NULL DEFAULT uuid_generate_v4(),
    remoteid                uuid,
    userid                  varchar(40) UNIQUE,
    fullname                varchar(40),
    identitytoken           varchar(40),
    uilanguagebcp47         varchar(40),
    timer                   char(10) REFERENCES timervalues(value),
    playbackspeed           integer CHECK (playBackSpeed >= 25 and playBackSpeed <= 200),
    progressbartype         char(10) REFERENCES progressbarvalues(value),
    knownlanguages          varchar(40),
    avatarurl               varchar(100),
    lasttranscriberproject  uuid REFERENCES project (id),
    lasttask                uuid REFERENCES task (id),
    assignedsets            uuid REFERENCES set (id)
);
CREATE TABLE userhotkey (
    user                    uuid,
	hotkeytype              char(10) REFERENCES hotkeyvalues(value),
	keycode                 char(10),
	PRIMARY KEY (user, hotkeytype)
);
CREATE TABLE usersetting (
    user                    uuid,
    setting                 uuid,
    PRIMARY KEY (user, setting)
);
CREATE TABLE userproject (
    id                      uuid NOT NULL DEFAULT uuid_generate_v4(),
    remoteid                uuid,
    role                    char(10) REFERENCES rolevalues(value),
    fontfamily              varchar(40),
    fontfeatures            varchar(40),
    fontsize                char(10) REFERENCES fontsizevalues(value),
    user                    uuid REFERENCES user (id),
    project                 uuid REFERENCES project (id)
);
CREATE TABLE rolevalues (
    value                   varchar(10) PRIMARY KEY
);
CREATE TABLE fontsizevalues (
    value                   varchar(10) PRIMARY KEY
);
CREATE TABLE booktypevalues (
    value                   varchar(10) PRIMARY KEY
);
CREATE TABLE projecttypevalues (
    value                   varchar(10) PRIMARY KEY
);
CREATE TABLE destinationvalues (
    value                   varchar(10) PRIMARY KEY
);
CREATE TABLE statevalues (
    value                   varchar(10) PRIMARY KEY
);
CREATE TABLE textqualitvalues (
    value                   varchar(10) PRIMARY KEY
);
CREATE TABLE audioqualitvalues (
    value                   varchar(10) PRIMARY KEY
);
CREATE TABLE eventactionvalues (
    value                   varchar(10) PRIMARY KEY
);
CREATE TABLE timervalues (
    value                   varchar(10) PRIMARY KEY
);
CREATE TABLE hotkeyvalues (
    value                   varchar(10) PRIMARY KEY
);
