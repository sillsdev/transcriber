-- public.vwpublished source

CREATE OR REPLACE VIEW public.vwpublished
AS WITH latestmediashared AS (
         SELECT grouped_table.id,
            grouped_table.passageid,
            grouped_table.versionnumber,
            grouped_table.artifacttype,
            grouped_table.eafurl,
            grouped_table.audiourl,
            grouped_table.duration,
            grouped_table.contenttype,
            grouped_table.audioquality,
            grouped_table.textquality,
            grouped_table.transcription,
            grouped_table.datecreated,
            grouped_table.dateupdated,
            grouped_table.planid,
            grouped_table.originalfile,
            grouped_table.filesize,
            grouped_table.s3file,
            grouped_table.archived,
            grouped_table.lastmodifiedby,
            grouped_table."position",
            grouped_table.lastmodifiedorigin,
            grouped_table.segments,
            grouped_table.languagebcp47,
            grouped_table.link,
            grouped_table.performedby,
            grouped_table.artifacttypeid,
            grouped_table.readytoshare,
            grouped_table.artifactcategoryid,
            grouped_table.resourcepassageid,
            grouped_table.recordedbyuserid,
            grouped_table.offlineid,
            grouped_table.sourcemediaid,
            grouped_table.sourcesegments,
            grouped_table.sourcemediaofflineid,
            grouped_table.transcriptionstate,
            grouped_table.topic,
            grouped_table.publishedas,
            grouped_table.row_num
           FROM ( SELECT mediafiles.id,
                    mediafiles.passageid,
                    mediafiles.versionnumber,
                    mediafiles.artifacttype,
                    mediafiles.eafurl,
                    mediafiles.audiourl,
                    mediafiles.duration,
                    mediafiles.contenttype,
                    mediafiles.audioquality,
                    mediafiles.textquality,
                    mediafiles.transcription,
                    mediafiles.datecreated,
                    mediafiles.dateupdated,
                    mediafiles.planid,
                    mediafiles.originalfile,
                    mediafiles.filesize,
                    mediafiles.s3file,
                    mediafiles.archived,
                    mediafiles.lastmodifiedby,
                    mediafiles."position",
                    mediafiles.lastmodifiedorigin,
                    mediafiles.segments,
                    mediafiles.languagebcp47,
                    mediafiles.link,
                    mediafiles.performedby,
                    mediafiles.artifacttypeid,
                    mediafiles.readytoshare,
                    mediafiles.artifactcategoryid,
                    mediafiles.resourcepassageid,
                    mediafiles.recordedbyuserid,
                    mediafiles.offlineid,
                    mediafiles.sourcemediaid,
                    mediafiles.sourcesegments,
                    mediafiles.sourcemediaofflineid,
                    mediafiles.transcriptionstate,
                    mediafiles.topic,
                    mediafiles.publishedas,
                    row_number() OVER (PARTITION BY mediafiles.passageid ORDER BY mediafiles.versionnumber DESC) AS row_num
                   FROM mediafiles
                  WHERE mediafiles.artifacttypeid IS NULL AND mediafiles.readytoshare AND NOT mediafiles.archived) grouped_table
          WHERE grouped_table.row_num = 1
        ), booktitles AS (
         WITH book AS (
                 SELECT sections.id AS bookid,
                    sections.name AS bookname,
                    sections.planid,
                    "substring"(sections.state, 6) AS book,
                    sections.titlemediafileid AS bookmediafileid
                   FROM sections
                  WHERE sections.level = 1 AND sections.sequencenum = '-4'::integer::numeric AND NOT sections.archived
                ), altbook AS (
                 SELECT sections.id AS altbookid,
                    sections.name AS altname,
                    sections.planid,
                    "substring"(sections.state, 7) AS altbook,
                    sections.titlemediafileid AS altbookmediafileid
                   FROM sections
                  WHERE sections.level = 1 AND sections.sequencenum = '-3'::integer::numeric AND NOT sections.archived
                )
         SELECT book.planid,
            book.bookname,
            book.book,
            book.bookid,
            book.bookmediafileid,
            altbook.altname,
            altbook.altbookid,
            altbook.altbookmediafileid
           FROM book
             LEFT JOIN altbook ON book.planid = altbook.planid AND book.book = altbook.altbook
        ), movements AS (
         SELECT s.id AS movementid,
            s.planid,
            "substring"(s.state, 6) AS book,
            s.sequencenum,
            s.name,
            s.titlemediafileid
           FROM sections s
          WHERE s.level = 2 AND NOT s.archived
        )
 SELECT m.id,
    b.id AS bid,
    b.bibleid,
    0 AS sr,
    o.organizationid,
    pr.defaultparams,
    pr.projecttypeid,
    ( SELECT mv.movementid
           FROM movements mv
          WHERE pl.id = mv.planid AND mv.sequencenum <= s.sequencenum
          ORDER BY mv.sequencenum DESC
         LIMIT 1) AS movementid,
    s.planid,
    s.id AS sectionid,
    s.sequencenum AS sectionsequence,
    s.name AS sectiontitle,
    s.published,
    s.level,
    s.titlemediafileid,
    (s.publishto->>'Public' = 'true') AS ispublic,
    p.id AS passageid,
    p.sequencenum,
        CASE pr.projecttypeid
            WHEN 1 THEN p.book
            ELSE pr.defaultparams ->> 'book'::text
        END AS book,
    p.reference,
    p.title,
    p.startchapter,
    p.startverse,
    p.endchapter,
    p.endverse,
    pt.abbrev AS passagetype,
    bt.bookname,
    bt.bookmediafileid,
    bt.bookid,
    bt.altname,
    bt.altbookmediafileid,
    bt.altbookid,
    ( SELECT max(sharedresources.id) AS max
           FROM sharedresources
          WHERE sharedresources.passageid = p.id) AS sharedresourceid,
    m.id AS mediafileid,
    m.duration,
    m.contenttype,
    m.transcription,
    m.s3file,
    m.filesize,
    m.datecreated,
    m.publishedas
   FROM vwpublishedbibles b
     JOIN organizationbibles o ON b.id = o.bibleid
     JOIN projects pr ON o.organizationid = pr.organizationid AND (b.iso = pr.language OR b.iso ~~ concat(pr.language, '-%'))
     JOIN plans pl ON pr.id = pl.projectid
     JOIN sections s ON pl.id = s.planid AND NOT s.archived AND (s.published OR s.level < 3)
     JOIN passages p ON s.id = p.sectionid AND NOT p.archived AND p.reference <> ''::text
     JOIN latestmediashared m ON m.passageid = p.id
     LEFT JOIN booktitles bt ON pl.id = bt.planid AND bt.book =
        CASE pr.projecttypeid
            WHEN 1 THEN p.book
            ELSE pr.defaultparams ->> 'book'::text
        END
     LEFT JOIN passagetypes pt ON pt.id = p.passagetypeid
     LEFT JOIN sharedresources sr ON NOT sr.archived AND sr.passageid = p.id
  WHERE p.sharedresourceid IS NULL AND
        CASE pr.projecttypeid
            WHEN 1 THEN p.book
            ELSE pr.defaultparams ->> 'book'::text
        END > ''::text
        and ((s.publishto->>'Public' = 'true') or (s.publishto->>'Beta' = 'true')) 
