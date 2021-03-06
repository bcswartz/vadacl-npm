import { AbstractControl, ValidatorFn, FormGroup, FormControl } from '@angular/forms';
import { ValidationMethods } from './validation-methods';
import { PropertyValidations } from './interfaces';

/*
 The Vadacl class can be used as the superclass for a component that implements validation, or as an injected service.
 */
export class Vadacl {

    static validationMethods = ValidationMethods;

    applyRules( domainClass: any, propertyName: string, validationOverrides ?: any  ) : any[] {
        let validators: any[] = [];

        //Collect the property validations defined in the domain class (if any).
        let propertyValidations = ( domainClass && domainClass.validations ) ? ( domainClass.validations[ propertyName ] || {} ) : {};

        //Apply any validation overrides and additional validations.
        let mergedValidations = this.mergeValidations( propertyValidations, validationOverrides );

        for( let mv in mergedValidations ) {
            //Add className and propertyName values to arguments
            mergedValidations[ mv ].className = domainClass ? domainClass.constructor.name : undefined;
            mergedValidations[ mv ].propertyName = propertyName ? propertyName : undefined;

            //Check that validation method exists
            if( Vadacl.validationMethods[ mv ] ) {
                //Parse the argument values to apply to the validation method.
                let validatorArguments = this.getValidatorArguments( this.getMethodDeclaredArguments( Vadacl.validationMethods[ mv ] ), mergedValidations[ mv ] );
                /*
                 Execute the validation method, which will return a validator that the Angular reactive form classes will
                 trigger on a value change, and add that validator to the validators array.
                 */
                validators.push( Vadacl.validationMethods[ mv ].apply( null, validatorArguments ) );
            } else {
                throw `*** Error thrown by Vadacl.applyRules: Validation method "${mv}" is undefined in ValidationMethods. ***`
            }

        }

        return validators;
    }

    applyCollectionRule( domainClass: any, propertyName: string, validationOverride ?: PropertyValidations ) : ValidatorFn {
        let collectionValidator: ValidatorFn;

        let propertyValidation: PropertyValidations = ( domainClass && domainClass.validations ) ? ( domainClass.validations[ propertyName ] || {} ) : {};
        let mergedValidation: PropertyValidations = this.mergeValidations( propertyValidation, validationOverride );

        let methodList = Object.keys( mergedValidation );
        if( methodList.length > 1 ) {
            throw `*** Error thrown by Vadacl.applyCollectionRule: A single validation method must be applied. ***`
        } else if ( methodList.length === 1 ){
            let mv = methodList[ 0 ];
            //Add className and propertyName values to arguments
            mergedValidation[ mv ].className = domainClass ? domainClass.constructor.name : undefined;
            mergedValidation[ mv ].propertyName = propertyName ? propertyName : undefined;

            //Check that validation method exists
            if( Vadacl.validationMethods[ mv ] ) {
                //Parse the argument values to apply to the validation method.
                let validatorArguments = this.getValidatorArguments( this.getMethodDeclaredArguments( Vadacl.validationMethods[ mv ] ), mergedValidation[ mv ] );
                /*
                 Execute the validation method, which will return a validator that the Angular reactive form classes will
                 trigger on a value change.
                 */
                collectionValidator = Vadacl.validationMethods[ mv ].apply( null, validatorArguments );
            } else {
                throw `*** Error thrown by Vadacl.applyCollectionRule: Validation method "${mv}" is undefined in ValidationMethods. ***`
            }
        }

        return collectionValidator;
    }

    /*
     Converts function to a string and then uses regular expressions to pull out the argument names.  The argument names
     are denoted as object literal properties with values equal to their position in the list of arguments (the positions
     are needed to help place the validation method argument values in the correct order).
     */
    getMethodDeclaredArguments( fn: any ) : any {
        let methodDeclarationRegExp = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
        let argumentSplit = /,/;
        let stripCommentsRegExp = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

        let methodArguments = {};
        let argumentPosition = 0;

        let methodAsString = fn.toString().replace( stripCommentsRegExp, '' );
        let methodDeclaration = methodAsString.match( methodDeclarationRegExp );
        let argumentArray = methodDeclaration[ 1 ].split( argumentSplit );

        if( argumentArray[ 0 ] != '' ) {
            for( let argIndex in argumentArray) {
                methodArguments[ argumentArray[ argIndex ].replace(/\s/g,'') ] = argumentPosition++;
            }
        }

        return methodArguments;
    }

