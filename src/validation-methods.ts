import { AbstractControl, FormGroup, FormArray, Validators } from '@angular/forms';
import { ValidationMessages} from './validation-messages';

/*
 The ValidationMethods class contains all of the validation methods defined for use by vadacl.  Validation methods
 provided in Angular are wrapped and leveraged whenever practical.
 */
export class ValidationMethods {

    static messages = ValidationMessages;

    static getLocaleMessage(validationErrorName: string, className ?: string, propertyName ?: string ): string {
        if( className && propertyName && this.messages[ className ] && this.messages[ className ][ propertyName ] ) {
            return this.messages[ className ][ propertyName ][ validationErrorName ] || this.messages[ validationErrorName ];
        } else {
            return this.messages[ validationErrorName ];
        }
    }

    //Modeled after the official Angular Required validators value checks
    static isEmpty( control: AbstractControl ) {
        let v = control.value;
        if ( v === undefined || v === null || ( typeof v === 'string' && v == '' ) ) {
            return true;
        } else {
            return false;
        }
    }

    static required( message ?: string, className ?: string, propertyName ?: string ) {
        let msg = message || ValidationMethods.getLocaleMessage( 'required', className, propertyName );
        return function ( control: AbstractControl ) {
            return ValidationMethods.isEmpty( control ) ? { 'required': { 'isEmpty': true, 'message': msg } } : null;
        }
    }

    static requiredTrue( message ?: string, className ?: string, propertyName ?: string ) {
        let msg = message || ValidationMethods.getLocaleMessage( 'requiredtrue', className, propertyName );
        return function( control: AbstractControl ) {
            return control.value === true ? null : { 'requiredtrue': { 'isNotTrue': true, 'message': msg } };
        }
    }

    static minLength( minLength: number, message ?: string, className ?: string, propertyName ?: string ) {
        let msg = message || ValidationMethods.getLocaleMessage( 'minlength', className, propertyName );
        return function ( control: AbstractControl ) {
            //Use and invoke the official Angular minLength Validator
            let baseValidator = Validators.minLength( minLength );
            let outcome = baseValidator( control );
            if ( outcome ) {
                //Append the message
                outcome[ 'minlength' ].message = msg;
            }
            return outcome;
        }
    }

    static maxLength( maxLength: number, message ?: string, className ?: string, propertyName ?: string  ) {
        let msg = message || ValidationMethods.getLocaleMessage( 'maxlength', className, propertyName );
        return function ( control: AbstractControl ) {
            //Use and invoke the official Angular maxLength Validator
            let baseValidator = Validators.maxLength( maxLength );
            let outcome = baseValidator( control );
            if ( outcome ) {
                //Append the message
                outcome[ 'maxlength' ].message = msg;
            }
            return outcome;
        }
    }


    static min( min: number, message ?: string, className ?: string, propertyName ?: string  ) {
        let msg = message || ValidationMethods.getLocaleMessage( 'min', className, propertyName );
        return function ( control: AbstractControl ) {
            //Use and invoke the official Angular min Validator, added in 4.x
            let baseValidator = Validators.min( min );
            let outcome = baseValidator( control );
            if ( outcome ) {
                //Append the message
                outcome[ 'min' ].message = msg;
            }
            return outcome;
        }
    }

    static max( max: number, message ?: string, className ?: string, propertyName ?: string  ) {
        let msg = message || ValidationMethods.getLocaleMessage( 'max', className, propertyName );
        return function ( control: AbstractControl ) {
            //Use and invoke the official Angular max Validator, added in 4.x
            let baseValidator = Validators.max( max );
            let outcome = baseValidator( control );
            if ( outcome ) {
                //Append the message
                outcome[ 'max' ].message = msg;
            }
            return outcome;
        }
    }

    static email( message ?: string, className ?: string, propertyName ?: string  ) {
        let msg = message || ValidationMethods.getLocaleMessage( 'email', className, propertyName );
        return function ( control: AbstractControl ) {
            //When a value is present, use and invoke the official Angular email Validator, added in 4.x
            return ( !ValidationMethods.isEmpty( control ) && Validators.email( control ) ) ? { 'email': { 'isNotEmail': true, 'message': msg } } : null;
        }
    }

    static pattern( pattern: string | RegExp, message ?: string, className ?: string, propertyName ?: string  ) {
        let msg = message || ValidationMethods.getLocaleMessage( 'pattern', className, propertyName );
        return function ( control: AbstractControl ) {
            //Use and invoke the official Angular pattern Validator
            let baseValidator = Validators.pattern( pattern );
            let outcome = baseValidator( control ) ;
            if ( outcome ) {
                //Append the message
                outcome[ 'pattern' ].message = msg;
            }
            return outcome;
        }
    }

