export class ApiInputError extends Error {
  code = "INVALID_INPUT";
  status = 400;

  constructor(message: string) {
    super(message);
    this.name = "ApiInputError";
  }
}

export class ApiNotFoundError extends Error {
  code = "NOT_FOUND";
  status = 404;

  constructor(message: string) {
    super(message);
    this.name = "ApiNotFoundError";
  }
}

export const formatApiError = (
  error: unknown,
  code: string | number,
  set: { status?: number | string },
) => {
  if (error instanceof ApiInputError) {
    set.status = error.status;
    return {
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  if (error instanceof ApiNotFoundError) {
    set.status = error.status;
    return {
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  if (code === "VALIDATION") {
    set.status = 400;
    return {
      error: {
        code: "INVALID_INPUT",
        message: "Request body does not match the API schema.",
      },
    };
  }

  if (code === "NOT_FOUND") {
    set.status = 404;
    return {
      error: {
        code: "NOT_FOUND",
        message: "Route not found.",
      },
    };
  }

  set.status = 500;
  return {
    error: {
      code: "INTERNAL_ERROR",
      message: "Unexpected API error.",
    },
  };
};
