import styled from 'styled-components';
import busyImage from '../assets/progress.gif';

const BusyDiv = styled.div`
  display: flex;
  height: 100vh;
  .busyImg {
    width: 120px;
    margin: auto;
  }
`;

export const Busy = () => {
  return (
    <BusyDiv>
      <img className="busyImg" src={busyImage} alt="busy" />
    </BusyDiv>
  );
};

export default Busy;
