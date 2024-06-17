

alter table artifactcategorys add specialuse text;

INSERT INTO public.artifactcategorys
(organizationid, categoryname, datecreated, dateupdated, lastmodifiedby, archived, lastmodifiedorigin, discussion, resource, note,specialuse)
select id, 'Chapter', current_timestamp at time zone 'utc',current_timestamp at time zone 'utc',(select id from users where email = 'sara_hentzel@sil.org'),
false, 'setup', false, false, true, 'chapter' from organizations where archived = false;

INSERT INTO public.artifactcategorys
(organizationid, categoryname, datecreated, dateupdated, lastmodifiedby, archived, lastmodifiedorigin, discussion, resource, note,specialuse)
select id, 'Title', current_timestamp at time zone 'utc',current_timestamp at time zone 'utc',(select id from users where email = 'sara_hentzel@sil.org'),
false, 'setup', false, false, true, 'title' from organizations where archived = false;

delete from artifactcategorys a where note = true and organizationid is null;