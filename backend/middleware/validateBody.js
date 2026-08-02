// Express middleware to validate req.body against a Zod schema

const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    // Format Zod issues into human-friendly key-value pairs
    const fieldErrors = {};
    let firstMessage = "Please check your inputs and try again.";

    result.error.issues.forEach((issue) => {
      const field = issue.path[issue.path.length - 1] || "general";
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
      if (firstMessage === "Please check your inputs and try again.") {
        firstMessage = issue.message;
      }
    });

    return res.status(400).json({
      success: false,
      message: firstMessage,
      errors: fieldErrors,
    });
  }

  // Assign normalized data back to req.body
  req.body = result.data;
  next();
};

module.exports = validateBody;
