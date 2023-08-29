--drop table passagetypes cascade;
create table passagetypes (
	id serial primary key,
	usfm  varchar not null,
	title varchar,
	abbrev varchar not null,
	defaultorder int,
	datecreated timestamp,
	dateupdated timestamp,
	lastmodifiedby int,
	lastmodifiedorigin text
	);
CREATE UNIQUE INDEX passagetype_abbrev_idx ON public.passagetypes (abbrev);
grant all on passagetypes to transcriber;
grant all on public.passagetypes_id_seq to transcriber;

--drop table passagenotes cascade;
create table passagenotes (
	id serial primary key,
	passageid int not null,
	notesectionid int not null,
	datecreated timestamp,
	dateupdated timestamp,
	lastmodifiedby int,
	lastmodifiedorigin text,
	archived bool default false
);
CREATE INDEX idx_passagenote_passage ON public.passagenotes (passageid);
ALTER TABLE passagenotes ADD CONSTRAINT fk_passagenote_passage FOREIGN KEY (passageid) REFERENCES passages(id) ON DELETE CASCADE;
ALTER TABLE passagenotes ADD CONSTRAINT fk_passagenote_note FOREIGN KEY (notesectionid) REFERENCES sections(id) ON DELETE CASCADE;
grant all on passagenotes to transcriber;
grant all on public.passagenotes_id_seq to transcriber;

delete from passagetypes;
INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder)
VALUES('toc1', 'longbookname', 'BKLNG', -4);
INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder)
VALUES('toc2', 'shortbookname', 'BK', -4);

INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder)
VALUES('s', 'title', 'TI', -2);
INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder)
VALUES('esb', 'audionote', 'IP', -1);
INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder)
VALUES('cn', 'chapternumber', 'CN', 1);


alter table passages add passagetypeid int;
ALTER TABLE passages ADD CONSTRAINT fk_passages_passagetype FOREIGN KEY (passagetypeid) REFERENCES passagetypes(id) ON DELETE SET NULL;


alter table sections add graphics jsonb default '{}';
alter table sections add published bool default false;
alter table sections add level int default 2;
alter table sections add artifactcategoryid int;
alter table sections add constraint fk_sections_artifactcategory foreign key (artifactcategoryid) references artifactcategorys(id) on delete set null;

alter table organizations add publishingdata jsonb default '{}';
alter table organizations add noteprojectid int;

ALTER TABLE public.organizations ADD CONSTRAINT fk_organizations_noteprojectid FOREIGN KEY (noteprojectid) REFERENCES projects(id) ON DELETE SET NULL;


alter table artifactcategorys add note bool default false;
alter table artifactcategorys add graphics jsonb default '{}';
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
