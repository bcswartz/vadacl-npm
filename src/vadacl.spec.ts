import { Vadacl } from "./vadacl";
import { FormControl, FormGroup, FormArray } from "@angular/forms";

import { ValidationMethods } from './validation-methods';

describe( 'Vadacl', () => {
    let vadacl: Vadacl;

    beforeEach( () => {
        vadacl = new Vadacl();
    });

    describe( 'applyRules: ', () => {
        let domainClass: any;

        beforeEach( () => {
            domainClass = {
                firstName: 'Bob',
                validations: {
                    firstName: {
                        required: { message: 'is required' },
                        minLength: { minLength: 3, message: 'minLength of 3' }
                    }
                }
            };

        });

        describe( 'internal call to mergeValidations', () => {
            beforeEach( () => {
                spyOn( vadacl, 'mergeValidations' ).and.returnValue( {} );
                spyOn( vadacl, 'getValidatorArguments' ).and.returnValue( [] );
            });

            it( 'should receive an empty object literal object if the domain class and property name arguments are null', () => {
                vadacl.applyRules( null, null );
                expect( vadacl.mergeValidations ).toHaveBeenCalled();
                expect( vadacl.mergeValidations[ "calls" ].argsFor( 0 )[ 0 ]).toEqual( {} );
            });

            it( 'should receive an empty object literal object as first argument if no validations exist', () => {
                let emptyDomainClass = { companyName: 'Money Inc.'};
                vadacl.applyRules( emptyDomainClass, 'companyName' );
                expect( vadacl.mergeValidations ).toHaveBeenCalled();
                expect( vadacl.mergeValidations[ "calls" ].argsFor( 0 )[ 0 ]).toEqual( {} );
            });

            it( 'should receive an empty object literal object as first argument if no validations for property', () => {
                vadacl.applyRules( domainClass, 'companyName' );
                expect( vadacl.mergeValidations ).toHaveBeenCalled();
                expect( vadacl.mergeValidations[ "calls" ].argsFor( 0 )[ 0 ]).toEqual( {} );
            });

            it( 'should receive the property validations as the first argument', () => {
                vadacl.applyRules( domainClass, 'firstName' );
                expect( vadacl.mergeValidations ).toHaveBeenCalled();
                expect( vadacl.mergeValidations[ "calls" ].argsFor( 0 )[ 0 ]).toEqual( domainClass.validations.firstName );
            });

            it( 'should receive any validation overrides as the second argument', () => {
                vadacl.applyRules( domainClass, 'firstName', { maxLength: { maxLength: 10 }} );
                expect( vadacl.mergeValidations ).toHaveBeenCalled();
                expect( vadacl.mergeValidations[ "calls" ].argsFor( 0 )[ 0 ]).toEqual( domainClass.validations.firstName );
                expect( vadacl.mergeValidations[ "calls" ].argsFor( 0 )[ 1 ]).toEqual( { maxLength: { maxLength: 10 } } );
            });
        });

        describe( 'internal call to getValidatorArguments', () => {

            beforeEach( () => {
                spyOn( ValidationMethods, 'required' ).and.returnValue( function() { return 'required' } );
                spyOn( ValidationMethods, 'minLength' ).and.returnValue( function() { return 'minLength' } );

                spyOn( vadacl, 'getMethodDeclaredArguments' ).and.returnValue( [ 'minLength', 'message' ] );
                spyOn( vadacl, 'mergeValidations' ).and.returnValue( domainClass.validations.firstName );
                spyOn( vadacl, 'getValidatorArguments' ).and.returnValue( [] );
            });

            it( 'should receive the returned value of getMethodDeclaredArguments as the first argument', () => {
                vadacl.applyRules( domainClass, 'firstName' );
                expect( vadacl.getValidatorArguments ).toHaveBeenCalled();
                expect( vadacl.getValidatorArguments[ "calls" ].argsFor( 0 )[ 0 ]).toEqual( [ 'minLength', 'message' ] );
            });

            it( 'should receive the properties of the specified validation as the second argument', () => {
                vadacl.applyRules( domainClass, 'firstName' );
                expect( vadacl.getValidatorArguments ).toHaveBeenCalled();
                expect( vadacl.getValidatorArguments[ "calls" ].argsFor( 0 )[ 1 ]).toEqual( domainClass.validations.firstName.required );
                expect( vadacl.getValidatorArguments[ "calls" ].argsFor( 1 )[ 1 ]).toEqual( domainClass.validations.firstName.minLength );
            });
        });

        describe( 'should return', () => {
            beforeEach( () => {
                spyOn( vadacl, 'mergeValidations' ).and.callFake( ( base, overrides ) => {
                    if( overrides != undefined ) {
                        for( let setting in overrides ) {
                            base[ setting ] = overrides[ setting ]
                        }
                    }
                    return base;
                });

                spyOn( vadacl, 'getValidatorArguments' ).and.returnValue( [] );
            });


            describe( 'an empty array', () => {
                it( 'for a domain class with no properties', () => {
                    domainClass = {};
                    expect( vadacl.applyRules( domainClass, null ) ).toEqual( [] );
                });

                it( 'when no validations are defined', () => {
                    domainClass = { firstName: 'Bob' };
                    expect( vadacl.applyRules( domainClass, 'firstName' ) ).toEqual( [] );
                });

                it( 'when no validations are defined for the specified property name', () => {
                    domainClass = {
                        firstName: 'Bob',
                        validations: {
                            age: { required: { message: 'age required' } }
                        }
                    };

                    expect( vadacl.applyRules( domainClass, 'firstName' ) ).toEqual( [] );
                });

                it( 'when the specified property does not exist', () => {
                    expect( vadacl.applyRules( domainClass, 'notThere' ) ).toEqual( [] );
                });
            });

            describe( 'an array of functions', () => {
                beforeEach( () => {
                    spyOn( ValidationMethods, 'required' ).and.returnValue( function() { return 'required' } );
                    spyOn( ValidationMethods, 'maxLength' ).and.returnValue( function() { return 'maxLength' } );
                    spyOn( ValidationMethods, 'minLength' ).and.returnValue( function() { return 'minLength' } );
                });

                it( 'that align with the base validations when no overrides are provided', () => {
                    let validators = vadacl.applyRules( domainClass, 'firstName' );
                    expect( validators.length ).toEqual( 2 );
                    expect( validators[ 0 ]() ).toEqual( 'required' );
                    expect( validators[ 1 ]() ).toEqual( 'minLength' );
                });

                it( 'that reflect both base and override validations when provided', () => {
                    let overrides = { maxLength: { maxLength: 3, message: 'minLength of 3' } };
                    let validators = vadacl.applyRules( domainClass, 'firstName', overrides );
                    expect( validators.length ).toEqual( 3 );
                    expect( validators[ 0 ]() ).toEqual( 'required' );
                    expect( validators[ 1 ]() ).toEqual( 'minLength' );
                    expect( validators[ 2 ]() ).toEqual( 'maxLength' );
                });
            });

            it( 'an error if a validation setting references a non-existent validation method', () => {
                expect( () => vadacl.applyRules( domainClass, 'firstName', { bogusMethod: { message: 'doesNotExist' }} ) )
                    .toThrow( '*** Error thrown by Vadacl.applyRules: Validation method "bogusMethod" is undefined in ValidationMethods. ***' );

                domainClass = {
                    lastName: 'Boxer',
                    validations: {
                        lastName: { alsoBogus: { message: 'alsoDoesNotExist' } }
                    }
                };

                expect( () => vadacl.applyRules( domainClass, 'lastName' ) )
                    .toThrow( '*** Error thrown by Vadacl.applyRules: Validation method "alsoBogus" is undefined in ValidationMethods. ***' );
            });

        });

    });

    describe( 'applyCollectionRule: ', () => {
        let domainClass: any;

        beforeEach( () => {
            domainClass = {
                activityTotal: 'Bob',
                validations: {
                    activityTotal: {
                        totals: { total: 100, message: 'must total 100' }
                    }
                }
            };

        });

        describe( 'internal call to mergeValidations', () => {
            beforeEach( () => {
                spyOn( vadacl, 'mergeValidations' ).and.returnValue( {} );
                spyOn( vadacl, 'getValidatorArguments' ).and.returnValue( [] );
            });

            it( 'should receive an empty object literal object as first argument if the domain class and property arguments are null', () => {
                vadacl.applyCollectionRule( null, null );
                expect( vadacl.mergeValidations ).toHaveBeenCalled();
                expect( vadacl.mergeValidations[ "calls" ].argsFor( 0 )[ 0 ]).toEqual( {} );
            });

            it( 'should receive an empty object literal object as first argument if no validations exist', () => {
                let emptyDomainClass = { companyName: 'Money Inc.'};
                vadacl.applyCollectionRule( emptyDomainClass, 'companyName' );
                expect( vadacl.mergeValidations ).toHaveBeenCalled();
                expect( vadacl.mergeValidations[ "calls" ].argsFor( 0 )[ 0 ]).toEqual( {} );
            });

            it( 'should receive an empty object literal object as first argument if no validations for property', () => {
                vadacl.applyCollectionRule( domainClass, 'companyName' );
                expect( vadacl.mergeValidations ).toHaveBeenCalled();
                expect( vadacl.mergeValidations[ "calls" ].argsFor( 0 )[ 0 ]).toEqual( {} );
            });

            it( 'should receive the property validations as the first argument', () => {
                vadacl.applyCollectionRule( domainClass, 'activityTotal' );
                expect( vadacl.mergeValidations ).toHaveBeenCalled();
                expect( vadacl.mergeValidations[ "calls" ].argsFor( 0 )[ 0 ]).toEqual( domainClass.validations.activityTotal );
            });

            it( 'should receive any validation overrides as the second argument', () => {
                vadacl.applyCollectionRule( domainClass, 'activityTotal', { totals: { total: 50 }} );
                expect( vadacl.mergeValidations ).toHaveBeenCalled();
                expect( vadacl.mergeValidations[ "calls" ].argsFor( 0 )[ 0 ]).toEqual( domainClass.validations.activityTotal );
                expect( vadacl.mergeValidations[ "calls" ].argsFor( 0 )[ 1 ]).toEqual( { totals: { total: 50 } } );
            });
        });

        describe( 'internal call to getValidatorArguments', () => {

            beforeEach( () => {
                spyOn( ValidationMethods, 'totals' ).and.returnValue( function() { return 'totals' } );

                spyOn( vadacl, 'getMethodDeclaredArguments' ).and.returnValue( [ 'total', 'message' ] );
                spyOn( vadacl, 'mergeValidations' ).and.returnValue( domainClass.validations.activityTotal );
                spyOn( vadacl, 'getValidatorArguments' ).and.returnValue( [] );
            });

            it( 'should receive the returned value of getMethodDeclaredArguments as the first argument', () => {
                vadacl.applyCollectionRule( domainClass, 'activityTotal' );
                expect( vadacl.getValidatorArguments ).toHaveBeenCalled();
                expect( vadacl.getValidatorArguments[ "calls" ].argsFor( 0 )[ 0 ]).toEqual( [ 'total', 'message' ] );
            });

            it( 'should receive the properties of the specified validation as the second argument', () => {
                vadacl.applyCollectionRule( domainClass, 'activityTotal' );
                expect( vadacl.getValidatorArguments ).toHaveBeenCalled();
                expect( vadacl.getValidatorArguments[ "calls" ].argsFor( 0 )[ 1 ]).toEqual( domainClass.validations.activityTotal.totals );
            });
        });

        describe( 'should return', () => {
            beforeEach( () => {
                spyOn( vadacl, 'mergeValidations' ).and.callFake( ( base, overrides ) => {
                    if( overrides != undefined ) {
                        for( let setting in overrides ) {
                            base[ setting ] = overrides[ setting ]
                        }
                    }
                    return base;
                });

                spyOn( vadacl, 'getValidatorArguments' ).and.returnValue( [] );
            });


            describe( 'an undefined object', () => {
                it( 'for a domain class with no properties', () => {
                    domainClass = {};
                    expect( vadacl.applyCollectionRule( domainClass, null ) ).toBeUndefined();
                });

                it( 'when no validations are defined', () => {
                    domainClass = { firstName: 'Bob' };
                    expect( vadacl.applyCollectionRule( domainClass, 'firstName' ) ).toBeUndefined();
                });

                it( 'when no validations are defined for the specified property name', () => {
                    domainClass = {
                        firstName: 'Bob',
                        validations: {
                            age: { required: { message: 'age required' } }
                        }
                    };

                    expect( vadacl.applyCollectionRule( domainClass, 'firstName' ) ).toBeUndefined();
                });

                it( 'when the specified property does not exist', () => {
                    expect( vadacl.applyCollectionRule( domainClass, 'notThere' ) ).toBeUndefined( [] );
                });
            });

            describe( 'the specified ValidationMethods method', () => {
                beforeEach( () => {
                    spyOn( ValidationMethods, 'totals' ).and.returnValue( function( num ) { return 'totals' } );
                });

                it( 'that matches the base validation when no override is provided', () => {
                    let validator = vadacl.applyCollectionRule( domainClass, 'activityTotal' );
                    expect( vadacl.getValidatorArguments[ "calls" ].argsFor( 0 )[ 1 ].total ).toEqual( 100 );
                    expect( validator.call( 0 ) ).toEqual( 'totals' );
                });

                it( 'that reflect the merge of the base and override validation when provided', () => {
                    let override = { totals: { total: 100, message: 'total override' } };
                    let validator = vadacl.applyCollectionRule( domainClass, 'activityTotal', override );
                    expect( vadacl.getValidatorArguments[ "calls" ].argsFor( 0 )[ 1 ].message ).toEqual( 'total override' );
                    expect( validator.call( 0 ) ).toEqual( 'totals' );
                });
            });

            it( 'an error if a validation setting references a non-existent validation method', () => {
                /*
                 Cannot provide a non-existent validation method as an override without violating the
                 PropertyValidations interface, so can only test via an untyped object validation setting
                 */
                domainClass = {
                    lastName: 'Boxer',
                    validations: {
                        lastName: { bogus: { message: 'doesNotExist' } }
                    }
                };

                expect( () => vadacl.applyCollectionRule( domainClass, 'lastName' ) )
                    .toThrow( '*** Error thrown by Vadacl.applyCollectionRule: Validation method "bogus" is undefined in ValidationMethods. ***' );
            });

            it( 'an error if the method is used with multiple validations', () => {
                domainClass = {
                    lastName: 'Boxer',
                    validations: {
                        lastName: {
                            required: { message: 'last name is required' },
                            minLength: { minlength: 2, message: 'must be at least 2 characters' }
                        }
                    }
                };

                expect( () => vadacl.applyCollectionRule( domainClass, 'lastName' ) )
                    .toThrow( '*** Error thrown by Vadacl.applyCollectionRule: A single validation method must be applied. ***' );

            });

        });

    });
    describe( 'getMethodDeclaredArguments:', () => {
        let noArgumentFunction: any;
        let threeArgumentFunction: any;

        beforeEach( () => {
            noArgumentFunction = function() {
                return true;
            };

            threeArgumentFunction = function( minLength, maxLength, message ) {
                return true;
            };
        });

        it( 'should return an empty object literal if passed-in function has no arguments', () => {
            expect( vadacl.getMethodDeclaredArguments( noArgumentFunction ) ).toEqual( {} );
        });

        it( 'should return an object literal with key:value pairs of argument:position for each argument expected by passed-in function', () => {
            let methodArguments = vadacl.getMethodDeclaredArguments( threeArgumentFunction );
            expect( methodArguments.minLength ).toBeDefined();
            expect( methodArguments.minLength ).toEqual( 0 );
            expect( methodArguments.message ).toBeDefined();
            expect( methodArguments.message ).toEqual( 2 );
        });
    });

    describe( 'getValidatorArguments', () => {
        it( 'should return an empty array if no argument declarations are provided', () => {
            expect( vadacl.getValidatorArguments( {}, null ) ).toEqual( [] );
        });

        it( 'should copy provided validator arguments into the resulting array in the order dictated by function argument order', () => {
            let argumentDeclarations = { minLength: 0, maxLength: 1, message: 2 };
            let validatorArguments = { message: 'Length invalid', maxLength: 10, minLength: 5 };
            let finalArguments = vadacl.getValidatorArguments( argumentDeclarations, validatorArguments );

            expect( finalArguments.length ).toEqual( 3 );
            expect( finalArguments[ 0 ] ).toEqual( 5 );
            expect( finalArguments[ 1 ] ).toEqual( 10 );
            expect( finalArguments[ 2 ] ).toEqual( 'Length invalid' );
        });

        it( 'should set any function arguments not provided in the validator arguments to be set to null', () => {
            let argumentDeclarations = { minLength: 0, maxLength: 1, message: 2 };
            let validatorArguments = { maxLength: 10 };
            let finalArguments = vadacl.getValidatorArguments( argumentDeclarations, validatorArguments );

            expect( finalArguments.length ).toEqual( 3 );
            expect( finalArguments[ 0 ] ).toEqual( null );
            expect( finalArguments[ 1 ] ).toEqual( 10 );
            expect( finalArguments[ 2 ] ).toEqual( null );
        });

    });

    describe( 'mergeValidations:', () => {
        it( 'should return base validations if no overrides provided', () => {
            let baseValidations = { required: { message: 'Base message' } };
            let mergedValidations = vadacl.mergeValidations( baseValidations, null );
            expect( mergedValidations ).toEqual( baseValidations );
        });

        it( 'should add new override validations into merged validations', () => {
            let baseValidations = { required: { message: 'Base message' } };
            let overrideValidations = { minLength: { minLength: 2, message: 'minLength message'} };
            let mergedValidations = vadacl.mergeValidations( baseValidations, overrideValidations );
            expect( mergedValidations.required ).toBeDefined();
            expect( mergedValidations.minLength ).toBeDefined();
            expect( mergedValidations.minLength.minLength ).toEqual( 2 );
        });

        it( 'should modify base validations based on matching override validations', () => {
            let baseValidations = { maxLength: { maxLength: 8, message: 'maxLength base message' }, minLength: { minLength: 2 } };
            let overrideValidations = { maxLength: { message: 'Override message' }, minLength: { minLength: 4 } };
            let mergedValidations = vadacl.mergeValidations( baseValidations, overrideValidations );
            expect( mergedValidations.maxLength.maxLength ).toEqual( 8 );
            expect( mergedValidations.maxLength.message ).toEqual( 'Override message' );
            expect( mergedValidations.minLength.minLength ).toEqual( 4 );
        });
    });

    describe( 'showErrors:', () => {
        let formControl: FormControl;

        beforeEach( () => {
            formControl = new FormControl();
        });

        it( 'should always return false if form class is pristine', () => {
            formControl.markAsPristine();
            expect( vadacl.showErrors( formControl ) ).toEqual( false );
            expect( vadacl.showErrors( formControl, false ) ).toEqual( false );

            let formGroup = new FormGroup( { 'fc': formControl } );
            formGroup.markAsPristine();
            expect( vadacl.showErrors( formGroup ) ).toEqual( false );
            expect( vadacl.showErrors( formGroup, false ) ).toEqual( false );
        });

        it( 'should always return false if form class is valid', () => {
            expect( vadacl.showErrors( formControl ) ).toEqual( false );
            expect( vadacl.showErrors( formControl, false ) ).toEqual( false );

            let formArray = new FormArray( [ formControl ] );
            expect( vadacl.showErrors( formArray ) ).toEqual( false );
            expect( vadacl.showErrors( formArray, false ) ).toEqual( false );
        });

        it( 'by default, should return false if form class dirty and invalid but not touched', () => {
            formControl.markAsDirty();
            formControl.setErrors( { "required": true } );
            formControl.markAsUntouched();
            expect( vadacl.showErrors( formControl ) ).toEqual( false );

            formControl.markAsTouched();
            expect( vadacl.showErrors( formControl ) ).toEqual( true );
        });

        it( 'should return true if form class dirty and invalid and onlyAfterTouched set to false', () => {
            formControl.markAsDirty();
            formControl.setErrors( { "required": true } );
            formControl.markAsUntouched();
            expect( vadacl.showErrors( formControl, true ) ).toEqual( false );
            expect( vadacl.showErrors( formControl, false ) ).toEqual( true );
        });
    });

    describe( 'getControlErrors:', () => {
        let formControl: FormControl;

        beforeEach( () => {
            formControl = new FormControl();
            formControl.setErrors( { "required": { message: "A value is required." }, "minlength": { message: 'minLength error.' } } );
        });

        it( 'should return an empty array if no errors, regardless of dirty status or onlyWhenDirty argument', () => {
            formControl.setErrors( {} );
            expect( vadacl.getControlErrors( formControl ) ).toEqual( [] );

            formControl.markAsDirty();
            expect( vadacl.getControlErrors( formControl ) ).toEqual( [] );

            expect( vadacl.getControlErrors( formControl, false ) ).toEqual( [] );
        });

        it( 'by default, should return empty array if errors present but control is not dirty', () => {
            expect( vadacl.getControlErrors( formControl ) ).toEqual( [] );
        });

        it( 'should return array of errors if errors present and control is dirty', () => {
            formControl.markAsDirty();
            let errorArray = vadacl.getControlErrors( formControl );
            expect( errorArray.length ).toEqual( 2 );
            expect( errorArray[ 0 ] ).toEqual( 'A value is required.')
        });

        it( 'should return array of errors on pristine control if onlyWhenDirty argument set to false', () => {
            formControl.markAsPristine();
            let errorArray = vadacl.getControlErrors( formControl, false );
            expect( errorArray.length ).toEqual( 2 );
            expect( errorArray[ 1 ] ).toEqual( 'minLength error.')
        });

    });

    describe( 'changeControlValue:', () => {
        let formControl: FormControl;

        beforeEach( () => {
            formControl = new FormControl( 'initial value' );
        });

        it( 'by default, form control will be flagged as dirty and touched', () => {
            vadacl.changeControlValue( formControl, 'new value' );
            expect( formControl.value ).toEqual( 'new value' );
            expect( formControl.dirty ).toEqual( true );
            expect( formControl.touched ).toEqual( true );
        });

        it( 'the markTouched argument determines if the form control will be marked as touched', () => {
            vadacl.changeControlValue( formControl, 'new value A', false );
            expect( formControl.value ).toEqual( 'new value A' );
            expect( formControl.touched ).toEqual( false );

            vadacl.changeControlValue( formControl, 'new value B', true );
            expect( formControl.value ).toEqual( 'new value B' );
            expect( formControl.touched ).toEqual( true );
        });

    });

    describe( 'generateForm', () => {
        let domainClass: any;

        beforeEach( () => {
            spyOn( vadacl, 'applyRules' ).and.returnValue( [] );
            domainClass = {
                firstName: 'Robert',
                middleName: null,
                lastName: null,
                email: 'bob@somewhere.com',

                validations: {
                    firstName: {
                        required: { message: 'First name required.' },
                        minLength: { minLength: 3, message: 'Must be at least 3 characters long.'}
                    },
                    lastName: {
                        required: { message: 'Last name required.' }
                    }
                }
            }
        });

        describe( 'when no modifications are used', () => {
           it( 'creates FormControls for all properties but ignore validations object', () => {
                let form = vadacl.generateForm( domainClass );
                expect( form instanceof FormGroup ).toEqual( true );
                expect( form.controls.firstName ).toBeDefined();
                expect( form.controls.lastName ).toBeDefined();
                expect( form.controls.middleName ).toBeDefined();
                expect( form.controls.email ).toBeDefined();
                expect( form.controls.validations ).not.toBeDefined();
           });

           it( 'sets starting FormControl values based on domain class values', () => {
                let form = vadacl.generateForm( domainClass );
                expect( form.controls.firstName.value ).toEqual( 'Robert' );
                expect( form.controls.email.value ).toEqual( 'bob@somewhere.com' );
                expect( form.controls.lastName.value ).toEqual( null )
           });

           it( 'passes domain class arguments to the applyRules method', () => {
                vadacl.generateForm( domainClass );
                expect( vadacl.applyRules[ "calls" ].count() ).toEqual( 4 );
                expect( vadacl.applyRules[ "calls" ].argsFor( 0 ).length ).toEqual( 2 );
                expect( vadacl.applyRules[ "calls" ].argsFor( 0 )[ 0 ] ).toEqual( domainClass );
                expect( vadacl.applyRules[ "calls" ].argsFor( 0 )[ 1 ] ).toEqual( 'firstName' );
                expect( vadacl.applyRules[ "calls" ].argsFor( 1 ).length ).toEqual( 2 );
                expect( vadacl.applyRules[ "calls" ].argsFor( 1 )[ 0 ] ).toEqual( domainClass );
                expect( vadacl.applyRules[ "calls" ].argsFor( 1 )[ 1 ] ).toEqual( 'middleName' );
           });
        });

        describe( 'when the "exclude" modification is used', () => {
           it( 'will not created FormControls for properties listed in the modification', () => {
                let form = vadacl.generateForm( domainClass, { exclude: [ 'middleName' ] } );
                expect( form.controls.firstName ).toBeDefined();
                expect( form.controls.lastName ).toBeDefined();
                expect( form.controls.email ).toBeDefined();
                expect( form.controls.middleName ).not.toBeDefined();
                expect( form.controls.email.value ).toEqual( 'bob@somewhere.com' );
                // Exclusions are evaluated after the call to applyRules, so applyRules is still called for each domain class property
                expect( vadacl.applyRules[ "calls" ].count() ).toEqual( 4 );
           });
        });

        describe( 'when the "only" modification is used', () => {
           it( 'will only create FormControls for the properties listed in the modification', () => {
                let form = vadacl.generateForm( domainClass, { only: [ 'firstName', 'lastName' ] } );
                expect( form.controls.firstName ).toBeDefined();
                expect( form.controls.lastName ).toBeDefined();
                expect( form.controls.middleName ).not.toBeDefined();
                expect( form.controls.email ).not.toBeDefined();
                expect( form.controls.firstName.value ).toEqual( 'Robert' );
                expect( vadacl.applyRules[ "calls" ].count() ).toEqual( 2 );
           });

           it( 'will override the "exclude" modification if both are present', () => {
               let form = vadacl.generateForm( domainClass, { only: [ 'firstName', 'lastName', 'email' ], exclude: [ 'firstName', 'email' ] } );
               expect( form.controls.firstName ).toBeDefined();
               expect( form.controls.lastName ).toBeDefined();
               expect( form.controls.email ).toBeDefined();
               expect( form.controls.middleName ).not.toBeDefined();
               expect( form.controls.firstName.value ).toEqual( 'Robert' );
               expect( vadacl.applyRules[ "calls" ].count() ).toEqual( 3 );
           });
        });

        describe( 'when the "validations" modification is used', () => {
           it( 'will add those validations to the invocation of applyRules', () => {
               let addedValidations = {
                   firstName: {
                       maxLength: { maxLength: 25, message: 'Must be no longer than 25 characters.' }
                   },
                   middleName: {
                       required: { message: 'Middle name is required.' },
                       minLength: { minLength: 3, message: 'Must be at least 3 characters long.' }
                   }
               };

               vadacl.generateForm( domainClass, { only: [ 'firstName', 'middleName' ], validations: addedValidations } );
               expect( vadacl.applyRules[ "calls" ].count() ).toEqual( 2 );
               expect( vadacl.applyRules[ "calls" ].argsFor( 0 ).length ).toEqual( 3 );
               expect( vadacl.applyRules[ "calls" ].argsFor( 0 )[ 0 ] ).toEqual( domainClass );
               expect( vadacl.applyRules[ "calls" ].argsFor( 0 )[ 1 ] ).toEqual( 'firstName' );
               expect( vadacl.applyRules[ "calls" ].argsFor( 0 )[ 2 ] ).toEqual( { maxLength: { maxLength: 25, message: 'Must be no longer than 25 characters.' } } );
               expect( vadacl.applyRules[ "calls" ].argsFor( 1 ).length ).toEqual( 3 );
               expect( vadacl.applyRules[ "calls" ].argsFor( 1 )[ 0 ] ).toEqual( domainClass );
               expect( vadacl.applyRules[ "calls" ].argsFor( 1 )[ 1 ] ).toEqual( 'middleName' );
               expect( vadacl.applyRules[ "calls" ].argsFor( 1 )[ 2 ] ).toEqual( addedValidations[ 'middleName' ] );
           })
        });
    });
});



