INSERT INTO public.organizations
("name", websiteurl, logourl, publicbydefault, ownerid, slug, 
datecreated, dateupdated, archived, lastmodifiedby, silid, description, lastmodifiedorigin, defaultparams, 
clusterid, clusterbase)
VALUES('BibleMedia', '', '', true, (select id from users where email = 'sara_hentzel@sil.org'), ''::text, 
current_timestamp at time zone 'utc', current_timestamp at time zone 'utc', false, 
(select id from users where email = 'sara_hentzel@sil.org'),
0, 'Media for bible language and title', 'https://admin-dev.siltranscriber.org'::text, null, null, false);

INSERT INTO public."groups"
("name", abbreviation, ownerid, datecreated, dateupdated, archived, lastmodifiedby, allusers, lastmodifiedorigin, permissions)
values('All users of BibleMedia', '', (select id from organizations where name = 'BibleMedia'),
current_timestamp at time zone 'utc', current_timestamp at time zone 'utc', false, (select id from users where email = 'sara_hentzel@sil.org'),
true, 'https://admin-dev.siltranscriber.org'::text, null);

INSERT INTO public.projects
("name", projecttypeid, description, 
ownerid, organizationid, groupid,
datecreated, dateupdated, archived, lastmodifiedby, lastmodifiedorigin)
VALUES('BibleMedia', 1, 'Media for bible language and title', 
(select id from users where email = 'sara_hentzel@sil.org'),
(select id from organizations where name = 'BibleMedia'),
(select id from groups where name = 'All users of BibleMedia'), 
current_timestamp at time zone 'utc', current_timestamp at time zone 'utc',false,  
 (select id from users where email = 'sara_hentzel@sil.org'), 'https://admin-dev.siltranscriber.org'::text);
 
INSERT INTO public."plans"
("name", plantypeid, projectid, slug, datecreated, dateupdated, archived, lastmodifiedby, ownerid, lastmodifiedorigin, organizedby, flat, sectioncount)
VALUES('BibleMedia', 1, (select id from projects where name = 'BibleMedia'), 
'BibleMedia'::text, current_timestamp at time zone 'utc', current_timestamp at time zone 'utc', false, (select id from users where email = 'sara_hentzel@sil.org'),
(select id from users where email = 'sara_hentzel@sil.org'), 'https://admin-dev.siltranscriber.org'::text, '', false, 0);

SELECT * FROM organizations WHERE name = 'BibleMedia';