-- public.vw_projects source

CREATE OR REPLACE VIEW public.vw_projects
AS SELECT pr.id AS projectid,
    pr.name AS projectname,
    pr.description,
    pr.projecttypeid,
    pr.ownerid,
    pr.organizationid,
    pr.language,
    pr.groupid,
    pr.datecreated,
    pr.dateupdated,
    pl.id AS planid,
    pl.name AS planname,
    pl.plantypeid,
    s.id AS sectionid,
    s.name AS sectionname,
    s.sequencenum AS sectionsequencenum,
    s.state AS sectionstate,
    s.transcriberid,
    s.editorid AS reviewerid,
    p.id AS passageid,
    p.sequencenum AS passagesequencenum,
    p.book,
    p.reference,
    p.state AS passagestate,
    p."position",
    m2.originalfile
   FROM projects pr
     LEFT JOIN plans pl ON pl.projectid = pr.id
     LEFT JOIN sections s ON s.planid = pl.id
     LEFT JOIN passages p ON p.sectionid = s.id
     LEFT JOIN mediafiles m2 ON m2.passageid = p.id
  WHERE p.archived = false;
  

-- public.resources source

CREATE OR REPLACE VIEW public.resources
AS WITH maxv AS (
         SELECT max(mm.versionnumber) AS versionnumber,
            mm.passageid
           FROM mediafiles mm
             JOIN plans ON mm.planid = plans.id
             JOIN projects ON plans.projectid = projects.id
          WHERE projects.ispublic = true AND mm.readytoshare
          GROUP BY mm.passageid
        ), latest AS (
         SELECT lm.id,
            true AS latest
           FROM mediafiles lm
             JOIN maxv ON lm.passageid = maxv.passageid AND lm.versionnumber = maxv.versionnumber
        )
 SELECT p.id,
    pr.id AS projectid,
    pr.name AS projectname,
    pr.organizationid,
    o.name AS organization,
    pr.language,
    pl.id AS planid,
    pl.name AS planname,
    pt.name AS plantype,
    s.id AS sectionid,
    s.name AS sectionname,
    s.sequencenum AS sectionsequencenum,
    m.id AS mediafileid,
    p.id AS passageid,
    p.sequencenum AS passagesequencenum,
    p.book,
    p.reference,
    concat(s.sequencenum::character varying, '.', p.sequencenum::character varying, ' ',
        CASE
            WHEN p.book IS NULL THEN ''::text
            ELSE concat(p.book, ' ')
        END, p.reference) AS passagedesc,
    m.versionnumber,
    m.audiourl,
    m.duration,
    m.contenttype,
    m.transcription,
    m.originalfile,
    m.filesize,
    m.s3file,
    COALESCE(c2.categoryname, c.categoryname) AS categoryname,
    t.typename,
    m.lastmodifiedby,
    m.datecreated,
    m.dateupdated,
    m.lastmodifiedorigin,
    COALESCE(latest.latest, false) AS latest,
    s2.id AS resourceid,
    s2.clusterid,
    s2.title,
    s2.description,
    COALESCE(s2.languagebcp47, m.languagebcp47) AS languagebcp47,
    s2.termsofuse,
    s2.keywords,
    s2.artifactcategoryid
   FROM organizations o
     JOIN projects pr ON pr.organizationid = o.id
     JOIN plans pl ON pl.projectid = pr.id
     JOIN plantypes pt ON pl.plantypeid = pt.id
     JOIN sections s ON s.planid = pl.id
     JOIN passages p ON p.sectionid = s.id
     JOIN mediafiles m ON p.id = m.passageid
     LEFT JOIN sharedresources s2 ON p.id = s2.passageid
     LEFT JOIN artifactcategorys c ON m.artifactcategoryid = c.id
     LEFT JOIN artifactcategorys c2 ON s2.artifactcategoryid = c2.id
     LEFT JOIN artifacttypes t ON m.artifacttypeid = t.id
     LEFT JOIN latest ON m.id = latest.id
  WHERE pr.ispublic AND m.readytoshare AND NOT m.archived;
 
 -- public.vw_userdata source

