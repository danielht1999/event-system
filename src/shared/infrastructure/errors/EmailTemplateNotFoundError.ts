import { InfrastructureError} from './InfrastructureError';
import { ErrorCategory } from '@shared/errors';

export class EmailTemplateNotFoundError extends InfrastructureError {
  readonly category = ErrorCategory.INTERNAL;
  readonly code = 'EMAIL_TEMPLATE_NOT_FOUND';

  constructor(templatePath: string) {
    super(
      `Email template not found at path [${templatePath}]`
    );
  }
}