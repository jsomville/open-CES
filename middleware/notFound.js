const notFound = (req, res, next) => {
    const error = new Error('URL not Found');
    error.status = 404;

    next(error);
};

export default notFound;