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
CREATE UNIQUE INDEX passagetype_usfm_idx ON public.passagetypes (usfm);
CREATE UNIQUE INDEX passagetype_abbrev_idx ON public.passagetypes (abbrev);
grant all on passagetypes to transcriber;

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

INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder)
VALUES('toc1', 'Book name: Long table of contents text', 'BKLNG', -4);
INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder)
VALUES('toc2', 'Book name: Short table of contents text', 'BK', -4);
INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder)
VALUES('ms', 'Movement', 'MV', -3);
INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder)
VALUES('s', 'Section Header', 'SH', -2);
INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder)
VALUES('ip', 'Introductory Paragraph', 'IP', -1);
INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder)
VALUES('w', 'Short note link', 'GL', 1);
INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder)
VALUES('f', 'Footnote','FN', 2);
INSERT INTO public.passagetypes
(usfm, title, abbrev, defaultorder)
VALUES('esb', 'Audio Note', 'AN', 3);

alter table passages add passagetypeid int;
ALTER TABLE passages ADD CONSTRAINT fk_passages_passagetype FOREIGN KEY (passagetypeid) REFERENCES passagetypes(id) ON DELETE SET NULL;


alter table sections add graphics jsonb default '{}';
alter table sections add published bool default false;

alter table organizations add publishingdata jsonb;
alter table organizations add glossaryprojectid int;
alter table organizations add sidebarprojectid int;
ALTER TABLE public.organizations ADD CONSTRAINT fk_organizations_glossaryprojectid FOREIGN KEY (glossaryprojectid) REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE public.organizations ADD CONSTRAINT fk_organizations_sidebarprojectid FOREIGN KEY (sidebarprojectid) REFERENCES projects(id) ON DELETE SET NULL;

