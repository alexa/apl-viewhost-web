/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import APLRenderer, { IAsyncKeyboardEvent } from '../APLRenderer';
import { ActionableComponent } from './ActionableComponent';
import { Component, FactoryFunction, IComponentProperties } from './Component';
import { FontStyle } from '../enums/FontStyle';
import { PropertyKey } from '../enums/PropertyKey';
import * as $ from 'jquery';
import { FontUtils } from '../utils/FontUtils';
import { Direction, SectionType, SpatialNavigation } from '../utils/SpatialNavigation';
import { UpdateType } from '../enums/UpdateType';
import { KeyboardType } from '../enums/KeyboardType';
import { ENTER_KEY } from '../utils/Constant';

/**
 * @ignore
 */
export interface IEditTextProperties extends IComponentProperties {
    [PropertyKey.kPropertyBorderColor] : number;
    [PropertyKey.kPropertyBorderStrokeWidth] : number;
    [PropertyKey.kPropertyBorderWidth] : number;
    [PropertyKey.kPropertyColor] : number;
    [PropertyKey.kPropertyFontFamily] : string;
    [PropertyKey.kPropertyFontSize] : number;
    [PropertyKey.kPropertyFontStyle] : FontStyle;
    [PropertyKey.kPropertyFontWeight] : string | number;
    [PropertyKey.kPropertyHighlightColor] : number;
    [PropertyKey.kPropertyHint] : string;
    [PropertyKey.kPropertyHintColor] : number;
    [PropertyKey.kPropertyHintStyle] : FontStyle;
    [PropertyKey.kPropertyHintWeight] : string | number;
    [PropertyKey.kPropertyKeyboardType] : KeyboardType;
    [PropertyKey.kPropertyMaxLength] : number;
    [PropertyKey.kPropertySecureInput] : boolean;
    [PropertyKey.kPropertySelectOnFocus] : boolean;
    [PropertyKey.kPropertySize] : number;
    [PropertyKey.kPropertySubmitKeyType] : string; // this depends on OS Keyboard through inputmode/input type in html.
    [PropertyKey.kPropertyText] : string;
    [PropertyKey.kPropertyValidCharacters] : string;
}

export class EditText extends ActionableComponent<IEditTextProperties> {
    public formElement : HTMLFormElement;
    public inputElement : HTMLInputElement;
    private localFocused : boolean = false;
    // Current press state
    private enterPressedDown : boolean = false;
    private isEdge : boolean = /msie\s|trident\/|edge\//i.test(window.navigator.userAgent);

    constructor(renderer : APLRenderer, component : APL.Component, factory : FactoryFunction, parent? : Component) {
        super(renderer, component, factory, parent);
        this.initEditTextHtmlComponent();

        if (SpatialNavigation.enabled()) {
            // D-Pad supports
            SpatialNavigation.makeNavigable(
                this.inputElement, this.getSectionId(), this.focus, this.blur);
            SpatialNavigation.addSection(this.getSectionId(), SectionType.NONE);
            // override will move listener
            this.inputElement.addEventListener('sn:willmove', this.navigate);
        } else {
            this.inputElement.addEventListener('focus', this.onFocus);
            this.inputElement.addEventListener('blur', this.onBlur);
        }

        this.formElement.onsubmit = this.onSubmit;
        this.inputElement.addEventListener('keyup', this.onKeyup);
        this.inputElement.addEventListener('keydown', this.onKeydown);
        this.inputElement.oninput = this.onInput;

        this.propExecutor
        (this.setBorderColor, PropertyKey.kPropertyBorderColor)
        (this.setBorderWidth, PropertyKey.kPropertyDrawnBorderWidth)
        (this.setColor, PropertyKey.kPropertyColor)
        (this.setDisabled, PropertyKey.kPropertyDisabled)
        (this.setFontFamily, PropertyKey.kPropertyFontFamily)
        (this.setFontSize, PropertyKey.kPropertyFontSize)
        (this.setFontStyle, PropertyKey.kPropertyFontStyle)
        (this.setFontWeight, PropertyKey.kPropertyFontWeight)
        (this.setHighlightColor, PropertyKey.kPropertyHighlightColor)
        (this.setHint, PropertyKey.kPropertyHint)
        (this.setHintColor, PropertyKey.kPropertyHintColor)
        (this.setHintStyle, PropertyKey.kPropertyHintStyle)
        (this.setHintWeight, PropertyKey.kPropertyHintWeight)
        (this.setKeyboardType, PropertyKey.kPropertyKeyboardType, PropertyKey.kPropertySecureInput)
        (this.setMaxLength, PropertyKey.kPropertyMaxLength)
        (this.setSelectTextOnFocus, PropertyKey.kPropertySelectOnFocus)
        (this.setInputSize, PropertyKey.kPropertySize)
        (this.setInputText, PropertyKey.kPropertyText);
    }

