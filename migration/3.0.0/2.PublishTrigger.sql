-- DROP FUNCTION public.publish_trigger();

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
		where id = (select bibleid FROM organizations o 
						INNER JOIN projects p ON p.organizationid = o.id 
						inner join plans pl on pl.projectid = p.id where pl.id = new.planid
						and ob.archived = false)
		for UPDATE;
begin
    if new.published = true AND new.published != old.published then
		open mybible;
		loop --just so the exit works
		 	fetch mybible into bible;
				exit when not found;
			if (bible.anypublished = false) then
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

create trigger publishtrigger after
update
    on
    public.sections for each row execute function publish_trigger();