# vadacl

> Extends and enhances reactive form validation in Angular 4.x and 5.x
> 
> vadacl provides:
>
>* A mechanism for declaring validation logic within domain classes / data objects that can be reused in 
>multiple components.
>* The ability to configure the text of validation failure messages as part of the domain class validation logic or
>within a global validation message object.
>* Helper methods for triggering validation, displaying validation results, and generating a FormGroup based on domain
>class properties and validations.
>* Additional validation methods beyond those provided by Angular 4.x and 5.x, and the ability to extend the vadacl
>validation methods with custom methods in your project.


## Installation / Getting Started

For a basic, out of the box installation, simply use npm install:

```bash
npm install --save vadacl
```
To add your own validator methods or add/change global validation messages, perform the following additional steps:

1. Copy the contents of **node_modules/vadacl/dist/templates/** (validation-messages.ts and vadacl.ts) into
a folder in your Angular project.
2. Update the files with your changes (see the example under "Usage" -> "Extending vadacl").
3. Use the exports from this copy of vadacl.ts instead of the package version.

In addition to the overview documentation here, the 
[vadacl-demo repo](https://github.com/bcswartz/vadacl-demo) explains some of the thinking behind
  the development of vadacl and contains an Angular CLI-powered Angular 4.x application that 
  provides a number of examples for using vadacl in various scenarios. 

## Usage

Once vadacl is installed in your Angular project, just use the exports provided by vadacl to 
define the validation rules for your data/domain objects and perform your reactive form validation.


### Standard Angular Reactive Form Validation
 
The typical approach to performing validation for reactive forms in Angular is to declare the
 validation "rules" for a form control as part of the arguments for instantiating the form control...
 
 ```javascript
ngOnInit() {
    this.myForm = new FormGroup( {
      'firstName': new FormControl( 'Bob', [ Validators.required, Validators.minLength(2) ] )
    } )
  }
```

...and then declare the validation messages for each rule using conditional HTML markup:

```html
<label for="firstName">First name:</label>
<input id="firstName" class="form-control" formControlName="firstname">
<div *ngIf="firstName.errors.required">
  First name is required.
</div>
<div *ngIf="firstName.errors.minlength">
  First name must be at least 2 characters long.
</div>
```

### vadacl-based Reactive Form Validation

When using vadacl, the typical approach is to declare the validation rules and corresponding 
messages as part of the data object/domain class...

```javascript
import { Validateable, PropertyValidations } from 'vadacl'

export class User implements Validateable {
    firstName: string = null;
    validations: { firstName: PropertyValidations } = {
        firstName: {
          required: { message: "First name is required" },
          minLength: { minLength: 2, message: "First name must be at least 2 characters long." }
        }
    }
}
```
...then apply the associated validator methods to the form control using vadacl's applyRules()
method, citing the validations to use from the data object/domain class...

```javascript
import { Vadacl } from 'vadacl';
export class UserFormComponent extends Vadacl implements OnInit {
    this.user = new User();
    ngOnInit() {
         this.myForm = new FormGroup( {
           'firstName': new FormControl( 'Bob', this.applyRules( this.user, 'firstName' ) )
         } )
    }
}
```

...and display the validation message that is passed back as part of the metadata regarding the 
validation failure, using the showErrors() and getControlErrors() methods provided by vadacl:

```html
<label for="firstName">First name:</label>
<input id="firstName" class="form-control" formControlName="firstname">
<div *ngIf="showErrors( myForm.controls.firstName )">
    <ul>
      <li *ngFor="let error of getControlErrors( myForm.controls.firstName )">
        {{error}}
      </li>
    </ul>
</div>
```

Starting with version 1.1.0 of vadacl, the reactive form can be generated based on the domain class properties and 
validations by using the generateForm() method.  Here is the previous example rewritten to use generateForm():

```javascript
import { Vadacl } from 'vadacl';
export class UserFormComponent extends Vadacl implements OnInit {
    this.user = new User();
    ngOnInit() {
         this.myForm = this.generateForm( this.user );
    }
}
```
  
#### Global Validation Messages

vadacl includes a "global" collection of validation messages via the validation-messages.ts file.  Out of the box, it 
contains a default validation message for every validation method provided, ensuring that a message value is
returned for a failed validation even if one hasn't been declared in code.

This collection of messages can also be used as an alternative to declaring the messages within the validation rules
of the data objects: 

```javascript
\\ User.ts file
import { Validateable, PropertyValidations } from 'vadacl'

export class User implements Validateable {
    firstName: string = null;
    validations: { firstName: PropertyValidations } = {
        firstName: {
          required: { },
          minLength: { minLength: 2 }
        }
    }
}

\\ Custom validation-messages.ts file
let ValidationMessages = {
    /* DEFAULT VALIDATOR ERROR MESSAGES */
    //...
    /* DOMAIN CLASS VALIDATION MESSAGES */
    User: {
        firstName: {
            required: "First name is required" ,
            minLength: "First name must be at least 2 characters long."
        }
    }
}
```

Such domain class validation messages are also default values, which can be overridden within the domain class validations or custom validations 
injected when invoking the applyRules() method.

The most compelling argument for declaring domain class validation messages within this file is the scenario where you need to provide
different validation messages for different versions of your website (internationalization, for example):  you can swap out different copies of
the file as part of your build/deploy process.


#### vadacl Validation Methods

The ValidationMethods class of vadacl includes validation methods that either mimic or wrap the Validator methods 
provided by Angular as of version 4.3.6:

* required
* requiredTrue
* minLength
* maxLength
* min
* max
* pattern
* email (NOTE: unlike the current Angular version, the validator will not flag a null, undefined, or empty value 
as invalid, essentially allowing the email value to be optional)

It also includes the following additional validation methods:

* "withinLength": Validates that the length of the value of the AbstractControl falls within a certain range.  Like
the minLength and maxLength methods, it can be used to validate the length of a string or the number of form controls 
in a FormGroup or FormArray.

* "totals": Validates that the sum of the numeric values of the FormGroup or FormArray controls equals a certain numeric amount.

* "equalValues": Validates that all of the values of the FormControls within a FormGroup or FormArray are exactly equal. 
Useful for performing password confirmation.

* "withinTrueCount": Validates that the number of FormControls within a FormGroup or FormArray with a value of Boolean 
true falls within a given range.  Designed primarily to validate how many checkboxes are checked.

You can also add your own custom validation messages by extending vadacl.
 
#### Extending vadacl

The safest way to extend vadacl is copy the vadacl.ts and validation-messages.ts files from **node_modules/vadacl/dist/templates/** into your
Angular project and make your customizations in those files.  That way you won't lose any of your customizations when you update to the 
 latest version of vadacl.
 
The vadacl.ts file from **node_modules/vadacl/dist/templates/** is NOT an exact copy of the vadacl class file in the package, but rather a 
template for extending the modules provided by the package and exporting those extensions.

The following example illustrates how you would add a custom validator for validating a full 9-digit US zip code:

```javascript