CREATE OR REPLACE VIEW public.vw_userdata
AS SELECT u.id AS userid,
    u.name,
    u.email,
    o.name AS org,
    p.name AS project,
    pl.name AS plan,
    pl.id AS planid,
    s.sequencenum AS sec_sequencenum,
    s.name AS section,
    psg.sequencenum AS psg_sequencenum,
    psg.book,
    psg.reference,
    psg.state
   FROM users u
     JOIN groupmemberships gm ON gm.userid = u.id
     JOIN projects p ON p.groupid = gm.groupid
     JOIN organizations o ON p.organizationid = o.id
     JOIN plans pl ON pl.projectid = p.id
     JOIN sections s ON s.planid = pl.id
     JOIN passages psg ON psg.sectionid = s.id
  WHERE psg.archived = false;
  
 -- public.vwpassagestatehistoryemails source

CREATE OR REPLACE VIEW public.vwpassagestatehistoryemails
AS SELECT row_number() OVER (ORDER BY tra.email, (date_trunc('hour'::text, tra.stateupdated)) DESC, tra.projectname, tra.planname, tra.sectionsequencenum, tra.passagesequencenum, tra.stateupdated DESC) AS id,
    tra.projectid,
    tra.projectname,
    tra.description,
    tra.ownerid,
    tra.organizationid,
    tra.organization,
    tra.language,
    tra.groupid,
    tra.planid,
    tra.planname,
    tra.plantype,
    tra.sectionid,
    tra.sectionname,
    tra.sectionsequencenum,
    tra.sectionstate,
    tra.transcriberid,
    tra.transcriberemail,
    tra.transcriber,
    tra.editorid,
    tra.editoremail,
    tra.editor,
    tra.passageid,
    tra.passagesequencenum,
    tra.book,
    tra.reference,
    tra.passage,
    tra.passagestate,
    tra.statemodifiedby,
    tra.stateupdated,
    tra.comments,
    tra.email,
    tra.timezone,
    tra.locale,
    tra.lastmodifiedby,
    tra.datecreated,
    tra.dateupdated,
    tra.lastmodifiedorigin
   FROM ( SELECT pr.id AS projectid,
            pr.name AS projectname,
            pr.description,
            COALESCE(pr.ownerid, 0) AS ownerid,
            pr.organizationid,
            o.name AS organization,
            pr.language,
            pr.groupid,
            pl.id AS planid,
            pl.name AS planname,
            pt.name AS plantype,
            s.id AS sectionid,
            s.name AS sectionname,
            s.sequencenum AS sectionsequencenum,
            s.state AS sectionstate,
            s.transcriberid,
            t.email AS transcriberemail,
            t.name AS transcriber,
            s.editorid,
            r.email AS editoremail,
            r.name AS editor,
            p.id AS passageid,
            p.sequencenum AS passagesequencenum,
            p.book,
            p.reference,
            concat(s.sequencenum::character varying, '.', p.sequencenum::character varying, ' ',
                CASE
                    WHEN p.book IS NULL THEN ''::text
                    ELSE concat(p.book, ' ')
                END, p.reference) AS passage,
            h.state AS passagestate,
            u.name AS statemodifiedby,
            h.datecreated AS stateupdated,
            h.comments,
            t.email,
            t.timezone,
            t.locale,
            h.lastmodifiedby,
            h.datecreated,
            h.dateupdated,
            h.lastmodifiedorigin
           FROM organizations o
             JOIN projects pr ON pr.organizationid = o.id
             JOIN groups g ON pr.groupid = g.id
             JOIN plans pl ON pl.projectid = pr.id
             JOIN plantypes pt ON pl.plantypeid = pt.id
             JOIN sections s ON s.planid = pl.id
             JOIN passages p ON p.sectionid = s.id
             JOIN passagestatechanges h ON p.id = h.passageid
             LEFT JOIN users t ON s.transcriberid = t.id
             LEFT JOIN users r ON s.editorid = r.id
             LEFT JOIN users u ON u.id = h.lastmodifiedby
          WHERE NOT p.archived AND s.transcriberid IS NOT NULL AND t.digestpreference > 0 AND t.email <> ''::text
        UNION
         SELECT pr.id AS projectid,
            pr.name AS projectname,
            pr.description,
            COALESCE(pr.ownerid, 0) AS ownerid,
            pr.organizationid,
            o.name AS organization,
            pr.language,
            pr.groupid,
            pl.id AS planid,
            pl.name AS planname,
            pt.name AS plantype,
            s.id AS sectionid,
            s.name AS sectionname,
            s.sequencenum AS sectionsequencenum,
            s.state AS sectionstate,
            s.transcriberid,
            t.email AS transcriberemail,
            t.name AS transcriber,
            s.editorid,
            r.email AS editoremail,
            r.name AS editor,
            p.id AS passageid,
            p.sequencenum AS passagesequencenum,
            p.book,
            p.reference,
            concat(s.sequencenum::character varying, '.', p.sequencenum::character varying, ' ',
                CASE
                    WHEN p.book IS NULL THEN ''::text
                    ELSE concat(p.book, ' ')
                END, p.reference) AS passage,
            h.state AS passagestate,
            u.name AS statemodifiedby,
            h.datecreated AS stateupdated,
            h.comments,
            r.email,
            r.timezone,
            r.locale,
            h.lastmodifiedby,
            h.datecreated,
            h.dateupdated,
            h.lastmodifiedorigin
           FROM organizations o
             JOIN projects pr ON pr.organizationid = o.id
             JOIN groups g ON pr.groupid = g.id
             JOIN plans pl ON pl.projectid = pr.id
             JOIN plantypes pt ON pl.plantypeid = pt.id
             JOIN sections s ON s.planid = pl.id
             JOIN passages p ON p.sectionid = s.id
             JOIN passagestatechanges h ON p.id = h.passageid
             LEFT JOIN users t ON s.transcriberid = t.id
             LEFT JOIN users r ON s.editorid = r.id
             LEFT JOIN users u ON u.id = h.lastmodifiedby
          WHERE NOT p.archived AND s.editorid IS NOT NULL AND r.digestpreference > 0 AND r.email <> ''::text
        UNION
         SELECT pr.id AS projectid,
            pr.name AS projectname,
            pr.description,
            COALESCE(pr.ownerid, 0) AS ownerid,
            pr.organizationid,
            o.name AS organization,
            pr.language,
            pr.groupid,
            pl.id AS planid,
            pl.name AS planname,
            pt.name AS plantype,
            s.id AS sectionid,
            s.name AS sectionname,
            s.sequencenum AS sectionsequencenum,
            s.state AS sectionstate,
            s.transcriberid,
            t.email AS transcriberemail,
            t.name AS transcriber,
            s.editorid,
            r.email AS editoremail,
            r.name AS editor,
            p.id AS passageid,
            p.sequencenum AS passagesequencenum,
            p.book,
            p.reference,
            concat(s.sequencenum::character varying, '.', p.sequencenum::character varying, ' ',
                CASE
                    WHEN p.book IS NULL THEN ''::text
                    ELSE concat(p.book, ' ')
                END, p.reference) AS passage,
            h.state AS passagestate,
            u.name AS statemodifiedby,
            h.datecreated AS stateupdated,
            h.comments,
            a.email,
            a.timezone,
            a.locale,
            h.lastmodifiedby,
            h.datecreated,
            h.dateupdated,
            h.lastmodifiedorigin
           FROM organizations o
             JOIN projects pr ON pr.organizationid = o.id
             JOIN groups g ON pr.groupid = g.id
             JOIN plans pl ON pl.projectid = pr.id
             JOIN plantypes pt ON pl.plantypeid = pt.id
             JOIN sections s ON s.planid = pl.id
             JOIN passages p ON p.sectionid = s.id
             JOIN passagestatechanges h ON p.id = h.passageid
             LEFT JOIN users t ON s.transcriberid = t.id
             LEFT JOIN users r ON s.editorid = r.id
             LEFT JOIN users u ON u.id = h.lastmodifiedby
             JOIN groupmemberships gm ON gm.groupid = g.id
             JOIN users a ON gm.userid = a.id
          WHERE NOT p.archived AND a.digestpreference > 0 AND gm.roleid = (( SELECT roles.id
                   FROM roles
                  WHERE roles.description::text = 'Admin'::text))) tra;