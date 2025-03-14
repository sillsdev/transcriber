alter table discussions add creatoruserid int4;
ALTER TABLE discussions ADD CONSTRAINT fk_discussions_users_creatoruserid FOREIGN KEY (creatoruserid) REFERENCES users(id) ON DELETE set NULL;

alter table projects add editsheetgroupid int4;
alter table projects add editsheetuserid int4;
alter table projects add publishgroupid int4;
alter table projects add publishuserid int4;
ALTER TABLE public.projects ADD CONSTRAINT fk_projects_users_editsheetuserid FOREIGN KEY (editsheetuserid) REFERENCES users(id) ON DELETE set NULL;
ALTER TABLE public.projects ADD CONSTRAINT fk_projects_groups_editsheetgroupid FOREIGN KEY (editsheetgroupid) REFERENCES groups(id) ON DELETE set NULL;

ALTER TABLE public.projects ADD CONSTRAINT fk_projects_users_publishuserid FOREIGN KEY (publishuserid) REFERENCES users(id) ON DELETE set NULL;
ALTER TABLE public.projects ADD CONSTRAINT fk_projects_groups_publishgroupid FOREIGN KEY (publishgroupid) REFERENCES groups(id) ON DELETE set NULL;


--drop table organizationscheme;
create table organizationschemes (
id serial,
organizationid int4 not null,
name text not null,
datecreated timestamp NULL,
dateupdated timestamp NULL,
lastmodifiedby int4 NULL,
archived bool DEFAULT false NULL,
lastmodifiedorigin text DEFAULT 'https://admin-dev.siltranscriber.org'::text NOT NULL
);
CREATE UNIQUE INDEX pk_organizationscheme ON public.organizationschemes USING btree (id);
ALTER TABLE public.organizationschemes ADD CONSTRAINT fk_organizationschemes_organizations_organizationid FOREIGN KEY (organizationid) REFERENCES organizations(id) ON DELETE CASCADE;
grant all on organizationschemes to transcriber;

--drop table organizationschemestep;
create table organizationschemesteps (
id serial,
organizationschemeid int4 not null,
orgworkflowstepid int4 not null,
userid int4,
groupid int4,
datecreated timestamp NULL,
dateupdated timestamp NULL,
lastmodifiedby int4 NULL,
archived bool DEFAULT false NULL,
lastmodifiedorigin text DEFAULT 'https://admin-dev.siltranscriber.org'::text NOT NULL
);

CREATE UNIQUE INDEX pk_organizationschemestep ON public.organizationschemesteps USING btree (id);
CREATE INDEX ix_organizationschemestep_organizationschemeid ON public.organizationschemesteps USING btree (organizationschemeid);
CREATE INDEX ix_organizationschemestep_orgworkflowstepid ON public.organizationschemesteps USING btree (orgworkflowstepid);
ALTER TABLE public.organizationschemesteps ADD CONSTRAINT fk_organizationschemesteps_organizationscheme_organizationschemeid FOREIGN KEY (organizationschemeid) REFERENCES organizationschemes(id) ON DELETE CASCADE;
--ALTER TABLE public.organizationschemesteps DROP CONSTRAINT fk_organizationschemesteps_users_userid;
ALTER TABLE public.organizationschemesteps ADD CONSTRAINT fk_organizationschemesteps_users_userid FOREIGN KEY (userid) REFERENCES users(id) ON DELETE set NULL;
ALTER TABLE public.organizationschemesteps ADD CONSTRAINT fk_organizationschemesteps_groups_groupid FOREIGN KEY (groupid) REFERENCES groups(id) ON DELETE set NULL;
ALTER TABLE public.organizationschemesteps ADD CONSTRAINT fk_organizationschemesteps_orgworkflowsteps_orgworkflowstepid FOREIGN KEY (orgworkflowstepid) REFERENCES orgworkflowsteps(id) ON DELETE CASCADE;
grant all on organizationschemesteps to transcriber;

alter table sections add organizationschemeid int4;
ALTER TABLE public.sections ADD CONSTRAINT fk_sections_organizationschemes_organizationschemesid FOREIGN KEY (organizationschemeid) REFERENCES organizationschemes(id) ON DELETE CASCADE;

