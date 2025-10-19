// Error handling utilities

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export class CustomError extends Error {
  public code?: string;
  public status?: number;
  public details?: unknown;

  constructor(message: string, code?: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Error types
export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  PARSING_ERROR: 'PARSING_ERROR',
} as const;

// Error messages
export const ErrorMessages = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  AUTHENTICATION_ERROR: 'Please sign in to continue.',
  AUTHORIZATION_ERROR: 'You do not have permission to perform this action.',
  NOT_FOUND_ERROR: 'The requested resource was not found.',
  SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
  FILE_UPLOAD_ERROR: 'Failed to upload file. Please try again.',
  PARSING_ERROR: 'Failed to process the data. Please try again.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Handle API errors
export const handleApiError = (error: unknown): AppError => {
  console.error('API Error:', error);

  // Network error
  if (!error || typeof error !== 'object' || !('response' in error)) {
    return {
      message: ErrorMessages.NETWORK_ERROR,
      code: ErrorTypes.NETWORK_ERROR,
      status: 0,
    };
  }

  const errorObj = error as { response?: { status: number; data?: unknown } };
  if (!errorObj.response) {
    return {
      message: ErrorMessages.NETWORK_ERROR,
      code: ErrorTypes.NETWORK_ERROR,
      status: 0,
    };
  }

  const { status, data } = errorObj.response;

  // Handle different status codes
  const dataObj = data as { message?: string; errors?: unknown; details?: unknown } | undefined;

  switch (status) {
    case 400:
      return {
        message: dataObj?.message || ErrorMessages.VALIDATION_ERROR,
        code: ErrorTypes.VALIDATION_ERROR,
        status,
        details: dataObj?.errors || dataObj?.details,
      };

    case 401:
      return {
        message: dataObj?.message || ErrorMessages.AUTHENTICATION_ERROR,
        code: ErrorTypes.AUTHENTICATION_ERROR,
        status,
      };

    case 403:
      return {
        message: dataObj?.message || ErrorMessages.AUTHORIZATION_ERROR,
        code: ErrorTypes.AUTHORIZATION_ERROR,
        status,
      };

    case 404:
      return {
        message: dataObj?.message || ErrorMessages.NOT_FOUND_ERROR,
        code: ErrorTypes.NOT_FOUND_ERROR,
        status,
      };

    case 422:
      return {
        message: dataObj?.message || ErrorMessages.VALIDATION_ERROR,
        code: ErrorTypes.VALIDATION_ERROR,
        status,
        details: dataObj?.errors || dataObj?.details,
      };

    case 500:
    case 502:
    case 503:
    case 504:
      return {
        message: dataObj?.message || ErrorMessages.SERVER_ERROR,
        code: ErrorTypes.SERVER_ERROR,
        status,
      };

    default:
      return {
        message: dataObj?.message || ErrorMessages.GENERIC_ERROR,
        code: 'UNKNOWN_ERROR',
        status,
      };
  }
};

// Handle file upload errors
export const handleFileUploadError = (error: unknown): AppError => {
  console.error('File Upload Error:', error);

  const errorObj = error as { code?: string; message?: string };

  if (errorObj.code === 'FILE_TOO_LARGE') {
    return {
      message: 'File is too large. Maximum size is 10MB.',
      code: ErrorTypes.FILE_UPLOAD_ERROR,
    };
  }

  if (errorObj.code === 'INVALID_FILE_TYPE') {
    return {
      message: 'Invalid file type. Only PDF and Word documents are allowed.',
      code: ErrorTypes.FILE_UPLOAD_ERROR,
    };
  }

  return {
    message: errorObj.message || ErrorMessages.FILE_UPLOAD_ERROR,
    code: ErrorTypes.FILE_UPLOAD_ERROR,
  };
};

// Handle parsing errors
export const handleParsingError = (error: unknown): AppError => {
  console.error('Parsing Error:', error);

  const errorObj = error as { message?: string };

  return {
    message: errorObj.message || ErrorMessages.PARSING_ERROR,
    code: ErrorTypes.PARSING_ERROR,
  };
};

// Log error to external service (placeholder)
export const logError = (error: AppError, context?: unknown): void => {
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error reporting service like Sentry
    console.error('Production Error:', { error, context });
  } else {
    console.error('Development Error:', { error, context });
  }
};

// Get user-friendly error message
export const getUserFriendlyMessage = (error: AppError): string => {
  // Return specific message if available, otherwise use generic message
  return error.message || ErrorMessages.GENERIC_ERROR;
};

// Check if error is retryable
export const isRetryableError = (error: AppError): boolean => {
  const retryableCodes = [
    ErrorTypes.NETWORK_ERROR,
    ErrorTypes.SERVER_ERROR,
  ];

  const retryableStatuses = [500, 502, 503, 504];

  return (
    retryableCodes.includes(error.code as keyof typeof ErrorTypes) ||
    (error.status && retryableStatuses.includes(error.status))
  );
};

// Create error from fetch response
export const createErrorFromResponse = async (response: Response): Promise<AppError> => {
  let data: unknown = {};
  
  try {
    data = await response.json();
  } catch {
    // Response doesn't contain JSON
  }

  return handleApiError({
    response: {
      status: response.status,
      data,
    },
  });
};

// Async error wrapper
export const withErrorHandling = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = error instanceof CustomError ? error : handleApiError(error);
      logError(appError, { function: fn.name, args });
      throw appError;
    }
  };
};
