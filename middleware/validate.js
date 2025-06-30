export const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: result.error.errors,
            });
        }

        // Attach parsed data to req
        req.validatedData = result.data;
        next();
    };
};