    /*
     Validates that the length of the value of the AbstractControl falls within a certain range.  Can be used to validate
     the length of a string or the number of form controls in a FormGroup or FormArray.
     */
    static withinLength( minLength: number, maxLength: number, message ?: string, className ?: string, propertyName ?: string  ) {
        let msg = message || ValidationMethods.getLocaleMessage( 'withinlength', className, propertyName );
        return function ( control: AbstractControl ) {
            //Do not display if the control is empty
            if( ValidationMethods.isEmpty( control ) ){
                return null;
            }
            let v = control.value;
            return v.length < minLength || v.length > maxLength ?
                { 'withinlength': { 'minLength': minLength, 'maxLength': maxLength, 'actualLength': v.length, 'message': msg } } :
                null
        }
    }

    /*
     Validates that the sum of the numeric values of the FormGroup or FormArray controls equals a certain amount.  Should
     be applied with the applyCollectionRule() method of the Vadacl class.
     */
    static totals( total: number, message ?: string, className ?: string, propertyName ?: string ) {
        let msg = message || ValidationMethods.getLocaleMessage( 'totals', className, propertyName );
        return function ( controlCollection: FormGroup | FormArray ) {
            let valueTotal;
            if( controlCollection.controls instanceof Array ) {
                for( let c in controlCollection.controls ) {
                    if( valueTotal === undefined && controlCollection.controls[ c ].value ) {
                        valueTotal = +controlCollection.controls[ c ].value;
                    } else if( controlCollection.controls[ c ].value ) {
                        valueTotal += +controlCollection.controls[ c ].value;
                    }
                }
            } else {
                let controlNames = Object.keys( controlCollection.controls );
                for( let cn in controlNames ) {
                    let currentControl = controlCollection.controls[ controlNames[ cn ] ];
                    if( valueTotal === undefined && currentControl.value ) {
                        valueTotal = +currentControl.value;
                    } else if( currentControl.value ) {
                        valueTotal += +currentControl.value;
                    }
                }
            }

            return total === valueTotal ? null :
                { 'totals': { 'requiredTotal': total, 'actualTotal': valueTotal, 'message': msg } } ;
        }
    }

    /*
     Validates that all of the values of the FormControls within a FormGroup or FormArray are exactly equal.  Should
     be applied with the applyCollectionRule() method of the Vadacl class.
     */
    static equalValues( message ?: string, className ?: string, propertyName ?: string ) {
        let msg = message || ValidationMethods.getLocaleMessage( 'equalvalues', className, propertyName );
        return function( controlCollection: FormGroup | FormArray ) {
            let areEqual: boolean = true;
            let firstValue: any;
            if( controlCollection.controls instanceof Array ) {
                for( let c in controlCollection.controls ) {
                    if( firstValue === undefined ) {
                        firstValue = controlCollection.controls[ c ].value;
                    } else {
                        if( firstValue !== controlCollection.controls[ c ].value ) {
                            areEqual = false;
                        }
                    }
                }
            } else {
                let controlNames = Object.keys( controlCollection.controls );
                for( let cn in controlNames ) {
                    let currentControl = controlCollection.controls[ controlNames[ cn ] ];
                    if( firstValue === undefined ) {
                        firstValue = currentControl.value;
                    } else {
                        if( firstValue !== currentControl.value ) {
                            areEqual = false;
                        }
                    }
                }
            }
            return ( firstValue && areEqual === true ) ? null : { 'equalvalues': { 'message': msg } };
        }
    }

    /*
     Validates that the number of FormControls within a FormGroup or FormArray with a value of Boolean true falls within
     a given range.  Designed primarily to validate how many checkboxes are checked.  Should be applied with the
     applyCollectionRule() method of the Vadacl class.
     */
    static withinTrueCount( minCount: number, maxCount: number, message ?: string, className ?: string, propertyName ?: string ) {
        let msg = message || ValidationMethods.getLocaleMessage( 'withintruecount', className, propertyName );
        return function( controlCollection: FormGroup | FormArray ) {
            let trueCount: number = 0;
            let minimumTrue: number = minCount ? minCount : 0;
            let withinCount: boolean = false;
            if( controlCollection.controls instanceof Array ) {
                for( let c in controlCollection.controls ) {
                    if( controlCollection.controls[ c ].value === true ) {
                        trueCount++;
                    }
                }
            } else {
                let controlNames = Object.keys( controlCollection.controls );
                for( let cn in controlNames ) {
                    let currentControl = controlCollection.controls[ controlNames[ cn ] ];
                    if( currentControl.value  === true ) {
                        trueCount++;
                    }
                }
            }

            if( maxCount ) {
                withinCount = ( trueCount >= minimumTrue && trueCount <= maxCount ) ? true : false;
            } else {
                withinCount = trueCount >= minimumTrue ? true : false;
            }

            return withinCount ? null : { 'withintruecount': { 'minTrue': minimumTrue, 'maxTrue': maxCount, 'trueCount': trueCount, 'message': msg } };
        }
    }

}



