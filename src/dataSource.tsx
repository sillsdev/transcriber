const source = () => {
    if (false && process.env.NODE_ENV === 'development') {
        return ['/api', '/_']
    } else {
        return [process.env.REACT_APP_TRANSCRIBER_API, '']
    }
}

export default source;