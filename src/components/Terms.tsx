import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { Typography } from '@material-ui/core';
import terms from '../assets/terms.json';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    page: {
      margin: theme.spacing(4),
    },
    sectionRow: {
      border: 1,
      backgroundColor: 'lightgray',
    },
    sectionHead: {
      padding: theme.spacing(2),
    },
    text: {
      paddingBottom: theme.spacing(1),
    },
  })
);

type IItem = string | Array<string>;

const ContentItem = ({ item, key }: { item: IItem; key: number }) => {
  const classes = useStyles();

  return typeof item === 'string' ? (
    <Typography className={classes.text}>{item}</Typography>
  ) : (
    <ul key={key}>
      {item.map((each, n) => (
        <li key={n}>{each}</li>
      ))}
    </ul>
  );
};

interface ITerm {
  type: string;
  head?: string;
  content?: Array<string | Array<string>>;
}

const TermItem = ({ term }: { term: ITerm }) => {
  const classes = useStyles();

  return term.type === 'pageHead' ? (
    <tr>
      <Typography variant="h3" className={classes.text}>
        {term.head}
      </Typography>
    </tr>
  ) : term.type === 'text' ? (
    <tr>
      <Typography className={classes.text}>{term.head}</Typography>
    </tr>
  ) : term.type === 'section' && term.content ? (
    <>
      <tr className={classes.sectionRow}>
        <Typography variant="h6" className={classes.sectionHead}>
          {term.head}
        </Typography>
      </tr>
      <tr>
        {term.content.map((i, n) => (
          <ContentItem item={i} key={n} />
        ))}
      </tr>
    </>
  ) : (
    <></>
  );
};

export const Terms = () => {
  const classes = useStyles();

  return (
    <div className={classes.page}>
      <table>
        {terms.map((t) => (
          <TermItem term={t} />
        ))}
      </table>
    </div>
  );
};
