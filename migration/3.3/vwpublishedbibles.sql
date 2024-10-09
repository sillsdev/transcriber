-- public.vwpublishedbibles source

CREATE OR REPLACE VIEW vwpublishedbibles AS 
	WITH pubscript AS ( 
		SELECT DISTINCT b_1.id, 
			(s.publishto ->> 'Public'::text) = 'true'::text AS haspublic, 
			(s.publishto ->> 'Beta'::text) = 'true'::text AS hasbeta 
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
				END > ''::text ) 
	SELECT b.id, b.bibleid, b.biblename, b.iso, b.description, b.isomediafileid, b.biblemediafileid, b.publishingdata, 
		(SELECT o.organizationid FROM organizationbibles o WHERE o.bibleid = b.id AND o.ownerorg = true AND o.archived = false LIMIT 1) AS organizationid, 
		COALESCE(( SELECT p.haspublic FROM pubscript p WHERE b.id = p.id AND p.haspublic = true LIMIT 1), false) AS haspublic, 
		COALESCE(( SELECT p.hasbeta FROM pubscript p WHERE b.id = p.id AND p.hasbeta = true LIMIT 1), false) AS hasbeta 
	FROM bibles b WHERE (EXISTS ( SELECT x.id, x.haspublic, x.hasbeta FROM pubscript x WHERE x.id = b.id));
	
CREATE OR REPLACE VIEW vwpublishedgeneral AS 
	SELECT id, bid, bibleid, sr, organizationid, defaultparams, 
		projecttypeid, movementid, planid, sectionid, sectionsequence, 
		sectiontitle, published, level, titlemediafileid, ispublic, 
		passageid, sequencenum, book, reference, title, startchapter, 
		startverse, endchapter, endverse, passagetype, bookname, 
		bookmediafileid, bookid, altname, altbookmediafileid, altbookid, 
		sharedresourceid, mediafileid, duration, contenttype, transcription, 
		s3file, filesize, datecreated, publishedas 
	FROM vwpublished WHERE projecttypeid = 2;
	
CREATE OR REPLACE VIEW vwpublishedscripture AS 
	SELECT vwpublished.id, vwpublished.bid, vwpublished.bibleid, vwpublished.sr, vwpublished.organizationid, 
		vwpublished.defaultparams, vwpublished.projecttypeid, vwpublished.movementid, vwpublished.planid, 
		vwpublished.sectionid, vwpublished.sectionsequence, vwpublished.sectiontitle, vwpublished.published, 
		vwpublished.level, vwpublished.titlemediafileid, vwpublished.ispublic, vwpublished.passageid, 
		vwpublished.sequencenum, vwpublished.book, vwpublished.reference, vwpublished.title, 
		vwpublished.startchapter, vwpublished.startverse, vwpublished.endchapter, vwpublished.endverse, 
		vwpublished.passagetype, vwpublished.bookname, vwpublished.bookmediafileid, vwpublished.bookid, 
		vwpublished.altname, vwpublished.altbookmediafileid, vwpublished.altbookid, vwpublished.sharedresourceid, 
		vwpublished.mediafileid, vwpublished.duration, vwpublished.contenttype, vwpublished.transcription, 
		vwpublished.s3file, vwpublished.filesize, vwpublished.datecreated, vwpublished.publishedas 
	FROM vwpublished WHERE vwpublished.projecttypeid = 1;