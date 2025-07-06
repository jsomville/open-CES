export const validate = (schema) => {
  return (req, res, next) => {

    const result = schema.safeParse({
      params: req.params,
      body: req.body,
    });

    if (!result.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.errors,
      });
    }

    const validated = result.data;
    req.validatedParams = validated.params ?? {};
    req.validatedBody = validated.body ?? {};

    next();
  };
};