    /*
     The arguments passed into the call to the validation method are organized in the proper order based on the order
     of the argument names in the validation method.
     */
    getValidatorArguments( argumentDeclarations: any, validatorArguments: any ) : any[] {
        let executionArguments: any[] = [];
        for( let arg in argumentDeclarations ) {
            executionArguments[ argumentDeclarations[ arg ] ] = validatorArguments[ arg ] || null;
        }
        return executionArguments;
    }

    /*
     Merges the previous validation settings with any new settings.
     */
    mergeValidations( baseValidations: any, overrideValidations: any ) : any {
        for( let validation in overrideValidations ) {
            if( baseValidations[ validation ] == undefined ) {
                baseValidations[ validation ] = overrideValidations[ validation ]
            } else {
                for( let setting in overrideValidations[ validation ] ) {
                    baseValidations[ validation ][ setting ] = overrideValidations[ validation ][ setting ]
                }
            }
        }
        return baseValidations;
    }

    /*
     Determines whether the errors for the form element should be displayed.  By default, returns false
     if the element is still marked as untouched.
     */
    showErrors( formElement: AbstractControl, onlyAfterTouched: boolean = true ) : boolean {
        let elementActive = onlyAfterTouched ? formElement.touched : true;
        return ( formElement.dirty && formElement.invalid && elementActive ) ? true : false
    }

    /*
     Returns array of error messages. By default, error messages only returned when control is dirty.
     */
    getControlErrors( control: AbstractControl, onlyWhenDirty: boolean = true ) : string[] {
        let errorMessages: string[] = [];
        if( ( !onlyWhenDirty || control.dirty ) && control.errors ) {
            let errorArray = Object.keys( control.errors );
            for ( let err in errorArray ) {
                if ( control.errors[ errorArray[ err ] ].message ) {
                    errorMessages.push( control.errors[ errorArray[ err ] ].message );
                }
            }
        }
        return errorMessages;
    }

    /*
     Ensures a programmatic change to an AbstractControl value is marked as dirty (and by default as touched)
     prior to the change, properly invoking validation and the display of any validation errors.
     */
    changeControlValue( control: AbstractControl, value: any, markTouched: boolean = true ) : void {
        control.markAsDirty();
        if( markTouched) { control.markAsTouched() };
        control.setValue( value );
    }

    /*
     Convenience method that returns a FormGroup based on the domain class argument with the desired FormControls and validations
     */
    generateForm( domainClass: any, mods: any = {} ) : FormGroup {
        let generatorMap = {};
        let formMap = {};

        //If mods argument includes an array of the "only" properties you want in the form, use that. Otherwise, grab the domain class properties
        let domainProperties = mods.only ? mods.only : Object.keys( domainClass );

        for( let p of domainProperties ) {
            if( p != 'validations' ) {  //Exclude validations property

                generatorMap[ p ] = {
                    currentValue: domainClass[ p ],

                    //Use key/values pairs in mods.rename to name the FormControl something different from the property name
                    controlName: mods.rename && mods.rename[ p ] ? mods.rename[ p ] : p,

                    //Apply any additional validations for the property in mods.validations, otherwise the normal property validations will be used
                    validations: mods.validations && mods.validations[ p ] ? this.applyRules( domainClass, p, mods.validations[ p ] ) : this.applyRules( domainClass, p ),

                    //If mods.only is not defined, check mods.exclude for exclusions from the form.
                    include: ( !mods.only && mods.exclude && mods.exclude.indexOf( p ) > -1 ) ? false : true
                };

            }
        }

        for( let f in generatorMap ) {
            if( generatorMap[ f ].include ) {
                formMap[ generatorMap[ f ].controlName ] = new FormControl( generatorMap[ f ].currentValue, generatorMap[ f ].validations );
            }
        }

        return new FormGroup( formMap );
    }

}

