import {
  Route,
  createRoutesFromElements,
  createHashRouter,
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import Logout from './Logout';
import Loading from './Loading';
import Profile from './Profile';
import { default as Team } from './TeamScreen';
import { default as Plan } from './PlanScreen';
import Buggy from './Buggy';
import EmailUnverified from './EmailUnverified';
import Access from './Access';
import Welcome from './Welcome';
import { HTMLPage } from '../components/HTMLPage';
import { termsContent } from './TermsContent';
import { privacyContent } from './privacyContent';
import { default as Detail } from './PassageDetail';
import { default as Auth } from '../hoc/PrivateRoute';
import { isElectron } from '../api-variable';
import { ErrorPage } from '../components/ErrorPage';

const routes = createRoutesFromElements([
  <Route errorElement={<ErrorPage />}>
    <Route path="/access/:users" element={<Access />} />
    <Route path="/error" element={<Buggy />} />
    <Route path="/emailunverified" element={<EmailUnverified />} />
    <Route path="/logout" element={<Logout />} />
    <Route path="/terms" element={<HTMLPage text={termsContent} />} />
    <Route path="/privacy" element={<HTMLPage text={privacyContent} />} />
    <Route path="/loading" element={<Auth el={<Loading />} />} />
    <Route path="/profile" element={<Auth el={<Profile />} />} />
    <Route path="/team" element={<Auth el={<Team />} />} />
    <Route path="/plan/:prjId/:tabNm" element={<Auth el={<Plan />} />} />
    <Route path="/work/:prjId/:pasId" element={<Auth el={<Team />} />} />
    <Route path="/work/:prjId" element={<Auth el={<Team />} />} />
    <Route
      path="/detail/:prjId/:pasId/:mediaId"
      element={<Auth el={<Detail />} />}
    />
    <Route path="/detail/:prjId/:pasId" element={<Auth el={<Detail />} />} />
    <Route path="/" element={<Welcome />} />
  </Route>,
]);

export default (
  <RouterProvider
    router={isElectron ? createHashRouter(routes) : createBrowserRouter(routes)}
  />
);