    private initEditTextHtmlComponent() {
        // Form is required to wrap input type for OS to detect submit key in its virtual keyboard.
        this.formElement = document.createElement('form');
        // set input's height and width same as container which read from core.
        $(this.formElement).css('max-width', '100%');
        $(this.formElement).css('max-height', '100%');

        this.inputElement = document.createElement('input');
        $(this.inputElement).attr('id', this.id);
        // set position, height, and width of input element according to core inner bounds.
        const innerBounds = this.component.getCalculatedByKey<APL.Rect>(PropertyKey.kPropertyInnerBounds);
        if (innerBounds) {
            $(this.inputElement).css('width', innerBounds.width);
            $(this.inputElement).css('height', innerBounds.height);
            $(this.inputElement).css('top', innerBounds.top);
            $(this.inputElement).css('left', innerBounds.left);
        } else {
            $(this.inputElement).css('max-width', '100%');
            $(this.inputElement).css('max-height', '100%');
        }
        // To apply transparent background to remain parity with Android
        $(this.inputElement).css('background', 'transparent');
        $(this.inputElement).css('border-color', 'transparent');
        this.formElement.appendChild(this.inputElement);
        this.container.appendChild(this.formElement);
    }

    private setBorderColor = () => {
        $(this.inputElement)
            .css('outline-color', Component.numberToColor(this.props[PropertyKey.kPropertyBorderColor]));
    }

    private setBorderWidth = () => {
        $(this.inputElement).css('outline-width', this.props[PropertyKey.kPropertyDrawnBorderWidth]);
        $(this.inputElement).css('outline-style', 'solid');
    }

    private setColor = () => {
        $(this.inputElement).css('color', Component.numberToColor(this.props[PropertyKey.kPropertyColor]));
    }

    private setDisabled = () => {
        this.inputElement.disabled = this.props[PropertyKey.kPropertyDisabled];
    }

    private setFontFamily = () => {
        const fontFamily = FontUtils.getFont(this.props[PropertyKey.kPropertyFontFamily]);
        $(this.inputElement).css('font-family', fontFamily);
    }

    private setFontSize = () => {
        $(this.inputElement).css('font-size', this.props[PropertyKey.kPropertyFontSize]);
    }

    private setFontStyle = () => {
        const fontStyle = FontUtils.getFontStyle(this.props[PropertyKey.kPropertyFontStyle]);
        $(this.inputElement).css('font-style', fontStyle);
    }

    private setFontWeight = () => {
        $(this.inputElement).css('font-weight', this.props[PropertyKey.kPropertyFontWeight]);
    }

    private setHighlightColor = () => {
        this.addRuleToAvailableStyleSheet('#\\' + this.component.getUniqueId() + ' input::selection',
            'background-color: ' + Component.numberToColor(this.props[PropertyKey.kPropertyHighlightColor]));
    }

    private setHint = () => {
        this.inputElement.placeholder = this.props[PropertyKey.kPropertyHint];
    }

    private setHintColor = () => {
        // per https://caniuse.com/css-placeholder
        this.addRuleToAvailableStyleSheet('#\\' + this.component.getUniqueId() +
                ' input' + (this.isEdge ? '::-ms-input-placeholder' : '::placeholder'),
                'color: ' + Component.numberToColor(this.props[PropertyKey.kPropertyHintColor]));
    }

    private setHintStyle = () => {
        const fontStyle = FontUtils.getFontStyle(this.props[PropertyKey.kPropertyHintStyle]);
        this.addRuleToAvailableStyleSheet('#\\' + this.component.getUniqueId() +
                ' input' + (this.isEdge ? '::-ms-input-placeholder' : '::placeholder'),
                'font-style: ' + fontStyle);
    }

    private setHintWeight = () => {
        this.addRuleToAvailableStyleSheet('#\\' + this.component.getUniqueId() +
                ' input' + (this.isEdge ? '::-ms-input-placeholder' : '::placeholder'),
                'font-weight: ' + this.props[PropertyKey.kPropertyHintWeight]);
    }

    private setKeyboardType = () => {
        switch (this.props[PropertyKey.kPropertyKeyboardType]) {
            case KeyboardType.kKeyboardTypeDecimalPad:
                this.inputElement.setAttribute('inputmode', 'decimal');
                // maxLength and size attribute does not support for number.
                // in this case will rely on inputmode for keyboard type in different OS.
                this.inputElement.type = 'text';
                break;
            case KeyboardType.kKeyboardTypeNumberPad:
                this.inputElement.setAttribute('inputmode', 'numeric');
                this.inputElement.type = 'text';
                break;
            case KeyboardType.kKeyboardTypeEmailAddress:
                this.inputElement.setAttribute('inputmode', 'email');
                this.inputElement.type = 'email';
                break;
            case KeyboardType.kKeyboardTypePhonePad:
                this.inputElement.setAttribute('inputmode', 'tel');
                this.inputElement.type = 'tel';
                break;
            case KeyboardType.kKeyboardTypeUrl:
                this.inputElement.setAttribute('inputmode', 'url');
                this.inputElement.type = 'url';
                break;
            case KeyboardType.kKeyboardTypeNormal:
            default:
                this.inputElement.setAttribute('inputmode', 'text');
                this.inputElement.type = 'text';
        }
        // modify to password type if secureInput
        if (this.props[PropertyKey.kPropertySecureInput]) {
            this.inputElement.type = 'password';
        }
    }