\\ validation-messages.ts
let ValidationMessages = {
    /* DEFAULT VALIDATOR ERROR MESSAGES */
    //...
    fullzipcode: 'The zip code is invalid'
}

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
 
\\ vadacl.ts
import { ValidationMethods, Vadacl, Validateable, PropertyValidations as BasePropertyValidations  } from 'vadacl'
import { ValidationMessages } from './validation-messages'

// Define new custom validation methods (EXAMPLE)
class CustomValidationMethods extends ValidationMethods {

  /*
   Most custom single-field validations will be specific string patterns (zip code, email, URL, etc.) that can leverage
   the existing pattern validation method.
  */
  static fullZipCode( message ?: string, className ?: string, propertyName ?: string ) {
    /*
      Need to obtain the desired message and provide it to the pattern validation method, otherwise
      the pattern validation message will look for a "pattern" message in the validation messages object
      or the domain class.
     */
    let msg = message || ValidationMethods.getLocaleMessage( 'fullzipcode', className, propertyName );
    return ValidationMethods.pattern( '[0-9]{5}\-[0-9]{4}', msg )
  }
}

// Increment / extend Vadacl interfaces to support custom validation methods (EXAMPLE)
interface FullZipCodeSettings {
  message ?: string
}

interface PropertyValidations extends BasePropertyValidations {
  fullZipCode ?: FullZipCodeSettings
}

ValidationMethods.messages = ValidationMessages;
Vadacl.validationMethods = ValidationMethods;

export { Vadacl, Validateable, PropertyValidations };
```
To use your customizations, you would simply use the exports from this vadacl.ts file rather than the one provided in the package.

## License

MIT



