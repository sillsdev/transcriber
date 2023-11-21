CREATE TABLE public.organizationbibles (
	id serial4 NOT NULL,
	bibleid int4 NOT NULL,
	organizationid int4 NOT NULL,
	datecreated timestamp NULL,
	dateupdated timestamp NULL,
	lastmodifiedby int4 NULL,
	ownerorg bool NULL DEFAULT false,	
	archived bool NULL DEFAULT false,
	lastmodifiedorigin text NULL,
	CONSTRAINT organizationbibles_un UNIQUE (bibleid, organizationid),
	CONSTRAINT pk_organizationbibles PRIMARY KEY (id)
);
CREATE INDEX ix_organizationbibles_organizationid ON public.organizationbibles USING btree (organizationid);
CREATE INDEX ix_organizatiobibles_bibleid ON public.organizationbibles USING btree (bibleid, archived);
CREATE INDEX organizationbibles_lastmodifiedorigin_idx ON public.organizationbibles USING btree (lastmodifiedorigin, lastmodifiedby, dateupdated);
grant all on organizationbibles to transcriber;
grant all on public.organizationbibles_id_seq to transcriber;
-- Table Triggers

create trigger archivetrigger after
update
    on
    public.organizationbibles for each row execute function archive_trigger();

-- Table Rules

-- DROP RULE rule_archivenotdelete ON public.organizationbibles;

CREATE RULE rule_archivenotdelete AS
    ON DELETE TO public.organizationbibles DO INSTEAD  UPDATE organizationbibles SET archived = true, dateupdated = timezone('UTC'::text, CURRENT_TIMESTAMP)
  WHERE (organizationbibles.id = old.id);


-- public.organizationbibles foreign keys

ALTER TABLE public.organizationbibles ADD CONSTRAINT fk_organizationbibles_lastmodifiedby FOREIGN KEY (lastmodifiedby) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.organizationbibles ADD CONSTRAINT fk_organizationbibless_organizationid FOREIGN KEY (organizationid) REFERENCES public.organizations(id) ON DELETE set NULL;
ALTER TABLE public.organizationbibles ADD CONSTRAINT fk_organizationbibles_bibleid FOREIGN KEY (bibleid) REFERENCES public.bibles(id) ON DELETE CASCADE;