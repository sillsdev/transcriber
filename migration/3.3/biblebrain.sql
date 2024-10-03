drop table biblebrainbibles;
create table biblebrainbibles (
	id serial,
    iso text,
    languagename  text, --language
    languageid int,
    biblename text, --name
    shortname text, 
    bibleid text, -- abbr
    --population text,
    --country text,
    --videodate date,
    pubdate date,
    datecreated timestamp,
    dateupdated timestamp,
    lastmodifiedby int,
    lastmodifiedorigin text,
    	CONSTRAINT biblebrainbibles_pk PRIMARY KEY (id)
);
grant all on biblebrainbibles to transcriber;
grant all on biblebrainbibles_id_seq to transcriber;

drop table biblebrainfilesets;
create table biblebrainfilesets (
	id serial,
	bibleid text,
	filesetid text, --id
	mediatype text, --type
	filesetsize text, -- NT, OT, ??
	licensor text,
	timing boolean,
	codec text,  --mp3, opus
	container text, --mp3, webm,
	bitrate text,
    datecreated timestamp,
    dateupdated timestamp,
    lastmodifiedby int,
    lastmodifiedorigin text,
    	CONSTRAINT biblebrainfilesets_pk PRIMARY KEY (id)
	);
	grant all on biblebrainfilesets to transcriber;
	grant all on biblebrainfilesets_id_seq to transcriber;
	CREATE UNIQUE INDEX biblebrainfilesets_filesetid_idx ON public.biblebrainfilesets (filesetid);

drop view vwbiblebrainlanguages;
create view vwbiblebrainlanguages as (
	select distinct iso, languagename from biblebrainbibles 
);
grant all on vwbiblebrainlanguages to transcriber;
select count(*) from vwbiblebrainlanguages;
	
drop view vwbiblebrainbibles;
create view vwbiblebrainbibles as (
	select distinct iso, b.bibleid, filesetsize, timing from biblebrainbibles b inner join biblebrainfilesets f on f.bibleid = b.bibleid 
);
grant all on vwbiblebrainbibles to transcriber;

select count(*) from biblebrainfilesets b where bibleid is null
select count(*) from biblebrainbibles b 
select distinct filesetsize from biblebrainfilesets b2 

select distinct iso, languagename, filesetsize, timing from biblebrainbibles b inner join biblebrainfilesets f on f.bibleid = b.bibleid where timing = true order by 1



