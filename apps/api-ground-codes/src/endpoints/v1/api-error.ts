export class ApiInputError extends Error {
  code = "INVALID_INPUT";
  status = 400;

  constructor(message: string) {
    super(message);
    this.name = "ApiInputError";
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

  if (code === "VALIDATION") {
    set.status = 400;
    return {
      error: {
        code: "INVALID_INPUT",
        message: "Request body does not match the API schema.",
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
