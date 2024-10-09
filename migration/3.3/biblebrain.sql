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
    pubdate text,
    datecreated timestamp,
    dateupdated timestamp,
    lastmodifiedby int,
    lastmodifiedorigin text,
    	CONSTRAINT biblebrainbibles_pk1 PRIMARY KEY (id)
);
grant all on biblebrainbibles to transcriber;
grant all on biblebrainbibles_id_seq1 to transcriber;

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
-- public.vwbiblebrainlanguages source

CREATE OR REPLACE VIEW public.vwbiblebrainlanguages
AS 
WITH filesets AS (
         SELECT DISTINCT iso, languagename, f_1.timing,
                CASE f_1.filesetsize
                    WHEN 'NT'::text THEN true
                    ELSE false
                END AS nt,
                CASE f_1.filesetsize
                    WHEN 'OT'::text THEN true
                    ELSE false
                END AS ot
           FROM biblebrainfilesets f_1 inner join biblebrainbibles b on f_1.bibleid = b.bibleid
          WHERE f_1.filesetsize = ANY (ARRAY['OT'::text, 'NT'::text])
        ),
 languages as (
 SELECT DISTINCT b.iso,
    b.languagename,
        CASE ( SELECT count(*) AS count
               FROM filesets
              WHERE filesets.iso = b.iso and filesets.languagename = b.languagename AND filesets.nt = true)
            WHEN 0 THEN false
            ELSE true
        END AS nt,
        CASE ( SELECT count(*) AS count
               FROM filesets
              WHERE filesets.iso = b.iso and filesets.languagename = b.languagename AND filesets.ot = true)
            WHEN 0 THEN false
            ELSE true
        END AS ot,
        CASE ( SELECT count(*) AS count
               FROM filesets
              WHERE filesets.iso = b.iso and filesets.languagename = b.languagename AND filesets.nt = true AND filesets.timing = true)
            WHEN 0 THEN false
            ELSE true
        END AS nttiming,
        CASE ( SELECT count(*) AS count
               FROM filesets
              WHERE filesets.iso = b.iso and filesets.languagename = b.languagename AND filesets.ot = true AND filesets.timing = true)
            WHEN 0 THEN false
            ELSE true
        END AS ottiming
   	FROM biblebrainbibles b
   ) select *, 
    row_number() OVER (ORDER BY iso DESC) AS id
    from languages

grant all on vwbiblebrainlanguages to transcriber;
--select * from vwbiblebrainlanguages where iso = 'eng';
	
drop view vwbiblebrainbibles;
-- public.vwbiblebrainbibles source

CREATE OR REPLACE VIEW public.vwbiblebrainbibles AS 
WITH filesets AS (
         SELECT DISTINCT f_1.bibleid,
            f_1.timing,
                CASE f_1.filesetsize
                    WHEN 'NT'::text THEN true
                    ELSE false
                END AS nt,
                CASE f_1.filesetsize
                    WHEN 'OT'::text THEN true
                    ELSE false
                END AS ot
           FROM biblebrainfilesets f_1
          WHERE f_1.filesetsize = ANY (ARRAY['OT'::text, 'NT'::text])
        ),
 bibles as (
 SELECT DISTINCT b.iso, b.languagename,
    b.bibleid,
    b.biblename,
    COALESCE(b.pubdate, ''::text) AS pubdate,
        CASE ( SELECT count(*) AS count
               FROM filesets
              WHERE filesets.bibleid = b.bibleid AND filesets.nt = true)
            WHEN 0 THEN false
            ELSE true
        END AS nt,
        CASE ( SELECT count(*) AS count
               FROM filesets
              WHERE filesets.bibleid = b.bibleid AND filesets.ot = true)
            WHEN 0 THEN false
            ELSE true
        END AS ot,
        CASE ( SELECT count(*) AS count
               FROM filesets
              WHERE filesets.bibleid = b.bibleid AND filesets.nt = true AND filesets.timing = true)
            WHEN 0 THEN false
            ELSE true
        END AS nttiming,
        CASE ( SELECT count(*) AS count
               FROM filesets
              WHERE filesets.bibleid = b.bibleid AND filesets.ot = true AND filesets.timing = true)
            WHEN 0 THEN false
            ELSE true
        END AS ottiming
   FROM biblebrainbibles b
   )
   select distinct *,
   row_number() OVER (ORDER BY bibleid DESC) AS id
   from bibles ;
  
grant all on vwbiblebrainbibles to transcriber;

