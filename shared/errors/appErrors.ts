/**
 * Error messages for RioVoley Mobile App
 */

export const ERROR_MESSAGES = {
  network: 'No se pudo conectar con el servidor.',
  unauthorized: 'No tienes permisos para realizar esta acción.',
  unknown: 'Ocurrió un error inesperado.',
  invalidEmail: 'El correo electrónico no es válido.',
  invalidPassword: 'La contraseña debe tener al menos 8 caracteres.',
  loginFailed: 'El correo o contraseña son incorrectos.',
  accountLocked: 'Tu cuenta ha sido bloqueada temporalmente. Intenta más tarde.',
  sessionExpired: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  loadingFailed: 'No se pudieron cargar los datos. Intenta nuevamente.',
  saveFailed: 'No se pudo guardar los cambios. Intenta nuevamente.',
  deleteFailed: 'No se pudo eliminar el elemento. Intenta nuevamente.',
  noInternet: 'No hay conexión a internet.',
};

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(message = ERROR_MESSAGES.network) {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = ERROR_MESSAGES.unauthorized) {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}
