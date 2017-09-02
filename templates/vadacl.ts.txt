import { ValidationMethods, Vadacl } from 'vadacl'
import { ValidationMessages } from './validation-messages'

ValidationMethods.messages = ValidationMessages;
Vadacl.validationMethods = ValidationMethods;

export { Vadacl };
