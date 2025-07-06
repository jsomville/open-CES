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

export const validate2 = (schema) => {
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

    console.log(result.data.body)

    next();
  };
};