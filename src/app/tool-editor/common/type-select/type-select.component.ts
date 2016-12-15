import {InputParameterTypeModel} from "cwlts/models/d2sb/InputParameterTypeModel";
import {Component, forwardRef} from "@angular/core";
import {ControlValueAccessor, FormControl, Validators, NG_VALUE_ACCESSOR} from "@angular/forms";
import {PrimitiveParameterType} from "cwlts/models/d2sb/ParameterTypeModel";
import {ComponentBase} from "../../../components/common/component-base";

@Component({
    selector: 'input-type-select',
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputTypeSelectComponent), multi: true }
    ],
    template: `
        <select class="form-control" 
                [formControl]="typeSelectControl">
            <option *ngFor="let propertyType of propertyTypes" [value]="propertyType">
                {{propertyType}}
            </option>
        </select>
    `
})
export class InputTypeSelectComponent extends ComponentBase implements ControlValueAccessor {

    private paramType: InputParameterTypeModel;

    private propertyTypes = ["array", "enum", "record", "File", "string", "int", "float", "boolean", "map"];

    private typeSelectControl: FormControl;

    private onTouched = () => { };

    private propagateChange = (_) => {};

    constructor() {
        super();
    }

    writeValue(paramType: InputParameterTypeModel): void {
        this.paramType = paramType;

        if (this.paramType.type === undefined) {
            this.paramType.type = "File";
            this.propagateChange(this.paramType);
        }

        this.typeSelectControl = new FormControl(this.paramType.type, [Validators.required]);

        this.tracked = this.typeSelectControl.valueChanges.subscribe((value: PrimitiveParameterType) => {
            this.paramType.type = value;
            this.propagateChange(this.paramType);
        });
    }

    registerOnChange(fn: any): void {
        this.propagateChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
    }
}