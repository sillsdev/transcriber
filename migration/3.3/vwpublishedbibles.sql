-- public.vwpublishedbibles source

CREATE OR REPLACE VIEW public.vwpublishedbibles
AS WITH pubscript AS (
         SELECT DISTINCT b_1.id,
            s.publishto->>'Public' = 'true' AS haspublic,
            s.publishto ->>'Beta' = 'true' AS hasbeta
           FROM bibles b_1
             JOIN organizationbibles o ON b_1.id = o.bibleid
             JOIN projects pr ON o.organizationid = pr.organizationid AND b_1.iso = pr.language AND pr.projecttypeid = 1
             JOIN plans pl ON pr.id = pl.projectid
             JOIN sections s ON pl.id = s.planid AND s.published
             JOIN passages p ON s.id = p.sectionid AND NOT p.archived AND p.reference IS NOT NULL AND p.passagetypeid IS NULL
             JOIN mediafiles m ON m.passageid = p.id AND NOT m.archived AND m.artifacttypeid IS NULL AND m.readytoshare
          WHERE NOT b_1.archived AND b_1.iso IS NOT NULL AND b_1.bibleid IS NOT NULL AND b_1.biblename IS NOT NULL AND
                CASE pr.projecttypeid
                    WHEN 1 THEN p.book
                    ELSE pr.defaultparams ->> 'book'::text
                END > ''::text
        )
 SELECT b.id,
    b.bibleid,
    b.biblename,
    b.iso,
    b.description,
    b.isomediafileid,
    b.biblemediafileid,
    b.publishingdata,
    ( SELECT o.organizationid
           FROM organizationbibles o
          WHERE o.bibleid = b.id AND o.ownerorg = true AND o.archived = false
         LIMIT 1) AS organizationid,
    COALESCE(( SELECT p.haspublic
           FROM pubscript p
          WHERE b.id = p.id AND p.haspublic = true
         LIMIT 1), false) AS haspublic,
    COALESCE(( SELECT p.hasbeta
           FROM pubscript p
          WHERE b.id = p.id AND p.hasbeta = true
         LIMIT 1), false) AS hasbeta
   FROM bibles b
  WHERE (EXISTS ( SELECT x.id,
            x.haspublic,
            x.hasbeta
           FROM pubscript x
          WHERE x.id = b.id));