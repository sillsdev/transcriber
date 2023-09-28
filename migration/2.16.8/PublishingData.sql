--drop views so we can change sequencenum types
drop VIEW public.vwpassagestatehistoryemails;
drop view public.vw_projects;
drop view resources;
drop view vw_userdata;
alter table passages alter column sequencenum type numeric(6,2);
alter table sections alter column sequencenum type numeric(6,2);
alter table sections add titlemediafileid int;
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
ALTER TABLE sharedresources ADD CONSTRAINT fk_sharedresources_mediafile FOREIGN KEY (titlemediafileid) REFERENCES mediafiles(id) ON DELETE set NULL;
ALTER TABLE sharedresources ADD CONSTRAINT fk_sharedresources_artifactcategory FOREIGN KEY (artifactcategoryid) REFERENCES artifactcategorys(id) ON DELETE set NULL;
CREATE INDEX ix_sharedresources_note ON public.sharedresources USING btree (note, artifactcategoryid, title);
CREATE INDEX ix_sharedresources_language ON public.sharedresources USING btree (languagebcp47);

alter table artifactcategorys add titlemediafileid int;
ALTER TABLE artifactcategorys ADD CONSTRAINT fk_artifactcategorys_mediafile FOREIGN KEY (titlemediafileid) REFERENCES mediafiles(id) ON DELETE set NULL;

--select * from passagetypes;
--delete from passagetypes;
--sections will have recordings of the title and this will be a special section title
--but we may want it to have it's own because of the usfm...so I'm going to put it in for now

--select * from passagetypes
INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder,datecreated, dateupdated,lastmodifiedby,lastmodifiedorigin)
VALUES('toc1', 'bookname', 'BOOK', -4,current_timestamp at time zone 'utc', current_timestamp at time zone 'utc',(select id from users where email = 'sara_hentzel@sil.org'), 'setup');

INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder,datecreated, dateupdated,lastmodifiedby,lastmodifiedorigin)
VALUES('toc2', 'altbookname', 'ALTBK', -3
,current_timestamp at time zone 'utc', current_timestamp at time zone 'utc',(select id from users where email = 'sara_hentzel@sil.org'), 'setup');


INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder,datecreated, dateupdated,lastmodifiedby,lastmodifiedorigin)
VALUES('esb', 'audionote', 'NOTE', 0,current_timestamp at time zone 'utc', current_timestamp at time zone 'utc',(select id from users where email = 'sara_hentzel@sil.org'), 'setup');

INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder,datecreated, dateupdated,lastmodifiedby,lastmodifiedorigin)
VALUES('cn', 'chapternumber', 'CHNUM', -2,current_timestamp at time zone 'utc', current_timestamp at time zone 'utc',(select id from users where email = 'sara_hentzel@sil.org'), 'setup');

--will this be a passage 0 or will it be directly in the section
--start with it as a passage and see if that works
INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder,datecreated, dateupdated,lastmodifiedby,lastmodifiedorigin)
VALUES('s', 'title', 'TITLE', -1,current_timestamp at time zone 'utc', current_timestamp at time zone 'utc',(select id from users where email = 'sara_hentzel@sil.org'), 'setup');
DROP INDEX passagetype_usfm_idx;
CREATE INDEX passagetype_usfm_idx ON public.passagetypes USING btree (usfm);

--drop table graphics;
CREATE TABLE graphics (
	id serial PRIMARY KEY,
	organizationid int not null,
	resourcetype text NOT NULL,
	resourceid int NOT NULL,
	mediafileid int not null,
	info jsonb DEFAULT '{}',
	datecreated timestamp,
	dateupdated timestamp,
	lastmodifiedby int,
	lastmodifiedorigin text,
	archived bool
);
CREATE unique INDEX idx_graphics_resource ON public.graphics (organizationid, resourcetype, resourceid);
create trigger archivetrigger after
update
    on
    public.graphics for each row execute function archive_trigger();

grant all on graphics to transcriber;
grant all on public.graphics_id_seq to transcriber;


alter table sections add published bool default false;
alter table sections add level int default 3;

alter table organizations add publishingdata jsonb default '{}';
alter table organizations add bibleid text; --ENGCSV
alter table organizations add iso text;
alter table organizations add isomediafileid int;
alter table organizations add biblemediafileid int;
alter table organizations add anypublished bool default false;

CREATE OR REPLACE FUNCTION public.publish_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
	org record;
	myorg cursor
		for
		SELECT *
		FROM public.organizations
		where id = (select organizationid from projects p inner join plans pl on pl.projectid = p.id where pl.id = new.planid)
		for UPDATE;
begin
	RAISE NOTICE 'here %', new.id;

    if new.published = true AND new.published != old.published then
		open myorg;
		loop --just so the exit works
		 	fetch myorg into org;
				exit when not found;
			if (org.anypublished = false) then
			RAISE NOTICE 'update %', new.id;
				update organizations
				set anypublished = true,
					dateupdated=current_timestamp,
					lastmodifiedorigin='publish'
					where current of myorg;

		 	end if;
		 	exit; -- just wanted to do the first one
	 	end loop;
	 	close myorg;
	 end if;
	 return new;
end;
$function$
;


create trigger publishtrigger after
update
    on
    public.sections for each row execute function publish_trigger();

CREATE INDEX ix_organizations_bibleid ON public.organizations USING btree (bibleid);
CREATE INDEX ix_organizations_iso ON public.organizations USING btree (iso);
ALTER TABLE organizations ADD CONSTRAINT fk_organizations_biblemediafile FOREIGN KEY (biblemediafileid) REFERENCES mediafiles(id) ON DELETE CASCADE;
ALTER TABLE organizations ADD CONSTRAINT fk_organizations_isomediafile FOREIGN KEY (isomediafileid) REFERENCES mediafiles(id) ON DELETE CASCADE;

select * from artifacttypes a
INSERT INTO public.artifacttypes
(organizationid, typename, datecreated, dateupdated, lastmodifiedby, archived, lastmodifiedorigin)
VALUES(null, 'title', current_timestamp at time zone 'utc', current_timestamp at time zone 'utc',null, false, 'setup'::text);
INSERT INTO public.artifacttypes
(organizationid, typename, datecreated, dateupdated, lastmodifiedby, archived, lastmodifiedorigin)
VALUES(null, 'graphic', current_timestamp at time zone 'utc', current_timestamp at time zone 'utc',null, false, 'setup'::text);
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