UNION ALL
 SELECT m.id,
    b.id AS bid,
    b.bibleid,
    1 AS sr,
    o.organizationid,
    pr.defaultparams,
    pr.projecttypeid,
    ( SELECT mv.movementid
           FROM movements mv
          WHERE pl.id = mv.planid AND mv.sequencenum < s.sequencenum
          ORDER BY mv.sequencenum DESC
         LIMIT 1) AS movementid,
    pl.id AS planid,
    s.id AS sectionid,
    s.sequencenum AS sectionsequence,
    s.name AS sectiontitle,
    s.published,
    s.level,
    s.titlemediafileid,
    s.publishto->>'Public' = 'true' AS ispublic,
    p.id AS passageid,
    p.sequencenum,
        CASE pr.projecttypeid
            WHEN 1 THEN p.book
            ELSE pr.defaultparams ->> 'book'::text
        END AS book,
    p.reference,
    p.title,
    p.startchapter,
    p.startverse,
    p.endchapter,
    p.endverse,
    pt.abbrev AS passagetype,
    bt.bookname,
    bt.bookmediafileid,
    bt.bookid,
    bt.altname,
    bt.altbookmediafileid,
    bt.altbookid,
    sr.id AS sharedresourceid,
    m.id AS mediafileid,
    m.duration,
    m.contenttype,
    m.transcription,
    m.s3file,
    m.filesize,
    m.datecreated,
    m.publishedas
   FROM vwpublishedbibles b
     JOIN organizationbibles o ON b.id = o.bibleid
     JOIN projects pr ON o.organizationid = pr.organizationid AND (b.iso = pr.language OR b.iso ~~ concat(pr.language, '-%'))
     JOIN plans pl ON pr.id = pl.projectid
     JOIN sections s ON pl.id = s.planid AND NOT s.archived AND (s.published OR s.level < 3)
     LEFT JOIN passages p ON s.id = p.sectionid AND NOT p.archived AND p.reference <> ''::text
     JOIN sharedresources sr ON p.sharedresourceid = sr.id
     JOIN latestmediashared m ON m.passageid = sr.passageid
     LEFT JOIN booktitles bt ON pl.id = bt.planid AND bt.book =
        CASE pr.projecttypeid
            WHEN 1 THEN p.book
            ELSE pr.defaultparams ->> 'book'::text
        END
     LEFT JOIN passagetypes pt ON pt.id = p.passagetypeid
  WHERE pt.abbrev::text = 'NOTE'::text AND
        CASE pr.projecttypeid
            WHEN 1 THEN p.book
            ELSE pr.defaultparams ->> 'book'::text
        END > ''::text
         and ((s.publishto->>'Public' = 'true') or (s.publishto->>'Beta' = 'true')) ;
         