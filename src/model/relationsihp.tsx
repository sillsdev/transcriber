interface TableRelationship {
    links: { self: string; related: string; };
    data: { type: string; id: string; };
  };
export default TableRelationship;  