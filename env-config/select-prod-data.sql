select p2.language, p2.languagename,  u.name, u.email, m.performedby, m.duration,
m.filesize, LENGTH(m.transcription), p3.book, p3.reference
from mediafiles m, "plans" p, projects p2, users u, passages p3
where m.performedby like '%' and
m.planid = p.id and p.projectid = p2.id and m.recordedbyuserid = u.id and m.duration > 0 and
m.passageid = p3.id and m.artifacttypeid is null and m.datecreated  > '2021-01-01' and
u.name not in ('Greg 16', 'William Tyas','Han Chung', 'Douglas Higby', 'Jake Wadsley',
'Emilee Johnson', 'Marlon Hovland', 'Michael Cochran', 'Sara M', 'Sara Mason',
'Sara Hentzel', 'Greg Trihus') and
u.name not like 'Dharma%' and
p2.language not like 'en%' and
p2.language not like 'es%' and
p2.language not like 'id%' and
p2.language not like 'pt%' and
p2.language not like 'zh%' and
p2.language not like 'ta%' and
p2.language not like 'ru%' and
p2.language not like 'sv%' and
p2.language not like 'fr%' and
p2.language not like 'und%' and
p2.language not like 'seh%'
order by p2.language, u.name, m.performedby
;
