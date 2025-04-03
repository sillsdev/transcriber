alter table discussions add creatoruserid int4;
ALTER TABLE discussions ADD CONSTRAINT fk_discussions_users_creatoruserid FOREIGN KEY (creatoruserid) REFERENCES users(id) ON DELETE set NULL;
alter table comments add creatoruserid int4;
ALTER TABLE comments ADD CONSTRAINT fk_comments_users_creatoruserid FOREIGN KEY (creatoruserid) REFERENCES users(id) ON DELETE set NULL;

CREATE FUNCTION remember_creator()
RETURNS trigger AS $$
BEGIN
  NEW.creatoruserid = NEW.lastmodifiedby;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER creator_trigger
BEFORE INSERT ON discussions
FOR EACH ROW
EXECUTE PROCEDURE remember_creator();

CREATE TRIGGER creator_trigger
BEFORE INSERT ON comments
FOR EACH ROW
EXECUTE PROCEDURE remember_creator();

--select * from discussions order by id desc limit 10
--select * from comments order by id desc limit 10