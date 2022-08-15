export interface fileInfo {
  table: string;
  sort: string;
}

export const updateableFiles = [
  { table: 'project', sort: 'D' },
  { table: 'user', sort: 'A' },
  { table: 'groupmembership', sort: 'D' },
  { table: 'section', sort: 'F' },
  { table: 'passage', sort: 'G' },
  { table: 'mediafile', sort: 'H' },
  { table: 'passagestatechange', sort: 'H' },
  { table: 'discussion', sort: 'I' },
  { table: 'comment', sort: 'J' },
  { table: 'sectionresourceuser', sort: 'H' },
];

/* If these can change in electron, they must extend BaseModel instead of Record,
      call UpdateRecord instead of t.updateRecord, and be moved up to the files array */
export const staticFiles = [
  { table: 'activitystate', sort: 'B' },
  { table: 'artifactcategory', sort: 'C' },
  { table: 'artifacttype', sort: 'C' },
  { table: 'integration', sort: 'B' },
  { table: 'organization', sort: 'B' },
  { table: 'plantype', sort: 'B' },
  { table: 'projecttype', sort: 'B' },
  { table: 'role', sort: 'B' },
  { table: 'group', sort: 'C' },
  { table: 'organizationmembership', sort: 'C' },
  { table: 'plan', sort: 'E' },
  { table: 'projectintegration', sort: 'E' }, //do we care that they synced locally??
  { table: 'workflowstep', sort: 'B' },
  { table: 'orgworkflowstep', sort: 'C' },
  { table: 'sectionresource', sort: 'G' },
];
