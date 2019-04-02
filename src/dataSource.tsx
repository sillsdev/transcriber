const source = () => {
    if (false && process.env.NODE_ENV === 'development') {
        return ['/api', '/_']
    } else if (process.env.REACT_APP_TRANSCRIBER_API != null) {
        return [process.env.REACT_APP_TRANSCRIBER_API, '']
    } else {
        return ['https://26nj47s4eh.execute-api.us-east-2.amazonaws.com/dev/api', '']
    }
}

export default source;