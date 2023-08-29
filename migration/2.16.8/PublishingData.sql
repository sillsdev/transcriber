alter table passages add sharedresourceid int null;  --link to note

alter table passages add startchapter int generated always as 
	(cast(substring(reference from '(\d{1,})\:') as int)) stored;
alter table passages add endchapter int generated always as 
	(cast(coalesce(substring(reference from '\d{1,}\:.*?(\d{1,})\:') ,  substring(reference from '(\d{1,})\:')) as int)) stored;
alter table passages add startverse int generated always as 
	(cast(substring(reference from '.:(\d{1,})-?') as int)) stored;
alter table passages add endverse int generated always as 
	(cast(case coalesce(substring(reference from '\d{1,}\:.*?(\d{1,})\:'),'') 
	when '' then substring(reference from '.-(\d{1,})-?') 
	else coalesce(substring(reference from '\d{1,}\:.*?\d{1,}\:(\d{1,})'), substring(reference from '.:(\d{1,})-?'))
end as int)) stored;

-- select * from passages where orgworkflowstepid is not null

-- note needs a link
-- note needs a title
-- note needs a artifacttype
-- note needs a graphic (use artifact type default if none )

alter table sharedresources add note bool default false;
alter table sharedresources add titlemediafileid int;
alter table sharedresources add linkurl text; -- optional link to survey, more info, etc
ALTER TABLE sharedresources ADD CONSTRAINT fk_sharedresources_mediafile FOREIGN KEY (titlemediafileid) REFERENCES mediafiles(id) ON DELETE CASCADE;
CREATE INDEX ix_sharedresources_note ON public.sharedresources USING btree (note, artifactcategoryid, title);
CREATE INDEX ix_sharedresources_language ON public.sharedresources USING btree (languagebcp47);

alter table artifactcategorys add titlemediafileid int;
ALTER TABLE artifactcategorys ADD CONSTRAINT fk_artifactcategorys_mediafile FOREIGN KEY (titlemediafileid) REFERENCES mediafiles(id) ON DELETE CASCADE;

--select * from passagetypes;
--delete from passagetypes;
--sections will have recordings of the title and this will be a special section title
--but we may want it to have it's own because of the usfm...so I'm going to put it in for now
INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder,datecreated, dateupdated,lastmodifiedby,lastmodifiedorigin)
VALUES('toc1', 'altbookname', 'BKALT', -4
,current_timestamp at time zone 'utc', current_timestamp at time zone 'utc',(select id from users where email = 'sara_hentzel@sil.org'), 'setup');

--select * from passagetypes
INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder,datecreated, dateupdated,lastmodifiedby,lastmodifiedorigin)
VALUES('toc2', 'shortbookname', 'BOOK', -3,current_timestamp at time zone 'utc', current_timestamp at time zone 'utc',(select id from users where email = 'sara_hentzel@sil.org'), 'setup');


INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder,datecreated, dateupdated,lastmodifiedby,lastmodifiedorigin)
VALUES('esb', 'audionote', 'NOTE', -1,current_timestamp at time zone 'utc', current_timestamp at time zone 'utc',(select id from users where email = 'sara_hentzel@sil.org'), 'setup');

INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder,datecreated, dateupdated,lastmodifiedby,lastmodifiedorigin)
VALUES('cn', 'chapternumber', 'CHNUM', 1,current_timestamp at time zone 'utc', current_timestamp at time zone 'utc',(select id from users where email = 'sara_hentzel@sil.org'), 'setup');

--will this be a passage 0 or will it be directly in the section
--start with it as a passage and see if that works
INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder,datecreated, dateupdated,lastmodifiedby,lastmodifiedorigin)
VALUES('s', 'title', 'TITLE', 1,current_timestamp at time zone 'utc', current_timestamp at time zone 'utc',(select id from users where email = 'sara_hentzel@sil.org'), 'setup');
DROP INDEX passagetype_usfm_idx;
CREATE INDEX passagetype_usfm_idx ON public.passagetypes USING btree (usfm);

--drop table graphics;
CREATE TABLE graphics (
	id serial PRIMARY KEY,
	organizationid int not null,
	resourcetype text NOT NULL,
	resourceid int NOT NULL,
	info jsonb DEFAULT '{}',
	datecreated timestamp,
	dateupdated timestamp,
	lastmodifiedby int,
	lastmodifiedorigin text
);
CREATE unique INDEX idx_graphics_resource ON public.graphics (organizationid, resourcetype, resourceid);
grant all on graphics to transcriber;
grant all on public.graphics_id_seq to transcriber;


alter table sections add published bool default false;
alter table sections add level int default 2;

alter table organizations add publishingdata jsonb default '{}';
alter table organizations add bibleid text; --ENGCSV
alter table organizations add iso text;
alter table organizations add isomediafileid int;
alter table organizations add biblemediafileid int;


CREATE INDEX ix_organizations_bibleid ON public.organizations USING btree (bibleid);
CREATE INDEX ix_organizations_iso ON public.organizations USING btree (iso);
ALTER TABLE organizations ADD CONSTRAINT fk_organizations_biblemediafile FOREIGN KEY (biblemediafileid) REFERENCES mediafiles(id) ON DELETE CASCADE;
ALTER TABLE organizations ADD CONSTRAINT fk_organizations_isomediafile FOREIGN KEY (isomediafileid) REFERENCES mediafiles(id) ON DELETE CASCADE;


--there are no default artifact categories for notes
--delete from artifactcategorys a where note = true;


--note TYPE:
--book friendly name  >> passage type
-- chapter number >> passage type  
/* DON'T NEED THESE 
INSERT INTO public.artifactcategorys
(organizationid, categoryname, datecreated, dateupdated, lastmodifiedby, lastmodifiedorigin, discussion, resource, note, archived)
VALUES(null, 'chapternumber', current_timestamp at time zone 'utc', current_timestamp at time zone 'utc', (select id from users where email = 'sara_hentzel@sil.org'), 'setup'::text, false, false, true, false);
INSERT INTO public.artifactcategorys
(organizationid, categoryname, datecreated, dateupdated, lastmodifiedby, lastmodifiedorigin, discussion, resource, note, archived)
VALUES(null, 'generalnote', current_timestamp at time zone 'utc', current_timestamp at time zone 'utc', (select id from users where email = 'sara_hentzel@sil.org'), 'setup'::text, false, false, true, false);
INSERT INTO public.artifactcategorys
(organizationid, categoryname, datecreated, dateupdated, lastmodifiedby, lastmodifiedorigin, discussion, resource, note, archived)
VALUES(null, 'introductoryparagraph', current_timestamp at time zone 'utc', current_timestamp at time zone 'utc', (select id from users where email = 'sara_hentzel@sil.org'), 'setup'::text, false, false, true, false);
*/