    private setMaxLength = () => {
        if (this.props[PropertyKey.kPropertyMaxLength] > 0) {
            this.inputElement.maxLength = this.props[PropertyKey.kPropertyMaxLength];
        }
    }

    private setSelectTextOnFocus = () => {
        this.inputElement.onfocus = (event) => {
            const originalType = this.inputElement.type;
            // HTML trick as not every input type support setSelectionRange.
            this.inputElement.type = 'text';
            if (this.props[PropertyKey.kPropertySelectOnFocus]) {
                this.inputElement.setSelectionRange(0, this.inputElement.value.length);
            } else {
                this.inputElement.setSelectionRange(this.inputElement.value.length, this.inputElement.value.length);
            }
            this.inputElement.type = originalType;
        };
    }

    private setInputSize = () => {
        if (this.props[PropertyKey.kPropertySize] > 0) {
            this.inputElement.size = this.props[PropertyKey.kPropertySize];
        }
    }

    private setInputText = async () => {
        const text = await this.filterText(this.props[PropertyKey.kPropertyText]);
        if (text.length > 0) {
            this.inputElement.value = text;
        }
    }

    private onFocus = () => {
        if (!this.localFocused) {
            this.localFocused = true;
            this.update(UpdateType.kUpdateTakeFocus, 1);
        }
    }

    private onBlur = () => {
        if (this.localFocused) {
            this.localFocused = false;
            this.update(UpdateType.kUpdateTakeFocus, 0);
        }
    }

    private onInput = async () => {
        this.inputElement.value = await this.filterText(this.inputElement.value);
        this.update(UpdateType.kUpdateTextChange, this.inputElement.value);
    }

    private onSubmit = (event) => {
        // block the form submit behavior
        event.preventDefault();
    }

    private onKeyup = (event : IAsyncKeyboardEvent) => {
        // only deal with this component event. Do not listen on dispatched event from Root.
        if (event.key === ENTER_KEY && this.enterPressedDown === true && !event.asyncChecked) {
            this.update(UpdateType.kUpdateSubmit, 0);
            this.enterPressedDown = false;
        }
    }

    private onKeydown = (event : IAsyncKeyboardEvent) => {
        if (event.key === ENTER_KEY && !event.asyncChecked) {
            this.enterPressedDown = true;
        }
    }

    private getSectionId = () => {
        return SpatialNavigation.getSectionName(this.component.getUniqueId());
    }

    protected navigate = (event) => {
        if (this.inputElement.selectionEnd === undefined || this.inputElement.selectionEnd === null) {
            // Not every input type support retrieving cursor position. (eg. email)
            // delegate to spatial navigation
            return;
        }
        const endPosition = this.inputElement.selectionEnd;
        const direction : Direction = event.detail.direction;
        switch (direction) {
            case 'up':
                if (endPosition !== 0) {
                    event.preventDefault();
                    this.inputElement.setSelectionRange(0, 0);
                }
                break;
            case 'left':
                if (endPosition !== 0) {
                    event.preventDefault();
                    this.inputElement.setSelectionRange(endPosition - 1, endPosition - 1);
                }
                break;
            case 'right':
                if (endPosition !== this.inputElement.value.length) {
                    event.preventDefault();
                    this.inputElement.setSelectionRange(endPosition + 1, endPosition + 1);
                }
                break;
            case 'down':
                if (endPosition !== this.inputElement.value.length) {
                    event.preventDefault();
                    this.inputElement.setSelectionRange(
                        this.inputElement.value.length, this.inputElement.value.length);
                }
                break;
            default:
        }
    }

    // filter the text based on validCharacters
    private async filterText(text : string) : Promise<string> {
        // cannot use filter directly as async in filter does not work.
        const promises = await text.split('').map(async (char) => await this.component.isCharacterValid(char));
        const charValidList = await Promise.all(promises);
        return text.split('').filter((char, index) => charValidList[index] === true).join('');
    }

    private addRuleToAvailableStyleSheet(selector : string, style : string) {
        const sheets = document.styleSheets;
        for (let i = 0; i < sheets.length; i++) {
            try {
                (sheets.item(i) as any).addRule(selector, style);
                break;
            } catch (e) {
                continue;
            }
        }
    }
}
