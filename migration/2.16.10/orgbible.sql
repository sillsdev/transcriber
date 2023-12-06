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
ALTER TABLE public.organizationbibles ADD CONSTRAINT fk_organizationbibless_organizationid FOREIGN KEY (organizationid) REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.organizationbibles DROP CONSTRAINT fk_organizationbibles_bibleid;
ALTER TABLE public.organizationbibles ADD CONSTRAINT fk_organizationbibles_bibleid FOREIGN KEY (bibleid) REFERENCES public.bibles(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION update_published() 
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $function$
declare anypub integer;
begin

	select count(*) 
	into anypub
	from projects p
		inner join plans pl on pl.projectid = p.id
		inner join sections s on s.planid = pl.id
	where published = true and p.organizationid = new.organizationid;
	if (anypub > 0) then
	/* when we insert an organizationbible record update the bible published */
    	UPDATE bibles set anypublished =  true where id = new.bibleid;
    end if;
    RETURN new;
end;
$function$
;
CREATE TRIGGER update_published
     AFTER INSERT ON organizationbibles
     FOR EACH ROW
     EXECUTE PROCEDURE update_published();
    
CREATE OR REPLACE FUNCTION public.publish_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
	bible record;
	mybible cursor
		for
		SELECT *
		FROM public.bibles
		where id = (select bibleid FROM organizationbibles ob 
						INNER JOIN projects p ON p.organizationid = ob.organizationid 
						inner join plans pl on pl.projectid = p.id where pl.id = new.planid)
		for UPDATE;
begin
	RAISE NOTICE 'here %', new.id;

    if new.published = true AND new.published != old.published then
		open mybible;
		loop --just so the exit works
		 	fetch mybible into bible;
				exit when not found;
			if (bible.anypublished = false) then
			RAISE NOTICE 'update %', new.id;
				update bibles
				set anypublished = true,
					dateupdated=current_timestamp,
					lastmodifiedorigin='publish'
					where current of mybible;

		 	end if;
		 	exit; -- just wanted to do the first one
	 	end loop;
	 	close mybible;
	 end if;
	 return new;
end;
$function$
;
