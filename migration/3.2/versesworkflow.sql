with transcribe as (
  select process, sequencenum,tool from workflowsteps where process in ('OBT', 'draft', 'transcriber') and name = 'Transcribe' 
  ) 
  update workflowsteps as w 
  set sequencenum = w.sequencenum + 1 
  from transcribe t
  where t.process = w.process and w.sequencenum >= t.sequencenum;
  
  with transcribe as (
  select process, sequencenum,tool from workflowsteps where process in ('OBT', 'draft', 'transcriber') and name = 'Transcribe' 
  ) 
  INSERT INTO workflowsteps (process, "name", sequencenum, tool, permissions, datecreated, dateupdated, lastmodifiedby, archived, lastmodifiedorigin)
   select process, 'MarkVerses', sequencenum-1, '{"tool": "verses"}', '{}', current_timestamp at time zone 'utc', current_timestamp at time zone 'utc', null, false, 'setup' 
   from transcribe;
   

  select * from workflowsteps w order by process, sequencenum 
select * from workflowsteps w where archived = false order by process, sequencenum 