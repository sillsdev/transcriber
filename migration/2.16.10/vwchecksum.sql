-- public.vwchecksums source

CREATE OR REPLACE VIEW public.vwchecksums
AS WITH activitystate AS (
         SELECT 'activitystate'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM activitystates t
             CROSS JOIN projects p
          WHERE p.archived = false
          GROUP BY p.id
        ), artifactcategory AS (
         SELECT 'artifactcategory'::text AS name,
            cs.id AS projectid,
            sum(tschecksum(cs.dateupdated)) AS checksum
           FROM ( SELECT p.id,
                    t.id AS tid,
                    t.dateupdated
                   FROM artifactcategorys t
                     JOIN organizations o ON t.organizationid = o.id
                     JOIN projects p ON p.organizationid = o.id
                  WHERE t.archived = false
                UNION
                 SELECT p.id,
                    t.id AS tid,
                    t.dateupdated
                   FROM artifactcategorys t
                     CROSS JOIN projects p
                  WHERE t.archived = false AND t.organizationid IS NULL) cs
          GROUP BY cs.id
        ), artifacttype AS (
         SELECT 'artifacttype'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM artifacttypes t
             CROSS JOIN projects p
          WHERE t.archived = false
          GROUP BY p.id
        ), bible as (SELECT 'bible'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM bibles t
             CROSS JOIN projects p
          WHERE t.archived = false
          GROUP BY p.id
        ),
        cscomment AS (
         SELECT 'comment'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM comments t
             JOIN discussions d ON t.discussionid = d.id
             JOIN mediafiles m ON d.mediafileid = m.id
             JOIN plans pl ON m.planid = pl.id
             JOIN projects p ON pl.projectid = p.id
          WHERE d.archived = false AND t.archived = false
          GROUP BY p.id
        ), discussion AS (
         SELECT 'discussion'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM discussions t
             JOIN mediafiles m ON t.mediafileid = m.id
             JOIN plans pl ON m.planid = pl.id
             JOIN projects p ON pl.projectid = p.id
          WHERE t.archived = false
          GROUP BY p.id
        ), graphic AS (
         SELECT 'graphic'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM graphics t
             JOIN projects p ON p.organizationid = t.organizationid
          WHERE t.archived = false
          GROUP BY p.id
        ), groupmembership AS (
         SELECT 'groupmembership'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM groupmemberships t
             JOIN groups g ON t.groupid = g.id
             JOIN projects p ON p.organizationid = g.ownerid
          WHERE t.archived = false
          GROUP BY p.id
        ), csgroup AS (
         SELECT 'group'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM groups t
             JOIN projects p ON p.organizationid = t.ownerid
          WHERE t.archived = false
          GROUP BY p.id
        ), integration AS (
         SELECT 'integration'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM integrations t
             CROSS JOIN projects p
          WHERE t.archived = false
          GROUP BY p.id
        ), intellectualproperty AS (
         SELECT 'intellectualproperty'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM intellectualpropertys t
             JOIN projects p ON p.organizationid = t.organizationid
          WHERE t.archived = false
          GROUP BY p.id
        ), invitation AS (
         SELECT 'invitation'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM invitations t
             JOIN projects p ON p.organizationid = t.organizationid
          WHERE p.archived = false
          GROUP BY p.id
        ), mediafile AS (
         SELECT 'mediafile'::text AS name,
            p.id AS projectid,
            sum(tschecksum(m.dateupdated)) AS checksum
           FROM mediafiles m
             JOIN plans pl ON m.planid = pl.id
             JOIN projects p ON pl.projectid = p.id
          WHERE m.archived = false
          GROUP BY p.id
        ), organizationmembership AS (
         SELECT 'organizationmembership'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM organizationmemberships t
             JOIN projects p ON p.organizationid = t.organizationid
          WHERE t.archived = false
          GROUP BY p.id
        ), organization AS (
         SELECT 'organization'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM organizations t
             JOIN projects p ON p.organizationid = t.id
          WHERE t.archived = false
          GROUP BY p.id
        ), organizationbible AS (
         SELECT 'organizationbible'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM organizationbibles t
             JOIN projects p ON p.organizationid = t.organizationid
          WHERE t.archived = false
          GROUP BY p.id
        ), orgkeyterm AS (
         SELECT 'orgkeyterm'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM orgkeyterms t
             JOIN projects p ON p.organizationid = t.organizationid
          WHERE t.archived = false
          GROUP BY p.id
        ), orgkeytermreference AS (
         SELECT 'orgkeytermreference'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM orgkeytermreferences t
             JOIN orgkeyterms o2 ON t.orgkeytermid = o2.id
             JOIN projects p ON p.organizationid = o2.organizationid
          WHERE t.archived = false
          GROUP BY p.id
        ), orgkeytermtarget AS (
         SELECT 'orgkeytermtarget'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM orgkeytermtargets t
             JOIN projects p ON p.organizationid = t.organizationid
          WHERE t.archived = false
          GROUP BY p.id
        ), orgworkflowstep AS (
         SELECT 'orgworkflowstep'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM orgworkflowsteps t
             JOIN projects p ON p.organizationid = t.organizationid
          WHERE t.archived = false
          GROUP BY p.id
        ), passage AS (
         SELECT 'passage'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM passages t
             JOIN sections s ON t.sectionid = s.id
             JOIN plans pl ON s.planid = pl.id
             JOIN projects p ON pl.projectid = p.id
          WHERE t.archived = false
          GROUP BY p.id
        ), passagestatechange AS (
         SELECT 'passagestatechange'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM passagestatechanges t
             JOIN passages ps ON t.passageid = ps.id
             JOIN sections s ON ps.sectionid = s.id
             JOIN plans pl ON s.planid = pl.id
             JOIN projects p ON pl.projectid = p.id
          WHERE ps.archived = false
          GROUP BY p.id
        ), passagetype AS (
         SELECT 'passagetype'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM passagetypes t
             CROSS JOIN projects p
          WHERE p.archived = false
          GROUP BY p.id
        ), plan AS (
         SELECT 'plan'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM plans t
             JOIN projects p ON t.projectid = p.id
          WHERE t.archived = false
          GROUP BY p.id
        ), plantype AS (
         SELECT 'plantype'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM plantypes t
             CROSS JOIN projects p
          WHERE p.archived = false
          GROUP BY p.id
        ), projectintegration AS (
         SELECT 'projectintegration'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM projectintegrations t
             JOIN projects p ON t.projectid = p.id
          WHERE t.archived = false
          GROUP BY p.id
        ), project AS (
         SELECT 'project'::text AS name,
            p.id AS projectid,
            tschecksum(p.dateupdated) AS checksum
           FROM projects p
          WHERE p.archived = false
        ), projecttype AS (
         SELECT 'projecttype'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM projecttypes t
             CROSS JOIN projects p
          WHERE p.archived = false
          GROUP BY p.id
        ), role AS (
         SELECT 'role'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM roles t
             CROSS JOIN projects p
          WHERE p.archived = false
          GROUP BY p.id
        ), sectionresource AS (
         SELECT 'sectionresource'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM sectionresources t
             JOIN sections s ON t.sectionid = s.id
             JOIN plans pl ON s.planid = pl.id
             JOIN projects p ON pl.projectid = p.id
          WHERE t.archived = false
          GROUP BY p.id
        ), sectionresourceuser AS (
         SELECT 'sectionresourceuser'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM sectionresourceusers t
             JOIN sectionresources r ON t.sectionresourceid = r.id
             JOIN sections s ON r.sectionid = s.id
             JOIN plans pl ON s.planid = pl.id
             JOIN projects p ON pl.projectid = p.id
          WHERE t.archived = false
          GROUP BY p.id
        ), section AS (
         SELECT 'section'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM sections t
             JOIN plans pl ON t.planid = pl.id
             JOIN projects p ON pl.projectid = p.id
          WHERE t.archived = false
          GROUP BY p.id
        ), sharedresource AS (
         SELECT 'sharedresource'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM sharedresources t
             JOIN passages ps ON t.passageid = ps.id
             JOIN sections s ON ps.sectionid = s.id
             JOIN plans pl ON s.planid = pl.id
             JOIN projects p ON pl.projectid = p.id
          WHERE t.archived = false
          GROUP BY p.id
        ), sharedresourcereference AS (
         SELECT 'sharedresourcereference'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM sharedresourcereferences t
             JOIN sharedresources s2 ON t.sharedresourceid = s2.id
             JOIN passages ps ON s2.passageid = ps.id
             JOIN sections s ON ps.sectionid = s.id
             JOIN plans pl ON s.planid = pl.id
             JOIN projects p ON pl.projectid = p.id
          WHERE t.archived = false
          GROUP BY p.id
        ), csuser AS (
         SELECT 'user'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM users t
             JOIN organizationmemberships o3 ON t.id = o3.userid
             JOIN projects p ON p.organizationid = o3.organizationid
          WHERE o3.archived = false AND t.archived = false
          GROUP BY p.id
        ), workflowstep AS (
         SELECT 'workflowstep'::text AS name,
            p.id AS projectid,
            sum(tschecksum(t.dateupdated)) AS checksum
           FROM workflowsteps t
             CROSS JOIN projects p
          WHERE t.archived = false
          GROUP BY p.id
        ), allofthem AS (
         SELECT activitystate.name,
            activitystate.projectid,
            activitystate.checksum
           FROM activitystate
        UNION
         SELECT artifactcategory.name,
            artifactcategory.projectid,
            artifactcategory.checksum
           FROM artifactcategory
        UNION
         SELECT artifacttype.name,
            artifacttype.projectid,
            artifacttype.checksum
           FROM artifacttype
        UNION
         SELECT bible.name,
            bible.projectid,
            bible.checksum
           FROM bible
        union
        SELECT cscomment.name,
            cscomment.projectid,
            cscomment.checksum
           FROM cscomment
        UNION
         SELECT discussion.name,
            discussion.projectid,
            discussion.checksum
           FROM discussion
        UNION
         SELECT graphic.name,
            graphic.projectid,
            graphic.checksum
           FROM graphic
        UNION
         SELECT groupmembership.name,
            groupmembership.projectid,
            groupmembership.checksum
           FROM groupmembership
        UNION
         SELECT csgroup.name,
            csgroup.projectid,
            csgroup.checksum
           FROM csgroup
        UNION
         SELECT integration.name,
            integration.projectid,
            integration.checksum
           FROM integration
        UNION
         SELECT intellectualproperty.name,
            intellectualproperty.projectid,
            intellectualproperty.checksum
           FROM intellectualproperty
        UNION
         SELECT invitation.name,
            invitation.projectid,
            invitation.checksum
           FROM invitation
        UNION
         SELECT mediafile.name,
            mediafile.projectid,
            mediafile.checksum
           FROM mediafile
        UNION
         SELECT organizationmembership.name,
            organizationmembership.projectid,
            organizationmembership.checksum
           FROM organizationmembership
        UNION
         SELECT organization.name,
            organization.projectid,
            organization.checksum
           FROM organization
        UNION
         SELECT organizationbible.name,
            organizationbible.projectid,
            organizationbible.checksum
           FROM organizationbible
        UNION
         SELECT orgkeyterm.name,
            orgkeyterm.projectid,
            orgkeyterm.checksum
           FROM orgkeyterm
        UNION
         SELECT orgkeytermreference.name,
            orgkeytermreference.projectid,
            orgkeytermreference.checksum
           FROM orgkeytermreference
        UNION
         SELECT orgkeytermtarget.name,
            orgkeytermtarget.projectid,
            orgkeytermtarget.checksum
           FROM orgkeytermtarget
        UNION
         SELECT orgworkflowstep.name,
            orgworkflowstep.projectid,
            orgworkflowstep.checksum
           FROM orgworkflowstep
        UNION
         SELECT passage.name,
            passage.projectid,
            passage.checksum
           FROM passage
        UNION
         SELECT passagestatechange.name,
            passagestatechange.projectid,
            passagestatechange.checksum
           FROM passagestatechange
        UNION
         SELECT passagetype.name,
            passagetype.projectid,
            passagetype.checksum
           FROM passagetype
        UNION
         SELECT plan.name,
            plan.projectid,
            plan.checksum
           FROM plan
        UNION
         SELECT plantype.name,
            plantype.projectid,
            plantype.checksum
           FROM plantype
        UNION
         SELECT projectintegration.name,
            projectintegration.projectid,
            projectintegration.checksum
           FROM projectintegration
        UNION
         SELECT project.name,
            project.projectid,
            project.checksum
           FROM project
        UNION
         SELECT projecttype.name,
            projecttype.projectid,
            projecttype.checksum
           FROM projecttype
        UNION
         SELECT role.name,
            role.projectid,
            role.checksum
           FROM role
        UNION
         SELECT sectionresource.name,
            sectionresource.projectid,
            sectionresource.checksum
           FROM sectionresource
        UNION
         SELECT sectionresourceuser.name,
            sectionresourceuser.projectid,
            sectionresourceuser.checksum
           FROM sectionresourceuser
        UNION
         SELECT section.name,
            section.projectid,
            section.checksum
           FROM section
        UNION
         SELECT sharedresourcereference.name,
            sharedresourcereference.projectid,
            sharedresourcereference.checksum
           FROM sharedresourcereference
        UNION
         SELECT sharedresource.name,
            sharedresource.projectid,
            sharedresource.checksum
           FROM sharedresource
        UNION
         SELECT csuser.name,
            csuser.projectid,
            csuser.checksum
           FROM csuser
        UNION
         SELECT workflowstep.name,
            workflowstep.projectid,
            workflowstep.checksum
           FROM workflowstep
        ), totalsum AS (
         SELECT 'total'::text AS name,
            allofthem.projectid,
            sum(allofthem.checksum) AS sum
           FROM allofthem
          GROUP BY allofthem.projectid
        )
 SELECT row_number() OVER () AS id,
    qry.name,
    qry.projectid,
    qry.checksum
   FROM ( SELECT allofthem.name,
            allofthem.projectid,
            allofthem.checksum
           FROM allofthem
        UNION
         SELECT totalsum.name,
            totalsum.projectid,
            totalsum.sum
           FROM totalsum) qry;