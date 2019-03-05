import Axios from 'axios';
import { FETCH_TASK_FULFILLED, FETCH_TASK_PENDING } from './types';

export const fetchTask = () => (dispatch: any) => {
    dispatch({type: FETCH_TASK_PENDING})
    // const config = {
    //     headers: {
    //         'Access-Control-Allow-Origin': 'https://3smmdvgfgb.execute-api.us-east-2.amazonaws.com'
    //     }
    // }
    // const instance = Axios.create({
    //     baseURL: 'https://3smmdvgfgb.execute-api.us-east-2.amazonaws.com',
    //     timeout: 1000,
    //     // headers: {'Access-Control-Allow-Origin': 'https://3smmdvgfgb.execute-api.us-east-2.amazonaws.com'}
    // })
    // Axios.get('/api/GetTasks')
    Axios.get('https://3smmdvgfgb.execute-api.us-east-2.amazonaws.com/Prod')
        .then(task => {
            console.log(task)
            dispatch({
                payload: task,
                type: FETCH_TASK_FULFILLED
            });
        })
}